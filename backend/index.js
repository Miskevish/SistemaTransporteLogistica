
const express = require("express");
const cors = require("cors");

require("dotenv").config();

const pool = require("./db");

const {
    manejarErrores
} = require("./middleware/errores");


const app = express();

const puerto = Number(process.env.PORT || 3000);

const origenesPermitidos = (
    process.env.CORS_ORIGIN ||
    "http://localhost:5500,http://127.0.0.1:5500"
)
    .split(",")
    .map(origen => origen.trim())
    .filter(Boolean);


// Comprobar la configuración antes de iniciar el servidor.
function validarConfiguracion() {
    if (
        !process.env.JWT_SECRET ||
        process.env.JWT_SECRET.length < 32
    ) {
        throw new Error(
            "Configurá JWT_SECRET con al menos 32 caracteres en .env"
        );
    }

    if (
        !Number.isInteger(puerto) ||
        puerto < 1 ||
        puerto > 65535
    ) {
        throw new Error(
            "El puerto configurado no es válido"
        );
    }
}


// Configurar los orígenes permitidos del frontend.
app.use(
    cors({
        origin: origenesPermitidos
    })
);


// Permitir recibir datos JSON desde el frontend.
app.use(
    express.json({
        limit: "100kb"
    })
);


// Registrar las solicitudes que llegan al backend.
// No registrar contraseñas, tokens ni cuerpos de las solicitudes.
app.use((req, res, next) => {
    const inicio = Date.now();

    res.on("finish", () => {
        const duracion = Date.now() - inicio;

        console.log(
            `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duracion} ms`
        );
    });

    next();
});


// Comprobar que el servidor y PostgreSQL funcionen.
app.get("/api/salud", async (req, res, next) => {
    try {
        await pool.query("SELECT 1");

        return res.status(200).json({
            mensaje: "Servidor y PostgreSQL funcionando"
        });

    } catch (error) {
        next(error);
    }
});


// Registrar las rutas de la aplicación.
app.use(
    "/api/auth",
    require("./routes/authRoutes")
);

app.use(
    "/api/clientes",
    require("./routes/clienteRoutes")
);

app.use(
    "/api/tipos-vehiculo",
    require("./routes/tipoVehiculoRoutes")
);

app.use(
    "/api/vehiculos",
    require("./routes/vehiculoRoutes")
);

app.use(
    "/api/conductores",
    require("./routes/conductorRoutes")
);

app.use(
    "/api/pedidos",
    require("./routes/pedidoRoutes")
);

app.use(
    "/api/envios",
    require("./routes/envioRoutes")
);

app.use(
    "/api/usuarios",
    require("./routes/usuarioRoutes")
);

app.use(
    "/api/reportes",
    require("./routes/reporteRoutes")
);


// Responder cuando la ruta solicitada no exista.
app.use((req, res) => {
    return res.status(404).json({
        error: "Ruta no encontrada"
    });
});


// Centralizar los errores de la aplicación.
app.use(manejarErrores);


// Iniciar el servidor después de comprobar PostgreSQL.
async function iniciarServidor() {
    try {
        validarConfiguracion();

        await pool.query("SELECT 1");

        console.log(
            "Conexión con PostgreSQL verificada correctamente"
        );

        const servidor = app.listen(puerto, () => {
            console.log(
                `Servidor funcionando en http://localhost:${puerto}`
            );
        });

        servidor.on("error", async (error) => {
            console.error(
                "No se pudo iniciar el servidor:",
                error.message
            );

            await pool.end();
            process.exitCode = 1;
        });

        // Cerrar las conexiones ordenadamente al detener Node.js.
        async function cerrarServidor() {
            console.log(
                "Cerrando el servidor y las conexiones..."
            );

            servidor.close(async (error) => {
                if (error) {
                    console.error(
                        "Error al cerrar el servidor:",
                        error.message
                    );

                    process.exitCode = 1;
                }

                try {
                    await pool.end();
                } catch (errorPool) {
                    console.error(
                        "Error al cerrar PostgreSQL:",
                        errorPool.message
                    );

                    process.exitCode = 1;
                }
            });
        }

        process.once("SIGINT", cerrarServidor);
        process.once("SIGTERM", cerrarServidor);

    } catch (error) {
        console.error(
            "No se pudo iniciar la aplicación:",
            error.message
        );

        try {
            await pool.end();
        } catch (errorPool) {
            console.error(
                "Error al cerrar PostgreSQL:",
                errorPool.message
            );
        }

        process.exitCode = 1;
    }
}


iniciarServidor();
