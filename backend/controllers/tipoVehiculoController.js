
const tipoVehiculoService = require("../services/tipoVehiculoService");

const { crearError } = require("../middleware/errores");
const { identificador } = require("../validators/validaciones");


async function listar(req, res) {
    const tiposVehiculo = await tipoVehiculoService.listar();

    return res.status(200).json(tiposVehiculo);
}


async function buscar(req, res) {
    const idTipoVehiculo = identificador(req.params.id);

    const tipoVehiculo = await tipoVehiculoService.buscar(
        idTipoVehiculo
    );

    if (!tipoVehiculo) {
        throw crearError(
            404,
            "El tipo de vehículo solicitado no existe"
        );
    }

    return res.status(200).json(tipoVehiculo);
}


async function crear(req, res) {
    const datosTipoVehiculo = req.body;

    const tipoVehiculo = await tipoVehiculoService.crear(
        datosTipoVehiculo
    );

    return res.status(201).json({
        mensaje: "Tipo de vehículo registrado correctamente",
        registro: tipoVehiculo
    });
}


async function actualizar(req, res) {
    const idTipoVehiculo = identificador(req.params.id);
    const datosTipoVehiculo = req.body;

    const tipoVehiculo = await tipoVehiculoService.actualizar(
        idTipoVehiculo,
        datosTipoVehiculo
    );

    return res.status(200).json({
        mensaje: "Tipo de vehículo actualizado correctamente",
        registro: tipoVehiculo
    });
}


async function eliminar(req, res) {
    const idTipoVehiculo = identificador(req.params.id);

    const resultado = await tipoVehiculoService.eliminar(
        idTipoVehiculo
    );

    if (!resultado || !resultado.registro) {
        throw crearError(
            404,
            "El tipo de vehículo solicitado no existe"
        );
    }

    return res.status(200).json({
        mensaje: "Tipo de vehículo eliminado definitivamente",
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
