const pool = require("../db");
const { texto, entero, positivo, opcion, correo, fecha } = require("../validators/validaciones");
const { crearError } = require("../middleware/errores");

function validarTipoVehiculo(datos) {
    const limpios = {
        descripcion: texto(datos.descripcion, "descripcion", 100, true)
    };
    return limpios;
}

async function listar() {
    const resultado = await pool.query("SELECT * FROM tipo_vehiculo ORDER BY id_tipo_vehiculo ASC");
    return resultado.rows;
}

async function buscar(id) {
    const resultado = await pool.query("SELECT * FROM tipo_vehiculo WHERE id_tipo_vehiculo = $1", [id]);
    return resultado.rows[0];
}

async function crear(datos) {
    const limpios = validarTipoVehiculo(datos);

    const resultado = await pool.query(
        `INSERT INTO tipo_vehiculo (descripcion) VALUES ($1) RETURNING *`,
        [limpios.descripcion]
    );
    return resultado.rows[0];
}

async function actualizar(id, datos) {
    const anterior = await buscar(id);
    if (!anterior) throw crearError(404, "Registro no encontrado");
    const limpios = validarTipoVehiculo({ ...anterior, ...datos });


    const resultado = await pool.query(
        `UPDATE tipo_vehiculo SET descripcion = $1 WHERE id_tipo_vehiculo = $2 RETURNING *`,
        [limpios.descripcion, id]
    );
    return resultado.rows[0];
}

async function eliminar(id) {
    const relacionados = await pool.query("SELECT 1 FROM vehiculo WHERE id_tipo_vehiculo = $1 LIMIT 1", [id]);
    if (relacionados.rowCount) throw crearError(409, "No se puede eliminar porque tiene registros relacionados");
    const resultado = await pool.query("DELETE FROM tipo_vehiculo WHERE id_tipo_vehiculo = $1 RETURNING *", [id]);
    return { modo: "ELIMINADO", registro: resultado.rows[0] };
}

module.exports = { listar, buscar, crear, actualizar, eliminar };
