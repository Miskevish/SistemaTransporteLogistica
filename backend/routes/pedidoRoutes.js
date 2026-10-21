const express = require("express");
const controlador = require("../controllers/pedidoController");
const { ejecutar } = require("../middleware/errores");
const { autenticar, permitirRoles } = require("../middleware/autenticacion");

const router = express.Router();
router.use(ejecutar(autenticar));
router.get("/", permitirRoles("ADMINISTRADOR", "OPERADOR"), ejecutar(controlador.listar));
router.get("/:id", permitirRoles("ADMINISTRADOR", "OPERADOR"), ejecutar(controlador.buscar));
router.post("/", permitirRoles("ADMINISTRADOR", "OPERADOR"), ejecutar(controlador.crear));
router.put("/:id", permitirRoles("ADMINISTRADOR", "OPERADOR"), ejecutar(controlador.actualizar));
router.delete("/:id", permitirRoles("ADMINISTRADOR", "OPERADOR"), ejecutar(controlador.eliminar));
module.exports = router;
