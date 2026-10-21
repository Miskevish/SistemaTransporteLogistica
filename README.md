# Sistema de Transporte y Logística

**Trabajo Práctico Integral — Taller Integrador II**

**Integrantes:** Nicolás José Miskevish · Ana Paula Soler · Braiton Juárez Isa

## Descripción

Aplicación web para administrar las operaciones de una empresa de transporte y logística. Centraliza la información de clientes, pedidos, vehículos, conductores, envíos y entregas. Incluye autenticación, permisos por rol, seguimiento de estados, historial de movimientos y un panel con indicadores operativos.

El sistema está desarrollado con una arquitectura cliente-servidor: el navegador consume una API REST y el backend administra las reglas de negocio y la persistencia en PostgreSQL.

## Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Frontend | HTML5, CSS3, Bootstrap 5.3.3 y JavaScript |
| Backend | Node.js y Express.js |
| Base de datos | PostgreSQL |
| Conexión a la base de datos | `pg` (pool de conexiones) |
| Autenticación | JWT y contraseñas protegidas mediante `bcryptjs` |
| Herramientas de desarrollo | Visual Studio Code, pgAdmin 4 y Live Server |
| Organización del trabajo | Trello y GitHub |

## Funcionalidades

- **Autenticación:** inicio de sesión, cierre de sesión y verificación de permisos mediante JWT.
- **Panel principal:** resumen de clientes activos, pedidos, vehículos disponibles y envíos por estado.
- **Clientes:** alta, consulta, búsqueda, edición y baja según las reglas de negocio.
- **Tipos de vehículo:** administración del catálogo de tipos.
- **Vehículos:** registro, consulta, edición, control de capacidad y estado operativo.
- **Conductores:** administración de datos, estado activo/inactivo y asignación a envíos.
- **Pedidos:** registro de origen, destino, tipo de carga, cantidad, peso y fecha estimada.
- **Envíos:** creación a partir de pedidos, asignación de vehículos y conductores, inicio y cancelación según el estado.
- **Seguimiento:** registro y consulta del historial de estados de cada envío.
- **Entregas:** confirmación de recepción, identificación de quien recibe y observaciones.
- **Usuarios:** gestión de cuentas, roles y estado de activación.
- **Interfaz responsive:** adaptación a pantallas de computadora, tablet y celular.

### Estados de los envíos

`PENDIENTE` → `EN_TRANSITO` → `ENTREGADO`

Un envío `PENDIENTE` también puede pasar a `CANCELADO`. Los envíos entregados o cancelados no pueden volver a un estado anterior.

## Roles y permisos

| Rol | Funciones principales |
| --- | --- |
| **ADMINISTRADOR** | Administración general, usuarios, vehículos, conductores, catálogos y operaciones. |
| **OPERADOR** | Gestión de clientes, pedidos, envíos y seguimiento; consulta de recursos e indicadores. |
| **CONDUCTOR** | Consulta de sus envíos asignados, inicio de viajes y registro de entregas permitidas. |

Las autorizaciones se comprueban en el backend; ocultar una opción en la interfaz no reemplaza la validación de permisos.

## Estructura del proyecto

```text
proyecto/
├── backend/
│   ├── controllers/       # Procesamiento de solicitudes HTTP
│   ├── middleware/        # Autenticación, permisos y errores
│   ├── routes/            # Endpoints de la API
│   ├── services/          # Reglas de negocio y consultas SQL
│   ├── sql/               # Scripts de base de datos
│   ├── validators/        # Validaciones de datos
│   ├── .env.example       # Plantilla de configuración
│   ├── .gitignore
│   ├── db.js              # Pool de PostgreSQL
│   ├── index.js           # Servidor Express
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── estilos.css
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   └── configuracion.js
│   └── index.html
└── README.md
```

## Requisitos previos

- Node.js y npm instalados.
- PostgreSQL instalado y en ejecución.
- Una herramienta para ejecutar scripts SQL, como pgAdmin 4.
- Un navegador moderno.
- Visual Studio Code con Live Server (recomendado para desarrollo local).

## Instalación y ejecución local

### 1. Obtener el proyecto

Clonar el repositorio de GitHub o descargarlo como archivo ZIP y descomprimirlo.

### 2. Configurar PostgreSQL

Crear una base de datos con el nombre:

```sql
CREATE DATABASE transporte_logistica;
```

Ejecutar los scripts incluidos en `backend/sql/`, respetando sus dependencias y el orden indicado dentro de ellos. El modelo contempla nueve tablas:

`cliente`, `pedido`, `envio`, `tipo_vehiculo`, `vehiculo`, `conductor`, `entrega`, `estado_envio` y `usuario`.

### 3. Configurar el backend

Abrir una terminal dentro de `backend/` e instalar las dependencias:

```bash
npm install
```

Crear un archivo `.env` a partir de `.env.example` y completar los valores de la instalación local. Por ejemplo:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transporte_logistica
DB_USER=postgres
DB_PASSWORD=REEMPLAZAR_CON_CONTRASENA_LOCAL
JWT_SECRET=REEMPLAZAR_CON_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
```

**Importante:** estos valores son ejemplos. No publicar `.env`, contraseñas reales ni claves JWT en el repositorio.

Iniciar el servidor desde `backend/`:

```bash
node index.js
```

Si la conexión funciona, la API estará disponible en `http://localhost:3000`.

Comprobar su estado en:

`http://localhost:3000/api/salud`

### 4. Ejecutar el frontend

Abrir `frontend/index.html` mediante la extensión **Live Server** de Visual Studio Code. Con la configuración utilizada durante el desarrollo, la dirección es:

`http://127.0.0.1:5500/frontend/index.html`

La aplicación se comunica con la API configurada en `frontend/js/configuracion.js`:

```javascript
const API_BASE = "http://localhost:3000/api";
```

Si se cambia el puerto u origen del frontend, ajustar también `CORS_ORIGIN` en el backend.

### 5. Acceder al sistema

Iniciar sesión con una cuenta habilitada y registrada en la base de datos. Las contraseñas deben almacenarse como hashes; no deben cargarse directamente en texto plano en la columna de contraseña cifrada.

## API REST

Las rutas tienen como prefijo `/api`.

| Módulo | Ruta principal | Operaciones |
| --- | --- | --- |
| Autenticación | `/api/auth` | Iniciar sesión y consultar perfil |
| Clientes | `/api/clientes` | Consultar, crear, editar y dar de baja |
| Tipos de vehículo | `/api/tipos-vehiculo` | CRUD |
| Vehículos | `/api/vehiculos` | Consultar, crear, editar y retirar según reglas |
| Conductores | `/api/conductores` | Consultar, crear, editar y dar de baja |
| Pedidos | `/api/pedidos` | CRUD según asociaciones existentes |
| Envíos | `/api/envios` | Consultar, crear, actualizar estado y registrar entrega |
| Usuarios | `/api/usuarios` | Administración y desactivación de cuentas |
| Reportes | `/api/reportes/resumen` | Indicadores generales |

### Rutas destacadas de envíos

```http
GET    /api/envios
GET    /api/envios/:id
POST   /api/envios
PATCH  /api/envios/:id/estado
GET    /api/envios/:id/historial
POST   /api/envios/:id/entrega
```

Las rutas protegidas requieren el encabezado:

```http
Authorization: Bearer TOKEN_JWT
```

## Reglas de negocio principales

1. No asignar vehículos que no estén disponibles.
2. No asignar conductores inactivos.
3. Evitar que un vehículo o conductor tenga envíos activos incompatibles.
4. Impedir que un envío entregado regrese a `EN_TRANSITO`.
5. Impedir la entrega de un envío cancelado.
6. Comprobar que la capacidad del vehículo alcance para el peso del pedido.
7. Validar campos obligatorios, identificadores, fechas y datos antes de guardar.
8. Conservar el historial de estados para permitir la trazabilidad de los envíos.

## Seguridad y validaciones

- Contraseñas almacenadas como hashes con `bcryptjs`.
- Tokens JWT para identificar sesiones.
- Restricciones de acceso por rol desde middleware del backend.
- Validación de entradas y respuestas HTTP con mensajes de error.
- Consultas parametrizadas mediante `pg` para reducir riesgos de inyección SQL.
- Configuración sensible mediante variables de entorno.

## Flujo de uso

1. Un usuario autorizado registra un cliente.
2. Registra un pedido con origen, destino y detalles de la carga.
3. Crea un envío y asigna un vehículo y un conductor válidos.
4. El envío se registra inicialmente como `PENDIENTE`.
5. Al iniciar el viaje, cambia a `EN_TRANSITO` y registra el movimiento.
6. Cuando llega a destino, registra la entrega y el envío pasa a `ENTREGADO`.
7. El historial conserva las transiciones realizadas.

## Gestión del proyecto

Tablero de Trello: [Tramo: empresa de Transporte y Logística](https://trello.com/b/zyWuCG45)

## Consideraciones

El sistema fue desarrollado como trabajo académico y se ejecuta en un entorno local de desarrollo. Antes de desplegarlo públicamente se recomienda incorporar una configuración de producción específica, HTTPS, gestión segura de secretos y pruebas automatizadas.

---

**Taller Integrador II — Sistema web de gestión para una empresa de transporte y logística.**
