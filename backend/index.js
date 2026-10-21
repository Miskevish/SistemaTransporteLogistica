const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const { manejarErrores } = require("./middleware/errores");
const app = express();
const puerto = Number(process.env.PORT || 3000);
const origenes = (process.env.CORS_ORIGIN || "http://localhost:5500,http://127.0.0.1:5500")
    .split(",").map(origen => origen.trim());

app.use(cors({ origin: origenes }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/salud", async (req, res, next) => {
    try {
        await pool.query("SELECT 1");
        res.json({ mensaje: "Servidor y PostgreSQL funcionando" });
    } catch (error) {
        next(error);
    }
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/clientes", require("./routes/clienteRoutes"));
app.use("/api/tipos-vehiculo", require("./routes/tipoVehiculoRoutes"));
app.use("/api/vehiculos", require("./routes/vehiculoRoutes"));
app.use("/api/conductores", require("./routes/conductorRoutes"));
app.use("/api/pedidos", require("./routes/pedidoRoutes"));
app.use("/api/envios", require("./routes/envioRoutes"));
app.use("/api/usuarios", require("./routes/usuarioRoutes"));
app.use("/api/reportes", require("./routes/reporteRoutes"));

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(manejarErrores);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("Configurá JWT_SECRET con al menos 32 caracteres en .env");
    process.exit(1);
}
app.listen(puerto, () => console.log(`Servidor funcionando en http://localhost:${puerto}`));
