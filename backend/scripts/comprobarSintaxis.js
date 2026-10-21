const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const raiz = path.resolve(__dirname, "..");
const carpetas = ["controllers", "services", "routes", "middleware", "validators", "scripts"];
let contador = 0;
for (const carpeta of carpetas) {
    for (const archivo of fs.readdirSync(path.join(raiz, carpeta))) {
        if (!archivo.endsWith(".js")) continue;
        execFileSync(process.execPath, ["--check", path.join(raiz, carpeta, archivo)]);
        contador++;
    }
}
for (const archivo of ["index.js", "db.js"]) {
    execFileSync(process.execPath, ["--check", path.join(raiz, archivo)]);
    contador++;
}
console.log(`Sintaxis correcta en ${contador} archivos JavaScript.`);
