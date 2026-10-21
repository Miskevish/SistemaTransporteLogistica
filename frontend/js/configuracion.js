
const API_BASE = "http://localhost:3000/api";

const MODULOS = {
    clientes: {
        titulo: "Clientes", ruta: "/clientes", identificador: "id_cliente", roles: ["ADMINISTRADOR", "OPERADOR"],
        columnas: ["razon_social", "cuit", "telefono", "localidad", "activo"],
        campos: [
            { nombre: "razon_social", etiqueta: "Razón social", obligatorio: true, maximo: 150 },
            { nombre: "cuit", etiqueta: "CUIT (11 dígitos)", obligatorio: true, maximo: 11 },
            { nombre: "telefono", etiqueta: "Teléfono", maximo: 30 },
            { nombre: "email", etiqueta: "Correo electrónico", tipo: "email", maximo: 150 },
            { nombre: "domicilio", etiqueta: "Domicilio", maximo: 200 },
            { nombre: "localidad", etiqueta: "Localidad", maximo: 100 }
        ]
    },
    tipos: {
        titulo: "Tipos de vehículo", ruta: "/tipos-vehiculo", identificador: "id_tipo_vehiculo", roles: ["ADMINISTRADOR", "OPERADOR"], escritura: ["ADMINISTRADOR"],
        columnas: ["descripcion"], campos: [{ nombre: "descripcion", etiqueta: "Descripción", obligatorio: true, maximo: 100 }]
    },
    vehiculos: {
        titulo: "Vehículos", ruta: "/vehiculos", identificador: "id_vehiculo", roles: ["ADMINISTRADOR", "OPERADOR"], escritura: ["ADMINISTRADOR"],
        columnas: ["patente", "marca", "modelo", "capacidad", "estado"],
        campos: [
            { nombre: "id_tipo_vehiculo", etiqueta: "Tipo de vehículo", tipo: "relacion", origen: "tipos", mostrar: "descripcion", obligatorio: true },
            { nombre: "patente", etiqueta: "Patente", obligatorio: true, maximo: 15 },
            { nombre: "marca", etiqueta: "Marca", obligatorio: true, maximo: 100 },
            { nombre: "modelo", etiqueta: "Modelo", obligatorio: true, maximo: 100 },
            { nombre: "anio", etiqueta: "Año", tipo: "numero", minimo: 1900, maximo: 2100 },
            { nombre: "capacidad", etiqueta: "Capacidad (kg)", tipo: "decimal", minimo: 0.01, obligatorio: true },
            { nombre: "estado", etiqueta: "Estado", tipo: "opciones", opciones: ["DISPONIBLE", "EN_VIAJE", "MANTENIMIENTO"], obligatorio: true }
        ]
    },
    conductores: {
        titulo: "Conductores", ruta: "/conductores", identificador: "id_conductor", roles: ["ADMINISTRADOR", "OPERADOR"], escritura: ["ADMINISTRADOR"],
        columnas: ["dni", "apellido", "nombre", "licencia", "estado"],
        campos: [
            { nombre: "dni", etiqueta: "DNI", obligatorio: true, maximo: 15 },
            { nombre: "apellido", etiqueta: "Apellido", obligatorio: true, maximo: 100 },
            { nombre: "nombre", etiqueta: "Nombre", obligatorio: true, maximo: 100 },
            { nombre: "licencia", etiqueta: "Licencia", obligatorio: true, maximo: 50 },
            { nombre: "telefono", etiqueta: "Teléfono", maximo: 30 },
            { nombre: "email", etiqueta: "Correo", tipo: "email", maximo: 150 },
            { nombre: "estado", etiqueta: "Estado", tipo: "opciones", opciones: ["ACTIVO", "INACTIVO"], obligatorio: true }
        ]
    },
    pedidos: {
        titulo: "Pedidos", ruta: "/pedidos", identificador: "id_pedido", roles: ["ADMINISTRADOR", "OPERADOR"],
        columnas: ["id_cliente", "origen", "destino", "tipo_carga", "peso", "fecha_estimada"],
        campos: [
            { nombre: "id_cliente", etiqueta: "Cliente", tipo: "relacion", origen: "clientes", mostrar: "razon_social", obligatorio: true },
            { nombre: "origen", etiqueta: "Origen", obligatorio: true, maximo: 200 },
            { nombre: "destino", etiqueta: "Destino", obligatorio: true, maximo: 200 },
            { nombre: "tipo_carga", etiqueta: "Tipo de carga", obligatorio: true, maximo: 100 },
            { nombre: "cantidad", etiqueta: "Cantidad de bultos", tipo: "numero", minimo: 1, obligatorio: true },
            { nombre: "peso", etiqueta: "Peso total (kg)", tipo: "decimal", minimo: .01, obligatorio: true },
            { nombre: "fecha_estimada", etiqueta: "Fecha estimada", tipo: "fecha", obligatorio: true },
            { nombre: "observaciones", etiqueta: "Observaciones", tipo: "texto-largo", maximo: 3000 }
        ]
    },
    usuarios: {
        titulo: "Usuarios", ruta: "/usuarios", identificador: "id_usuario", roles: ["ADMINISTRADOR"],
        columnas: ["usuario", "rol", "activo", "id_conductor"],
        campos: [
            { nombre: "usuario", etiqueta: "Nombre de usuario", obligatorio: true, maximo: 100 },
            { nombre: "clave", etiqueta: "Contraseña (mínimo 10 caracteres)", tipo: "password", maximo: 150, minimoCaracteres: 10 },
            { nombre: "rol", etiqueta: "Rol", tipo: "opciones", opciones: ["ADMINISTRADOR", "OPERADOR", "CONDUCTOR"], obligatorio: true },
            { nombre: "id_conductor", etiqueta: "Conductor asociado (solo para rol CONDUCTOR)", tipo: "relacion", origen: "conductores", mostrar: "nombre" },
            { nombre: "activo", etiqueta: "Cuenta activa", tipo: "booleano" }
        ]
    }
};
