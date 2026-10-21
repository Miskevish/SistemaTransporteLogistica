# Frontend — Sistema de Transporte y Logística

Interfaz desarrollada con HTML, CSS, Bootstrap y JavaScript, para el backend Node.js + Express del trabajo de Taller Integrador II.

## Cómo instalarlo

1. Copiá el contenido de esta carpeta `frontend` a `SistemaTransporteLogistica/frontend`. No reemplaces ni modifiques el backend ni `.env`.
2. Arrancá el backend en CMD desde `SistemaTransporteLogistica/backend` con `npm start`.
3. En Visual Studio Code instalá la extensión **Live Server** (Ritwick Dey), si todavía no la tenés.
4. Abrí `frontend/index.html` y elegí **Open with Live Server**. Es importante usar `http://127.0.0.1:5500` o `http://localhost:5500`, y no abrir el HTML directamente como `file://`.
5. Iniciá sesión con el administrador creado en el backend.

## Conexión

El archivo `js/configuracion.js` contiene `API_BASE = "http://localhost:3000/api"`, que coincide con las rutas del backend actual. Si cambiás el puerto del backend, ajustá ese valor. El backend permite los orígenes 5500 indicados en sus opciones de CORS.

## Pantallas incluidas

- Inicio de sesión con roles.
- Panel de indicadores.
- CRUD de clientes, tipos de vehículo, vehículos, conductores y pedidos.
- Gestión de usuarios (solo administrador).
- Creación de envíos, seguimiento de estados, historial y registro de entrega.
- Búsqueda y filtrado en tablas, mensajes y confirmación de acciones.

## Notas sobre los permisos

El backend determina qué puede hacer cada usuario. La interfaz oculta opciones que no corresponden al rol, pero la validación de permisos se hace en el servidor.

## Pruebas sugeridas

1. Iniciar sesión como administrador.
2. Registrar un tipo de vehículo, un vehículo disponible y un conductor activo.
3. Registrar un cliente y crear su pedido.
4. Crear un envío seleccionando pedido, vehículo y conductor.
5. Pasarlo de PENDIENTE a EN_TRANSITO y confirmar su entrega.
6. Revisar el historial y el dashboard.
7. Ingresar con un operador y con un conductor para comprobar los permisos.

Estas pantallas están conectadas a las rutas revisadas del backend, pero todavía necesitan una prueba integral en tu computadora con datos reales de prueba. No se modificó el backend ni la base de datos.

## Seguridad

No se guarda la contraseña del administrador en el frontend. El token de sesión se conserva temporalmente en `sessionStorage` para este prototipo académico; para un despliegue público conviene endurecer la gestión de sesiones y configuración de CORS.
