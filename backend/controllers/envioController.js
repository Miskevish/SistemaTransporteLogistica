const servicio = require("../services/envioService");
const { identificador } = require("../validators/validaciones");

async function listar(req, res) {
    res.json(await servicio.listar(req.usuario, req.query.estado));
}
async function buscar(req, res) {
    res.json(await servicio.obtenerEnvio(identificador(req.params.id), req.usuario));
}
async function crear(req, res) {
    const envio = await servicio.crear(req.body, req.usuario);
    res.status(201).json({ mensaje: "Envío creado", envio });
}
async function cambiarEstado(req, res) {
    const envio = await servicio.cambiarEstado(identificador(req.params.id), req.body.estado, req.usuario);
    res.json({ mensaje: "Estado actualizado", envio });
}
async function entregar(req, res) {
    const entrega = await servicio.registrarEntrega(identificador(req.params.id), req.body, req.usuario);
    res.status(201).json({ mensaje: "Entrega registrada", entrega });
}
async function historial(req, res) {
    res.json(await servicio.historial(identificador(req.params.id), req.usuario));
}
module.exports = { listar, buscar, crear, cambiarEstado, entregar, historial };
