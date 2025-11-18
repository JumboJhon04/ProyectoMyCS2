# ProyectoMyCS2

Descripción
------------
ProyectoMyCS2 es una plataforma web para la gestión de eventos y cursos académicos. Incluye:

- Frontend: React (Create React App)
- Backend: Node.js + Express
- Base de datos: MySQL / MariaDB
- Funcionalidades: autenticación, roles (ADMIN, DOCENTE, ESTUDIANTE, RESPONSABLE), gestión de eventos, inscripciones, pagos y recursos multimedia.

Badges (opcional)
-------------------
- Estado: Trabajo en progreso
- Ramas protegidas: `main`, `develop` (merge sólo vía Pull Request)

Estructura del repositorio
---------------------------

- `/backend` — API Node/Express
  - `src/app.js` — configuración del servidor y registro de rutas
  - `src/controllers` — lógica de negocio (endpoints)
  - `src/routes` — definición de rutas
  - `src/config` — configuración (p. ej. `database.js`)
  - `uploads/` — archivos subidos (imágenes, comprobantes)
- `/src` — frontend React (componentes, páginas, contexto)
- `uta_fisei_eventosconfig.sql` — dump de la base de datos (esquema y datos de ejemplo)

Requisitos
----------

- Node.js >= 14

# ProyectoMyCS2

ProyectoMyCS2 es una aplicación para gestionar eventos académicos (organizados por docentes, con inscripciones de estudiantes).

**Objetivo**: una base para gestionar eventos, inscripciones y usuarios (estudiantes, docentes, responsables y administradores).

---

**Estado actual**: el backend expone endpoints REST conectados a una base MySQL usando el dump `uta_fisei_eventosconfig.sql`. El frontend consume esos endpoints para mostrar eventos reales y permitir inscripciones.

**Tecnologías**: Node.js, Express, MySQL (mysql2), React (Create React App).

---

**Instalación rápida (Windows, PowerShell)**

1) Clona el repositorio

```powershell
git clone <repo-url>
cd ProyectoMyCS2
```

2) Backend

```powershell
cd backend
npm install
```

- Crea un archivo `.env` (puedes copiar `.env.example` si existe) y configura:
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (por defecto `uta_fisei_eventosconfig`), `DB_PORT`.

3) Frontend

```powershell
cd ..
npm install
```

4) Importar base de datos (opcional pero recomendado)

```powershell
mysql -u root -p
CREATE DATABASE uta_fisei_eventosconfig CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
exit
mysql -u root -p uta_fisei_eventosconfig < .\uta_fisei_eventosconfig.sql
```

5) Ejecutar la aplicación

```powershell
# Terminal 1: backend
cd backend; npm run dev

# Terminal 2: frontend
cd ..; npm start
```

---

**Rutas principales (resumen)**

- `GET /api/eventos` — lista de todos los eventos.
- `GET /api/estudiantes/:id/eventos` — eventos en los que el estudiante está inscrito.
- `POST /api/estudiantes/:id/inscribir` — crear una inscripción para el estudiante (body: `{ eventoId: number }`).
- `GET /api/docentes/:id/eventos` — eventos dictados por el docente.

Para detalles adicionales revisa los controladores en `backend/src/controllers`.

---

**Cómo probar rápidamente (curl / PowerShell)**

- Obtener eventos:

```powershell
curl http://localhost:5000/api/eventos
```

- Obtener los eventos de un estudiante (ejemplo id=3):

```powershell
curl http://localhost:5000/api/estudiantes/3/eventos
```

- Inscribir un estudiante en un evento (id estudiante=3, eventoId en body):

```powershell
curl -X POST http://localhost:5000/api/estudiantes/3/inscribir -H "Content-Type: application/json" -d '{"eventoId": 7}'
```

---

**Notas y recomendaciones**

- Asegúrate de que el `user` en el frontend tenga `id` en `localStorage` para que las páginas de estudiante y docente carguen datos específicos.
- El flujo de inscripciones crea una fila en `inscripcion`. Actualmente el estado inicial se marca como `ACE` por simplicidad; ajusta según reglas del proyecto.
- Para desarrollo es útil tener la base de datos cargada con los datos del dump para ver el comportamiento real.

---

Si quieres, puedo:

- Añadir una plantilla de Pull Request en `.github/PULL_REQUEST_TEMPLATE.md`.
- Crear un ejemplo básico de workflow de GitHub Actions para ejecutar linter/tests antes del merge.
- Ejecutar comprobaciones y pruebas si inicias el servidor local y me das permiso para ejecutar comandos.


- Frontend: crea un `.env` en la raíz del frontend si lo necesitas:

```
REACT_APP_API_URL=http://localhost:5000
```

4. Instala dependencias y arranca los servicios

```powershell
# Backend
cd backend
npm install
npm run start

# Frontend (nuevo terminal, desde la raíz del repo)
cd ..
npm install
npm start
```

Endpoints principales (resumen y ejemplos)
-----------------------------------------

Autenticación

- POST /api/auth/register — Registrar usuario
- POST /api/auth/login — Iniciar sesión

Ejemplo curl (login):

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@uta.edu.ec","contrasena":"tuPassword"}'
```

Eventos

- GET /api/eventos — Listar eventos
- GET /api/eventos/:id — Detalle de evento

Estudiantes

- GET /api/estudiantes — Listar estudiantes
- GET /api/estudiantes/:id — Detalle de estudiante
- GET /api/estudiantes/:id/eventos — Eventos donde está inscrito
- POST /api/estudiantes/:id/inscribir — Inscribirse a un evento

Docentes

- GET /api/docentes — Listar docentes
- GET /api/docentes/:id — Detalle docente
- GET /api/docentes/:id/eventos — Eventos asociados (organizador)

Notas sobre datos reales
------------------------

- El frontend ahora consume datos reales del backend para páginas de Estudiante y Docente.
- Para que las páginas personales funcionen correctamente, el `login` debe guardar en `localStorage` un objeto `user` que incluya `id` (SECUENCIAL en la tabla `usuario`).

Contribuir
----------

Lee `CONTRIBUTING.md` para el flujo completo de contribución (contribuidores, no-contribuidores, plantillas de PR y reglas de ramas protegidas).

Soporte
-------

Si tienes problemas con la instalación o con la base de datos, abre un issue describiendo:

- Qué intentaste (comandos)
- Salida/errores relevantes
- Qué esperabas que sucediera

Licencia
--------

Incluye aquí la licencia del proyecto si aplica (MIT, Apache-2.0, etc.).

Proyecto segundo parcial de MyCS.
