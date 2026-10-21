
const conductorService = require("../services/conductorService");

const { crearError } = require("../middleware/errores");

const { identificador } = require("../validators/validaciones");


async function listar(req, res) {
    const conductores = await conductorService.listar();

    return res.status(200).json(conductores);
}


async function buscar(req, res) {
    const idConductor = identificador(req.params.id);

    const conductor = await conductorService.buscar(idConductor);

    if (!conductor) {
        throw crearError(
            404,
            "El conductor solicitado no existe"
        );
    }

    return res.status(200).json(conductor);
}


async function crear(req, res) {
    const datosConductor = req.body;

    const conductor = await conductorService.crear(datosConductor);

    return res.status(201).json({
        mensaje: "Conductor registrado correctamente",
        registro: conductor
    });
}


async function actualizar(req, res) {
    const idConductor = identificador(req.params.id);
    const datosConductor = req.body;

    const conductor = await conductorService.actualizar(
        idConductor,
        datosConductor
    );

    return res.status(200).json({
        mensaje: "Conductor actualizado correctamente",
        registro: conductor
    });
}


async function eliminar(req, res) {
    const idConductor = identificador(req.params.id);

    const resultado = await conductorService.eliminar(idConductor);

    if (!resultado || !resultado.registro) {
        throw crearError(
            404,
            "El conductor solicitado no existe"
        );
    }

    let mensaje;

    if (resultado.modo === "BAJA_LOGICA") {
        mensaje = "Conductor dado de baja correctamente. Se conserva su historial.";

    } else if (resultado.modo === "ELIMINADO") {
        mensaje = "Conductor eliminado definitivamente";

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
