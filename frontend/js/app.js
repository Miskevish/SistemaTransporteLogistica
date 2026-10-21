
let usuarioActual = null;
let vistaActual = "inicio";
let registrosActuales = [];

let modalFormulario;
let modalDetalle;

let registroEditando = null;
let tipoFormulario = "";
let idEnvioEntrega = null;

const nombresCampos = {
    id_cliente: "Cliente",
    id_conductor: "Conductor",
    id_vehiculo: "Vehículo",
    id_pedido: "Pedido",
    id_envio: "Envío",
    id_tipo_vehiculo: "Tipo de vehículo",
    id_usuario: "Usuario",
    razon_social: "Razón social",
    cuit: "CUIT",
    dni: "DNI",
    tipo_carga: "Tipo de carga",
    fecha_estimada: "Fecha estimada",
    fecha_estimada_llegada: "Llegada estimada",
    fecha_salida: "Fecha de salida",
    fecha_hora: "Fecha y hora",
    capacidad: "Capacidad (kg)",
    peso: "Peso (kg)",
    estado_actual: "Estado del envío",
    estado: "Estado",
    persona_recibe: "Persona que recibe",
    estado_entrega: "Resultado de entrega",
    activo: "Activo",
    id_estado_envio: "Movimiento",
    anio: "Año",
    patente: "Patente"
};


// --------------------------------------------------
// FUNCIONES GENERALES
// --------------------------------------------------

function escapar(valor) {
    return String(valor ?? "").replace(
        /[&<>"']/g,
        caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]
    );
}


function tituloCampo(campo) {
    return nombresCampos[campo] ||
        campo
            .replaceAll("_", " ")
            .replace(/^./, letra => letra.toUpperCase());
}


function textoValor(valor) {
    if (valor === true) return "Sí";
    if (valor === false) return "No";

    if (valor === null || valor === undefined || valor === "") {
        return "—";
    }

    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}T/.test(valor)) {
        const fecha = new Date(valor);

        if (!Number.isNaN(fecha.getTime())) {
            return fecha.toLocaleString("es-AR");
        }
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

    if (typeof valor === "string" && estados.includes(valor)) {
        return `
            <span class="estado ${escapar(valor)}">
                ${escapar(valor.replaceAll("_", " "))}
            </span>
        `;
    }

    return escapar(textoValor(valor));
}


function aviso(mensaje, tipo = "success") {
    const contenedor = document.getElementById("alertas");

    contenedor.innerHTML = `
        <div
            class="alert alert-${tipo} alert-dismissible fade show"
            role="alert">
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


function mostrarErrorFormulario(mensaje) {
    document.getElementById("errorFormulario").textContent = mensaje;
}


function limpiarErrorFormulario() {
    document.getElementById("errorFormulario").textContent = "";
}


function tieneRol(roles) {
    if (!usuarioActual) {
        return false;
    }

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
    document.getElementById("contenidoVista").innerHTML = `
        <div class="tarjeta text-secondary" role="status">
            Cargando información...
        </div>
    `;
}


function botonAccion(accion, id, texto, clase = "outline-secondary") {
    return `
        <button
            type="button"
            class="btn btn-sm btn-${clase}"
            data-accion="${escapar(accion)}"
            data-id="${escapar(id)}">
            ${escapar(texto)}
        </button>
    `;
}


// --------------------------------------------------
// INICIALIZACIÓN Y SESIÓN
// --------------------------------------------------

function iniciarAplicacion() {
    modalFormulario = new bootstrap.Modal(
        document.getElementById("modalFormulario")
    );

    modalDetalle = new bootstrap.Modal(
        document.getElementById("modalDetalle")
    );

    const camposModal = document.getElementById("camposModal");

    if (!document.getElementById("errorFormulario")) {
        camposModal.insertAdjacentHTML(
            "afterend",
            '<div id="errorFormulario" class="text-danger small mt-2" role="alert"></div>'
        );
    }

    document.getElementById("formIngreso").addEventListener(
        "submit",
        ingresar
    );

    document.getElementById("formRegistro").addEventListener(
        "submit",
        guardarFormulario
    );

    document.getElementById("botonSalir").addEventListener(
        "click",
        salir
    );

    document.getElementById("botonMenu").addEventListener(
        "click",
        () => {
            document.getElementById("menuLateral").classList.toggle("abierto");
        }
    );

    document.getElementById("contenidoVista").addEventListener(
        "click",
        eventoTabla
    );

    document.getElementById("accionesVista").addEventListener(
        "click",
        eventoAcciones
    );

    document.getElementById("modalFormulario").addEventListener(
        "hidden.bs.modal",
        () => {
            registroEditando = null;
            tipoFormulario = "";
            idEnvioEntrega = null;

            document.getElementById("formRegistro").reset();
            limpiarErrorFormulario();
        }
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
    const errorIngreso = document.getElementById("errorIngreso");

    boton.disabled = true;
    errorIngreso.textContent = "";

    try {
        const respuesta = await solicitarAPI(
            "/auth/login",
            "POST",
            {
                usuario: document.getElementById("usuarioIngreso").value.trim(),
                clave: document.getElementById("claveIngreso").value
            }
        );

        sessionStorage.setItem("token", respuesta.token);

        document.getElementById("formIngreso").reset();

        abrirSesion(respuesta.usuario);

    } catch (error) {
        errorIngreso.textContent = error.message;

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
    sessionStorage.removeItem("usuario");

    usuarioActual = null;
    registrosActuales = [];

    document.getElementById("aplicacion").classList.add("d-none");
    document.getElementById("pantallaIngreso").classList.remove("d-none");
}


// --------------------------------------------------
// NAVEGACIÓN
// --------------------------------------------------

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

        boton.type = "button";
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
        await cargarInicio();
        return;
    }

    if (clave === "envios") {
        await cargarEnvios();
        return;
    }

    if (MODULOS[clave]) {
        await cargarModulo(clave);
    }
}


// --------------------------------------------------
// PANEL PRINCIPAL
// --------------------------------------------------

function tarjetaEstadistica(titulo, cantidad) {
    return `
        <div class="col-sm-6 col-xl-4">
            <div class="tarjeta h-100">
                <p class="text-secondary mb-2">
                    ${escapar(titulo)}
                </p>

                <div class="numero-panel">
                    ${escapar(cantidad)}
                </div>
            </div>
        </div>
    `;
}


async function cargarInicio() {
    establecerTitulo("Panel principal", "Resumen de la empresa");
    mostrarCargando();

    try {
        let tarjetas = [];
        let descripcion = "";

        if (usuarioActual.rol === "CONDUCTOR") {
            const envios = await solicitarAPI("/envios");

            const enTransito = envios.filter(
                envio => envio.estado_actual === "EN_TRANSITO"
            ).length;

            tarjetas = [
                ["Mis envíos asignados", envios.length],
                ["En tránsito", enTransito]
            ];

            descripcion =
                "Consultá tus viajes asignados y registrá las entregas desde Envíos y seguimiento.";

        } else {
            const resumen = await solicitarAPI("/reportes/resumen");

            tarjetas = [
                ["Clientes activos", resumen.clientes_activos],
                ["Pedidos registrados", resumen.pedidos],
                ["Vehículos disponibles", resumen.vehiculos_disponibles],
                ["Envíos en tránsito", resumen.envios_en_transito],
                ["Envíos entregados", resumen.envios_entregados]
            ];

            descripcion =
                "Registrá clientes y recursos, creá pedidos y asigná vehículos y conductores para realizar los envíos.";
        }

        const contenidoTarjetas = tarjetas
            .map(([titulo, cantidad]) => tarjetaEstadistica(titulo, cantidad))
            .join("");

        document.getElementById("contenidoVista").innerHTML = `
            <div class="row g-3">
                ${contenidoTarjetas}
            </div>

            <div class="tarjeta mt-4">
                <h2 class="h5 mb-3">Gestión de transporte</h2>

                <p class="text-secondary mb-0">
                    ${escapar(descripcion)}
                </p>
            </div>
        `;

    } catch (error) {
        document.getElementById("contenidoVista").innerHTML = "";
        aviso(error.message, "danger");
    }
}


// --------------------------------------------------
// TABLAS
// --------------------------------------------------

function construirTabla(registros, columnas, campoIdentificador, acciones) {
    if (registros.length === 0) {
        return `
            <div class="vacio">
                Todavía no hay registros para mostrar.
            </div>
        `;
    }

    const encabezados = columnas.map(campo => `
        <th scope="col">${escapar(tituloCampo(campo))}</th>
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
                <td>${escapar(registro[campoIdentificador])}</td>

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
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th scope="col">ID</th>
                        ${encabezados}
                        <th scope="col">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    ${filas}
                </tbody>
            </table>
        </div>
    `;
}


// --------------------------------------------------
// FILTROS DE MÓDULOS
// --------------------------------------------------

function obtenerEstadosFiltro(clave) {
    if (clave === "conductores") {
        return [
            ["ACTIVO", "Activos"],
            ["INACTIVO", "Inactivos"]
        ];
    }

    if (clave === "usuarios") {
        return [
            ["true", "Activos"],
            ["false", "Inactivos"]
        ];
    }

    if (clave === "vehiculos") {
        return [
            ["DISPONIBLE", "Disponibles"],
            ["EN_VIAJE", "En viaje"],
            ["MANTENIMIENTO", "En mantenimiento"]
        ];
    }

    return [];
}


function filtrarRegistros(clave, registros, busqueda, estado) {
    const consulta = busqueda.trim().toLowerCase();

    return registros.filter(registro => {
        const coincideTexto = Object.values(registro).some(valor =>
            String(valor ?? "").toLowerCase().includes(consulta)
        );

        if (!coincideTexto) {
            return false;
        }

        if (!estado) {
            return true;
        }

        if (clave === "usuarios") {
            return String(registro.activo) === estado;
        }

        return registro.estado === estado;
    });
}


// --------------------------------------------------
// MÓDULOS GENERALES
// --------------------------------------------------

async function cargarModulo(clave) {
    const modulo = MODULOS[clave];

    if (!modulo) {
        return;
    }

    establecerTitulo(modulo.titulo);

    if (puedeModificar(modulo)) {
        document.getElementById("accionesVista").innerHTML = `
            <button
                type="button"
                class="btn btn-primary"
                data-accion="nuevo">
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

            if (!puedeModificar(modulo)) {
                return botones;
            }

            const esConductorInactivo =
                clave === "conductores" &&
                registro.estado === "INACTIVO";

            const esUsuarioInactivo =
                clave === "usuarios" &&
                registro.activo === false;

            const esClienteInactivo =
                clave === "clientes" &&
                registro.activo === false;

            const vehiculoEnViaje =
                clave === "vehiculos" &&
                registro.estado === "EN_VIAJE";

            if (!vehiculoEnViaje && !esClienteInactivo) {
                botones += botonAccion("editar", id, "Editar");
            }

            if (
                !esConductorInactivo &&
                !esUsuarioInactivo &&
                !esClienteInactivo &&
                !vehiculoEnViaje
            ) {
                let etiqueta = "Eliminar";

                if (clave === "usuarios") {
                    etiqueta = "Desactivar";
                }

                if (clave === "conductores" || clave === "clientes") {
                    etiqueta = "Eliminar / Baja";
                }

                if (clave === "vehiculos") {
                    etiqueta = "Retirar";
                }

                botones += botonAccion(
                    "eliminar",
                    id,
                    etiqueta,
                    "outline-danger"
                );
            }

            if (esConductorInactivo || esUsuarioInactivo) {
                botones += botonAccion(
                    "reactivar",
                    id,
                    "Reactivar",
                    "outline-success"
                );
            }

            return botones;
        };

        const estados = obtenerEstadosFiltro(clave);

        const opcionesEstado = estados.map(([valor, etiqueta]) => `
            <option value="${escapar(valor)}">
                ${escapar(etiqueta)}
            </option>
        `).join("");

        const filtroEstado = estados.length ? `
            <div class="col-md-4">
                <label for="filtroModulo" class="form-label">
                    Filtrar por estado
                </label>

                <select id="filtroModulo" class="form-select">
                    <option value="">Todos</option>
                    ${opcionesEstado}
                </select>
            </div>
        ` : "";

        document.getElementById("contenidoVista").innerHTML = `
            <div class="tarjeta mb-3">
                <div class="row g-3">
                    <div class="${estados.length ? "col-md-8" : "col-12"}">
                        <label for="busqueda" class="form-label">
                            Buscar en ${escapar(modulo.titulo.toLowerCase())}
                        </label>

                        <input
                            id="busqueda"
                            type="search"
                            class="form-control"
                            placeholder="Escribí para buscar...">
                    </div>

                    ${filtroEstado}
                </div>
            </div>

            <div id="tablaModulo"></div>
        `;

        const busqueda = document.getElementById("busqueda");
        const filtro = document.getElementById("filtroModulo");
        const tabla = document.getElementById("tablaModulo");

        if (filtro && (clave === "conductores" || clave === "usuarios")) {
            filtro.value = clave === "usuarios" ? "true" : "ACTIVO";
        }

        function actualizarTabla() {
            const filtrados = filtrarRegistros(
                clave,
                registrosActuales,
                busqueda.value,
                filtro ? filtro.value : ""
            );

            tabla.innerHTML = construirTabla(
                filtrados,
                modulo.columnas,
                modulo.identificador,
                acciones
            );
        }

        busqueda.addEventListener("input", actualizarTabla);

        if (filtro) {
            filtro.addEventListener("change", actualizarTabla);
        }

        actualizarTabla();

    } catch (error) {
        document.getElementById("contenidoVista").innerHTML = "";
        aviso(error.message, "danger");
    }
}


// --------------------------------------------------
// CAMPOS DINÁMICOS DE FORMULARIOS
// --------------------------------------------------

async function crearCampos(campos, registro = null) {
    const fragmentos = [];

    for (const campo of campos) {
        let valor = registro ? registro[campo.nombre] : "";

        if (campo.nombre === "activo" && !registro) {
            valor = true;
        }

        const id = `campo_${campo.nombre}`;
        const etiqueta = escapar(campo.etiqueta);
        const requerido = campo.obligatorio ? "required" : "";

        let elemento = "";

        if (campo.tipo === "relacion") {
            const moduloRelacionado = MODULOS[campo.origen];

            let opciones = await solicitarAPI(moduloRelacionado.ruta);

            // Solo permitir recursos operativamente utilizables
            // en los formularios de nuevas asignaciones.
            if (!registro && tipoFormulario === "envioNuevo") {
                if (campo.origen === "conductores") {
                    opciones = opciones.filter(
                        opcion => opcion.estado === "ACTIVO"
                    );
                }

                if (campo.origen === "vehiculos") {
                    opciones = opciones.filter(
                        opcion => opcion.estado === "DISPONIBLE"
                    );
                }
            }

            // Al crear un pedido, solo utilizar clientes activos.
            if (campo.origen === "clientes") {
                opciones = opciones.filter(
                    opcion => opcion.activo === true
                );
            }

            // Para usuarios conductores, preferir conductores activos.
            if (
                tipoFormulario === "usuarios" &&
                campo.origen === "conductores"
            ) {
                opciones = opciones.filter(
                    opcion => opcion.estado === "ACTIVO" ||
                    String(opcion.id_conductor) === String(valor)
                );
            }

            const opcionesHTML = opciones.map(opcion => {
                const idOpcion = opcion[moduloRelacionado.identificador];

                const descripcion = campo.origen === "conductores"
                    ? `${opcion.nombre} ${opcion.apellido}`
                    : opcion[campo.mostrar];

                const seleccionado = String(valor ?? "") === String(idOpcion)
                    ? "selected"
                    : "";

                return `
                    <option value="${escapar(idOpcion)}" ${seleccionado}>
                        ${escapar(descripcion)}
                    </option>
                `;
            }).join("");

            elemento = `
                <select
                    id="${id}"
                    name="${campo.nombre}"
                    class="form-select"
                    ${requerido}>
                    <option value="">Seleccionar...</option>
                    ${opcionesHTML}
                </select>
            `;

        } else if (campo.tipo === "opciones") {
            const opcionesHTML = campo.opciones.map(opcion => {
                const seleccionado = opcion === (valor || campo.opciones[0])
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
                    id="${id}"
                    name="${campo.nombre}"
                    class="form-select"
                    ${requerido}>
                    ${opcionesHTML}
                </select>
            `;

        } else if (campo.tipo === "booleano") {
            elemento = `
                <select
                    id="${id}"
                    name="${campo.nombre}"
                    class="form-select">
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
                    id="${id}"
                    name="${campo.nombre}"
                    class="form-control"
                    rows="3"
                    maxlength="${campo.maximo || 3000}"
                    ${requerido}>${escapar(valor)}</textarea>
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
                valor = String(valor).slice(0, 10);
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

            const minimoCaracteres = campo.minimoCaracteres
                ? `minlength="${campo.minimoCaracteres}"`
                : "";

            elemento = `
                <input
                    id="${id}"
                    name="${campo.nombre}"
                    type="${tipo}"
                    class="form-control"
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
                    ${etiqueta}${campo.obligatorio ? " *" : ""}
                </label>

                ${elemento}
            </div>
        `);
    }

    return fragmentos.join("");
}


// --------------------------------------------------
// APERTURA DE FORMULARIOS
// --------------------------------------------------

async function abrirFormulario(modulo, registro = null) {
    tipoFormulario = vistaActual;
    registroEditando = registro;
    idEnvioEntrega = null;

    limpiarErrorFormulario();

    document.getElementById("tituloModal").textContent =
        `${registro ? "Editar" : "Crear"} ${modulo.titulo.toLowerCase()}`;

    document.getElementById("camposModal").innerHTML = `
        <div class="text-secondary">
            Cargando campos...
        </div>
    `;

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


function camposEnvioNuevo() {
    return [
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
}


function camposEntrega() {
    return [
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
}


async function abrirEnvioNuevo() {
    tipoFormulario = "envioNuevo";
    registroEditando = null;
    idEnvioEntrega = null;

    limpiarErrorFormulario();

    document.getElementById("tituloModal").textContent = "Crear envío";

    document.getElementById("camposModal").innerHTML = `
        <div class="text-secondary">
            Cargando opciones...
        </div>
    `;

    modalFormulario.show();

    try {
        document.getElementById("camposModal").innerHTML =
            await crearCampos(camposEnvioNuevo());

    } catch (error) {
        modalFormulario.hide();
        aviso(error.message, "danger");
    }
}


async function abrirEntrega(id) {
    tipoFormulario = "entrega";
    registroEditando = null;
    idEnvioEntrega = id;

    limpiarErrorFormulario();

    document.getElementById("tituloModal").textContent =
        `Registrar entrega del envío Nº ${id}`;

    document.getElementById("camposModal").innerHTML =
        await crearCampos(camposEntrega());

    modalFormulario.show();
}


// --------------------------------------------------
// RECOLECCIÓN Y ENVÍO DE FORMULARIOS
// --------------------------------------------------

function recopilarDatos(campos) {
    const datos = {};

    for (const campo of campos) {
        const elemento = document.getElementById(
            `campo_${campo.nombre}`
        );

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
            datos[campo.nombre] = valor === "" ? null : Number(valor);

        } else if (campo.tipo === "password" && valor === "") {
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

    const boton = document.getElementById("guardarRegistro");

    if (boton.disabled || !tipoFormulario) {
        return;
    }

    boton.disabled = true;
    limpiarErrorFormulario();

    const formularioActual = tipoFormulario;

    try {
        let respuesta;

        if (formularioActual === "envioNuevo") {
            respuesta = await solicitarAPI(
                "/envios",
                "POST",
                recopilarDatos(camposEnvioNuevo())
            );

        } else if (formularioActual === "entrega") {
            respuesta = await solicitarAPI(
                `/envios/${idEnvioEntrega}/entrega`,
                "POST",
                recopilarDatos(camposEntrega())
            );

        } else {
            const modulo = MODULOS[formularioActual];

            if (!modulo) {
                throw new Error("El formulario solicitado no existe");
            }

            const datos = recopilarDatos(modulo.campos);

            if (registroEditando) {
                respuesta = await solicitarAPI(
                    `${modulo.ruta}/${registroEditando[modulo.identificador]}`,
                    "PUT",
                    datos
                );

            } else {
                respuesta = await solicitarAPI(
                    modulo.ruta,
                    "POST",
                    datos
                );
            }
        }

        modalFormulario.hide();

        if (formularioActual === "envioNuevo" || formularioActual === "entrega") {
            await cargarEnvios();
        } else {
            await cargarModulo(formularioActual);
        }

        aviso(
            respuesta.mensaje || "Operación realizada correctamente"
        );

    } catch (error) {
        mostrarErrorFormulario(error.message);

    } finally {
        boton.disabled = false;
    }
}


// --------------------------------------------------
// DETALLES DE REGISTROS
// --------------------------------------------------

function mostrarDetalle(registro, titulo = "Detalle del registro") {
    document.getElementById("tituloDetalle").textContent = titulo;

    const detalles = Object.entries(registro)
        .filter(([campo]) => campo !== "hash_clave")
        .map(([campo, valor]) => `
            <dt>${escapar(tituloCampo(campo))}</dt>
            <dd>${escapar(textoValor(valor))}</dd>
        `)
        .join("");

    document.getElementById("contenidoDetalle").innerHTML = `
        <dl class="detalle-tabla mb-0">
            ${detalles}
        </dl>
    `;

    modalDetalle.show();
}


// --------------------------------------------------
// ACCIONES DEL MÓDULO
// --------------------------------------------------

async function eventoAcciones(evento) {
    const boton = evento.target.closest("[data-accion]");

    if (!boton) {
        return;
    }

    const accion = boton.dataset.accion;

    if (accion === "nuevo") {
        await abrirFormulario(MODULOS[vistaActual]);
    }

    if (accion === "nuevo-envio") {
        await abrirEnvioNuevo();
    }
}


async function reactivarRegistro(modulo, registro) {
    const id = registro[modulo.identificador];

    if (vistaActual === "conductores") {
        return solicitarAPI(
            `${modulo.ruta}/${id}`,
            "PUT",
            { estado: "ACTIVO" }
        );
    }

    if (vistaActual === "usuarios") {
        return solicitarAPI(
            `${modulo.ruta}/${id}`,
            "PUT",
            { activo: true }
        );
    }

    throw new Error("Este módulo no admite reactivación");
}


async function eventoTabla(evento) {
    const boton = evento.target.closest("[data-accion]");

    if (!boton) {
        return;
    }

    const accion = boton.dataset.accion;
    const id = boton.dataset.id;

    if (vistaActual === "envios") {
        await manejarEnvio(id, accion);
        return;
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
        mostrarDetalle(
            registro,
            `Detalle de ${modulo.titulo.toLowerCase()}`
        );
        return;
    }

    if (accion === "editar") {
        await abrirFormulario(modulo, registro);
        return;
    }

    if (accion === "reactivar") {
        if (!confirm(`¿Querés reactivar el registro ${id}?`)) {
            return;
        }

        try {
            const respuesta = await reactivarRegistro(modulo, registro);

            await cargarModulo(vistaActual);

            aviso(
                respuesta.mensaje || "Registro reactivado correctamente"
            );

        } catch (error) {
            aviso(error.message, "danger");
        }

        return;
    }

    if (accion === "eliminar") {
        let mensaje = `¿Confirmás la eliminación del registro ${id}?`;

        if (vistaActual === "usuarios") {
            mensaje = `¿Confirmás desactivar el usuario ${id}?`;
        }

        if (vistaActual === "conductores" || vistaActual === "clientes") {
            mensaje =
                `¿Confirmás eliminar o dar de baja el registro ${id}? ` +
                "Si tiene historial, sus datos se conservarán.";
        }

        if (vistaActual === "vehiculos") {
            mensaje =
                `¿Confirmás retirar el vehículo ${id}? ` +
                "Si tiene historial, se conservará en la base de datos.";
        }

        if (!confirm(mensaje)) {
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


// --------------------------------------------------
// ENVÍOS Y SEGUIMIENTO
// --------------------------------------------------

async function cargarEnvios() {
    establecerTitulo(
        "Envíos y seguimiento",
        "Asignaciones, estados y entregas"
    );

    if (usuarioActual.rol !== "CONDUCTOR") {
        document.getElementById("accionesVista").innerHTML = `
            <button
                type="button"
                class="btn btn-primary"
                data-accion="nuevo-envio">
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

                if (usuarioActual.rol !== "CONDUCTOR") {
                    botones += botonAccion(
                        "cancelar",
                        id,
                        "Cancelar",
                        "outline-danger"
                    );
                }
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

        const opcionesEstado = [
            "PENDIENTE",
            "EN_TRANSITO",
            "ENTREGADO",
            "CANCELADO"
        ].map(estado => `
            <option value="${estado}">
                ${estado.replaceAll("_", " ")}
            </option>
        `).join("");

        document.getElementById("contenidoVista").innerHTML = `
            <div class="tarjeta mb-3">
                <label for="filtroEstado" class="form-label">
                    Filtrar envíos por estado
                </label>

                <select id="filtroEstado" class="form-select">
                    <option value="">Todos</option>
                    ${opcionesEstado}
                </select>
            </div>

            <div id="tablaEnvios"></div>
        `;

        const filtro = document.getElementById("filtroEstado");
        const tabla = document.getElementById("tablaEnvios");

        function actualizarTabla() {
            const estado = filtro.value;

            const filtrados = registrosActuales.filter(registro =>
                !estado || registro.estado_actual === estado
            );

            tabla.innerHTML = construirTabla(
                filtrados,
                columnas,
                "id_envio",
                acciones
            );
        }

        filtro.addEventListener("change", actualizarTabla);

        actualizarTabla();

    } catch (error) {
        document.getElementById("contenidoVista").innerHTML = "";
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
            mostrarDetalle(envio, `Envío Nº ${id}`);
            return;
        }

        if (accion === "historial") {
            const movimientos = await solicitarAPI(
                `/envios/${id}/historial`
            );

            let contenido = `
                <p class="text-secondary">
                    Este envío todavía no tiene movimientos.
                </p>
            `;

            if (movimientos.length > 0) {
                const elementos = movimientos.map(movimiento => `
                    <li class="list-group-item">
                        <strong>
                            ${escapar(movimiento.estado.replaceAll("_", " "))}
                        </strong>

                        <div class="small text-secondary">
                            ${escapar(textoValor(movimiento.fecha_hora))}
                            ·
                            ${escapar(movimiento.responsable || "Sistema")}
                        </div>
                    </li>
                `).join("");

                contenido = `
                    <ul class="list-group">
                        ${elementos}
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

            const descripcion = accion === "iniciar"
                ? "iniciar"
                : "cancelar";

            if (!confirm(`¿Confirmás ${descripcion} el envío Nº ${id}?`)) {
                return;
            }

            const respuesta = await solicitarAPI(
                `/envios/${id}/estado`,
                "PATCH",
                { estado }
            );

            await cargarEnvios();

            aviso(
                respuesta.mensaje || "Estado actualizado correctamente"
            );

            return;
        }

        if (accion === "entregar") {
            await abrirEntrega(id);
        }

    } catch (error) {
        aviso(error.message, "danger");
    }
}


// --------------------------------------------------
// INICIAR LA APLICACIÓN
// --------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacion
);
