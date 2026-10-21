
const API_BASE = "http://localhost:3000/api";


const ROLES = {
    ADMINISTRADOR: "ADMINISTRADOR",
    OPERADOR: "OPERADOR",
    CONDUCTOR: "CONDUCTOR"
};


const ESTADOS = {
    CONDUCTOR: [
        "ACTIVO",
        "INACTIVO"
    ],

    VEHICULO: [
        "DISPONIBLE",
        "MANTENIMIENTO"
    ],

    ENVIO: [
        "PENDIENTE",
        "EN_TRANSITO",
        "ENTREGADO",
        "CANCELADO"
    ],

    ENTREGA: [
        "CONFORME",
        "CON_OBSERVACIONES"
    ]
};


const MODULOS = {

    clientes: {
        titulo: "Clientes",
        ruta: "/clientes",
        identificador: "id_cliente",

        roles: [
            ROLES.ADMINISTRADOR,
            ROLES.OPERADOR
        ],

        escritura: [
            ROLES.ADMINISTRADOR,
            ROLES.OPERADOR
        ],

        columnas: [
            "razon_social",
            "cuit",
            "telefono",
            "localidad",
            "activo"
        ],

        campos: [
            {
                nombre: "razon_social",
                etiqueta: "Razón social",
                obligatorio: true,
                maximo: 150
            },
            {
                nombre: "cuit",
                etiqueta: "CUIT",
                obligatorio: true,
                maximo: 11
            },
            {
                nombre: "telefono",
                etiqueta: "Teléfono",
                maximo: 30
            },
            {
                nombre: "email",
                etiqueta: "Correo electrónico",
                tipo: "email",
                maximo: 150
            },
            {
                nombre: "domicilio",
                etiqueta: "Domicilio",
                maximo: 200
            },
            {
                nombre: "localidad",
                etiqueta: "Localidad",
                maximo: 100
            }
        ]
    },


    tipos: {
        titulo: "Tipos de vehículo",
        ruta: "/tipos-vehiculo",
        identificador: "id_tipo_vehiculo",

        roles: [
            ROLES.ADMINISTRADOR,
            ROLES.OPERADOR
        ],

        escritura: [
            ROLES.ADMINISTRADOR
        ],

        columnas: [
            "descripcion"
        ],

        campos: [
            {
                nombre: "descripcion",
                etiqueta: "Descripción del tipo de vehículo",
                obligatorio: true,
                maximo: 100
            }
        ]
    },


    vehiculos: {
        titulo: "Vehículos",
        ruta: "/vehiculos",
        identificador: "id_vehiculo",

        roles: [
            ROLES.ADMINISTRADOR,
            ROLES.OPERADOR
        ],

        escritura: [
            ROLES.ADMINISTRADOR
        ],

        columnas: [
            "patente",
            "marca",
            "modelo",
            "capacidad",
            "estado"
        ],

        campos: [
            {
                nombre: "id_tipo_vehiculo",
                etiqueta: "Tipo de vehículo",
                tipo: "relacion",
                origen: "tipos",
                mostrar: "descripcion",
                obligatorio: true
            },
            {
                nombre: "patente",
                etiqueta: "Patente",
                obligatorio: true,
                maximo: 15
            },
            {
                nombre: "marca",
                etiqueta: "Marca",
                obligatorio: true,
                maximo: 100
            },
            {
                nombre: "modelo",
                etiqueta: "Modelo",
                obligatorio: true,
                maximo: 100
            },
            {
                nombre: "anio",
                etiqueta: "Año de fabricación",
                tipo: "numero",
                minimo: 1950,
                maximo: new Date().getFullYear() + 1
            },
            {
                nombre: "capacidad",
                etiqueta: "Capacidad de carga (kg)",
                tipo: "decimal",
                minimo: 0.01,
                obligatorio: true
            },
            {
                nombre: "estado",
                etiqueta: "Estado operativo",
                tipo: "opciones",
                opciones: ESTADOS.VEHICULO,
                obligatorio: true
            }
        ]
    },


    conductores: {
        titulo: "Conductores",
        ruta: "/conductores",
        identificador: "id_conductor",

        roles: [
            ROLES.ADMINISTRADOR,
            ROLES.OPERADOR
        ],

        escritura: [
            ROLES.ADMINISTRADOR
        ],

        columnas: [
            "dni",
            "apellido",
            "nombre",
            "licencia",
            "estado"
        ],

        campos: [
            {
                nombre: "dni",
                etiqueta: "DNI",
                obligatorio: true,
                maximo: 9
            },
            {
                nombre: "apellido",
                etiqueta: "Apellido",
                obligatorio: true,
                maximo: 100
            },
            {
                nombre: "nombre",
                etiqueta: "Nombre",
                obligatorio: true,
                maximo: 100
            },
            {
                nombre: "licencia",
                etiqueta: "Número de licencia",
                obligatorio: true,
                maximo: 50
            },
            {
                nombre: "telefono",
                etiqueta: "Teléfono",
                maximo: 30
            },
            {
                nombre: "email",
                etiqueta: "Correo electrónico",
                tipo: "email",
                maximo: 150
            },
            {
                nombre: "estado",
                etiqueta: "Estado del conductor",
                tipo: "opciones",
                opciones: ESTADOS.CONDUCTOR,
                obligatorio: true
            }
        ]
    },


    pedidos: {
        titulo: "Pedidos",
        ruta: "/pedidos",
        identificador: "id_pedido",

        roles: [
            ROLES.ADMINISTRADOR,
            ROLES.OPERADOR
        ],

        escritura: [
            ROLES.ADMINISTRADOR,
            ROLES.OPERADOR
        ],

        columnas: [
            "id_cliente",
            "origen",
            "destino",
            "tipo_carga",
            "peso",
            "fecha_estimada"
        ],

        campos: [
            {
                nombre: "id_cliente",
                etiqueta: "Cliente",
                tipo: "relacion",
                origen: "clientes",
                mostrar: "razon_social",
                obligatorio: true
            },
            {
                nombre: "origen",
                etiqueta: "Lugar de origen",
                obligatorio: true,
                maximo: 200
            },
            {
                nombre: "destino",
                etiqueta: "Lugar de destino",
                obligatorio: true,
                maximo: 200
            },
            {
                nombre: "tipo_carga",
                etiqueta: "Tipo de carga",
                obligatorio: true,
                maximo: 100
            },
            {
                nombre: "cantidad",
                etiqueta: "Cantidad de bultos",
                tipo: "numero",
                minimo: 1,
                obligatorio: true
            },
            {
                nombre: "peso",
                etiqueta: "Peso total (kg)",
                tipo: "decimal",
                minimo: 0.01,
                obligatorio: true
            },
            {
                nombre: "fecha_estimada",
                etiqueta: "Fecha estimada",
                tipo: "fecha",
                obligatorio: true
            },
            {
                nombre: "observaciones",
                etiqueta: "Observaciones adicionales",
                tipo: "texto-largo",
                maximo: 3000
            }
        ]
    },


    usuarios: {
        titulo: "Usuarios",
        ruta: "/usuarios",
        identificador: "id_usuario",

        roles: [
            ROLES.ADMINISTRADOR
        ],

        escritura: [
            ROLES.ADMINISTRADOR
        ],

        columnas: [
            "usuario",
            "rol",
            "activo",
            "id_conductor"
        ],

        campos: [
            {
                nombre: "usuario",
                etiqueta: "Nombre de usuario",
                obligatorio: true,
                maximo: 100
            },
            {
                nombre: "clave",
                etiqueta: "Contraseña",
                tipo: "password",
                maximo: 150,
                minimoCaracteres: 10
            },
            {
                nombre: "rol",
                etiqueta: "Rol del usuario",
                tipo: "opciones",
                opciones: [
                    ROLES.ADMINISTRADOR,
                    ROLES.OPERADOR,
                    ROLES.CONDUCTOR
                ],
                obligatorio: true
            },
            {
                nombre: "id_conductor",
                etiqueta: "Conductor asociado",
                tipo: "relacion",
                origen: "conductores",
                mostrar: "nombre"
            },
            {
                nombre: "activo",
                etiqueta: "Cuenta activa",
                tipo: "booleano"
            }
        ]
    }
};
