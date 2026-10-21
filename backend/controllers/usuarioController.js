
const usuarioService = require("../services/usuarioService");

const { identificador } = require("../validators/validaciones");


async function listar(req, res) {
    const usuarios = await usuarioService.listar();

    return res.status(200).json(usuarios);
}


async function crear(req, res) {
    const datosUsuario = req.body;

    const usuario = await usuarioService.crear(datosUsuario);

    return res.status(201).json({
        mensaje: "Usuario registrado correctamente",
        usuario
    });
}


async function actualizar(req, res) {
    const idUsuario = identificador(req.params.id);
    const datosUsuario = req.body;
    const solicitante = req.usuario;

    const usuario = await usuarioService.actualizar(
        idUsuario,
        datosUsuario,
        solicitante
    );

    return res.status(200).json({
        mensaje: "Usuario actualizado correctamente",
        usuario
    });
}


async function desactivar(req, res) {
    const idUsuario = identificador(req.params.id);
    const solicitante = req.usuario;

    const usuario = await usuarioService.desactivar(
        idUsuario,
        solicitante
    );

    return res.status(200).json({
        mensaje: "Usuario desactivado correctamente",
        usuario
    });
}


module.exports = {
    listar,
    crear,
    actualizar,
    desactivar
};
