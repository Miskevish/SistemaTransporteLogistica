
async function solicitarAPI(ruta, metodo = "GET", datos = null) {
    const token = sessionStorage.getItem("token");

    const opciones = {
        method: metodo,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (token) {
        opciones.headers.Authorization = `Bearer ${token}`;
    }

    if (datos !== null) {
        opciones.body = JSON.stringify(datos);
    }

    let respuesta;

    try {
        respuesta = await fetch(API_BASE + ruta, opciones);
    } catch (error) {
        console.error("Error de conexión:", error);

        throw new Error(
            "No se pudo contactar al servidor. Comprobá que Node.js esté ejecutándose."
        );
    }

    const contenido = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        if (respuesta.status === 401 && ruta !== "/auth/login") {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("usuario");
            window.location.reload();
        }

        throw new Error(
            contenido.error ||
            contenido.mensaje ||
            `Error HTTP ${respuesta.status}`
        );
    }

    return contenido;
}
