const pool = require("../db");
const { texto, entero, positivo, opcion, correo, fecha } = require("../validators/validaciones");
const { crearError } = require("../middleware/errores");

function validarCliente(datos) {
    const limpios = {
        razon_social: texto(datos.razon_social, "razon_social", 150, true),
        cuit: texto(datos.cuit, "cuit", 11, true),
        telefono: texto(datos.telefono, "telefono", 30, false),
        email: correo(datos.email),
        domicilio: texto(datos.domicilio, "domicilio", 200, false),
        localidad: texto(datos.localidad, "localidad", 100, false)
    };
    if (!/^\d{11}$/.test(limpios.cuit)) throw crearError(400, "El CUIT debe tener 11 dígitos");
    return limpios;
}

async function listar() {
    const resultado = await pool.query("SELECT * FROM cliente WHERE activo = TRUE ORDER BY id_cliente ASC");
    return resultado.rows;
}

async function buscar(id) {
    const resultado = await pool.query("SELECT * FROM cliente WHERE id_cliente = $1", [id]);
    return resultado.rows[0];
}

async function crear(datos) {
    const limpios = validarCliente(datos);

    const resultado = await pool.query(
        `INSERT INTO cliente (razon_social, cuit, telefono, email, domicilio, localidad) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [limpios.razon_social, limpios.cuit, limpios.telefono, limpios.email, limpios.domicilio, limpios.localidad]
    );
    return resultado.rows[0];
}

async function actualizar(id, datos) {
    const anterior = await buscar(id);
    if (!anterior) throw crearError(404, "Registro no encontrado");
    const limpios = validarCliente({ ...anterior, ...datos });


    const resultado = await pool.query(
        `UPDATE cliente SET razon_social = $1,
                cuit = $2,
                telefono = $3,
                email = $4,
                domicilio = $5,
                localidad = $6 WHERE id_cliente = $7 RETURNING *`,
        [limpios.razon_social, limpios.cuit, limpios.telefono, limpios.email, limpios.domicilio, limpios.localidad, id]
    );
    return resultado.rows[0];
}

async function eliminar(id) {
    const relaciones = await pool.query("SELECT 1 FROM pedido WHERE id_cliente = $1 LIMIT 1", [id]);
    if (relaciones.rowCount > 0) {
        const resultado = await pool.query("UPDATE cliente SET activo = FALSE WHERE id_cliente = $1 RETURNING *", [id]);
        return { modo: "BAJA_LOGICA", registro: resultado.rows[0] };
    }
    const resultado = await pool.query("DELETE FROM cliente WHERE id_cliente = $1 RETURNING *", [id]);
    return { modo: "ELIMINADO", registro: resultado.rows[0] };
}

module.exports = { listar, buscar, crear, actualizar, eliminar };
