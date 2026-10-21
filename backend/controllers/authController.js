const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { crearError } = require("../middleware/errores");

async function iniciarSesion(req, res) {
    const { usuario, clave } = req.body;
    if (typeof usuario !== "string" || typeof clave !== "string") {
        throw crearError(400, "Ingresá usuario y contraseña");
    }
    const consulta = await pool.query("SELECT * FROM usuario WHERE usuario = $1 AND activo = TRUE", [usuario]);
    const encontrado = consulta.rows[0];
    if (!encontrado || !(await bcrypt.compare(clave, encontrado.hash_clave))) {
        throw crearError(401, "Usuario o contraseña incorrectos");
    }
    const sesion = {
        id_usuario: encontrado.id_usuario,
        usuario: encontrado.usuario,
        rol: encontrado.rol,
        id_conductor: encontrado.id_conductor
    };
    const token = jwt.sign({ id_usuario: encontrado.id_usuario }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ mensaje: "Inicio de sesión correcto", token, usuario: sesion });
}

async function miPerfil(req, res) {
    res.json(req.usuario);
}
module.exports = { iniciarSesion, miPerfil };
