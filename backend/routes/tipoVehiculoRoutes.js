
const express = require("express");

const tipoVehiculoController = require("../controllers/tipoVehiculoController");

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


// Listar todos los tipos de vehículos.
// Administradores y operadores pueden consultar.
router.get(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(tipoVehiculoController.listar)
);


// Consultar un tipo de vehículo por su identificador.
router.get(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(tipoVehiculoController.buscar)
);


// Registrar un nuevo tipo de vehículo.
// Solo los administradores pueden crear registros.
router.post(
    "/",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(tipoVehiculoController.crear)
);


// Modificar la descripción de un tipo de vehículo.
// Solo los administradores pueden actualizar registros.
router.put(
    "/:id",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(tipoVehiculoController.actualizar)
);


// Eliminar un tipo de vehículo.
// Solo se permite cuando no existen vehículos asociados.
router.delete(
    "/:id",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(tipoVehiculoController.eliminar)
);


module.exports = router;
