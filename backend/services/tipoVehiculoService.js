
const pool = require("../db");

const {
    texto,
    entero
} = require("../validators/validaciones");

const { crearError } = require("../middleware/errores");


function validarTipoVehiculo(datos) {
    const tipoVehiculo = {
        descripcion: texto(
            datos.descripcion,
            "descripcion",
            100,
            true
        )
    };

    return tipoVehiculo;
}


async function listar() {
    const resultado = await pool.query(
        `SELECT *
         FROM tipo_vehiculo
         ORDER BY id_tipo_vehiculo ASC`
    );

    return resultado.rows;
}


async function buscar(id) {
    const idTipoVehiculo = entero(
        id,
        "id_tipo_vehiculo"
    );

    const resultado = await pool.query(
        `SELECT *
         FROM tipo_vehiculo
         WHERE id_tipo_vehiculo = $1`,
        [idTipoVehiculo]
    );

    return resultado.rows[0];
}


async function crear(datos) {
    const tipoVehiculo = validarTipoVehiculo(datos);

    const resultado = await pool.query(
        `INSERT INTO tipo_vehiculo (
            descripcion
         )
         VALUES ($1)
         RETURNING *`,
        [tipoVehiculo.descripcion]
    );

    return resultado.rows[0];
}


async function actualizar(id, datos) {
    const idTipoVehiculo = entero(
        id,
        "id_tipo_vehiculo"
    );

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Bloquear el registro durante la actualización.
        const resultadoAnterior = await conexion.query(
            `SELECT *
             FROM tipo_vehiculo
             WHERE id_tipo_vehiculo = $1
             FOR UPDATE`,
            [idTipoVehiculo]
        );

        const anterior = resultadoAnterior.rows[0];

        if (!anterior) {
            throw crearError(
                404,
                "El tipo de vehículo no existe"
            );
        }

        // Validar los datos nuevos y conservar los anteriores.
        const tipoVehiculo = validarTipoVehiculo({
            ...anterior,
            ...datos
        });

        const resultado = await conexion.query(
            `UPDATE tipo_vehiculo
             SET descripcion = $1
             WHERE id_tipo_vehiculo = $2
             RETURNING *`,
            [
                tipoVehiculo.descripcion,
                idTipoVehiculo
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
    const idTipoVehiculo = entero(
        id,
        "id_tipo_vehiculo"
    );

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        // Bloquear el tipo de vehículo durante la eliminación.
        const resultadoTipoVehiculo = await conexion.query(
            `SELECT *
             FROM tipo_vehiculo
             WHERE id_tipo_vehiculo = $1
             FOR UPDATE`,
            [idTipoVehiculo]
        );

        const tipoVehiculo = resultadoTipoVehiculo.rows[0];

        if (!tipoVehiculo) {
            throw crearError(
                404,
                "El tipo de vehículo no existe"
            );
        }

        // Verificar si existen vehículos que utilizan este tipo.
        const resultadoVehiculos = await conexion.query(
            `SELECT 1
             FROM vehiculo
             WHERE id_tipo_vehiculo = $1
             LIMIT 1`,
            [idTipoVehiculo]
        );

        if (resultadoVehiculos.rowCount > 0) {
            throw crearError(
                409,
                "No se puede eliminar el tipo de vehículo porque tiene vehículos asociados"
            );
        }

        // Eliminar definitivamente el registro sin relaciones.
        const resultadoEliminado = await conexion.query(
            `DELETE FROM tipo_vehiculo
             WHERE id_tipo_vehiculo = $1
             RETURNING *`,
            [idTipoVehiculo]
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
