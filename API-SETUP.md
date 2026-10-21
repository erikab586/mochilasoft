# Backend Node.js para prospectos

El formulario de la landing se envía al endpoint `POST /api/prospectos`. La API está implementada en Node.js/Express y guarda los prospectos en PostgreSQL (`bd_mochilasoft.public.prospecto`).

## Requisitos

- Node.js 20 o superior.
- PostgreSQL accesible en `127.0.0.1:5432`.
- La base `bd_mochilasoft` y credenciales PostgreSQL válidas.

## Configuración inicial

1. Copia `.env.example` a `.env` y completa `DB_PASSWORD`. La contraseña solo debe existir en `.env` o en el entorno del proceso; `.env` está excluido de Git.
2. Verifica los valores `DB_HOST`, `DB_PORT`, `DB_NAME` y `DB_USER`.
3. Ejecuta `npm run db:setup` para crear las tablas de prospectos y administración e índices si aún no existen.
4. Crea una cuenta independiente para cada persona con `npm run admin:create`. El usuario puede ser un nombre o un correo electrónico de hasta 64 caracteres. El comando solicita usuario y contraseña de forma interactiva; utiliza una contraseña diferente y segura de al menos 12 caracteres para cada cuenta. Repite el comando para crear la segunda cuenta. Las contraseñas se almacenan como hashes con salt y no se guardan en `.env`.
5. Inicia el proyecto con `npm run dev`. Este comando levanta el backend Node.js (con reinicio automático) y Vite en paralelo; Vite reenvía `/api` a `http://127.0.0.1:3001`. Si el puerto 5173 ya está ocupado, detén la instancia anterior antes de iniciar el comando para evitar usar otra versión del frontend.
   - Para iniciar solo el backend: `npm run api:dev` (reinicio automático) o `npm run api`.
   - Para iniciar solo el frontend: `npm run dev:frontend`.
6. Abre `http://localhost:5173/admin` e inicia sesión con una de las cuentas. El panel permite buscar solicitudes, revisar datos de contacto y descargar adjuntos. La sesión se guarda en una cookie `HttpOnly` y expira a las 12 horas.
7. Verifica la API y su conexión con PostgreSQL en `http://127.0.0.1:3001/api/health`.

Para producción, inicia `npm run api` como servicio de Node.js y sirve el frontend generado por `npm run build` bajo el mismo origen de la API para mantener las cookies de sesión seguras. El frontend usa `/api/prospectos` por defecto; si la API tiene otro origen, establece `VITE_API_URL` antes de compilar y agrega el origen del frontend a `MOCHILASOFT_ALLOWED_ORIGINS`. Usa HTTPS en producción para que la cookie de administración se marque como `Secure`.

## Archivos adjuntos

Los adjuntos son opcionales: PDF/JPG/PNG/WebP hasta 5 MB. Node verifica la firma del archivo, crea un nombre aleatorio y lo guarda en `api/private_uploads/prospectos`. La API nunca expone ese directorio como contenido estático; la tabla guarda el nombre original y el nombre interno. En producción, restringe el acceso al directorio en el servidor web y aplica permisos de escritura solo al usuario que ejecuta Node.

## Pruebas

- `npm test`: pruebas unitarias de campos obligatorios, formato de teléfono, email, longitudes y firmas de archivos.
- `npm run build`: compilación de producción del frontend.
