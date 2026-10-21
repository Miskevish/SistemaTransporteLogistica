const express = require("express");
const { resumen } = require("../controllers/reporteController");
const { autenticar, permitirRoles } = require("../middleware/autenticacion");
const { ejecutar } = require("../middleware/errores");
const router = express.Router();
router.get("/resumen", ejecutar(autenticar), permitirRoles("ADMINISTRADOR", "OPERADOR"), ejecutar(resumen));
module.exports = router;
