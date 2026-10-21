
const pool = require("../db");

const {
    texto,
    entero,
    opcion,
    correo
} = require("../validators/validaciones");

const { crearError } = require("../middleware/errores");


function validarConductor(datos) {
    const conductor = {
        dni: texto(datos.dni, "dni", 15, true),
        apellido: texto(datos.apellido, "apellido", 100, true),
        nombre: texto(datos.nombre, "nombre", 100, true),
        licencia: texto(datos.licencia, "licencia", 50, true),
        telefono: texto(datos.telefono, "telefono", 30, false),
        email: correo(datos.email),
        estado: opcion(
            datos.estado || "ACTIVO",
            "estado",
            ["ACTIVO", "INACTIVO"]
        )
    };

    if (!/^\d{7,9}$/.test(conductor.dni)) {
        throw crearError(
            400,
            "El DNI debe contener entre 7 y 9 números"
        );
    }

    return conductor;
}


async function listar() {
    const resultado = await pool.query(
        `SELECT *
         FROM conductor
         ORDER BY id_conductor ASC`
    );

    return resultado.rows;
}


async function buscar(id) {
    const idConductor = entero(id, "id_conductor");

    const resultado = await pool.query(
        `SELECT *
         FROM conductor
         WHERE id_conductor = $1`,
        [idConductor]
    );

    return resultado.rows[0];
}


async function crear(datos) {
    const conductor = validarConductor(datos);

    const resultado = await pool.query(
        `INSERT INTO conductor (
            dni,
            apellido,
            nombre,
            licencia,
            telefono,
            email,
            estado
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
            conductor.dni,
            conductor.apellido,
            conductor.nombre,
            conductor.licencia,
            conductor.telefono,
            conductor.email,
            conductor.estado
        ]
    );

    return resultado.rows[0];
}


async function actualizar(id, datos) {
    const idConductor = entero(id, "id_conductor");

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        const resultadoAnterior = await conexion.query(
            `SELECT *
             FROM conductor
             WHERE id_conductor = $1
             FOR UPDATE`,
            [idConductor]
        );

        const anterior = resultadoAnterior.rows[0];

        if (!anterior) {
            throw crearError(404, "Conductor no encontrado");
        }

        const conductor = validarConductor({
            ...anterior,
            ...datos
        });

        if (conductor.estado === "INACTIVO") {
            const resultadoEnvios = await conexion.query(
                `SELECT 1
                 FROM envio
                 WHERE id_conductor = $1
                   AND estado_actual IN ('PENDIENTE', 'EN_TRANSITO')
                 LIMIT 1`,
                [idConductor]
            );

            if (resultadoEnvios.rowCount > 0) {
                throw crearError(
                    409,
                    "No se puede desactivar un conductor que tiene envíos activos"
                );
            }
        }

        const resultado = await conexion.query(
            `UPDATE conductor
             SET dni = $1,
                 apellido = $2,
                 nombre = $3,
                 licencia = $4,
                 telefono = $5,
                 email = $6,
                 estado = $7
             WHERE id_conductor = $8
             RETURNING *`,
            [
                conductor.dni,
                conductor.apellido,
                conductor.nombre,
                conductor.licencia,
                conductor.telefono,
                conductor.email,
                conductor.estado,
                idConductor
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
    const idConductor = entero(id, "id_conductor");

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        const resultadoConductor = await conexion.query(
            `SELECT *
             FROM conductor
             WHERE id_conductor = $1
             FOR UPDATE`,
            [idConductor]
        );

        const conductor = resultadoConductor.rows[0];

        if (!conductor) {
            throw crearError(404, "Conductor no encontrado");
        }

        const resultadoEnviosActivos = await conexion.query(
            `SELECT 1
             FROM envio
             WHERE id_conductor = $1
               AND estado_actual IN ('PENDIENTE', 'EN_TRANSITO')
             LIMIT 1`,
            [idConductor]
        );

        if (resultadoEnviosActivos.rowCount > 0) {
            throw crearError(
                409,
                "No se puede eliminar un conductor con envíos pendientes o en tránsito"
            );
        }

        const resultadoHistorial = await conexion.query(
            `SELECT 1
             FROM envio
             WHERE id_conductor = $1
             LIMIT 1`,
            [idConductor]
        );

        const resultadoUsuarios = await conexion.query(
            `SELECT 1
             FROM usuario
             WHERE id_conductor = $1
             LIMIT 1`,
            [idConductor]
        );

        const tieneHistorial = resultadoHistorial.rowCount > 0;
        const tieneCuenta = resultadoUsuarios.rowCount > 0;

        if (tieneHistorial || tieneCuenta) {
            if (conductor.estado === "INACTIVO") {
                throw crearError(
                    409,
                    "El conductor ya se encuentra dado de baja"
                );
            }

            const resultadoBaja = await conexion.query(
                `UPDATE conductor
                 SET estado = 'INACTIVO'
                 WHERE id_conductor = $1
                 RETURNING *`,
                [idConductor]
            );

            await conexion.query("COMMIT");

            return {
                modo: "BAJA_LOGICA",
                registro: resultadoBaja.rows[0]
            };
        }

        const resultadoEliminado = await conexion.query(
            `DELETE FROM conductor
             WHERE id_conductor = $1
             RETURNING *`,
            [idConductor]
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
