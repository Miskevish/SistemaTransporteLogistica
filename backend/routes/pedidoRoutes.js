
const express = require("express");

const pedidoController = require("../controllers/pedidoController");

const {
    autenticar,
    permitirRoles
} = require("../middleware/autenticacion");

const { ejecutar } = require("../middleware/errores");


const router = express.Router();


// Todas las rutas requieren autenticación.
router.use(
    ejecutar(autenticar)
);


// Listar todos los pedidos.
router.get(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(pedidoController.listar)
);


// Consultar un pedido por su identificador.
router.get(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(pedidoController.buscar)
);


// Registrar un nuevo pedido.
router.post(
    "/",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(pedidoController.crear)
);


// Modificar un pedido existente.
// El servicio impide modificar pedidos que ya tienen un envío.
router.put(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(pedidoController.actualizar)
);


// Eliminar un pedido.
// Solo se pueden eliminar pedidos sin envíos asociados.
router.delete(
    "/:id",
    permitirRoles("ADMINISTRADOR", "OPERADOR"),
    ejecutar(pedidoController.eliminar)
);


module.exports = router;
