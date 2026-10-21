const { crearError } = require("../middleware/errores");

function obligatorio(valor, nombre) {
    if (valor === undefined || valor === null || String(valor).trim() === "") {
        throw crearError(400, `El campo ${nombre} es obligatorio`);
    }
}

function texto(valor, nombre, maximo, requerido = false) {
    if (requerido) obligatorio(valor, nombre);
    if (valor === undefined || valor === null || valor === "") return null;
    if (typeof valor !== "string" || valor.trim().length > maximo) {
        throw crearError(400, `${nombre} debe ser texto de hasta ${maximo} caracteres`);
    }
    return valor.trim();
}

function entero(valor, nombre, minimo = 1, requerido = true) {
    if (!requerido && (valor === undefined || valor === null || valor === "")) return null;
    const numero = Number(valor);
    if (!Number.isSafeInteger(numero) || numero < minimo) {
        throw crearError(400, `${nombre} debe ser un número entero mayor o igual a ${minimo}`);
    }
    return numero;
}

function positivo(valor, nombre) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) {
        throw crearError(400, `${nombre} debe ser un número positivo`);
    }
    return numero;
}

function opcion(valor, nombre, opciones) {
    if (!opciones.includes(valor)) {
        throw crearError(400, `${nombre} debe ser: ${opciones.join(", ")}`);
    }
    return valor;
}

function correo(valor) {
    const email = texto(valor, "email", 150);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw crearError(400, "El correo electrónico no tiene un formato válido");
    }
    return email;
}

function identificador(valor) {
    return entero(valor, "id");
}

function fecha(valor, nombre) {
    obligatorio(valor, nombre);
    const dia = new Date(valor);
    if (Number.isNaN(dia.getTime())) throw crearError(400, `${nombre} no es una fecha válida`);
    return valor;
}

module.exports = { obligatorio, texto, entero, positivo, opcion, correo, identificador, fecha };
