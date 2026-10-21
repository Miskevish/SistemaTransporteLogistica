function crearError(estado, mensaje) {
    const error = new Error(mensaje);
    error.estado = estado;
    return error;
}

function manejarErrores(error, req, res, next) {
    if (error.code === "23505") {
        return res.status(409).json({ error: "Ya existe un registro con ese dato único" });
    }
    if (error.code === "23503") {
        return res.status(409).json({ error: "El registro está relacionado con otros datos" });
    }
    if (error.code === "23514" || error.code === "23502" || error.code === "22P02") {
        return res.status(400).json({ error: "Los datos enviados no son válidos" });
    }
    if (error.status === 413 || error.type === "entity.too.large") {
        return res.status(413).json({ error: "La solicitud es demasiado grande" });
    }
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ error: "El JSON enviado es incorrecto" });
    }
    const estado = error.estado || 500;
    if (estado >= 500) console.error("Error interno:", error);
    res.status(estado).json({ error: estado >= 500 ? "Error interno del servidor" : error.message });
}

function ejecutar(funcion) {
    return (req, res, next) => Promise.resolve(funcion(req, res, next)).catch(next);
}

module.exports = { crearError, manejarErrores, ejecutar };
