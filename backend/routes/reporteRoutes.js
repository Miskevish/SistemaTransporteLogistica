
const express = require("express");

const reporteController = require("../controllers/reporteController");

const {
    autenticar,
    permitirRoles
} = require("../middleware/autenticacion");

const { ejecutar } = require("../middleware/errores");


const router = express.Router();


// Todas las rutas de reportes requieren autenticación.
router.use(
    ejecutar(autenticar)
);


// Solo administradores y operadores pueden consultar reportes.
router.use(
    permitirRoles("ADMINISTRADOR", "OPERADOR")
);


// Obtener las estadísticas generales del sistema.
// Este endpoint proporciona los indicadores del dashboard.
router.get(
    "/resumen",
    ejecutar(reporteController.resumen)
);


module.exports = router;
