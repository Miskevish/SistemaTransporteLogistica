
# TRAMO — Sistema de Transporte y Logística

**Trabajo Práctico Integral — Taller Integrador II**

**Integrantes:** Nicolás José Miskevish · Ana Paula Soler · Braiton Juárez Isa

---

## Descripción

**Tramo** es una aplicación web para gestionar las operaciones de una empresa de transporte y logística.

Centraliza la información de clientes, pedidos, vehículos, conductores, envíos y entregas. También incorpora autenticación, permisos por rol, historial de estados e indicadores operativos.

El sistema utiliza una arquitectura cliente-servidor:

- El frontend muestra la interfaz al usuario.
- El backend recibe y procesa las solicitudes mediante una API REST.
- PostgreSQL almacena la información.
- Los servicios del backend aplican las reglas de negocio.

La aplicación también incluye una página pública con la identidad visual de Tramo, un carrusel informativo, una sección de servicios, inicio de sesión y una página de error 404.

Los paneles de Administrador, Operador y Conductor, sus tablas y sus modales son responsive.

---

## Tecnologías utilizadas

| Capa | Tecnologías |
| --- | --- |
| Frontend | HTML5, CSS3, Bootstrap 5.3.3, Bootstrap Icons y JavaScript |
| Backend | Node.js y Express.js |
| Base de datos | PostgreSQL 16 |
| Conexión a la base de datos | pg (pool de conexiones) |
| Autenticación | JWT y bcryptjs |
| Herramientas de desarrollo | Visual Studio Code, Live Server y pgAdmin 4 |
| Control de versiones | Git y GitHub |
| Organización del trabajo | Trello |

---

## Funcionalidades del sistema

- **Sitio público:** página de inicio, carrusel de tres imágenes, presentación de la empresa, servicios e inicio de sesión.
- **Autenticación:** inicio y cierre de sesión mediante JWT.
- **Panel principal:** indicadores de clientes activos, pedidos, vehículos disponibles y estados de envíos.
- **Clientes:** alta, consulta, búsqueda, edición y baja según las reglas de negocio.
- **Tipos de vehículo:** administración del catálogo de tipos.
- **Vehículos:** registro, consulta, edición, capacidad y estado operativo.
- **Conductores:** administración de datos personales, licencias y estado activo/inactivo.
- **Pedidos:** registro de origen, destino, tipo de carga, cantidad, peso y fecha estimada.
- **Envíos y seguimiento:** creación de envíos, asignación de recursos, inicio de viaje, cancelación y consulta del historial.
- **Entregas:** confirmación de recepción, identificación de quien recibe y observaciones.
- **Usuarios:** administración de cuentas, roles y desactivación.
- **Interfaz responsive:** adaptación a computadoras, tablets y celulares.
- **Página 404:** pantalla personalizada para enlaces no disponibles.

### Estados de los envíos

El flujo principal es:

**PENDIENTE → EN_TRANSITO → ENTREGADO**

Un envío `PENDIENTE` también puede pasar a `CANCELADO`.

Los envíos entregados o cancelados no pueden volver a un estado anterior.

---

## Roles y permisos

El sistema cuenta con tres perfiles de usuario.

| Rol | Funciones principales |
| --- | --- |
| ADMINISTRADOR | Administración general, usuarios, catálogos, recursos y operaciones. |
| OPERADOR | Gestión de clientes, pedidos, envíos y seguimiento; consulta de recursos e indicadores. |
| CONDUCTOR | Consulta de sus envíos asignados, inicio de viajes y registro de entregas permitidas. |

Los permisos se verifican desde el backend.

Ocultar botones u opciones en el frontend no reemplaza las validaciones de autorización del servidor.

---

## Estructura actual del proyecto

```text
SistemaTransporteLogistica/
│
├── backend/
│   │
│   ├── controllers/
│   │   └── Controladores de solicitudes HTTP
│   │
│   ├── middleware/
│   │   └── Autenticación, permisos y manejo de errores
│   │
│   ├── routes/
│   │   └── Endpoints de la API REST
│   │
│   ├── scripts/
│   │   └── Scripts de mantenimiento y configuración
│   │
│   ├── services/
│   │   └── Reglas de negocio y consultas SQL
│   │
│   ├── sql/
│   │   └── Material de apoyo de la base de datos
│   │
│   ├── validators/
│   │   └── Validaciones de datos
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── db.js
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   │
│   ├── css/
│   │   ├── estilos.css
│   │   ├── inicio.css
│   │   └── 404.css
│   │
│   ├── img/
│   │   ├── Logo.png
│   │   ├── favicon.png
│   │   │
│   │   └── carrusel/
│   │       ├── slide-1.png
│   │       ├── slide-2.png
│   │       └── slide-3.png
│   │
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── configuracion.js
│   │   └── inicio.js
│   │
│   ├── index.html
│   └── 404.html
│
└── README.md
```

### Descripción de los archivos principales

**Backend**

- `index.js`: configura e inicia el servidor Express.
- `db.js`: administra la conexión con PostgreSQL.
- `routes/`: define las rutas disponibles de la API.
- `controllers/`: recibe solicitudes y genera respuestas HTTP.
- `services/`: contiene las reglas de negocio y operaciones de base de datos.
- `validators/`: verifica los datos recibidos.
- `middleware/`: gestiona autenticación, autorización y errores.
- `scripts/`: contiene utilidades del backend.
- `.env.example`: plantilla de configuración.
- `package.json`: dependencias y comandos del proyecto.

**Frontend**

- `index.html`: página pública, inicio de sesión y paneles administrativos.
- `estilos.css`: estilos generales del sistema.
- `inicio.css`: identidad visual de Tramo, página pública, paneles y estilos responsive.
- `404.css`: diseño de la página de error.
- `api.js`: centraliza las solicitudes HTTP y el token JWT.
- `app.js`: controla sesiones, vistas, formularios y operaciones.
- `configuracion.js`: contiene la URL de la API, roles, estados y módulos.
- `inicio.js`: administra la navegación entre Inicio e Ingresar.
- `Logo.png`: logo oficial de Tramo.
- `favicon.png`: ícono del navegador.
- `carrusel/`: imágenes de presentación del sitio.

**Importante:** el archivo `backend/.env` contiene configuración privada y no debe publicarse en GitHub.

La carpeta `node_modules/` se genera automáticamente al instalar las dependencias.

---

## Requisitos previos

Para ejecutar Tramo localmente se necesita:

1. Node.js y npm instalados.
2. PostgreSQL instalado y en funcionamiento.
3. pgAdmin 4 o una herramienta similar.
4. Visual Studio Code.
5. Extensión Live Server.
6. Un navegador actualizado.

---

## Instalación y ejecución local

### 1. Obtener el proyecto

Clonar el repositorio desde GitHub:

```bash
git clone https://github.com/Miskevish/SistemaTransporteLogistica.git
```

Ingresar a la carpeta:

```bash
cd SistemaTransporteLogistica
```

También es posible descargar el repositorio como ZIP y descomprimirlo.

### 2. Configurar PostgreSQL

Abrir pgAdmin 4 y crear una base de datos llamada:

```sql
CREATE DATABASE transporte_logistica;
```

La base de datos utiliza nueve tablas:

1. cliente
2. pedido
3. envio
4. tipo_vehiculo
5. vehiculo
6. conductor
7. entrega
8. estado_envio
9. usuario

Las tablas mantienen relaciones mediante claves primarias y foráneas.

Para una instalación desde cero es necesario contar con el script SQL correspondiente a la estructura de la base de datos.

El material disponible en `backend/sql/` debe revisarse antes de realizar una instalación nueva, ya que la copia examinada no incluye un script completo para reconstruir automáticamente las nueve tablas.

### 3. Instalar las dependencias del backend

Abrir una terminal e ingresar a la carpeta:

```bash
cd backend
```

Instalar las dependencias:

```bash
npm install
```

Este comando instalará las bibliotecas indicadas en `package.json`.

### 4. Configurar las variables de entorno

Crear el archivo `.env` dentro de `backend/`.

Utilizar `.env.example` como referencia.

Ejemplo:

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

Los valores anteriores son ejemplos.

**Nunca publicar contraseñas reales, secretos JWT ni archivos `.env` en GitHub.**

### 5. Iniciar el backend

Desde la carpeta `backend/` ejecutar:

```bash
npm start
```

También se puede utilizar:

```bash
node index.js
```

Con la configuración local utilizada, el servidor estará disponible en:

```text
http://localhost:3000
```

Para verificar su funcionamiento:

```text
http://localhost:3000/api/salud
```

### 6. Iniciar el frontend

Abrir el proyecto en Visual Studio Code.

Buscar:

```text
frontend/index.html
```

Hacer clic derecho y seleccionar:

**Open with Live Server**

La dirección utilizada durante el desarrollo es:

```text
http://127.0.0.1:5500/frontend/index.html
```

En `frontend/js/configuracion.js` se establece la dirección de la API:

```javascript
const API_BASE = "http://localhost:3000/api";
```

Si se cambia la dirección del servidor o el puerto del frontend, también debe revisarse la configuración de CORS.

### 7. Iniciar sesión

Ingresar a la página principal de Tramo.

Seleccionar **Ingresar**.

Completar:

- Nombre de usuario.
- Contraseña.

Presionar **Iniciar sesión**.

El sistema verificará las credenciales y mostrará el panel correspondiente al rol del usuario.

---

## API REST

El backend expone una API REST con el prefijo:

```text
/api
```

### Endpoints principales

| Módulo | Ruta | Funcionalidad |
| --- | --- | --- |
| Autenticación | `/api/auth` | Inicio de sesión y perfil |
| Clientes | `/api/clientes` | Gestión de clientes |
| Tipos de vehículo | `/api/tipos-vehiculo` | Catálogo de tipos |
| Vehículos | `/api/vehiculos` | Gestión de flota |
| Conductores | `/api/conductores` | Gestión de conductores |
| Pedidos | `/api/pedidos` | Gestión de pedidos |
| Envíos | `/api/envios` | Creación y seguimiento |
| Usuarios | `/api/usuarios` | Administración de cuentas |
| Reportes | `/api/reportes/resumen` | Indicadores operativos |
| Salud | `/api/salud` | Estado del servidor |

### Métodos HTTP utilizados

- `GET`: consultar información.
- `POST`: registrar nuevos datos.
- `PUT`: actualizar registros.
- `PATCH`: modificar parcialmente un recurso.
- `DELETE`: eliminar o desactivar registros según las reglas del sistema.

### Endpoints de envíos

```http
GET    /api/envios
GET    /api/envios/:id
POST   /api/envios
PATCH  /api/envios/:id/estado
GET    /api/envios/:id/historial
POST   /api/envios/:id/entrega
```

### Autenticación mediante JWT

Las rutas protegidas requieren un token de autenticación.

Ejemplo de encabezado:

```http
Authorization: Bearer TOKEN_JWT
```

El backend comprueba la validez del token y los permisos del usuario.

---

## Reglas de negocio

El sistema aplica reglas que permiten mantener la integridad de las operaciones.

1. Solo se pueden asignar vehículos disponibles.
2. Los conductores deben estar activos.
3. No se permiten asignaciones simultáneas incompatibles.
4. La capacidad del vehículo debe ser suficiente para transportar la carga.
5. Los envíos deben seguir las transiciones de estado permitidas.
6. No se puede entregar un envío pendiente o cancelado.
7. Los registros deben cumplir con las validaciones obligatorias.
8. Los movimientos deben conservarse en el historial de estados.

---

## Seguridad

Tramo implementa diferentes mecanismos de seguridad:

- Contraseñas protegidas mediante bcryptjs.
- Autenticación con JWT.
- Control de acceso basado en roles.
- Validaciones en frontend y backend.
- Consultas SQL parametrizadas.
- Variables de entorno para información privada.
- Manejo de errores HTTP.

Las operaciones protegidas requieren autenticación y autorización.

---

## Flujo de funcionamiento

El recorrido principal de una operación de transporte es el siguiente:

### 1. Registrar un cliente

Un usuario autorizado ingresa los datos del cliente y guarda el registro.

### 2. Crear un pedido

Se registran los datos del transporte:

- Cliente.
- Origen.
- Destino.
- Tipo de carga.
- Cantidad.
- Peso.
- Fecha estimada.

### 3. Crear un envío

Se seleccionan:

- Pedido.
- Vehículo.
- Conductor.
- Fecha estimada de llegada.

El backend valida que los recursos puedan utilizarse.

### 4. Iniciar el envío

El envío comienza en estado:

`PENDIENTE`

Cuando se inicia el viaje cambia a:

`EN_TRANSITO`

### 5. Registrar la entrega

Al confirmar la recepción, el envío pasa a:

`ENTREGADO`

### 6. Consultar el historial

El sistema permite revisar los cambios de estado y los movimientos realizados.

---

## Interfaz e identidad visual

Tramo utiliza una identidad visual basada en tres colores corporativos:

| Color | Código |
| --- | --- |
| Grafito | `#20252B` |
| Arena tostada | `#A88351` |
| Blanco hueso | `#FAF7F5` |

La tipografía utilizada es **Montserrat**.

### Página pública

El sitio presenta:

- Barra de navegación con el logo oficial.
- Carrusel de tres imágenes.
- Presentación de la empresa.
- Sección de servicios.
- Formulario de inicio de sesión.
- Pie de página con información y redes sociales.

### Paneles de gestión

Los paneles incluyen:

- Cabecera personalizada con logo y usuario.
- Menú lateral de navegación.
- Indicadores de operaciones.
- Tablas de registros.
- Filtros y búsquedas.
- Botones de acciones.
- Formularios modales.
- Ventanas de detalles.

### Diseño responsive

La interfaz se adapta a:

- Computadoras.
- Tablets.
- Celulares.

En pantallas pequeñas, el menú lateral se puede desplegar mediante un botón hamburguesa.

Los formularios y modales también se adaptan al tamaño de la pantalla.

### Colores de las acciones

- **Azul:** iniciar un envío.
- **Verde:** registrar una entrega.
- **Rojo:** cancelar, eliminar, retirar o desactivar.
- **Grafito y arena:** acciones generales y elementos de la marca.

---

## Gestión del proyecto

### GitHub

Repositorio del proyecto:

https://github.com/Miskevish/SistemaTransporteLogistica

El desarrollo utiliza Git para registrar cambios y GitHub para mantener el repositorio compartido.

Se utilizaron las ramas:

- `dev`: desarrollo y modificaciones.
- `main`: integración de cambios.

La incorporación de nuevas funcionalidades se realiza mediante commits y pull requests.

### Trello

Tablero de organización:

https://trello.com/b/zyWuCG45

Se utiliza para organizar tareas y seguir el avance del trabajo.

---

## Consideraciones finales

Tramo fue desarrollado como proyecto académico para la asignatura Taller Integrador II.

La aplicación funciona en un entorno local con frontend, backend y base de datos PostgreSQL.

Para una implementación pública se recomienda incorporar:

- Configuración de producción.
- HTTPS.
- Gestión segura de credenciales.
- Scripts o migraciones de base de datos.
- Pruebas automatizadas.

---

**Taller Integrador II — TRAMO, Sistema de Transporte y Logística.**
