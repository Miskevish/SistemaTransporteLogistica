
const express = require("express");

const usuarioController = require("../controllers/usuarioController");

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


// Solo los administradores pueden gestionar usuarios.
router.use(
    permitirRoles("ADMINISTRADOR")
);


// Listar todas las cuentas de usuario,
// incluyendo las activas y las desactivadas.
router.get(
    "/",
    ejecutar(usuarioController.listar)
);


// Registrar una nueva cuenta de usuario.
router.post(
    "/",
    ejecutar(usuarioController.crear)
);


// Modificar los datos, el rol o el estado de una cuenta.
// También permite reactivar una cuenta desactivada.
router.put(
    "/:id",
    ejecutar(usuarioController.actualizar)
);


// Desactivar una cuenta sin eliminarla de PostgreSQL.
// El servicio impide desactivar la propia cuenta
// o dejar al sistema sin administradores activos.
router.delete(
    "/:id",
    ejecutar(usuarioController.desactivar)
);


module.exports = router;
