
const pool = require("../db");

const { crearError } = require("../middleware/errores");

const {
    entero,
    fecha,
    opcion,
    texto
} = require("../validators/validaciones");


const ESTADOS_ENVIO = [
    "PENDIENTE",
    "EN_TRANSITO",
    "ENTREGADO",
    "CANCELADO"
];


async function obtenerEnvio(id, usuario, conexion = pool, bloquear = false) {
    const idEnvio = entero(id, "id_envio");

    let consulta = "SELECT * FROM envio WHERE id_envio = $1";
    const parametros = [idEnvio];

    if (usuario.rol === "CONDUCTOR") {
        consulta += " AND id_conductor = $2";
        parametros.push(usuario.id_conductor);
    }

    if (bloquear) {
        consulta += " FOR UPDATE";
    }

    const resultado = await conexion.query(consulta, parametros);

    if (resultado.rows.length === 0) {
        throw crearError(404, "Envío no encontrado");
    }

    return resultado.rows[0];
}


async function listar(usuario, estado) {
    let consulta = "SELECT * FROM envio WHERE TRUE";
    const parametros = [];

    if (usuario.rol === "CONDUCTOR") {
        parametros.push(usuario.id_conductor);
        consulta += ` AND id_conductor = $${parametros.length}`;
    }

    if (estado) {
        opcion(estado, "estado", ESTADOS_ENVIO);

        parametros.push(estado);
        consulta += ` AND estado_actual = $${parametros.length}`;
    }

    consulta += " ORDER BY id_envio DESC";

    const resultado = await pool.query(consulta, parametros);

    return resultado.rows;
}


async function crear(datos, usuario) {
    const idPedido = entero(datos.id_pedido, "id_pedido");
    const idVehiculo = entero(datos.id_vehiculo, "id_vehiculo");
    const idConductor = entero(datos.id_conductor, "id_conductor");

    const fechaLlegada = fecha(
        datos.fecha_estimada_llegada,
        "fecha_estimada_llegada"
    );

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Bloquear la asignación simultánea del mismo vehículo.
        await conexion.query(
            "SELECT pg_advisory_xact_lock($1, $2)",
            [1, idVehiculo]
        );

        // Bloquear la asignación simultánea del mismo conductor.
        await conexion.query(
            "SELECT pg_advisory_xact_lock($1, $2)",
            [2, idConductor]
        );

        // Verificar que el pedido exista.
        const resultadoPedido = await conexion.query(
            `SELECT *
             FROM pedido
             WHERE id_pedido = $1
             FOR UPDATE`,
            [idPedido]
        );

        const pedido = resultadoPedido.rows[0];

        if (!pedido) {
            throw crearError(404, "El pedido no existe");
        }

        // Verificar que el cliente esté activo.
        const resultadoCliente = await conexion.query(
            `SELECT activo
             FROM cliente
             WHERE id_cliente = $1
             FOR SHARE`,
            [pedido.id_cliente]
        );

        const cliente = resultadoCliente.rows[0];

        if (!cliente || !cliente.activo) {
            throw crearError(409, "El cliente está dado de baja");
        }

        // Cada pedido puede generar un único envío.
        const resultadoExistente = await conexion.query(
            `SELECT 1
             FROM envio
             WHERE id_pedido = $1`,
            [idPedido]
        );

        if (resultadoExistente.rowCount > 0) {
            throw crearError(409, "Este pedido ya tiene un envío");
        }

        // Comprobar que el vehículo esté disponible.
        const resultadoVehiculo = await conexion.query(
            `SELECT *
             FROM vehiculo
             WHERE id_vehiculo = $1
             FOR UPDATE`,
            [idVehiculo]
        );

        const vehiculo = resultadoVehiculo.rows[0];

        if (!vehiculo) {
            throw crearError(404, "El vehículo no existe");
        }

        if (vehiculo.estado !== "DISPONIBLE") {
            throw crearError(409, "El vehículo no está disponible");
        }

        // Comprobar que el vehículo soporte el peso de la carga.
        if (Number(vehiculo.capacidad) < Number(pedido.peso)) {
            throw crearError(
                409,
                "La capacidad del vehículo es insuficiente"
            );
        }

        // Comprobar que el conductor esté activo.
        const resultadoConductor = await conexion.query(
            `SELECT *
             FROM conductor
             WHERE id_conductor = $1
             FOR UPDATE`,
            [idConductor]
        );

        const conductor = resultadoConductor.rows[0];

        if (!conductor) {
            throw crearError(404, "El conductor no existe");
        }

        if (conductor.estado !== "ACTIVO") {
            throw crearError(409, "El conductor no está activo");
        }

        // Evitar asignaciones duplicadas en envíos activos.
        const resultadoOcupado = await conexion.query(
            `SELECT 1
             FROM envio
             WHERE estado_actual IN ('PENDIENTE', 'EN_TRANSITO')
               AND (id_vehiculo = $1 OR id_conductor = $2)
             LIMIT 1`,
            [idVehiculo, idConductor]
        );

        if (resultadoOcupado.rowCount > 0) {
            throw crearError(
                409,
                "El vehículo o conductor ya está asignado a otro envío activo"
            );
        }

        // Comprobar que la fecha estimada de llegada sea válida.
        const resultadoFecha = await conexion.query(
            `SELECT
                $1::DATE >= CURRENT_DATE AS fecha_valida,
                $1::DATE >= $2::DATE AS fecha_pedido_valida`,
            [fechaLlegada, pedido.fecha_estimada]
        );

        const fechas = resultadoFecha.rows[0];

        if (!fechas.fecha_valida || !fechas.fecha_pedido_valida) {
            throw crearError(
                400,
                "La fecha estimada de llegada no puede ser anterior a hoy ni a la fecha del pedido"
            );
        }

        // Registrar el envío con estado pendiente.
        const resultadoEnvio = await conexion.query(
            `INSERT INTO envio (
                id_pedido,
                id_vehiculo,
                id_conductor,
                fecha_estimada_llegada,
                estado_actual
             )
             VALUES ($1, $2, $3, $4, 'PENDIENTE')
             RETURNING *`,
            [
                idPedido,
                idVehiculo,
                idConductor,
                fechaLlegada
            ]
        );

        const envio = resultadoEnvio.rows[0];

        // Guardar el estado inicial en el historial.
        await conexion.query(
            `INSERT INTO estado_envio (
                id_envio,
                estado,
                id_usuario
             )
             VALUES ($1, 'PENDIENTE', $2)`,
            [envio.id_envio, usuario.id_usuario]
        );

        await conexion.query("COMMIT");

        return envio;

    } catch (error) {
        await conexion.query("ROLLBACK");
        throw error;

    } finally {
        conexion.release();
    }
}


async function cambiarEstado(id, estado, usuario) {
    const idEnvio = entero(id, "id_envio");

    opcion(
        estado,
        "estado",
        ["EN_TRANSITO", "CANCELADO"]
    );

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        const envio = await obtenerEnvio(
            idEnvio,
            usuario,
            conexion,
            true
        );

        // Los conductores no pueden cancelar envíos.
        if (estado === "CANCELADO" && usuario.rol === "CONDUCTOR") {
            throw crearError(
                403,
                "Solo el administrador o el operador pueden cancelar envíos"
            );
        }

        // Solo los envíos pendientes pueden iniciarse o cancelarse.
        if (envio.estado_actual !== "PENDIENTE") {
            throw crearError(
                409,
                "Solo se puede iniciar o cancelar un envío pendiente"
            );
        }

        if (estado === "EN_TRANSITO") {
            // Marcar el vehículo como ocupado antes de iniciar el viaje.
            // Esta operación es parte de la misma transacción que el envío.
            const resultadoVehiculo = await conexion.query(
                `UPDATE vehiculo
                 SET estado = 'EN_VIAJE'
                 WHERE id_vehiculo = $1
                   AND estado = 'DISPONIBLE'
                 RETURNING id_vehiculo`,
                [envio.id_vehiculo]
            );

            if (resultadoVehiculo.rowCount === 0) {
                throw crearError(
                    409,
                    "El vehículo no está disponible para iniciar el envío"
                );
            }

            // Registrar el inicio del viaje y su fecha de salida.
            await conexion.query(
                `UPDATE envio
                 SET estado_actual = 'EN_TRANSITO',
                     fecha_salida = CURRENT_TIMESTAMP
                 WHERE id_envio = $1`,
                [idEnvio]
            );
        } else {
            // Un envío pendiente se cancela sin borrar su historial.
            await conexion.query(
                `UPDATE envio
                 SET estado_actual = 'CANCELADO'
                 WHERE id_envio = $1`,
                [idEnvio]
            );
        }

        // Registrar el cambio de estado.
        await conexion.query(
            `INSERT INTO estado_envio (
                id_envio,
                estado,
                id_usuario
             )
             VALUES ($1, $2, $3)`,
            [
                idEnvio,
                estado,
                usuario.id_usuario
            ]
        );

        await conexion.query("COMMIT");

        return {
            id_envio: idEnvio,
            estado_actual: estado
        };

    } catch (error) {
        await conexion.query("ROLLBACK");
        throw error;

    } finally {
        conexion.release();
    }
}


async function registrarEntrega(id, datos, usuario) {
    const idEnvio = entero(id, "id_envio");

    const personaRecibe = texto(
        datos.persona_recibe,
        "persona_recibe",
        150,
        true
    );

    const estadoEntrega = opcion(
        datos.estado_entrega,
        "estado_entrega",
        ["CONFORME", "CON_OBSERVACIONES"]
    );

    const observaciones = texto(
        datos.observaciones,
        "observaciones",
        3000
    );

    if (estadoEntrega === "CON_OBSERVACIONES" && !observaciones) {
        throw crearError(
            400,
            "Tenés que indicar las observaciones de la entrega"
        );
    }

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        const envio = await obtenerEnvio(
            idEnvio,
            usuario,
            conexion,
            true
        );

        // Solo se pueden entregar envíos en tránsito.
        if (envio.estado_actual !== "EN_TRANSITO") {
            throw crearError(
                409,
                "Solo se puede registrar la entrega de un envío en tránsito"
            );
        }

        // Registrar la entrega.
        const resultadoEntrega = await conexion.query(
            `INSERT INTO entrega (
                id_envio,
                persona_recibe,
                observaciones,
                estado_entrega
             )
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                idEnvio,
                personaRecibe,
                observaciones,
                estadoEntrega
            ]
        );

        const entrega = resultadoEntrega.rows[0];

        // Marcar el envío como entregado.
        await conexion.query(
            `UPDATE envio
             SET estado_actual = 'ENTREGADO'
             WHERE id_envio = $1`,
            [idEnvio]
        );

        // Liberar el vehículo después de completar la entrega.
        // Si no está EN_VIAJE, se trata de una inconsistencia de estado.
        const resultadoVehiculo = await conexion.query(
            `UPDATE vehiculo
             SET estado = 'DISPONIBLE'
             WHERE id_vehiculo = $1
               AND estado = 'EN_VIAJE'
             RETURNING id_vehiculo`,
            [envio.id_vehiculo]
        );

        if (resultadoVehiculo.rowCount === 0) {
            throw crearError(
                409,
                "El vehículo no figura en viaje; no se pudo finalizar la entrega"
            );
        }

        // Guardar el último movimiento en el historial.
        await conexion.query(
            `INSERT INTO estado_envio (
                id_envio,
                estado,
                id_usuario
             )
             VALUES ($1, 'ENTREGADO', $2)`,
            [
                idEnvio,
                usuario.id_usuario
            ]
        );

        await conexion.query("COMMIT");

        return entrega;

    } catch (error) {
        await conexion.query("ROLLBACK");
        throw error;

    } finally {
        conexion.release();
    }
}


async function historial(id, usuario) {
    const idEnvio = entero(id, "id_envio");

    // Comprobar que el usuario tenga acceso al envío.
    await obtenerEnvio(idEnvio, usuario);

    const resultado = await pool.query(
        `SELECT
            estado_envio.*,
            usuario.usuario AS responsable
         FROM estado_envio
         LEFT JOIN usuario
            ON usuario.id_usuario = estado_envio.id_usuario
         WHERE estado_envio.id_envio = $1
         ORDER BY
            estado_envio.fecha_hora ASC,
            estado_envio.id_estado_envio ASC`,
        [idEnvio]
    );

    return resultado.rows;
}


module.exports = {
    listar,
    obtenerEnvio,
    crear,
    cambiarEstado,
    registrarEntrega,
    historial
};
