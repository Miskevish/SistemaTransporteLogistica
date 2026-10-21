
const express = require("express");

const envioController = require("../controllers/envioController");

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


// Consultar la lista de envíos.
router.get(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR", "CONDUCTOR"),
    ejecutar(envioController.listar)
);


// Consultar el historial de un envío.
router.get(
    "/:id/historial",
    permitirRoles("ADMINISTRADOR", "OPERADOR", "CONDUCTOR"),
    ejecutar(envioController.historial)
);


// Consultar un envío específico.
router.get(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR", "CONDUCTOR"),
    ejecutar(envioController.buscar)
);


// Crear un nuevo envío.
// Solo administración y operaciones pueden asignar recursos.
router.post(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(envioController.crear)
);


// Iniciar o cancelar un envío.
// El servicio comprueba las transiciones permitidas y
// evita que un conductor cancele un envío.
router.patch(
    "/:id/estado",
    permitirRoles("ADMINISTRADOR", "OPERADOR", "CONDUCTOR"),
    ejecutar(envioController.cambiarEstado)
);


// Registrar la entrega de un envío.
// El servicio verifica que esté en tránsito y que
// el conductor solo acceda a sus propios envíos.
router.post(
    "/:id/entrega",
    permitirRoles("ADMINISTRADOR", "OPERADOR", "CONDUCTOR"),
    ejecutar(envioController.entregar)
);


module.exports = router;
