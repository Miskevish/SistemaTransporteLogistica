TRAMO — Sistema de Transporte y Logística
Trabajo Práctico Integral — Taller Integrador II

Integrantes: Nicolás José Miskevish · Ana Paula Soler · Braiton Juárez Isa
Descripción
Tramo es una aplicación web para gestionar las operaciones de una empresa de transporte y logística. Centraliza clientes, pedidos, vehículos, conductores, envíos y entregas, e incorpora autenticación, permisos por rol, historial de estados e indicadores operativos.

El proyecto utiliza una arquitectura cliente-servidor: el frontend se comunica mediante HTTP/JSON con una API REST construida con Node.js y Express; los servicios aplican las reglas de negocio y almacenan la información en PostgreSQL.

La aplicación incluye una página pública con identidad visual de Tramo, carrusel informativo, sección de servicios, acceso al sistema y página de error 404. Los paneles de Administrador, Operador y Conductor, sus tablas y sus modales son responsive.
Tecnologías
Capa	Tecnologías
Frontend	HTML5, CSS3, Bootstrap 5.3.3, Bootstrap Icons y JavaScript puro
Backend	Node.js y Express.js
Base de datos	PostgreSQL 16
Acceso a la base de datos	pg (pool de conexiones)
Autenticación	JWT y bcryptjs
Herramientas	Visual Studio Code, Live Server y pgAdmin 4
Control de versiones	Git y GitHub
Organización	Trello


Funcionalidades
- Sitio público: página de inicio, carrusel de tres imágenes, presentación de la empresa, servicios, inicio de sesión y página 404.
- Autenticación: ingreso, cierre de sesión, JWT y autorización por rol.
- Panel principal: indicadores de clientes, pedidos, vehículos disponibles y envíos.
- Clientes: alta, consulta, búsqueda, edición y baja según reglas de negocio.
- Tipos de vehículo: catálogo y operaciones autorizadas.
- Vehículos: datos de la flota, capacidad, disponibilidad y estados operativos.
- Conductores: datos personales, licencias, estado y asignación.
- Pedidos: origen, destino, carga, peso, cantidad y fecha estimada.
- Envíos y seguimiento: asignación de pedido, vehículo y conductor; inicio, cancelación, entrega e historial.
- Entregas: datos del receptor, resultado y observaciones.
- Usuarios: gestión de cuentas, roles y desactivación.
- Diseño responsive: navegación adaptable, tablas desplazables y modales de creación, edición y detalles adaptados a PC, tablet y celular.
Estados de los envíos
PENDIENTE → EN_TRANSITO → ENTREGADO

Un envío PENDIENTE también puede pasar a CANCELADO. Los estados finales no vuelven a estados anteriores.
Roles y permisos
Rol	Funciones principales
ADMINISTRADOR	Administración general, usuarios, catálogos, recursos y operaciones.
OPERADOR	Gestión de clientes, pedidos, envíos y seguimiento; consulta de recursos e indicadores.
CONDUCTOR	Consulta de sus envíos asignados, inicio de viajes y registro de entregas permitidas.


Los permisos se verifican en el backend. Ocultar botones en la interfaz no reemplaza esa autorización.
Estructura actual del proyecto
SistemaTransporteLogistica/
├── backend/
│   ├── controllers/           # Controladores de solicitudes HTTP
│   ├── middleware/            # Autenticación y manejo de errores
│   ├── routes/                # Endpoints de la API REST
│   ├── scripts/               # Comprobación de sintaxis y creación de admin
│   ├── services/              # Reglas de negocio y consultas SQL
│   ├── sql/                   # Material de apoyo de la base de datos
│   ├── validators/            # Validación de entradas
│   ├── .env.example           # Plantilla de variables de entorno
│   ├── .gitignore
│   ├── db.js                  # Conexión y pool de PostgreSQL
│   ├── index.js               # Configuración y arranque de Express
│   ├── package.json          # Dependencias y comandos npm
│   └── package-lock.json      # Versiones resueltas de dependencias
├── frontend/
│   ├── css/
│   │   ├── estilos.css        # Estilos base del sistema
│   │   ├── inicio.css         # Sitio público, marca y paneles responsive
│   │   └── 404.css            # Página de error
│   ├── img/
│   │   ├── Logo.png           # Logo oficial de Tramo
│   │   ├── favicon.png        # Ícono de la página
│   │   └── carrusel/
│   │       ├── slide-1.png
│   │       ├── slide-2.png
│   │       └── slide-3.png
│   ├── js/
│   │   ├── configuracion.js   # API_BASE, roles, estados y módulos
│   │   ├── api.js             # Peticiones Fetch y token JWT
│   │   ├── app.js             # Sesión y lógica de los paneles
│   │   └── inicio.js          # Navegación de la página pública
│   ├── index.html             # Sitio público, login y paneles
│   └── 404.html               # Página para enlaces no disponibles
└── README.md
backend/.env es un archivo local y privado: puede existir en tu computadora, pero no debe subirse a GitHub. La carpeta node_modules/ se genera con npm install y no forma parte del código fuente.

Requisitos previos
- Node.js y npm instalados.
- PostgreSQL instalado y en ejecución.
- pgAdmin 4 (o un cliente SQL equivalente).
- Navegador actualizado.
- Visual Studio Code con la extensión Live Server (recomendado).
Instalación y ejecución local
1. Obtener el proyecto
Clonar el repositorio:
git clone https://github.com/Miskevish/SistemaTransporteLogistica.git
cd SistemaTransporteLogistica
O descargarlo como ZIP desde GitHub y descomprimirlo.
2. Configurar PostgreSQL
Crear la base de datos:
CREATE DATABASE transporte_logistica;
El modelo relacional contiene nueve tablas: cliente, pedido, envio, tipo_vehiculo, vehiculo, conductor, entrega, estado_envio y usuario.

Importante: verificar el material de backend/sql/ y contar con el script SQL de creación y datos iniciales correspondiente a la versión de base utilizada antes de intentar instalar el sistema desde cero. En la copia del backend revisada, esa carpeta contiene una nota, pero no un script SQL completo para reconstruir automáticamente las nueve tablas.
3. Instalar y configurar el backend
Abrir una terminal en backend/ y ejecutar:
cd backend
npm install
Crear backend/.env utilizando backend/.env.example como guía. Ejemplo de configuración sin credenciales reales:
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transporte_logistica
DB_USER=postgres
DB_PASSWORD=REEMPLAZAR_CON_CONTRASENA_LOCAL
JWT_SECRET=REEMPLAZAR_CON_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
No subir .env, contraseñas, tokens ni claves JWT al repositorio.

Iniciar el backend:
npm start
También puede ejecutarse node index.js. La API utiliza http://localhost:3000/api con la configuración anterior.

Comprobar el servicio en:
http://localhost:3000/api/salud
4. Ejecutar el frontend
Abrir frontend/index.html con Live Server desde VS Code. En el entorno usado durante el desarrollo:
http://127.0.0.1:5500/frontend/index.html
El frontend consulta la dirección establecida en frontend/js/configuracion.js:
const API_BASE = "http://localhost:3000/api";
Si cambia el puerto o dominio, actualizar API_BASE y los orígenes permitidos en CORS_ORIGIN.
5. Acceder al sistema
Desde la página pública, elegir Ingresar y utilizar una cuenta activa. Las contraseñas se verifican frente a hashes almacenados; no deben guardarse en texto plano.
API REST
Las rutas usan el prefijo /api.
Módulo	Ruta principal	Operaciones
Autenticación	/api/auth	Login y perfil
Clientes	/api/clientes	Consulta, creación, edición y baja
Tipos de vehículo	/api/tipos-vehiculo	CRUD según permisos
Vehículos	/api/vehiculos	Consulta, creación, edición y retiro según reglas
Conductores	/api/conductores	Consulta, creación, edición y baja
Pedidos	/api/pedidos	CRUD según asociaciones
Envíos	/api/envios	Consulta, creación, estado, historial y entrega
Usuarios	/api/usuarios	Gestión y desactivación
Reportes	/api/reportes/resumen	Indicadores operativos
Salud	/api/salud	Comprobación del servidor


Rutas destacadas de envíos
GET    /api/envios
GET    /api/envios/:id
POST   /api/envios
PATCH  /api/envios/:id/estado
GET    /api/envios/:id/historial
POST   /api/envios/:id/entrega
Las rutas protegidas utilizan:
Authorization: Bearer TOKEN_JWT
Reglas de negocio principales
1. No asignar vehículos que no estén disponibles.
2. No asignar conductores inactivos.
3. Evitar asignaciones simultáneas incompatibles de vehículos y conductores.
4. Respetar las transiciones de estado permitidas.
5. No registrar entregas de envíos cancelados ni pendientes.
6. Comprobar que la capacidad del vehículo alcance para el peso de la carga.
7. Validar campos, referencias, formatos y fechas antes de guardar.
8. Mantener el historial de estados para asegurar trazabilidad.
Seguridad y validaciones
- Contraseñas verificadas mediante bcryptjs.
- JWT para autenticar solicitudes.
- Middleware de autenticación y control de roles.
- Validaciones del frontend y del backend.
- Consultas SQL parametrizadas mediante pg.
- Configuración privada en variables de entorno.
Flujo de uso
1. Un usuario autorizado registra un cliente.
2. Registra un pedido con origen, destino y datos de la carga.
3. Crea un envío, eligiendo pedido, vehículo disponible, conductor activo y fecha prevista.
4. El envío comienza en PENDIENTE.
5. Al iniciar el viaje, cambia a EN_TRANSITO.
6. Al registrar la entrega, pasa a ENTREGADO.
7. Se puede consultar el historial de estados y movimientos.
Interfaz e identidad visual
La marca Tramo utiliza grafito (#20252B), arena tostada (#A88351) y blanco hueso (#FAF7F5), con tipografía Montserrat. El diseño diferencia las acciones de riesgo (rojo), inicio de envíos (azul) y entregas (verde).

La web pública incorpora tres diapositivas de carrusel, presentación institucional, servicios y pie con enlaces informativos. Los paneles muestran navegación lateral adaptable y modales de creación, edición y consulta optimizados para pantallas pequeñas.
Gestión del proyecto
- Repositorio: https://github.com/Miskevish/SistemaTransporteLogistica
- Tablero de Trello: https://trello.com/b/zyWuCG45
El equipo trabajó con ramas dev y main y utilizó pull requests para integrar cambios a main.
Consideraciones
Tramo es un desarrollo académico ejecutado localmente. Para un despliegue público se recomienda configurar HTTPS, gestionar los secretos de forma segura, preparar migraciones o scripts de instalación de la base de datos y contar con pruebas automatizadas.
Taller Integrador II — TRAMO, Sistema de Transporte y Logística.
