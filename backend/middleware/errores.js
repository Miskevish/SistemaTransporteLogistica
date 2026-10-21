
function crearError(estado, mensaje) {
    const error = new Error(mensaje);

    error.estado = estado;

    return error;
}


function obtenerErrorPostgreSQL(error) {
    const mensajes = {
        "23505": {
            estado: 409,
            mensaje: "Ya existe un registro con ese dato único"
        },

        "23503": {
            estado: 409,
            mensaje: "No se puede realizar la operación porque el registro está relacionado con otros datos"
        },

        "23502": {
            estado: 400,
            mensaje: "Faltan datos obligatorios para completar la operación"
        },

        "23514": {
            estado: 400,
            mensaje: "Uno o más valores no cumplen las restricciones de la base de datos"
        },

        "22P02": {
            estado: 400,
            mensaje: "Uno o más datos tienen un formato incorrecto"
        },

        "22007": {
            estado: 400,
            mensaje: "El formato de la fecha no es válido"
        },

        "22008": {
            estado: 400,
            mensaje: "La fecha enviada está fuera del rango permitido"
        },

        "22003": {
            estado: 400,
            mensaje: "Uno de los valores numéricos está fuera del rango permitido"
        },

        "22001": {
            estado: 400,
            mensaje: "Uno de los textos supera la longitud permitida"
        },

        "23506": {
            estado: 409,
            mensaje: "La operación no cumple una restricción de integridad de la base de datos"
        }
    };

    return mensajes[error.code] || null;
}


function manejarErrores(error, req, res, next) {
    // Evitar intentar responder cuando ya se enviaron encabezados.
    if (res.headersSent) {
        return next(error);
    }

    // Comprobar si PostgreSQL devolvió un error conocido.
    const errorPostgreSQL = obtenerErrorPostgreSQL(error);

    if (errorPostgreSQL) {
        return res.status(errorPostgreSQL.estado).json({
            error: errorPostgreSQL.mensaje
        });
    }

    // Manejar solicitudes demasiado grandes.
    if (
        error.status === 413 ||
        error.type === "entity.too.large"
    ) {
        return res.status(413).json({
            error: "La solicitud es demasiado grande"
        });
    }

    // Manejar JSON incorrecto enviado por el frontend.
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        "body" in error
    ) {
        return res.status(400).json({
            error: "El JSON enviado es incorrecto"
        });
    }

    // Resolver el código HTTP de errores personalizados.
    const estadoSolicitado = error.estado || error.status;

    const estado = (
        Number.isInteger(estadoSolicitado) &&
        estadoSolicitado >= 400 &&
        estadoSolicitado <= 599
    )
        ? estadoSolicitado
        : 500;

    // Los errores internos se registran solamente en el servidor.
    if (estado >= 500) {
        console.error("Error interno del servidor:", {
            metodo: req.method,
            ruta: req.originalUrl,
            mensaje: error.message,
            codigo: error.code || null,
            detalle: error.stack
        });

        return res.status(estado).json({
            error: "Error interno del servidor"
        });
    }

    // Devolver mensajes comprensibles para los errores controlados.
    return res.status(estado).json({
        error: error.message || "No se pudo completar la operación"
    });
}


function ejecutar(funcion) {
    return function ejecutarControlador(req, res, next) {
        Promise.resolve()
            .then(() => funcion(req, res, next))
            .catch(next);
    };
}


module.exports = {
    crearError,
    manejarErrores,
    ejecutar
};
