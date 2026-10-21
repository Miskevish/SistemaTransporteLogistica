
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { crearError } = require("../middleware/errores");


const DURACION_TOKEN = "8h";
const MENSAJE_CREDENCIALES = "Usuario o contraseña incorrectos";


function validarCredenciales(datos) {
    if (
        !datos ||
        typeof datos.usuario !== "string" ||
        typeof datos.clave !== "string"
    ) {
        throw crearError(
            400,
            "Ingresá usuario y contraseña"
        );
    }

    const nombreUsuario = datos.usuario.trim();
    const clave = datos.clave;

    if (!nombreUsuario || !clave.trim()) {
        throw crearError(
            400,
            "Ingresá usuario y contraseña"
        );
    }

    if (nombreUsuario.length > 100 || clave.length > 150) {
        throw crearError(
            400,
            "Los datos ingresados superan la longitud permitida"
        );
    }

    return {
        usuario: nombreUsuario,
        clave
    };
}


async function buscarUsuario(nombreUsuario) {
    const resultado = await pool.query(
        `SELECT
            id_usuario,
            usuario,
            hash_clave,
            rol,
            activo,
            id_conductor
         FROM usuario
         WHERE usuario = $1`,
        [nombreUsuario]
    );

    return resultado.rows[0] || null;
}


async function verificarAccesoConductor(usuario) {
    if (usuario.rol !== "CONDUCTOR") {
        return;
    }

    if (!usuario.id_conductor) {
        throw crearError(
            403,
            "Esta cuenta no tiene un conductor asociado"
        );
    }

    const resultado = await pool.query(
        `SELECT estado
         FROM conductor
         WHERE id_conductor = $1`,
        [usuario.id_conductor]
    );

    const conductor = resultado.rows[0];

    if (!conductor || conductor.estado !== "ACTIVO") {
        throw crearError(
            403,
            "La cuenta no puede acceder porque el conductor está inactivo"
        );
    }
}


function crearToken(usuario) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET no está configurado");
    }

    return jwt.sign(
        {
            id_usuario: usuario.id_usuario
        },
        process.env.JWT_SECRET,
        {
            expiresIn: DURACION_TOKEN,
            algorithm: "HS256"
        }
    );
}


async function iniciarSesion(req, res) {
    const credenciales = validarCredenciales(req.body);

    const usuario = await buscarUsuario(
        credenciales.usuario
    );

    // Verificar primero que exista una cuenta activa.
    if (!usuario || !usuario.activo) {
        throw crearError(
            401,
            MENSAJE_CREDENCIALES
        );
    }

    // Comparar la contraseña ingresada con su hash.
    const claveCorrecta = await bcrypt.compare(
        credenciales.clave,
        usuario.hash_clave
    );

    if (!claveCorrecta) {
        throw crearError(
            401,
            MENSAJE_CREDENCIALES
        );
    }

    // Comprobar que el conductor vinculado esté activo.
    await verificarAccesoConductor(usuario);

    // Preparar únicamente los datos públicos de la sesión.
    const datosSesion = {
        id_usuario: usuario.id_usuario,
        usuario: usuario.usuario,
        rol: usuario.rol,
        id_conductor: usuario.id_conductor
    };

    const token = crearToken(usuario);

    return res.status(200).json({
        mensaje: "Inicio de sesión correcto",
        token,
        usuario: datosSesion
    });
}


async function miPerfil(req, res) {
    return res.status(200).json(req.usuario);
}


module.exports = {
    iniciarSesion,
    miPerfil
};
