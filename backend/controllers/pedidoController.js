
const pedidoService = require("../services/pedidoService");

const { crearError } = require("../middleware/errores");

const { identificador } = require("../validators/validaciones");


async function listar(req, res) {
    const pedidos = await pedidoService.listar();

    return res.status(200).json(pedidos);
}


async function buscar(req, res) {
    const idPedido = identificador(req.params.id);

    const pedido = await pedidoService.buscar(idPedido);

    if (!pedido) {
        throw crearError(
            404,
            "El pedido solicitado no existe"
        );
    }

    return res.status(200).json(pedido);
}


async function crear(req, res) {
    const datosPedido = req.body;

    const pedido = await pedidoService.crear(datosPedido);

    return res.status(201).json({
        mensaje: "Pedido registrado correctamente",
        registro: pedido
    });
}


async function actualizar(req, res) {
    const idPedido = identificador(req.params.id);
    const datosPedido = req.body;

    const pedido = await pedidoService.actualizar(
        idPedido,
        datosPedido
    );

    return res.status(200).json({
        mensaje: "Pedido actualizado correctamente",
        registro: pedido
    });
}


async function eliminar(req, res) {
    const idPedido = identificador(req.params.id);

    const resultado = await pedidoService.eliminar(idPedido);

    if (!resultado || !resultado.registro) {
        throw crearError(
            404,
            "El pedido solicitado no existe"
        );
    }

    return res.status(200).json({
        mensaje: "Pedido eliminado definitivamente",
        modo: resultado.modo,
        registro: resultado.registro
    });
}


module.exports = {
    listar,
    buscar,
    crear,
    actualizar,
    eliminar
};
