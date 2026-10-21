
const envioService = require("../services/envioService");

const {
    identificador
} = require("../validators/validaciones");


async function listar(req, res) {
    const estado = req.query.estado;

    const envios = await envioService.listar(
        req.usuario,
        estado
    );

    return res.status(200).json(envios);
}


async function buscar(req, res) {
    const idEnvio = identificador(req.params.id);

    const envio = await envioService.obtenerEnvio(
        idEnvio,
        req.usuario
    );

    return res.status(200).json(envio);
}


async function crear(req, res) {
    const datosEnvio = req.body;

    const envio = await envioService.crear(
        datosEnvio,
        req.usuario
    );

    return res.status(201).json({
        mensaje: "Envío creado correctamente",
        envio
    });
}


async function cambiarEstado(req, res) {
    const idEnvio = identificador(req.params.id);
    const nuevoEstado = req.body.estado;

    const envio = await envioService.cambiarEstado(
        idEnvio,
        nuevoEstado,
        req.usuario
    );

    let mensaje = "Estado del envío actualizado correctamente";

    if (nuevoEstado === "EN_TRANSITO") {
        mensaje = "El envío se inició correctamente";
    }

    if (nuevoEstado === "CANCELADO") {
        mensaje = "El envío se canceló correctamente";
    }

    return res.status(200).json({
        mensaje,
        envio
    });
}


async function entregar(req, res) {
    const idEnvio = identificador(req.params.id);
    const datosEntrega = req.body;

    const entrega = await envioService.registrarEntrega(
        idEnvio,
        datosEntrega,
        req.usuario
    );

    return res.status(201).json({
        mensaje: "Entrega registrada correctamente",
        entrega
    });
}


async function historial(req, res) {
    const idEnvio = identificador(req.params.id);

    const movimientos = await envioService.historial(
        idEnvio,
        req.usuario
    );

    return res.status(200).json(movimientos);
}


module.exports = {
    listar,
    buscar,
    crear,
    cambiarEstado,
    entregar,
    historial
};
