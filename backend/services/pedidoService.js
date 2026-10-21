const pool = require("../db");
const { texto, entero, positivo, opcion, correo, fecha } = require("../validators/validaciones");
const { crearError } = require("../middleware/errores");

function validarPedido(datos) {
    const limpios = {
        id_cliente: entero(datos.id_cliente, "id_cliente"),
        origen: texto(datos.origen, "origen", 200, true),
        destino: texto(datos.destino, "destino", 200, true),
        tipo_carga: texto(datos.tipo_carga, "tipo_carga", 100, true),
        cantidad: entero(datos.cantidad, "cantidad", 1, true),
        peso: positivo(datos.peso, "peso"),
        observaciones: texto(datos.observaciones, "observaciones", 3000),
        fecha_estimada: fecha(datos.fecha_estimada, "fecha_estimada")
    };
    if (limpios.origen.toLowerCase() === limpios.destino.toLowerCase()) {
        throw crearError(400, "El origen y el destino deben ser diferentes");
    }
    return limpios;
}

async function listar() {
    const resultado = await pool.query("SELECT * FROM pedido ORDER BY id_pedido ASC");
    return resultado.rows;
}

async function buscar(id) {
    const resultado = await pool.query("SELECT * FROM pedido WHERE id_pedido = $1", [id]);
    return resultado.rows[0];
}

async function crear(datos) {
    const limpios = validarPedido(datos);
    const cliente = await pool.query("SELECT activo FROM cliente WHERE id_cliente = $1", [limpios.id_cliente]);
    if (!cliente.rows[0]?.activo) throw crearError(400, "El cliente no existe o está inactivo");
    const resultado = await pool.query(
        `INSERT INTO pedido (id_cliente, origen, destino, tipo_carga, cantidad, peso, observaciones, fecha_estimada) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [limpios.id_cliente, limpios.origen, limpios.destino, limpios.tipo_carga, limpios.cantidad, limpios.peso, limpios.observaciones, limpios.fecha_estimada]
    );
    return resultado.rows[0];
}

async function actualizar(id, datos) {
    const anterior = await buscar(id);
    if (!anterior) throw crearError(404, "Registro no encontrado");
    const limpios = validarPedido({ ...anterior, ...datos });
    const envio = await pool.query("SELECT 1 FROM envio WHERE id_pedido = $1", [id]);
    if (envio.rowCount) throw crearError(409, "No se puede modificar un pedido que ya tiene envío");
    const cliente = await pool.query("SELECT activo FROM cliente WHERE id_cliente = $1", [limpios.id_cliente]);
    if (!cliente.rows[0]?.activo) throw crearError(400, "El cliente no existe o está inactivo");
    const resultado = await pool.query(
        `UPDATE pedido SET id_cliente = $1,
                origen = $2,
                destino = $3,
                tipo_carga = $4,
                cantidad = $5,
                peso = $6,
                observaciones = $7,
                fecha_estimada = $8 WHERE id_pedido = $9 RETURNING *`,
        [limpios.id_cliente, limpios.origen, limpios.destino, limpios.tipo_carga, limpios.cantidad, limpios.peso, limpios.observaciones, limpios.fecha_estimada, id]
    );
    return resultado.rows[0];
}

async function eliminar(id) {
    const relacionados = await pool.query("SELECT 1 FROM envio WHERE id_pedido = $1 LIMIT 1", [id]);
    if (relacionados.rowCount) throw crearError(409, "No se puede eliminar porque tiene registros relacionados");
    const resultado = await pool.query("DELETE FROM pedido WHERE id_pedido = $1 RETURNING *", [id]);
    return { modo: "ELIMINADO", registro: resultado.rows[0] };
}

module.exports = { listar, buscar, crear, actualizar, eliminar };
