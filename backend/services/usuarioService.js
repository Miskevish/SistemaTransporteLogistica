
const pool = require("../db");
const bcrypt = require("bcryptjs");

const { crearError } = require("../middleware/errores");

const {
    texto,
    entero,
    opcion
} = require("../validators/validaciones");


const ROLES_USUARIO = [
    "ADMINISTRADOR",
    "OPERADOR",
    "CONDUCTOR"
];

const CAMPOS_PUBLICOS = `
    id_usuario,
    usuario,
    rol,
    activo,
    id_conductor
`;

const MINIMO_CARACTERES_CLAVE = 10;
const RONDAS_BCRYPT = 12;


function validarClave(clave) {
    const claveValidada = texto(
        clave,
        "clave",
        150,
        true
    );

    if (claveValidada.length < MINIMO_CARACTERES_CLAVE) {
        throw crearError(
            400,
            "La contraseña debe tener al menos 10 caracteres"
        );
    }

    return claveValidada;
}


function validarActivo(valor) {
    if (typeof valor !== "boolean") {
        throw crearError(
            400,
            "El campo activo debe ser verdadero o falso"
        );
    }

    return valor;
}


async function bloquearGestionUsuarios(conexion) {
    // Evitar modificaciones simultáneas que puedan
    // dejar al sistema sin administradores activos.
    await conexion.query(
        "SELECT pg_advisory_xact_lock($1, $2)",
        [3, 1]
    );
}


async function verificarConductor(
    idConductor,
    requiereActivo,
    conexion
) {
    // Coordinar la operación con el servicio de conductores.
    await conexion.query(
        "SELECT pg_advisory_xact_lock($1, $2)",
        [2, idConductor]
    );

    const resultado = await conexion.query(
        `SELECT id_conductor, estado
         FROM conductor
         WHERE id_conductor = $1
         FOR SHARE`,
        [idConductor]
    );

    const conductor = resultado.rows[0];

    if (!conductor) {
        throw crearError(
            404,
            "El conductor seleccionado no existe"
        );
    }

    if (requiereActivo && conductor.estado !== "ACTIVO") {
        throw crearError(
            409,
            "No se puede activar una cuenta vinculada a un conductor inactivo"
        );
    }

    return conductor;
}


async function verificarAdministradoresActivos(conexion) {
    const resultado = await conexion.query(
        `SELECT COUNT(*)::INTEGER AS cantidad
         FROM usuario
         WHERE rol = 'ADMINISTRADOR'
           AND activo = TRUE`
    );

    const cantidad = resultado.rows[0].cantidad;

    if (cantidad === 0) {
        throw crearError(
            409,
            "El sistema debe conservar al menos un administrador activo"
        );
    }
}


async function listar() {
    const resultado = await pool.query(
        `SELECT ${CAMPOS_PUBLICOS}
         FROM usuario
         ORDER BY id_usuario ASC`
    );

    return resultado.rows;
}


async function crear(datos) {
    const nombre = texto(
        datos.usuario,
        "usuario",
        100,
        true
    );

    const clave = validarClave(datos.clave);

    const rol = opcion(
        datos.rol,
        "rol",
        ROLES_USUARIO
    );

    let idConductor = null;

    if (rol === "CONDUCTOR") {
        idConductor = entero(
            datos.id_conductor,
            "id_conductor"
        );
    }

    // Cifrar la contraseña antes de guardarla.
    const hashClave = await bcrypt.hash(
        clave,
        RONDAS_BCRYPT
    );

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        await bloquearGestionUsuarios(conexion);

        // Una cuenta nueva de conductor necesita
        // un conductor existente y activo.
        if (rol === "CONDUCTOR") {
            await verificarConductor(
                idConductor,
                true,
                conexion
            );
        }

        const resultado = await conexion.query(
            `INSERT INTO usuario (
                usuario,
                hash_clave,
                rol,
                activo,
                id_conductor
             )
             VALUES ($1, $2, $3, TRUE, $4)
             RETURNING ${CAMPOS_PUBLICOS}`,
            [
                nombre,
                hashClave,
                rol,
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


async function actualizar(id, datos, solicitante) {
    const idUsuario = entero(id, "id_usuario");
    const idSolicitante = entero(
        solicitante.id_usuario,
        "id_usuario_solicitante"
    );

    // Preparar la nueva contraseña únicamente si fue enviada.
    let hashClave = null;

    if (datos.clave !== undefined) {
        const clave = validarClave(datos.clave);

        hashClave = await bcrypt.hash(
            clave,
            RONDAS_BCRYPT
        );
    }

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        await bloquearGestionUsuarios(conexion);

        // Bloquear el usuario mientras se actualizan sus datos.
        const resultadoAnterior = await conexion.query(
            `SELECT ${CAMPOS_PUBLICOS}
             FROM usuario
             WHERE id_usuario = $1
             FOR UPDATE`,
            [idUsuario]
        );

        const anterior = resultadoAnterior.rows[0];

        if (!anterior) {
            throw crearError(
                404,
                "El usuario no existe"
            );
        }

        // Conservar los valores anteriores cuando
        // no se envíen nuevos datos.
        const nombre = texto(
            datos.usuario ?? anterior.usuario,
            "usuario",
            100,
            true
        );

        const rol = opcion(
            datos.rol ?? anterior.rol,
            "rol",
            ROLES_USUARIO
        );

        const activo = validarActivo(
            datos.activo === undefined
                ? anterior.activo
                : datos.activo
        );

        // Impedir que un administrador elimine
        // sus propios permisos o acceso.
        if (idUsuario === idSolicitante) {
            if (!activo) {
                throw crearError(
                    409,
                    "No podés desactivar tu propia cuenta"
                );
            }

            if (
                anterior.rol === "ADMINISTRADOR" &&
                rol !== "ADMINISTRADOR"
            ) {
                throw crearError(
                    409,
                    "No podés quitarte tus propios permisos de administrador"
                );
            }
        }

        let idConductor = null;

        if (rol === "CONDUCTOR") {
            idConductor = entero(
                datos.id_conductor ?? anterior.id_conductor,
                "id_conductor"
            );

            // Las cuentas activas solo pueden vincularse
            // a conductores que estén activos.
            await verificarConductor(
                idConductor,
                activo,
                conexion
            );
        }

        // Actualizar los datos de la cuenta.
        const resultado = await conexion.query(
            `UPDATE usuario
             SET usuario = $1,
                 rol = $2,
                 activo = $3,
                 id_conductor = $4,
                 hash_clave = COALESCE($5::VARCHAR, hash_clave)
             WHERE id_usuario = $6
             RETURNING ${CAMPOS_PUBLICOS}`,
            [
                nombre,
                rol,
                activo,
                idConductor,
                hashClave,
                idUsuario
            ]
        );

        // Comprobar que siga existiendo al menos
        // un administrador activo.
        await verificarAdministradoresActivos(conexion);

        await conexion.query("COMMIT");

        return resultado.rows[0];

    } catch (error) {
        await conexion.query("ROLLBACK");
        throw error;

    } finally {
        conexion.release();
    }
}


async function desactivar(id, solicitante) {
    const idUsuario = entero(id, "id_usuario");

    const idSolicitante = entero(
        solicitante.id_usuario,
        "id_usuario_solicitante"
    );

    // No permitir que el usuario desactive su propia cuenta.
    if (idUsuario === idSolicitante) {
        throw crearError(
            409,
            "No podés desactivar tu propia cuenta"
        );
    }

    const conexion = await pool.connect();

    try {
        await conexion.query("BEGIN");

        await bloquearGestionUsuarios(conexion);

        const resultadoAnterior = await conexion.query(
            `SELECT ${CAMPOS_PUBLICOS}
             FROM usuario
             WHERE id_usuario = $1
             FOR UPDATE`,
            [idUsuario]
        );

        const usuario = resultadoAnterior.rows[0];

        if (!usuario) {
            throw crearError(
                404,
                "El usuario no existe"
            );
        }

        if (!usuario.activo) {
            throw crearError(
                409,
                "La cuenta ya se encuentra desactivada"
            );
        }

        // Desactivar sin eliminar el registro ni su historial.
        const resultado = await conexion.query(
            `UPDATE usuario
             SET activo = FALSE
             WHERE id_usuario = $1
             RETURNING ${CAMPOS_PUBLICOS}`,
            [idUsuario]
        );

        // No permitir que se desactive
        // el último administrador activo.
        await verificarAdministradoresActivos(conexion);

        await conexion.query("COMMIT");

        return resultado.rows[0];

    } catch (error) {
        await conexion.query("ROLLBACK");
        throw error;

    } finally {
        conexion.release();
    }
}


module.exports = {
    listar,
    crear,
    actualizar,
    desactivar
};
