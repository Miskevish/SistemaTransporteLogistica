
async function solicitarAPI(ruta, metodo = "GET", datos = null) {
    const token = sessionStorage.getItem("token");

    const metodoHTTP = metodo.toUpperCase();

    const opciones = {
        method: metodoHTTP,
        headers: {
            Accept: "application/json"
        }
    };

    // Agregar el token JWT cuando exista una sesión activa.
    if (token) {
        opciones.headers.Authorization = `Bearer ${token}`;
    }

    // Enviar datos JSON únicamente cuando corresponda.
    if (datos !== null && datos !== undefined) {
        if (metodoHTTP === "GET" || metodoHTTP === "HEAD") {
            throw new Error(
                "No se pueden enviar datos en el cuerpo de una solicitud GET o HEAD"
            );
        }

        opciones.headers["Content-Type"] = "application/json";
        opciones.body = JSON.stringify(datos);
    }

    let respuesta;

    try {
        respuesta = await fetch(
            API_BASE + ruta,
            opciones
        );

    } catch (error) {
        console.error(
            "No se pudo establecer conexión con el backend:",
            error
        );

        throw new Error(
            "No se pudo contactar al servidor. Comprobá que Node.js esté ejecutándose."
        );
    }

    // Algunas respuestas HTTP pueden no contener contenido.
    let contenido = {};

    if (respuesta.status !== 204) {
        const textoRespuesta = await respuesta.text();

        if (textoRespuesta) {
            try {
                contenido = JSON.parse(textoRespuesta);

            } catch (error) {
                console.error(
                    "El servidor devolvió una respuesta no válida:",
                    error
                );

                throw new Error(
                    "El servidor devolvió una respuesta que no se pudo interpretar."
                );
            }
        }
    }

    // Procesar los errores devueltos por el backend.
    if (!respuesta.ok) {
        const mensajeError =
            contenido.error ||
            contenido.mensaje ||
            `Error HTTP ${respuesta.status}`;

        // Un error 401 indica que la sesión ya no es válida.
        // No cerrar la sesión cuando falla un intento de login.
        if (
            respuesta.status === 401 &&
            ruta !== "/auth/login"
        ) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("usuario");

            window.location.reload();
        }

        throw new Error(mensajeError);
    }

    return contenido;
}
