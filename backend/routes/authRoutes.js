const express = require("express");
const controlador = require("../controllers/authController");
const { autenticar } = require("../middleware/autenticacion");
const { ejecutar } = require("../middleware/errores");
const router = express.Router();
router.post("/login", ejecutar(controlador.iniciarSesion));
router.get("/perfil", ejecutar(autenticar), ejecutar(controlador.miPerfil));
module.exports = router;
