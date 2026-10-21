
const express = require("express");

const authController = require("../controllers/authController");

const { autenticar } = require("../middleware/autenticacion");
const { ejecutar } = require("../middleware/errores");


const router = express.Router();


// Iniciar sesión.
// Esta ruta es pública porque el usuario todavía no tiene un token.
router.post(
    "/login",
    ejecutar(authController.iniciarSesion)
);


// Consultar los datos del usuario autenticado.
// Requiere un token JWT válido y una cuenta activa.
router.get(
    "/perfil",
    ejecutar(autenticar),
    ejecutar(authController.miPerfil)
);


module.exports = router;
