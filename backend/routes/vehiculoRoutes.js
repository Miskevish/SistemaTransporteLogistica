
const express = require("express");

const vehiculoController = require("../controllers/vehiculoController");

const {
    autenticar,
    permitirRoles
} = require("../middleware/autenticacion");

const { ejecutar } = require("../middleware/errores");


const router = express.Router();


// Todas las rutas requieren una sesión válida.
router.use(
    ejecutar(autenticar)
);


// Listar todos los vehículos.
// Administradores y operadores pueden consultar.
router.get(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(vehiculoController.listar)
);


// Consultar un vehículo por su identificador.
router.get(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(vehiculoController.buscar)
);


// Registrar un vehículo nuevo.
// Solo los administradores pueden crear vehículos.
router.post(
    "/",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(vehiculoController.crear)
);


// Modificar los datos de un vehículo.
// Solo los administradores pueden actualizar vehículos.
router.put(
    "/:id",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(vehiculoController.actualizar)
);


// Eliminar o dar de baja un vehículo.
// El servicio decide según sus relaciones e historial.
router.delete(
    "/:id",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(vehiculoController.eliminar)
);


module.exports = router;
