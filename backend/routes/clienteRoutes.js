
const express = require("express");

const clienteController = require("../controllers/clienteController");

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


// Listar los clientes activos.
router.get(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(clienteController.listar)
);


// Consultar un cliente por su identificador.
router.get(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(clienteController.buscar)
);


// Registrar un nuevo cliente.
router.post(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(clienteController.crear)
);


// Actualizar los datos de un cliente activo.
router.put(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(clienteController.actualizar)
);


// Eliminar o dar de baja un cliente.
// El servicio determina la operación según sus pedidos asociados.
router.delete(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(clienteController.eliminar)
);


module.exports = router;
