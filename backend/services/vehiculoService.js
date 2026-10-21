
const pool = require("../db");

const {
    texto,
    entero,
    positivo,
    opcion
} = require("../validators/validaciones");

const { crearError } = require("../middleware/errores");


const ESTADOS_VEHICULO = [
    "DISPONIBLE",
    "EN_VIAJE",
    "MANTENIMIENTO"
];

const ESTADOS_ENVIO_ACTIVO = [
    "PENDIENTE",
    "EN_TRANSITO"
];


function validarVehiculo(datos) {
    const vehiculo = {
        id_tipo_vehiculo: entero(
            datos.id_tipo_vehiculo,
            "id_tipo_vehiculo"
        ),

        patente: texto(
            datos.patente,
            "patente",
            15,
            true
        ),

        marca: texto(
            datos.marca,
            "marca",
            100,
            true
        ),

        modelo: texto(
            datos.modelo,
            "modelo",
            100,
            true
        ),

        anio: entero(
            datos.anio,
            "anio",
            1,
            false
        ),

        capacidad: positivo(
            datos.capacidad,
            "capacidad"
        ),

        estado: opcion(
            datos.estado || "DISPONIBLE",
            "estado",
            ESTADOS_VEHICULO
        )
    };

    const anioActual = new Date().getFullYear();

    if (
        vehiculo.anio !== null &&
        vehiculo.anio !== undefined &&
        (vehiculo.anio < 1950 || vehiculo.anio > anioActual + 1)
    ) {
        throw crearError(
            400,
            "El año del vehículo está fuera del rango permitido"
        );
    }

    return vehiculo;
}


async function verificarTipoVehiculo(idTipoVehiculo, conexion = pool) {
    const resultado = await conexion.query(
        `SELECT id_tipo_vehiculo
         FROM tipo_vehiculo
         WHERE id_tipo_vehiculo = $1`,
        [idTipoVehiculo]
    );

    if (resultado.rows.length === 0) {
        throw crearError(
            400,
            "El tipo de vehículo seleccionado no existe"
        );
    }
}


async function verificarEnviosActivos(idVehiculo, conexion = pool) {
    const resultado = await conexion.query(
        `SELECT id_envio, estado_actual
         FROM envio
         WHERE id_vehiculo = $1
           AND estado_actual IN ('PENDIENTE', 'EN_TRANSITO')
         LIMIT 1`,
        [idVehiculo]
    );

    return resultado.rows[0] || null;
}


async function tieneHistorialEnvios(idVehiculo, conexion = pool) {
    const resultado = await conexion.query(
        `SELECT 1
         FROM envio
         WHERE id_vehiculo = $1
         LIMIT 1`,
        [idVehiculo]
    );

    return resultado.rows.length > 0;
}


async function listar() {
    const resultado = await pool.query(
        `SELECT *
         FROM vehiculo
         ORDER BY id_vehiculo ASC`
    );

    return resultado.rows;
}


async function buscar(id) {
    const idVehiculo = entero(id, "id_vehiculo");

    const resultado = await pool.query(
        `SELECT *
         FROM vehiculo
         WHERE id_vehiculo = $1`,
        [idVehiculo]
    );

    return resultado.rows[0];
}


async function crear(datos) {
    const vehiculo = validarVehiculo(datos);

    // El estado EN_VIAJE se asignará desde el proceso de envíos.
    if (vehiculo.estado === "EN_VIAJE") {
        throw crearError(
            400,
            "Un vehículo nuevo no puede registrarse directamente en viaje"
        );
    }

    await verificarTipoVehiculo(vehiculo.id_tipo_vehiculo);

    const resultado = await pool.query(
        `INSERT INTO vehiculo (
            id_tipo_vehiculo,
            patente,
            marca,
            modelo,
            anio,
            capacidad,
            estado
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
            vehiculo.id_tipo_vehiculo,
            vehiculo.patente,
            vehiculo.marca,
            vehiculo.modelo,
            vehiculo.anio,
            vehiculo.capacidad,
            vehiculo.estado
        ]
    );

    return resultado.rows[0];
}


async function actualizar(id, datos) {
    const idVehiculo = entero(id, "id_vehiculo");

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Coordinar las modificaciones con las asignaciones de envíos.
        await conexion.query(
            "SELECT pg_advisory_xact_lock($1, $2)",
            [1, idVehiculo]
        );

        const resultadoAnterior = await conexion.query(
            `SELECT *
             FROM vehiculo
             WHERE id_vehiculo = $1
             FOR UPDATE`,
            [idVehiculo]
        );

        const anterior = resultadoAnterior.rows[0];

        if (!anterior) {
            throw crearError(
                404,
                "El vehículo no existe"
            );
        }

        // Validar los datos nuevos junto con los anteriores.
        const vehiculo = validarVehiculo({
            ...anterior,
            ...datos
        });

        // Comprobar que el tipo de vehículo exista.
        await verificarTipoVehiculo(
            vehiculo.id_tipo_vehiculo,
            conexion
        );

        // No permitir modificaciones mientras tenga un envío activo.
        const envioActivo = await verificarEnviosActivos(
            idVehiculo,
            conexion
        );

        if (envioActivo) {
            throw crearError(
                409,
                "No se puede modificar un vehículo asignado a un envío pendiente o en tránsito"
            );
        }

        // El estado EN_VIAJE debe manejarlo el proceso de envíos.
        if (vehiculo.estado === "EN_VIAJE") {
            throw crearError(
                409,
                "El estado EN_VIAJE no puede establecerse manualmente"
            );
        }

        const resultado = await conexion.query(
            `UPDATE vehiculo
             SET id_tipo_vehiculo = $1,
                 patente = $2,
                 marca = $3,
                 modelo = $4,
                 anio = $5,
                 capacidad = $6,
                 estado = $7
             WHERE id_vehiculo = $8
             RETURNING *`,
            [
                vehiculo.id_tipo_vehiculo,
                vehiculo.patente,
                vehiculo.marca,
                vehiculo.modelo,
                vehiculo.anio,
                vehiculo.capacidad,
                vehiculo.estado,
                idVehiculo
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
    const idVehiculo = entero(id, "id_vehiculo");

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Evitar conflictos con solicitudes de asignación simultáneas.
        await conexion.query(
            "SELECT pg_advisory_xact_lock($1, $2)",
            [1, idVehiculo]
        );

        const resultadoVehiculo = await conexion.query(
            `SELECT *
             FROM vehiculo
             WHERE id_vehiculo = $1
             FOR UPDATE`,
            [idVehiculo]
        );

        const vehiculo = resultadoVehiculo.rows[0];

        if (!vehiculo) {
            throw crearError(
                404,
                "El vehículo no existe"
            );
        }

        // Verificar que no tenga envíos activos.
        const envioActivo = await verificarEnviosActivos(
            idVehiculo,
            conexion
        );

        if (envioActivo) {
            throw crearError(
                409,
                "No se puede eliminar un vehículo con envíos pendientes o en tránsito"
            );
        }

        // Comprobar si existen envíos históricos relacionados.
        const tieneHistorial = await tieneHistorialEnvios(
            idVehiculo,
            conexion
        );

        if (tieneHistorial) {
            /*
             * El vehículo tiene historial.
             * No se elimina físicamente para conservar las relaciones.
             *
             * IMPORTANTE:
             * La tabla actual no tiene un estado BAJA.
             * MANTENIMIENTO se usa temporalmente para impedir
             * nuevas asignaciones hasta incorporar la baja real.
             */

            const resultadoBaja = await conexion.query(
                `UPDATE vehiculo
                 SET estado = 'MANTENIMIENTO'
                 WHERE id_vehiculo = $1
                 RETURNING *`,
                [idVehiculo]
            );

            await conexion.query("COMMIT");

            return {
                modo: "BAJA_LOGICA",
                registro: resultadoBaja.rows[0]
            };
        }

        // Si nunca tuvo envíos, puede eliminarse definitivamente.
        const resultadoEliminado = await conexion.query(
            `DELETE FROM vehiculo
             WHERE id_vehiculo = $1
             RETURNING *`,
            [idVehiculo]
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
