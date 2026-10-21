
const clienteService = require("../services/clienteService");

const { crearError } = require("../middleware/errores");
const { identificador } = require("../validators/validaciones");


async function listar(req, res) {
    const clientes = await clienteService.listar();

    return res.status(200).json(clientes);
}


async function buscar(req, res) {
    const idCliente = identificador(req.params.id);

    const cliente = await clienteService.buscar(idCliente);

    if (!cliente) {
        throw crearError(
            404,
            "El cliente solicitado no existe"
        );
    }

    return res.status(200).json(cliente);
}


async function crear(req, res) {
    const datosCliente = req.body;

    const cliente = await clienteService.crear(datosCliente);

    return res.status(201).json({
        mensaje: "Cliente registrado correctamente",
        registro: cliente
    });
}


async function actualizar(req, res) {
    const idCliente = identificador(req.params.id);
    const datosCliente = req.body;

    const cliente = await clienteService.actualizar(
        idCliente,
        datosCliente
    );

    return res.status(200).json({
        mensaje: "Cliente actualizado correctamente",
        registro: cliente
    });
}


async function eliminar(req, res) {
    const idCliente = identificador(req.params.id);

    const resultado = await clienteService.eliminar(idCliente);

    if (!resultado || !resultado.registro) {
        throw crearError(
            404,
            "El cliente solicitado no existe"
        );
    }

    let mensaje;

    if (resultado.modo === "BAJA_LOGICA") {
        mensaje = "Cliente dado de baja correctamente. Se conserva su historial de pedidos.";

    } else if (resultado.modo === "ELIMINADO") {
        mensaje = "Cliente eliminado definitivamente";

    } else {
        throw crearError(
            500,
            "El servicio devolvió un resultado de eliminación desconocido"
        );
    }

    return res.status(200).json({
        mensaje,
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
