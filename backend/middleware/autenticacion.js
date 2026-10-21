
const jwt = require("jsonwebtoken");
const pool = require("../db");

const { crearError } = require("./errores");


async function buscarUsuario(idUsuario) {
    const resultado = await pool.query(
        `SELECT
            usuario.id_usuario,
            usuario.usuario,
            usuario.rol,
            usuario.activo,
            usuario.id_conductor,
            conductor.estado AS estado_conductor
         FROM usuario
         LEFT JOIN conductor
            ON conductor.id_conductor = usuario.id_conductor
         WHERE usuario.id_usuario = $1`,
        [idUsuario]
    );

    return resultado.rows[0] || null;
}


function obtenerToken(encabezado) {
    if (
        typeof encabezado !== "string" ||
        !encabezado.startsWith("Bearer ")
    ) {
        throw crearError(
            401,
            "Se necesita iniciar sesión"
        );
    }

    const token = encabezado.slice(7).trim();

    if (!token) {
        throw crearError(
            401,
            "El token de autenticación está vacío"
        );
    }

    return token;
}


async function autenticar(req, res, next) {
    try {
        // Obtener el token enviado por el frontend.
        const token = obtenerToken(
            req.headers.authorization
        );

        // Verificar la firma y la fecha de vencimiento.
        const datosToken = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        // Comprobar que el token contenga un identificador válido.
        if (
            !datosToken ||
            !Number.isSafeInteger(datosToken.id_usuario) ||
            datosToken.id_usuario <= 0
        ) {
            throw crearError(
                401,
                "La sesión no es válida"
            );
        }

        // Buscar los datos actuales del usuario en PostgreSQL.
        const usuario = await buscarUsuario(
            datosToken.id_usuario
        );

        // Rechazar usuarios inexistentes o desactivados.
        if (!usuario || !usuario.activo) {
            throw crearError(
                401,
                "La sesión no es válida o la cuenta está desactivada"
            );
        }

        // Verificar que las cuentas de conductor
        // estén relacionadas con un conductor activo.
        if (usuario.rol === "CONDUCTOR") {
            if (
                !usuario.id_conductor ||
                usuario.estado_conductor !== "ACTIVO"
            ) {
                throw crearError(
                    403,
                    "El conductor asociado a esta cuenta está inactivo"
                );
            }
        }

        // Guardar únicamente los datos necesarios para las rutas.
        req.usuario = {
            id_usuario: usuario.id_usuario,
            usuario: usuario.usuario,
            rol: usuario.rol,
            activo: usuario.activo,
            id_conductor: usuario.id_conductor
        };

        next();

    } catch (error) {
        // Manejar errores conocidos de los tokens JWT.
        if (error instanceof jwt.TokenExpiredError) {
            return next(
                crearError(
                    401,
                    "La sesión venció. Iniciá sesión nuevamente"
                )
            );
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return next(
                crearError(
                    401,
                    "El token de autenticación no es válido"
                )
            );
        }

        // Enviar los demás errores al middleware centralizado.
        next(error);
    }
}


function permitirRoles(...rolesPermitidos) {
    return function verificarPermisos(req, res, next) {
        // Comprobar que el usuario esté autenticado.
        if (!req.usuario) {
            return next(
                crearError(
                    401,
                    "Se necesita iniciar sesión"
                )
            );
        }

        // Comprobar que tenga uno de los roles autorizados.
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return next(
                crearError(
                    403,
                    "No tenés permiso para realizar esta operación"
                )
            );
        }

        next();
    };
}


module.exports = {
    autenticar,
    permitirRoles
};
