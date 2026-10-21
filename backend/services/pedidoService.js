
const pool = require("../db");

const {
    texto,
    entero,
    positivo,
    fecha
} = require("../validators/validaciones");

const { crearError } = require("../middleware/errores");


function validarPedido(datos) {
    const pedido = {
        id_cliente: entero(
            datos.id_cliente,
            "id_cliente"
        ),

        origen: texto(
            datos.origen,
            "origen",
            200,
            true
        ),

        destino: texto(
            datos.destino,
            "destino",
            200,
            true
        ),

        tipo_carga: texto(
            datos.tipo_carga,
            "tipo_carga",
            100,
            true
        ),

        cantidad: entero(
            datos.cantidad,
            "cantidad",
            1,
            true
        ),

        peso: positivo(
            datos.peso,
            "peso"
        ),

        observaciones: texto(
            datos.observaciones,
            "observaciones",
            3000
        ),

        fecha_estimada: fecha(
            datos.fecha_estimada,
            "fecha_estimada"
        )
    };

    // El transporte debe tener origen y destino diferentes.
    if (
        pedido.origen.toLowerCase() ===
        pedido.destino.toLowerCase()
    ) {
        throw crearError(
            400,
            "El origen y el destino deben ser diferentes"
        );
    }

    return pedido;
}


async function verificarClienteActivo(idCliente, conexion = pool) {
    const resultado = await conexion.query(
        `SELECT id_cliente, activo
         FROM cliente
         WHERE id_cliente = $1`,
        [idCliente]
    );

    const cliente = resultado.rows[0];

    if (!cliente) {
        throw crearError(
            404,
            "El cliente seleccionado no existe"
        );
    }

    if (!cliente.activo) {
        throw crearError(
            409,
            "No se pueden registrar pedidos para un cliente dado de baja"
        );
    }

    return cliente;
}


async function verificarEnvioAsociado(idPedido, conexion = pool) {
    const resultado = await conexion.query(
        `SELECT id_envio, estado_actual
         FROM envio
         WHERE id_pedido = $1
         LIMIT 1`,
        [idPedido]
    );

    return resultado.rows[0] || null;
}


async function listar() {
    const resultado = await pool.query(
        `SELECT *
         FROM pedido
         ORDER BY id_pedido ASC`
    );

    return resultado.rows;
}


async function buscar(id) {
    const idPedido = entero(id, "id_pedido");

    const resultado = await pool.query(
        `SELECT *
         FROM pedido
         WHERE id_pedido = $1`,
        [idPedido]
    );

    return resultado.rows[0];
}


async function crear(datos) {
    const pedido = validarPedido(datos);

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Bloquear el cliente mientras se valida su estado.
        const resultadoCliente = await conexion.query(
            `SELECT id_cliente, activo
             FROM cliente
             WHERE id_cliente = $1
             FOR SHARE`,
            [pedido.id_cliente]
        );

        const cliente = resultadoCliente.rows[0];

        if (!cliente) {
            throw crearError(
                404,
                "El cliente seleccionado no existe"
            );
        }

        if (!cliente.activo) {
            throw crearError(
                409,
                "No se pueden registrar pedidos para un cliente dado de baja"
            );
        }

        // Registrar el pedido.
        const resultadoPedido = await conexion.query(
            `INSERT INTO pedido (
                id_cliente,
                origen,
                destino,
                tipo_carga,
                cantidad,
                peso,
                observaciones,
                fecha_estimada
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                pedido.id_cliente,
                pedido.origen,
                pedido.destino,
                pedido.tipo_carga,
                pedido.cantidad,
                pedido.peso,
                pedido.observaciones,
                pedido.fecha_estimada
            ]
        );

        await conexion.query("COMMIT");

        return resultadoPedido.rows[0];

    } catch (error) {
        await conexion.query("ROLLBACK");
        throw error;

    } finally {
        conexion.release();
    }
}


async function actualizar(id, datos) {
    const idPedido = entero(id, "id_pedido");

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Bloquear el pedido para evitar modificaciones simultáneas.
        const resultadoAnterior = await conexion.query(
            `SELECT *
             FROM pedido
             WHERE id_pedido = $1
             FOR UPDATE`,
            [idPedido]
        );

        const pedidoAnterior = resultadoAnterior.rows[0];

        if (!pedidoAnterior) {
            throw crearError(
                404,
                "El pedido no existe"
            );
        }

        // Validar los campos recibidos.
        const pedido = validarPedido({
            ...pedidoAnterior,
            ...datos
        });

        // No modificar pedidos que ya forman parte de un envío.
        const envioAsociado = await verificarEnvioAsociado(
            idPedido,
            conexion
        );

        if (envioAsociado) {
            throw crearError(
                409,
                "No se puede modificar un pedido que ya tiene un envío asociado"
            );
        }

        // Comprobar que el cliente seleccionado esté activo.
        await verificarClienteActivo(
            pedido.id_cliente,
            conexion
        );

        // Actualizar el pedido.
        const resultado = await conexion.query(
            `UPDATE pedido
             SET id_cliente = $1,
                 origen = $2,
                 destino = $3,
                 tipo_carga = $4,
                 cantidad = $5,
                 peso = $6,
                 observaciones = $7,
                 fecha_estimada = $8
             WHERE id_pedido = $9
             RETURNING *`,
            [
                pedido.id_cliente,
                pedido.origen,
                pedido.destino,
                pedido.tipo_carga,
                pedido.cantidad,
                pedido.peso,
                pedido.observaciones,
                pedido.fecha_estimada,
                idPedido
            ]
        );

        await conexion.query("COMMIT");

        return resultado.rows[0];

    } catch (error) {
        await conexion.query("ROLLBACK");
        throw error;

    } finally {
        conexion.release();
    }
}


async function eliminar(id) {
    const idPedido = entero(id, "id_pedido");

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Bloquear el pedido antes de comprobar sus relaciones.
        const resultadoPedido = await conexion.query(
            `SELECT *
             FROM pedido
             WHERE id_pedido = $1
             FOR UPDATE`,
            [idPedido]
        );

        const pedido = resultadoPedido.rows[0];

        if (!pedido) {
            throw crearError(
                404,
                "El pedido no existe"
            );
        }

        // Comprobar si el pedido tiene un envío asociado.
        const envioAsociado = await verificarEnvioAsociado(
            idPedido,
            conexion
        );

        if (envioAsociado) {
            throw crearError(
                409,
                "No se puede eliminar este pedido porque tiene un envío asociado. Se debe conservar su historial."
            );
        }

        // Eliminar definitivamente el pedido sin relaciones.
        const resultadoEliminado = await conexion.query(
            `DELETE FROM pedido
             WHERE id_pedido = $1
             RETURNING *`,
            [idPedido]
        );

        await conexion.query("COMMIT");

        return {
            modo: "ELIMINADO",
            registro: resultadoEliminado.rows[0]
        };

    } catch (error) {
        await conexion.query("ROLLBACK");
        throw error;

    } finally {
        conexion.release();
    }
}


module.exports = {
    listar,
    buscar,
    crear,
    actualizar,
    eliminar
};
