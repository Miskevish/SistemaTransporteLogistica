const servicio = require("../services/usuarioService");
const { identificador } = require("../validators/validaciones");

async function listar(req, res) {
    res.json(await servicio.listar());
}
async function crear(req, res) {
    const usuario = await servicio.crear(req.body);
    res.status(201).json({ mensaje: "Usuario registrado", usuario });
}
async function actualizar(req, res) {
    const usuario = await servicio.actualizar(identificador(req.params.id), req.body, req.usuario);
    res.json({ mensaje: "Usuario actualizado", usuario });
}
async function desactivar(req, res) {
    const usuario = await servicio.desactivar(identificador(req.params.id), req.usuario);
    res.json({ mensaje: "Usuario desactivado", usuario });
}
module.exports = { listar, crear, actualizar, desactivar };
