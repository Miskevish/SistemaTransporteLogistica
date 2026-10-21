
const express = require("express");

const conductorController = require("../controllers/conductorController");

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


// Listar conductores.
// Los administradores y operadores pueden consultar los registros.
router.get(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(conductorController.listar)
);


// Consultar un conductor por su identificador.
router.get(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(conductorController.buscar)
);


// Registrar un nuevo conductor.
// Solo los administradores pueden crear conductores.
router.post(
    "/",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(conductorController.crear)
);


// Actualizar los datos de un conductor.
// Esta operación también permite cambiar su estado
// entre ACTIVO e INACTIVO, según las reglas del servicio.
router.put(
    "/:id",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(conductorController.actualizar)
);


// Eliminar o dar de baja un conductor.
// El servicio decide si corresponde una eliminación definitiva
// o una baja lógica, dependiendo de sus relaciones.
router.delete(
    "/:id",
    permitirRoles("ADMINISTRADOR"),
    ejecutar(conductorController.eliminar)
);


module.exports = router;
