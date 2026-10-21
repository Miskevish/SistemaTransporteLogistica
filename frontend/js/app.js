
let usuarioActual = null;
let vistaActual = "inicio";
let registrosActuales = [];
let modalFormulario;
let modalDetalle;
let registroEditando = null;
let tipoFormulario = "";

const nombresCampos = {
    id_cliente: "Cliente",
    id_conductor: "Conductor",
    id_vehiculo: "Vehículo",
    id_pedido: "Pedido",
    id_envio: "Envío",
    id_tipo_vehiculo: "Tipo",
    id_usuario: "Usuario",
    razon_social: "Razón social",
    tipo_carga: "Tipo de carga",
    fecha_estimada: "Fecha estimada",
    capacidad: "Capacidad (kg)",
    peso: "Peso (kg)",
    estado_actual: "Estado",
    estado: "Estado",
    fecha_estimada_llegada: "Llegada estimada",
    fecha_salida: "Salida",
    fecha_hora: "Fecha y hora",
    persona_recibe: "Persona que recibe",
    estado_entrega: "Resultado",
    activo: "Activo",
    id_estado_envio: "Movimiento"
};

function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

function tituloCampo(campo) {
    return nombresCampos[campo] ||
        campo.replaceAll("_", " ").replace(/^./, letra => letra.toUpperCase());
}

function textoValor(valor) {
    if (valor === true) return "Sí";
    if (valor === false) return "No";

    if (valor === null || valor === undefined || valor === "") {
        return "—";
    }

    if (typeof valor === "string" && /^\d{4}-\d\d-\d\dT/.test(valor)) {
        const fecha = new Date(valor);

        return Number.isNaN(fecha.getTime())
            ? valor
            : fecha.toLocaleString("es-AR");
    }

    return String(valor);
}

function mostrarEstado(valor) {
    const estados = [
        "PENDIENTE",
        "EN_TRANSITO",
        "ENTREGADO",
        "CANCELADO",
        "DISPONIBLE",
        "EN_VIAJE",
        "MANTENIMIENTO",
        "ACTIVO",
        "INACTIVO"
    ];

    if (estados.includes(valor)) {
        return `<span class="estado ${escapar(valor)}">
            ${escapar(valor.replaceAll("_", " "))}
        </span>`;
    }

    return escapar(textoValor(valor));
}

function aviso(mensaje, tipo = "success") {
    const caja = document.getElementById("alertas");

    caja.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${escapar(mensaje)}
            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert"
                aria-label="Cerrar">
            </button>
        </div>
    `;
}

function tieneRol(roles) {
    return !roles || roles.includes(usuarioActual.rol);
}

function puedeModificar(modulo) {
    return tieneRol(modulo.escritura || modulo.roles);
}

function establecerTitulo(titulo, subtitulo = "Gestión de operaciones") {
    document.getElementById("tituloVista").textContent = titulo;
    document.getElementById("subtituloVista").textContent = subtitulo;
    document.getElementById("accionesVista").innerHTML = "";
    document.getElementById("alertas").innerHTML = "";
}

function mostrarCargando() {
    document.getElementById("contenidoVista").innerHTML =
        '<div class="tarjeta text-secondary">Cargando información...</div>';
}

function iniciarAplicacion() {
    modalFormulario = new bootstrap.Modal(
        document.getElementById("modalFormulario")
    );

    modalDetalle = new bootstrap.Modal(
        document.getElementById("modalDetalle")
    );

    document.getElementById("formIngreso").addEventListener(
        "submit",
        ingresar
    );

    document.getElementById("botonSalir").addEventListener(
        "click",
        salir
    );

    document.getElementById("botonMenu").addEventListener("click", () => {
        document.getElementById("menuLateral").classList.toggle("abierto");
    });

    document.getElementById("formRegistro").addEventListener(
        "submit",
        guardarFormulario
    );

    document.getElementById("contenidoVista").addEventListener(
        "click",
        eventoTabla
    );

    document.getElementById("accionesVista").addEventListener(
        "click",
        eventoAcciones
    );

    const token = sessionStorage.getItem("token");

    if (token) {
        solicitarAPI("/auth/perfil")
            .then(perfil => abrirSesion(perfil))
            .catch(() => salir());
    }
}

async function ingresar(evento) {
    evento.preventDefault();

    const boton = document.getElementById("botonIngreso");
    boton.disabled = true;

    document.getElementById("errorIngreso").textContent = "";

    try {
        const resultado = await solicitarAPI("/auth/login", "POST", {
            usuario: document.getElementById("usuarioIngreso").value.trim(),
            clave: document.getElementById("claveIngreso").value
        });

        sessionStorage.setItem("token", resultado.token);

        abrirSesion(resultado.usuario);

        document.getElementById("formIngreso").reset();

    } catch (error) {
        document.getElementById("errorIngreso").textContent = error.message;

    } finally {
        boton.disabled = false;
    }
}

function abrirSesion(usuario) {
    usuarioActual = usuario;

    document.getElementById("pantallaIngreso").classList.add("d-none");
    document.getElementById("aplicacion").classList.remove("d-none");

    document.getElementById("usuarioActual").textContent =
        `${usuario.usuario} · ${usuario.rol}`;

    crearMenu();
    cambiarVista("inicio");
}

function salir() {
    sessionStorage.removeItem("token");
    usuarioActual = null;

    document.getElementById("aplicacion").classList.add("d-none");
    document.getElementById("pantallaIngreso").classList.remove("d-none");
}

function crearMenu() {
    const opciones = [
        ["inicio", "Inicio"],
        ["clientes", "Clientes"],
        ["tipos", "Tipos de vehículo"],
        ["vehiculos", "Vehículos"],
        ["conductores", "Conductores"],
        ["pedidos", "Pedidos"],
        ["envios", "Envíos y seguimiento"],
        ["usuarios", "Usuarios"]
    ];

    const navegacion = document.getElementById("navegacion");
    navegacion.innerHTML = "";

    for (const [clave, nombre] of opciones) {
        if (MODULOS[clave] && !tieneRol(MODULOS[clave].roles)) {
            continue;
        }

        const boton = document.createElement("button");

        boton.className = "enlace-menu";
        boton.textContent = nombre;
        boton.dataset.vista = clave;

        boton.addEventListener("click", () => cambiarVista(clave));

        navegacion.appendChild(boton);
    }
}

async function cambiarVista(clave) {
    if (MODULOS[clave] && !tieneRol(MODULOS[clave].roles)) {
        return;
    }

    vistaActual = clave;

    document.getElementById("menuLateral").classList.remove("abierto");

    document.querySelectorAll(".enlace-menu").forEach(boton => {
        boton.classList.toggle(
            "activo",
            boton.dataset.vista === clave
        );
    });

    if (clave === "inicio") {
        return cargarInicio();
    }

    if (clave === "envios") {
        return cargarEnvios();
    }

    return cargarModulo(clave);
}

async function cargarInicio() {
    establecerTitulo("Panel principal", "Resumen de la empresa");
    mostrarCargando();

    try {
        if (usuarioActual.rol === "CONDUCTOR") {
            const envios = await solicitarAPI("/envios");

            const enTransito = envios.filter(
                envio => envio.estado_actual === "EN_TRANSITO"
            ).length;

            document.getElementById("contenidoVista").innerHTML = `
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="tarjeta">
                            <p class="text-secondary mb-2">Mis envíos asignados</p>
                            <div class="numero-panel">${envios.length}</div>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="tarjeta">
                            <p class="text-secondary mb-2">En tránsito</p>
                            <div class="numero-panel">${enTransito}</div>
                        </div>
                    </div>
                </div>

                <div class="tarjeta mt-4">
                    <h2 class="h5">Mis viajes</h2>
                    <p class="mb-0 text-secondary">
                        Entrá a Envíos y seguimiento para consultar
                        tus viajes y registrar entregas.
                    </p>
                </div>
            `;

            return;
        }

        const resumen = await solicitarAPI("/reportes/resumen");

        const tarjetas = [
            ["Clientes activos", resumen.clientes_activos],
            ["Pedidos", resumen.pedidos],
            ["Vehículos disponibles", resumen.vehiculos_disponibles],
            ["Envíos en tránsito", resumen.envios_en_transito],
            ["Envíos entregados", resumen.envios_entregados]
        ];

        const contenidoTarjetas = tarjetas.map(([nombre, cantidad]) => `
            <div class="col-sm-6 col-xl-4">
                <div class="tarjeta h-100">
                    <p class="text-secondary mb-2">${escapar(nombre)}</p>
                    <div class="numero-panel">${escapar(cantidad)}</div>
                </div>
            </div>
        `).join("");

        document.getElementById("contenidoVista").innerHTML = `
            <div class="row g-3">
                ${contenidoTarjetas}
            </div>

            <div class="tarjeta mt-4">
                <h2 class="h5">Cómo utilizar el sistema</h2>
                <p class="mb-0 text-secondary">
                    Registrá clientes y recursos, creá pedidos y
                    convertí cada pedido en un envío.
                    Después podrás seguir sus estados y registrar la entrega.
                </p>
            </div>
        `;

    } catch (error) {
        document.getElementById("contenidoVista").innerHTML = "";
        aviso(error.message, "danger");
    }
}

function construirTabla(registros, columnas, idCampo, acciones) {
    if (!registros.length) {
        return '<div class="vacio">Todavía no hay registros para mostrar.</div>';
    }

    const encabezados = columnas.map(campo => `
        <th>${escapar(tituloCampo(campo))}</th>
    `).join("");

    const filas = registros.map(registro => {
        const celdas = columnas.map(campo => `
            <td
                class="texto-recortado"
                title="${escapar(textoValor(registro[campo]))}">
                ${mostrarEstado(registro[campo])}
            </td>
        `).join("");

        return `
            <tr>
                <td>${escapar(registro[idCampo])}</td>
                ${celdas}
                <td>
                    <div class="acciones-tabla">
                        ${acciones(registro)}
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    return `
        <div class="tabla-contenedor">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        ${encabezados}
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    ${filas}
                </tbody>
            </table>
        </div>
    `;
}

function botonAccion(accion, id, texto, clase = "outline-secondary") {
    return `
        <button
            class="btn btn-sm btn-${clase}"
            data-accion="${escapar(accion)}"
            data-id="${escapar(id)}">
            ${escapar(texto)}
        </button>
    `;
}

async function cargarModulo(clave) {
    const modulo = MODULOS[clave];

    establecerTitulo(modulo.titulo);

    if (puedeModificar(modulo)) {
        document.getElementById("accionesVista").innerHTML = `
            <button class="btn btn-primary" data-accion="nuevo">
                + Nuevo registro
            </button>
        `;
    }

    mostrarCargando();

    try {
        registrosActuales = await solicitarAPI(modulo.ruta);

        const acciones = registro => {
            const id = registro[modulo.identificador];

            let botones = botonAccion("detalle", id, "Ver");

            if (puedeModificar(modulo)) {
                botones += botonAccion("editar", id, "Editar");

                botones += botonAccion(
                    "eliminar",
                    id,
                    clave === "usuarios" ? "Desactivar" : "Eliminar",
                    "outline-danger"
                );
            }

            return botones;
        };

        document.getElementById("contenidoVista").innerHTML = `
            <div class="tarjeta mb-3">
                <label for="busqueda" class="form-label">
                    Buscar en ${escapar(modulo.titulo.toLowerCase())}
                </label>

                <input
                    id="busqueda"
                    class="form-control"
                    placeholder="Escribí para filtrar la tabla...">
            </div>

            <div id="tablaModulo">
                ${construirTabla(
                    registrosActuales,
                    modulo.columnas,
                    modulo.identificador,
                    acciones
                )}
            </div>
        `;

        document.getElementById("busqueda").addEventListener(
            "input",
            evento => {
                const consulta = evento.target.value.toLowerCase();

                const filtrados = registrosActuales.filter(registro =>
                    Object.values(registro).some(valor =>
                        String(valor ?? "").toLowerCase().includes(consulta)
                    )
                );

                document.getElementById("tablaModulo").innerHTML =
                    construirTabla(
                        filtrados,
                        modulo.columnas,
                        modulo.identificador,
                        acciones
                    );
            }
        );

    } catch (error) {
        document.getElementById("contenidoVista").innerHTML = "";
        aviso(error.message, "danger");
    }
}

async function crearCampos(campos, registro = null) {
    const fragmentos = [];

    for (const campo of campos) {
        let valor = registro ? registro[campo.nombre] : "";

        if (campo.nombre === "activo" && !registro) {
            valor = true;
        }

        const id = `campo_${campo.nombre}`;
        const etiqueta = `${escapar(campo.etiqueta)}${campo.obligatorio ? " *" : ""}`;
        const requerido = campo.obligatorio ? "required" : "";

        let elemento;

        if (campo.tipo === "relacion") {
            const moduloRelacionado = MODULOS[campo.origen];
            let opciones = [];

            try {
                opciones = await solicitarAPI(moduloRelacionado.ruta);

            } catch (error) {
                throw new Error(
                    `No se pudo cargar ${moduloRelacionado.titulo}: ${error.message}`
                );
            }

            const opcionesHTML = opciones.map(opcion => {
                const identificador = opcion[moduloRelacionado.identificador];

                const descripcion = campo.origen === "conductores"
                    ? `${opcion.nombre} ${opcion.apellido}`
                    : opcion[campo.mostrar];

                const seleccionado =
                    String(valor ?? "") === String(identificador)
                        ? "selected"
                        : "";

                return `
                    <option value="${escapar(identificador)}" ${seleccionado}>
                        ${escapar(descripcion)}
                    </option>
                `;
            }).join("");

            elemento = `
                <select
                    class="form-select"
                    id="${id}"
                    name="${campo.nombre}"
                    ${requerido}>
                    <option value="">Seleccionar...</option>
                    ${opcionesHTML}
                </select>
            `;

        } else if (campo.tipo === "opciones") {
            const opcionesHTML = campo.opciones.map(opcion => {
                const seleccionado =
                    opcion === (valor || campo.opciones[0])
                        ? "selected"
                        : "";

                return `
                    <option value="${escapar(opcion)}" ${seleccionado}>
                        ${escapar(opcion.replaceAll("_", " "))}
                    </option>
                `;
            }).join("");

            elemento = `
                <select
                    class="form-select"
                    id="${id}"
                    name="${campo.nombre}"
                    ${requerido}>
                    ${opcionesHTML}
                </select>
            `;

        } else if (campo.tipo === "booleano") {
            elemento = `
                <select
                    class="form-select"
                    id="${id}"
                    name="${campo.nombre}">
                    <option value="true" ${valor !== false ? "selected" : ""}>
                        Sí
                    </option>
                    <option value="false" ${valor === false ? "selected" : ""}>
                        No
                    </option>
                </select>
            `;

        } else if (campo.tipo === "texto-largo") {
            elemento = `
                <textarea
                    class="form-control"
                    id="${id}"
                    name="${campo.nombre}"
                    rows="3"
                    maxlength="${campo.maximo || 3000}">${escapar(valor)}</textarea>
            `;

        } else {
            const tipos = {
                numero: "number",
                decimal: "number",
                fecha: "date",
                password: "password",
                email: "email"
            };

            const tipo = tipos[campo.tipo] || "text";

            if (campo.tipo === "fecha" && valor) {
                valor = String(valor).substring(0, 10);
            }

            if (campo.tipo === "password") {
                valor = "";
            }

            const paso = campo.tipo === "decimal"
                ? 'step="0.01"'
                : campo.tipo === "numero"
                    ? 'step="1"'
                    : "";

            const minimo = campo.minimo !== undefined
                ? `min="${campo.minimo}"`
                : "";

            const maximo = campo.maximo && !["numero", "decimal"].includes(campo.tipo)
                ? `maxlength="${campo.maximo}"`
                : "";

            const minimoCaracteres = campo.minimoCaracteres &&
                (!registro || campo.tipo !== "password")
                    ? `minlength="${campo.minimoCaracteres}"`
                    : "";

            elemento = `
                <input
                    class="form-control"
                    id="${id}"
                    name="${campo.nombre}"
                    type="${tipo}"
                    value="${escapar(valor)}"
                    ${requerido}
                    ${paso}
                    ${minimo}
                    ${maximo}
                    ${minimoCaracteres}>
            `;
        }

        fragmentos.push(`
            <div class="col-md-${campo.tipo === "texto-largo" ? 12 : 6}">
                <label class="form-label" for="${id}">
                    ${etiqueta}
                </label>
                ${elemento}
            </div>
        `);
    }

    return fragmentos.join("");
}

async function abrirFormulario(modulo, registro = null) {
    document.getElementById("formRegistro").onsubmit = null;

    tipoFormulario = vistaActual;
    registroEditando = registro;

    document.getElementById("tituloModal").textContent =
        `${registro ? "Editar" : "Crear"} ${modulo.titulo.toLowerCase()}`;

    document.getElementById("camposModal").innerHTML =
        '<div class="text-secondary">Cargando campos...</div>';

    modalFormulario.show();

    try {
        const campos = modulo.campos.map(campo => ({ ...campo }));

        if (tipoFormulario === "usuarios") {
            const clave = campos.find(campo => campo.nombre === "clave");

            if (clave) {
                clave.obligatorio = !registro;
            }
        }

        document.getElementById("camposModal").innerHTML =
            await crearCampos(campos, registro);

    } catch (error) {
        modalFormulario.hide();
        aviso(error.message, "danger");
    }
}

function recopilarDatos(campos) {
    const datos = {};

    for (const campo of campos) {
        const elemento = document.getElementById(`campo_${campo.nombre}`);

        if (!elemento) {
            continue;
        }

        const valor = elemento.value.trim();

        if (campo.tipo === "booleano") {
            datos[campo.nombre] = valor === "true";

        } else if (
            campo.tipo === "numero" ||
            campo.tipo === "decimal" ||
            campo.tipo === "relacion"
        ) {
            datos[campo.nombre] = valor ? Number(valor) : null;

        } else if (campo.tipo === "password" && !valor) {
            continue;

        } else {
            datos[campo.nombre] = valor;
        }
    }

    if (tipoFormulario === "usuarios" && datos.rol !== "CONDUCTOR") {
        datos.id_conductor = null;
    }

    return datos;
}

async function guardarFormulario(evento) {
    evento.preventDefault();

    if (tipoFormulario === "envioNuevo" || tipoFormulario === "entrega") {
        return;
    }

    const modulo = MODULOS[tipoFormulario];
    const boton = document.getElementById("guardarRegistro");
    const datos = recopilarDatos(modulo.campos);

    boton.disabled = true;

    try {
        if (registroEditando) {
            await solicitarAPI(
                `${modulo.ruta}/${registroEditando[modulo.identificador]}`,
                "PUT",
                datos
            );

        } else {
            await solicitarAPI(modulo.ruta, "POST", datos);
        }

        modalFormulario.hide();

        await cargarModulo(tipoFormulario);

        aviso(
            registroEditando
                ? "Registro actualizado correctamente"
                : "Registro creado correctamente"
        );

    } catch (error) {
        alert(error.message);

    } finally {
        boton.disabled = false;
    }
}

function mostrarDetalle(registro, titulo = "Detalle del registro") {
    document.getElementById("tituloDetalle").textContent = titulo;

    const detalles = Object.entries(registro)
        .filter(([campo]) => campo !== "hash_clave")
        .map(([campo, valor]) => `
            <dt>${escapar(tituloCampo(campo))}</dt>
            <dd>${escapar(textoValor(valor))}</dd>
        `).join("");

    document.getElementById("contenidoDetalle").innerHTML = `
        <dl class="detalle-tabla mb-0">
            ${detalles}
        </dl>
    `;

    modalDetalle.show();
}

async function eventoAcciones(evento) {
    const boton = evento.target.closest("[data-accion]");

    if (!boton) {
        return;
    }

    if (boton.dataset.accion === "nuevo") {
        await abrirFormulario(MODULOS[vistaActual]);
    }

    if (boton.dataset.accion === "nuevo-envio") {
        await abrirEnvioNuevo();
    }
}

async function eventoTabla(evento) {
    const boton = evento.target.closest("[data-accion]");

    if (!boton) {
        return;
    }

    const accion = boton.dataset.accion;
    const id = boton.dataset.id;

    if (vistaActual === "envios") {
        return manejarEnvio(id, accion);
    }

    const modulo = MODULOS[vistaActual];

    if (!modulo) {
        return;
    }

    const registro = registrosActuales.find(item =>
        String(item[modulo.identificador]) === String(id)
    );

    if (!registro) {
        return;
    }

    if (accion === "detalle") {
        return mostrarDetalle(
            registro,
            `Detalle de ${modulo.titulo.toLowerCase()}`
        );
    }

    if (accion === "editar") {
        return abrirFormulario(modulo, registro);
    }

    if (accion === "eliminar") {
        const mensaje = vistaActual === "usuarios"
            ? "la desactivación"
            : "la eliminación o baja";

        if (!confirm(`¿Confirmás ${mensaje} del registro ${id}?`)) {
            return;
        }

        try {
            const respuesta = await solicitarAPI(
                `${modulo.ruta}/${id}`,
                "DELETE"
            );

            await cargarModulo(vistaActual);

            aviso(
                respuesta.mensaje || "Operación realizada correctamente"
            );

        } catch (error) {
            aviso(error.message, "danger");
        }
    }
}

async function cargarEnvios() {
    establecerTitulo(
        "Envíos y seguimiento",
        "Asignaciones, estados y entregas"
    );

    if (usuarioActual.rol !== "CONDUCTOR") {
        document.getElementById("accionesVista").innerHTML = `
            <button class="btn btn-primary" data-accion="nuevo-envio">
                + Crear envío
            </button>
        `;
    }

    mostrarCargando();

    try {
        registrosActuales = await solicitarAPI("/envios");

        const columnas = [
            "id_pedido",
            "id_vehiculo",
            "id_conductor",
            "estado_actual",
            "fecha_estimada_llegada"
        ];

        const acciones = registro => {
            const id = registro.id_envio;

            let botones = botonAccion("detalle", id, "Ver");
            botones += botonAccion("historial", id, "Historial");

            if (registro.estado_actual === "PENDIENTE") {
                botones += botonAccion(
                    "iniciar",
                    id,
                    "Iniciar",
                    "outline-primary"
                );
            }

            if (
                registro.estado_actual === "PENDIENTE" &&
                usuarioActual.rol !== "CONDUCTOR"
            ) {
                botones += botonAccion(
                    "cancelar",
                    id,
                    "Cancelar",
                    "outline-danger"
                );
            }

            if (registro.estado_actual === "EN_TRANSITO") {
                botones += botonAccion(
                    "entregar",
                    id,
                    "Entregar",
                    "outline-success"
                );
            }

            return botones;
        };

        const estados = [
            "PENDIENTE",
            "EN_TRANSITO",
            "ENTREGADO",
            "CANCELADO"
        ];

        const opcionesEstado = estados.map(estado => `
            <option value="${estado}">
                ${estado.replaceAll("_", " ")}
            </option>
        `).join("");

        document.getElementById("contenidoVista").innerHTML = `
            <div class="tarjeta mb-3">
                <label for="filtroEstado" class="form-label">
                    Filtrar por estado
                </label>

                <select id="filtroEstado" class="form-select">
                    <option value="">Todos</option>
                    ${opcionesEstado}
                </select>
            </div>

            <div id="tablaEnvios">
                ${construirTabla(
                    registrosActuales,
                    columnas,
                    "id_envio",
                    acciones
                )}
            </div>
        `;

        document.getElementById("filtroEstado").addEventListener(
            "change",
            evento => {
                const filtrados = registrosActuales.filter(registro =>
                    !evento.target.value ||
                    registro.estado_actual === evento.target.value
                );

                document.getElementById("tablaEnvios").innerHTML =
                    construirTabla(
                        filtrados,
                        columnas,
                        "id_envio",
                        acciones
                    );
            }
        );

    } catch (error) {
        document.getElementById("contenidoVista").innerHTML = "";
        aviso(error.message, "danger");
    }
}

async function abrirEnvioNuevo() {
    try {
        const campos = [
            {
                nombre: "id_pedido",
                etiqueta: "Pedido",
                tipo: "relacion",
                origen: "pedidos",
                mostrar: "id_pedido",
                obligatorio: true
            },
            {
                nombre: "id_vehiculo",
                etiqueta: "Vehículo",
                tipo: "relacion",
                origen: "vehiculos",
                mostrar: "patente",
                obligatorio: true
            },
            {
                nombre: "id_conductor",
                etiqueta: "Conductor",
                tipo: "relacion",
                origen: "conductores",
                mostrar: "nombre",
                obligatorio: true
            },
            {
                nombre: "fecha_estimada_llegada",
                etiqueta: "Fecha estimada de llegada",
                tipo: "fecha",
                obligatorio: true
            }
        ];

        document.getElementById("tituloModal").textContent =
            "Crear envío";

        document.getElementById("camposModal").innerHTML =
            '<div class="text-secondary">Cargando opciones...</div>';

        tipoFormulario = "envioNuevo";

        modalFormulario.show();

        document.getElementById("camposModal").innerHTML =
            await crearCampos(campos);

        document.getElementById("formRegistro").onsubmit = async evento => {
            evento.preventDefault();

            const boton = document.getElementById("guardarRegistro");
            boton.disabled = true;

            try {
                const datos = recopilarDatos(campos);

                await solicitarAPI("/envios", "POST", datos);

                modalFormulario.hide();

                document.getElementById("formRegistro").onsubmit = null;

                await cargarEnvios();

                aviso("Envío creado correctamente");

            } catch (error) {
                alert(error.message);

            } finally {
                boton.disabled = false;
            }
        };

        document.getElementById("modalFormulario").addEventListener(
            "hidden.bs.modal",
            () => {
                document.getElementById("formRegistro").onsubmit = null;
            },
            { once: true }
        );

    } catch (error) {
        modalFormulario.hide();
        aviso(error.message, "danger");
    }
}

async function manejarEnvio(id, accion) {
    const envio = registrosActuales.find(registro =>
        String(registro.id_envio) === String(id)
    );

    if (!envio) {
        return;
    }

    try {
        if (accion === "detalle") {
            return mostrarDetalle(envio, `Envío Nº ${id}`);
        }

        if (accion === "historial") {
            const historial = await solicitarAPI(
                `/envios/${id}/historial`
            );

            let contenido = '<p class="text-secondary">Sin movimientos.</p>';

            if (historial.length) {
                const movimientos = historial.map(movimiento => `
                    <li class="list-group-item">
                        <strong>${escapar(movimiento.estado)}</strong>
                        <div class="small text-secondary">
                            ${escapar(textoValor(movimiento.fecha_hora))}
                            · ${escapar(movimiento.responsable || "Sistema")}
                        </div>
                    </li>
                `).join("");

                contenido = `
                    <ul class="list-group">
                        ${movimientos}
                    </ul>
                `;
            }

            document.getElementById("tituloDetalle").textContent =
                `Historial del envío Nº ${id}`;

            document.getElementById("contenidoDetalle").innerHTML =
                contenido;

            modalDetalle.show();

            return;
        }

        if (accion === "iniciar" || accion === "cancelar") {
            const estado = accion === "iniciar"
                ? "EN_TRANSITO"
                : "CANCELADO";

            if (!confirm(`¿Confirmás cambiar el envío ${id} a ${estado}?`)) {
                return;
            }

            await solicitarAPI(
                `/envios/${id}/estado`,
                "PATCH",
                { estado }
            );

            await cargarEnvios();

            aviso("Estado actualizado correctamente");

            return;
        }

        if (accion === "entregar") {
            const campos = [
                {
                    nombre: "persona_recibe",
                    etiqueta: "Nombre de quien recibe",
                    obligatorio: true,
                    maximo: 150
                },
                {
                    nombre: "estado_entrega",
                    etiqueta: "Resultado",
                    tipo: "opciones",
                    opciones: [
                        "CONFORME",
                        "CON_OBSERVACIONES"
                    ],
                    obligatorio: true
                },
                {
                    nombre: "observaciones",
                    etiqueta: "Observaciones",
                    tipo: "texto-largo",
                    maximo: 3000
                }
            ];

            document.getElementById("tituloModal").textContent =
                `Registrar entrega del envío Nº ${id}`;

            tipoFormulario = "entrega";

            document.getElementById("camposModal").innerHTML =
                await crearCampos(campos);

            modalFormulario.show();

            document.getElementById("formRegistro").onsubmit =
                async evento => {
                    evento.preventDefault();

                    const boton = document.getElementById("guardarRegistro");
                    boton.disabled = true;

                    try {
                        await solicitarAPI(
                            `/envios/${id}/entrega`,
                            "POST",
                            recopilarDatos(campos)
                        );

                        modalFormulario.hide();

                        document.getElementById("formRegistro").onsubmit = null;

                        await cargarEnvios();

                        aviso("Entrega registrada correctamente");

                    } catch (error) {
                        alert(error.message);

                    } finally {
                        boton.disabled = false;
                    }
                };

            document.getElementById("modalFormulario").addEventListener(
                "hidden.bs.modal",
                () => {
                    document.getElementById("formRegistro").onsubmit = null;
                },
                { once: true }
            );
        }

    } catch (error) {
        aviso(error.message, "danger");
    }
}

document.addEventListener("DOMContentLoaded", iniciarAplicacion);
