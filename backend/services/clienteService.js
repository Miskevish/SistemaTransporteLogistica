
const pool = require("../db");

const {
    texto,
    entero,
    correo
} = require("../validators/validaciones");

const { crearError } = require("../middleware/errores");


function validarCliente(datos) {
    const cliente = {
        razon_social: texto(
            datos.razon_social,
            "razon_social",
            150,
            true
        ),

        cuit: texto(
            datos.cuit,
            "cuit",
            11,
            true
        ),

        telefono: texto(
            datos.telefono,
            "telefono",
            30,
            false
        ),

        email: correo(datos.email),

        domicilio: texto(
            datos.domicilio,
            "domicilio",
            200,
            false
        ),

        localidad: texto(
            datos.localidad,
            "localidad",
            100,
            false
        )
    };

    // El CUIT debe tener exactamente 11 dígitos.
    if (!/^\d{11}$/.test(cliente.cuit)) {
        throw crearError(
            400,
            "El CUIT debe contener exactamente 11 dígitos"
        );
    }

    return cliente;
}


async function verificarPedidosAsociados(idCliente, conexion = pool) {
    const resultado = await conexion.query(
        `SELECT 1
         FROM pedido
         WHERE id_cliente = $1
         LIMIT 1`,
        [idCliente]
    );

    return resultado.rows.length > 0;
}


async function listar() {
    // La lista principal muestra solamente clientes activos.
    const resultado = await pool.query(
        `SELECT *
         FROM cliente
         WHERE activo = TRUE
         ORDER BY id_cliente ASC`
    );

    return resultado.rows;
}


async function buscar(id) {
    const idCliente = entero(id, "id_cliente");

    const resultado = await pool.query(
        `SELECT *
         FROM cliente
         WHERE id_cliente = $1`,
        [idCliente]
    );

    return resultado.rows[0];
}


async function crear(datos) {
    const cliente = validarCliente(datos);

    const resultado = await pool.query(
        `INSERT INTO cliente (
            razon_social,
            cuit,
            telefono,
            email,
            domicilio,
            localidad,
            activo
         )
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING *`,
        [
            cliente.razon_social,
            cliente.cuit,
            cliente.telefono,
            cliente.email,
            cliente.domicilio,
            cliente.localidad
        ]
    );

    return resultado.rows[0];
}


async function actualizar(id, datos) {
    const idCliente = entero(id, "id_cliente");

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Bloquear el cliente durante la modificación.
        const resultadoAnterior = await conexion.query(
            `SELECT *
             FROM cliente
             WHERE id_cliente = $1
             FOR UPDATE`,
            [idCliente]
        );

        const anterior = resultadoAnterior.rows[0];

        if (!anterior) {
            throw crearError(
                404,
                "El cliente no existe"
            );
        }

        // No permitir modificaciones de clientes dados de baja.
        if (!anterior.activo) {
            throw crearError(
                409,
                "El cliente está dado de baja y no puede modificarse"
            );
        }

        // Combinar los datos existentes con los nuevos.
        const cliente = validarCliente({
            ...anterior,
            ...datos
        });

        const resultado = await conexion.query(
            `UPDATE cliente
             SET razon_social = $1,
                 cuit = $2,
                 telefono = $3,
                 email = $4,
                 domicilio = $5,
                 localidad = $6
             WHERE id_cliente = $7
             RETURNING *`,
            [
                cliente.razon_social,
                cliente.cuit,
                cliente.telefono,
                cliente.email,
                cliente.domicilio,
                cliente.localidad,
                idCliente
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
    const idCliente = entero(id, "id_cliente");

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Bloquear el registro antes de decidir cómo eliminarlo.
        const resultadoCliente = await conexion.query(
            `SELECT *
             FROM cliente
             WHERE id_cliente = $1
             FOR UPDATE`,
            [idCliente]
        );

        const cliente = resultadoCliente.rows[0];

        if (!cliente) {
            throw crearError(
                404,
                "El cliente no existe"
            );
        }

        // Verificar si tiene pedidos registrados.
        const tienePedidos = await verificarPedidosAsociados(
            idCliente,
            conexion
        );

        if (tienePedidos) {
            // Conservar el cliente para no perder su historial.
            if (!cliente.activo) {
                throw crearError(
                    409,
                    "El cliente ya está dado de baja y tiene pedidos asociados"
                );
            }

            const resultadoBaja = await conexion.query(
                `UPDATE cliente
                 SET activo = FALSE
                 WHERE id_cliente = $1
                 RETURNING *`,
                [idCliente]
            );

            await conexion.query("COMMIT");

            return {
                modo: "BAJA_LOGICA",
                registro: resultadoBaja.rows[0]
            };
        }

        // Un cliente sin pedidos puede eliminarse definitivamente.
        const resultadoEliminado = await conexion.query(
            `DELETE FROM cliente
             WHERE id_cliente = $1
             RETURNING *`,
            [idCliente]
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
