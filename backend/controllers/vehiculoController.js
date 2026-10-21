
const vehiculoService = require("../services/vehiculoService");

const { crearError } = require("../middleware/errores");

const {
    identificador
} = require("../validators/validaciones");


async function listar(req, res) {
    const vehiculos = await vehiculoService.listar();

    return res.status(200).json(vehiculos);
}


async function buscar(req, res) {
    const idVehiculo = identificador(req.params.id);

    const vehiculo = await vehiculoService.buscar(idVehiculo);

    if (!vehiculo) {
        throw crearError(
            404,
            "El vehículo solicitado no existe"
        );
    }

    return res.status(200).json(vehiculo);
}


async function crear(req, res) {
    const datosVehiculo = req.body;

    const vehiculo = await vehiculoService.crear(datosVehiculo);

    return res.status(201).json({
        mensaje: "Vehículo registrado correctamente",
        registro: vehiculo
    });
}


async function actualizar(req, res) {
    const idVehiculo = identificador(req.params.id);
    const datosVehiculo = req.body;

    const vehiculo = await vehiculoService.actualizar(
        idVehiculo,
        datosVehiculo
    );

    return res.status(200).json({
        mensaje: "Vehículo actualizado correctamente",
        registro: vehiculo
    });
}


async function eliminar(req, res) {
    const idVehiculo = identificador(req.params.id);

    const resultado = await vehiculoService.eliminar(idVehiculo);

    if (!resultado || !resultado.registro) {
        throw crearError(
            404,
            "El vehículo solicitado no existe"
        );
    }

    let mensaje;

    if (resultado.modo === "BAJA_LOGICA") {
        mensaje = "Vehículo retirado de disponibilidad. Se conserva su historial.";

    } else if (resultado.modo === "ELIMINADO") {
        mensaje = "Vehículo eliminado definitivamente";

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
