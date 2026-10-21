
const pool = require("../db");


async function resumen(req, res) {
    const consulta = `
        SELECT
            (
                SELECT COUNT(*)::INTEGER
                FROM cliente
                WHERE activo = TRUE
            ) AS clientes_activos,

            (
                SELECT COUNT(*)::INTEGER
                FROM pedido
            ) AS pedidos,

            (
                SELECT COUNT(*)::INTEGER
                FROM vehiculo
                WHERE estado = 'DISPONIBLE'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM envio
                      WHERE envio.id_vehiculo = vehiculo.id_vehiculo
                        AND envio.estado_actual IN (
                            'PENDIENTE',
                            'EN_TRANSITO'
                        )
                  )
            ) AS vehiculos_disponibles,

            (
                SELECT COUNT(*)::INTEGER
                FROM envio
                WHERE estado_actual = 'EN_TRANSITO'
            ) AS envios_en_transito,

            (
                SELECT COUNT(*)::INTEGER
                FROM envio
                WHERE estado_actual = 'ENTREGADO'
            ) AS envios_entregados
    `;

    const resultado = await pool.query(consulta);

    const estadisticas = resultado.rows[0];

    return res.status(200).json({
        clientes_activos: estadisticas.clientes_activos,
        pedidos: estadisticas.pedidos,
        vehiculos_disponibles: estadisticas.vehiculos_disponibles,
        envios_en_transito: estadisticas.envios_en_transito,
        envios_entregados: estadisticas.envios_entregados
    });
}


module.exports = {
    resumen
};
