
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { crearError } = require("./errores");

async function autenticar(req, res, next) {
    try {
        const autorizacion = req.get("Authorization");

        if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
            throw crearError(401, "No se recibió el token de autenticación");
        }

        const token = autorizacion.substring(7).trim();

        const datos = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        const idUsuario = Number(datos.id_usuario);

        if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
            throw crearError(401, "El token no contiene un usuario válido");
        }

        const resultado = await pool.query(
            `SELECT id_usuario, usuario, rol, activo, id_conductor
             FROM usuario
             WHERE id_usuario = $1`,
            [idUsuario]
        );

        const usuario = resultado.rows[0];

        if (!usuario || !usuario.activo) {
            throw crearError(401, "La cuenta no está activa");
        }

        if (usuario.rol === "CONDUCTOR") {
            const conductor = await pool.query(
                "SELECT estado FROM conductor WHERE id_conductor = $1",
                [usuario.id_conductor]
            );

            if (
                conductor.rows.length === 0 ||
                conductor.rows[0].estado !== "ACTIVO"
            ) {
                throw crearError(401, "El conductor no está activo");
            }
        }

        req.usuario = usuario;

        next();

    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError"
        ) {
            return next(
                crearError(401, "Token inválido o sesión vencida")
            );
        }

        next(error);
    }
}

function permitirRoles(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.rol)) {
            return next(
                crearError(403, "No tenés permiso para esta operación")
            );
        }

        next();
    };
}

module.exports = {
    autenticar,
    permitirRoles
};
