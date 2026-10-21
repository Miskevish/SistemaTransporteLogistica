
const { Pool, types } = require("pg");

require("dotenv").config();


// PostgreSQL utiliza el identificador 1082 para las columnas DATE.
// Conservamos estas fechas como texto en formato AAAA-MM-DD,
// evitando conversiones automáticas de zona horaria.
types.setTypeParser(
    1082,
    (valor) => valor
);


// Configuración de la conexión con PostgreSQL.
const pool = new Pool({
    host: process.env.DB_HOST || "localhost",

    port: Number(
        process.env.DB_PORT || 5432
    ),

    database: process.env.DB_NAME,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    // Cantidad máxima de conexiones simultáneas.
    max: 10,

    // Tiempo máximo para establecer una conexión.
    connectionTimeoutMillis: 5000,

    // Tiempo de inactividad antes de cerrar una conexión libre.
    idleTimeoutMillis: 30000
});


// Registrar errores inesperados de conexiones inactivas.
// No se imprimen contraseñas ni datos de autenticación.
pool.on("error", (error) => {
    console.error(
        "Error inesperado en el pool de PostgreSQL:",
        error.message
    );
});


module.exports = pool;
