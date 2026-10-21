require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

async function crearAdministrador() {
    const nombre = process.env.ADMIN_USUARIO;
    const clave = process.env.ADMIN_CLAVE;
    if (!nombre || nombre.length > 100 || !clave || clave.length < 10) {
        throw new Error("Definí ADMIN_USUARIO y ADMIN_CLAVE (mínimo 10 caracteres) en la terminal CMD");
    }
    try {
        const hash = await bcrypt.hash(clave, 12);
        const resultado = await pool.query(
            `INSERT INTO usuario (usuario, hash_clave, rol, activo)
             VALUES ($1, $2, 'ADMINISTRADOR', TRUE)
             ON CONFLICT (usuario) DO NOTHING RETURNING id_usuario`, [nombre, hash]
        );
        console.log(resultado.rowCount ? "Administrador creado correctamente" : "Ese usuario ya existe; no se modificó");
    } finally {
        await pool.end();
    }
}
crearAdministrador().catch(error => {
    console.error("Error al crear administrador:", error.message);
    process.exitCode = 1;
});
