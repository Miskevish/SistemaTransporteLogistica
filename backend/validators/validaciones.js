
const { crearError } = require("../middleware/errores");


function obligatorio(valor, nombre) {
    if (
        valor === undefined ||
        valor === null ||
        (typeof valor === "string" && valor.trim() === "")
    ) {
        throw crearError(
            400,
            `El campo ${nombre} es obligatorio`
        );
    }
}


function texto(valor, nombre, maximo, requerido = false) {
    if (requerido) {
        obligatorio(valor, nombre);
    }

    if (valor === undefined || valor === null) {
        return null;
    }

    if (typeof valor !== "string") {
        throw crearError(
            400,
            `El campo ${nombre} debe contener texto`
        );
    }

    const valorLimpio = valor.trim();

    if (valorLimpio === "") {
        return null;
    }

    if (valorLimpio.length > maximo) {
        throw crearError(
            400,
            `El campo ${nombre} no puede superar los ${maximo} caracteres`
        );
    }

    return valorLimpio;
}


function entero(valor, nombre, minimo = 1, requerido = true) {
    if (
        valor === undefined ||
        valor === null ||
        (typeof valor === "string" && valor.trim() === "")
    ) {
        if (!requerido) {
            return null;
        }

        throw crearError(
            400,
            `El campo ${nombre} es obligatorio`
        );
    }

    if (
        typeof valor !== "number" &&
        typeof valor !== "string"
    ) {
        throw crearError(
            400,
            `El campo ${nombre} debe ser un número entero`
        );
    }

    if (
        typeof valor === "string" &&
        !/^\d+$/.test(valor.trim())
    ) {
        throw crearError(
            400,
            `El campo ${nombre} debe ser un número entero`
        );
    }

    const numero = Number(valor);

    if (
        !Number.isSafeInteger(numero) ||
        numero < minimo
    ) {
        throw crearError(
            400,
            `El campo ${nombre} debe ser un número entero mayor o igual a ${minimo}`
        );
    }

    return numero;
}


function positivo(valor, nombre) {
    obligatorio(valor, nombre);

    if (
        typeof valor !== "number" &&
        typeof valor !== "string"
    ) {
        throw crearError(
            400,
            `El campo ${nombre} debe ser un número positivo`
        );
    }

    if (
        typeof valor === "string" &&
        valor.trim() === ""
    ) {
        throw crearError(
            400,
            `El campo ${nombre} debe ser un número positivo`
        );
    }

    const numero = Number(valor);

    if (
        !Number.isFinite(numero) ||
        numero <= 0
    ) {
        throw crearError(
            400,
            `El campo ${nombre} debe ser un número mayor a cero`
        );
    }

    return numero;
}


function opcion(valor, nombre, opciones) {
    if (!opciones.includes(valor)) {
        throw crearError(
            400,
            `El campo ${nombre} debe ser: ${opciones.join(", ")}`
        );
    }

    return valor;
}


function correo(valor) {
    const email = texto(
        valor,
        "email",
        150,
        false
    );

    if (!email) {
        return null;
    }

    const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!expresionCorreo.test(email)) {
        throw crearError(
            400,
            "El correo electrónico no tiene un formato válido"
        );
    }

    return email;
}


function identificador(valor) {
    return entero(
        valor,
        "id",
        1,
        true
    );
}


function fecha(valor, nombre) {
    obligatorio(valor, nombre);

    if (typeof valor !== "string") {
        throw crearError(
            400,
            `El campo ${nombre} debe ser una fecha en formato AAAA-MM-DD`
        );
    }

    // Aceptar fechas de calendario en formato ISO.
    // También admitir valores ISO con hora recibidos
    // desde PostgreSQL al actualizar un registro.
    const expresionFecha = /^\d{4}-\d{2}-\d{2}$/;

    const expresionFechaHora =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;

    if (
        !expresionFecha.test(valor) &&
        !expresionFechaHora.test(valor)
    ) {
        throw crearError(
            400,
            `El campo ${nombre} debe tener un formato de fecha válido`
        );
    }

    const fechaCalendario = valor.slice(0, 10);

    const anio = Number(fechaCalendario.slice(0, 4));
    const mes = Number(fechaCalendario.slice(5, 7));
    const dia = Number(fechaCalendario.slice(8, 10));

    const fechaComprobacion = new Date(0);

    fechaComprobacion.setUTCFullYear(
        anio,
        mes - 1,
        dia
    );

    fechaComprobacion.setUTCHours(0, 0, 0, 0);

    if (
        fechaComprobacion.getUTCFullYear() !== anio ||
        fechaComprobacion.getUTCMonth() !== mes - 1 ||
        fechaComprobacion.getUTCDate() !== dia
    ) {
        throw crearError(
            400,
            `El campo ${nombre} contiene una fecha inexistente`
        );
    }

    if (
        expresionFechaHora.test(valor) &&
        Number.isNaN(Date.parse(valor))
    ) {
        throw crearError(
            400,
            `El campo ${nombre} contiene una fecha y hora inválidas`
        );
    }

    return fechaCalendario;
}


module.exports = {
    obligatorio,
    texto,
    entero,
    positivo,
    opcion,
    correo,
    identificador,
    fecha
};
