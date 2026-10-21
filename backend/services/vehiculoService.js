const pool = require("../db");
const { texto, entero, positivo, opcion, correo, fecha } = require("../validators/validaciones");
const { crearError } = require("../middleware/errores");

function validarVehiculo(datos) {
    const limpios = {
        id_tipo_vehiculo: entero(datos.id_tipo_vehiculo, "id_tipo_vehiculo"),
        patente: texto(datos.patente, "patente", 15, true),
        marca: texto(datos.marca, "marca", 100, true),
        modelo: texto(datos.modelo, "modelo", 100, true),
        anio: entero(datos.anio, "anio", 1, false),
        capacidad: positivo(datos.capacidad, "capacidad"),
        estado: opcion(datos.estado || "DISPONIBLE", "estado", ["DISPONIBLE", "EN_VIAJE", "MANTENIMIENTO"])
    };
    if (limpios.anio && (limpios.anio < 1950 || limpios.anio > new Date().getFullYear() + 1)) {
        throw crearError(400, "El año del vehículo está fuera de rango");
    }
    return limpios;
}

async function listar() {
    const resultado = await pool.query("SELECT * FROM vehiculo ORDER BY id_vehiculo ASC");
    return resultado.rows;
}

async function buscar(id) {
    const resultado = await pool.query("SELECT * FROM vehiculo WHERE id_vehiculo = $1", [id]);
    return resultado.rows[0];
}

async function crear(datos) {
    const limpios = validarVehiculo(datos);
    const tipo = await pool.query("SELECT 1 FROM tipo_vehiculo WHERE id_tipo_vehiculo = $1", [limpios.id_tipo_vehiculo]);
    if (!tipo.rowCount) throw crearError(400, "El tipo de vehículo no existe");
    const resultado = await pool.query(
        `INSERT INTO vehiculo (id_tipo_vehiculo, patente, marca, modelo, anio, capacidad, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [limpios.id_tipo_vehiculo, limpios.patente, limpios.marca, limpios.modelo, limpios.anio, limpios.capacidad, limpios.estado]
    );
    return resultado.rows[0];
}

async function actualizar(id, datos) {
    const anterior = await buscar(id);
    if (!anterior) throw crearError(404, "Registro no encontrado");
    const limpios = validarVehiculo({ ...anterior, ...datos });
    const envio = await pool.query("SELECT 1 FROM envio WHERE id_vehiculo = $1 AND estado_actual IN ('PENDIENTE','EN_TRANSITO') LIMIT 1", [id]);
    if (envio.rowCount) throw crearError(409, "No se puede modificar un vehículo con envío activo");
    const tipo = await pool.query("SELECT 1 FROM tipo_vehiculo WHERE id_tipo_vehiculo = $1", [limpios.id_tipo_vehiculo]);
    if (!tipo.rowCount) throw crearError(400, "El tipo de vehículo no existe");
    const resultado = await pool.query(
        `UPDATE vehiculo SET id_tipo_vehiculo = $1,
                patente = $2,
                marca = $3,
                modelo = $4,
                anio = $5,
                capacidad = $6,
                estado = $7 WHERE id_vehiculo = $8 RETURNING *`,
        [limpios.id_tipo_vehiculo, limpios.patente, limpios.marca, limpios.modelo, limpios.anio, limpios.capacidad, limpios.estado, id]
    );
    return resultado.rows[0];
}

async function eliminar(id) {
    const relaciones = await pool.query("SELECT 1 FROM envio WHERE id_vehiculo = $1 LIMIT 1", [id]);
    if (relaciones.rowCount) {
        const activo = await pool.query("SELECT 1 FROM envio WHERE id_vehiculo = $1 AND estado_actual IN ('PENDIENTE','EN_TRANSITO') LIMIT 1", [id]);
        if (activo.rowCount) throw crearError(409, "El vehículo tiene un envío activo");
        const resultado = await pool.query("UPDATE vehiculo SET estado = 'MANTENIMIENTO' WHERE id_vehiculo = $1 RETURNING *", [id]);
        return { modo: "BAJA_LOGICA", registro: resultado.rows[0] };
    }
    const resultado = await pool.query("DELETE FROM vehiculo WHERE id_vehiculo = $1 RETURNING *", [id]);
    return { modo: "ELIMINADO", registro: resultado.rows[0] };
}

module.exports = { listar, buscar, crear, actualizar, eliminar };
