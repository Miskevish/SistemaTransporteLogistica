const pool = require("../db");

async function resumen(req, res) {
    const clientes = await pool.query("SELECT COUNT(*)::integer AS total FROM cliente WHERE activo = TRUE");
    const pedidos = await pool.query("SELECT COUNT(*)::integer AS total FROM pedido");
    const vehiculos = await pool.query("SELECT COUNT(*)::integer AS total FROM vehiculo WHERE estado = 'DISPONIBLE'");
    const enTransito = await pool.query("SELECT COUNT(*)::integer AS total FROM envio WHERE estado_actual = 'EN_TRANSITO'");
    const entregados = await pool.query("SELECT COUNT(*)::integer AS total FROM envio WHERE estado_actual = 'ENTREGADO'");
    res.json({
        clientes_activos: clientes.rows[0].total,
        pedidos: pedidos.rows[0].total,
        vehiculos_disponibles: vehiculos.rows[0].total,
        envios_en_transito: enTransito.rows[0].total,
        envios_entregados: entregados.rows[0].total
    });
}
module.exports = { resumen };
