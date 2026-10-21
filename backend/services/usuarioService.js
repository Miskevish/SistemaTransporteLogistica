const pool = require("../db");
const bcrypt = require("bcryptjs");
const { crearError } = require("../middleware/errores");
const { texto, entero, opcion } = require("../validators/validaciones");

const camposPublicos = "id_usuario, usuario, rol, activo, id_conductor";

async function listar() {
    const resultado = await pool.query(`SELECT ${camposPublicos} FROM usuario ORDER BY id_usuario`);
    return resultado.rows;
}

async function crear(datos) {
    const nombre = texto(datos.usuario, "usuario", 100, true);
    const clave = texto(datos.clave, "clave", 150, true);
    if (clave.length < 10) throw crearError(400, "La contraseña debe tener al menos 10 caracteres");
    const rol = opcion(datos.rol, "rol", ["ADMINISTRADOR", "OPERADOR", "CONDUCTOR"]);
    const conductor = rol === "CONDUCTOR" ? entero(datos.id_conductor, "id_conductor") : null;
    if (conductor) {
        const resultado = await pool.query("SELECT 1 FROM conductor WHERE id_conductor = $1 AND estado = 'ACTIVO'", [conductor]);
        if (!resultado.rowCount) throw crearError(400, "El conductor no existe o está inactivo");
    }
    const hash = await bcrypt.hash(clave, 12);
    const resultado = await pool.query(
        `INSERT INTO usuario (usuario, hash_clave, rol, activo, id_conductor)
         VALUES ($1, $2, $3, TRUE, $4) RETURNING ${camposPublicos}`,
        [nombre, hash, rol, conductor]
    );
    return resultado.rows[0];
}

async function actualizar(id, datos, solicitante) {
    const consulta = await pool.query(`SELECT ${camposPublicos} FROM usuario WHERE id_usuario = $1`, [id]);
    const anterior = consulta.rows[0];
    if (!anterior) throw crearError(404, "Usuario no encontrado");
    const nombre = texto(datos.usuario ?? anterior.usuario, "usuario", 100, true);
    const rol = opcion(datos.rol ?? anterior.rol, "rol", ["ADMINISTRADOR", "OPERADOR", "CONDUCTOR"]);
    const activo = datos.activo === undefined ? anterior.activo : datos.activo;
    if (typeof activo !== "boolean") throw crearError(400, "activo debe ser verdadero o falso");
    if (id === Number(solicitante.id_usuario) && (!activo || rol !== "ADMINISTRADOR")) {
        throw crearError(409, "No podés quitarte tu propio acceso administrador");
    }
    const conductor = rol === "CONDUCTOR" ? entero(datos.id_conductor ?? anterior.id_conductor, "id_conductor") : null;
    if (conductor) {
        const existe = await pool.query("SELECT 1 FROM conductor WHERE id_conductor = $1", [conductor]);
        if (!existe.rowCount) throw crearError(400, "Conductor inexistente");
    }
    let hash = null;
    if (datos.clave !== undefined) {
        const clave = texto(datos.clave, "clave", 150, true);
        if (clave.length < 10) throw crearError(400, "La contraseña debe tener al menos 10 caracteres");
        hash = await bcrypt.hash(clave, 12);
    }
    const resultado = await pool.query(
        `UPDATE usuario SET usuario = $1, rol = $2, activo = $3, id_conductor = $4,
         hash_clave = COALESCE($5, hash_clave) WHERE id_usuario = $6
         RETURNING ${camposPublicos}`,
        [nombre, rol, activo, conductor, hash, id]
    );
    return resultado.rows[0];
}

async function desactivar(id, solicitante) {
    if (id === Number(solicitante.id_usuario)) throw crearError(409, "No podés desactivar tu propia cuenta");
    const resultado = await pool.query(
        `UPDATE usuario SET activo = FALSE WHERE id_usuario = $1 RETURNING ${camposPublicos}`,
        [id]
    );
    if (!resultado.rowCount) throw crearError(404, "Usuario no encontrado");
    return resultado.rows[0];
}

module.exports = { listar, crear, actualizar, desactivar };
