const servicio = require("../services/pedidoService");
const { crearError } = require("../middleware/errores");
const { identificador } = require("../validators/validaciones");

async function listar(req, res) {
    const registros = await servicio.listar();
    res.json(registros);
}

async function buscar(req, res) {
    const registro = await servicio.buscar(identificador(req.params.id));
    if (!registro) throw crearError(404, "Registro no encontrado");
    res.json(registro);
}

async function crear(req, res) {
    const registro = await servicio.crear(req.body);
    res.status(201).json({ mensaje: "Registro creado correctamente", registro });
}

async function actualizar(req, res) {
    const registro = await servicio.actualizar(identificador(req.params.id), req.body);
    res.json({ mensaje: "Registro actualizado correctamente", registro });
}

async function eliminar(req, res) {
    const resultado = await servicio.eliminar(identificador(req.params.id));
    if (!resultado.registro) throw crearError(404, "Registro no encontrado");
    res.json({ mensaje: resultado.modo === "BAJA_LOGICA" ? "Registro dado de baja" : "Registro eliminado", ...resultado });
}

module.exports = { listar, buscar, crear, actualizar, eliminar };
