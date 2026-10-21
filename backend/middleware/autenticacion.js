const jwt = require("jsonwebtoken");
const pool = require("../db");
const { crearError } = require("./errores");

async function autenticar(req, res, next) {
    try {
        const encabezado = req.headers.authorization || "";
        if (!encabezado.startsWith("Bearer ")) throw crearError(401, "Se necesita iniciar sesión");
        const token = encabezado.slice(7);
        const datos = jwt.verify(token, process.env.JWT_SECRET);
        const resultado = await pool.query(
            "SELECT id_usuario, usuario, rol, activo, id_conductor FROM usuario WHERE id_usuario = $1",
            [datos.id_usuario]
        );
        const usuario = resultado.rows[0];
        if (!usuario || !usuario.activo) throw crearError(401, "La sesión no es válida");
        req.usuario = usuario;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return next(crearError(401, "Sesión vencida o inválida"));
        }
        next(error);
    }
}

function permitirRoles(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.rol)) {
            return next(crearError(403, "No tenés permiso para esta operación"));
        }
        next();
    };
}

module.exports = { autenticar, permitirRoles };
