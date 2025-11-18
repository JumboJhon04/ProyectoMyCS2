
# Contributing (Guía de contribución)

Gracias por ayudar a mejorar ProyectoMyCS2. Aquí hay instrucciones claras para dos perfiles diferentes:

- Contribuidores externos (quieres contribuir con código)
- No-contribuidores / usuarios (quieres reportar bugs o pedir features)

IMPORTANTE: Las ramas `main` y `develop` están protegidas. Todos los cambios deben llegar mediante Pull Requests (PRs).

1) Resumen rápido (si ya conoces Git)

- Crea una rama a partir de `develop`:
  - `git checkout develop`
  - `git pull origin develop`
  - `git checkout -b feature/<tu-descripcion>`
- Implementa cambios, haz commits atómicos y con mensajes claros (ver Conv. Commits más abajo).
- Push y abre un PR hacia `develop`.

2) Flujo para contribuyentes (paso a paso)

- A) Crear rama
  - Nombres sugeridos: `feature/`, `fix/`, `hotfix/`, `chore/`.

- B) Trabajar localmente
  - Instala dependencias y ejecuta la app localmente.
  - Añade tests cuando corresponda.
  - Corre linter y formatea (si aplica).

- C) Commits
  - Usa Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
  - Mantén commits pequeños y con mensaje claro.

- D) Abrir Pull Request
  - Destino: `develop` (salvo que se indique otra rama en el issue).
  - Título: claro y corto. Ej: `feat(auth): login con OTP`.
  - Descripción: explica qué cambia, por qué, y cómo probarlo.
  - Añade checklist en la descripción del PR (ver plantilla incluida).

- E) Revisión y merge
  - Al menos 1 revisor debe aprobar.
  - CI debe pasar (tests / lint).
  - Responder y resolver comentarios de revisión.
  - No se permite merge sin aprobación y CI exitoso.

3) Flujo para no-contribuidores (reportar bugs o solicitar features)

- A) Abrir un issue
  - Elige label `bug` o `enhancement`.
  - Proporciona: pasos para reproducir, entorno, capturas/console logs, expected vs actual.

- B) Participación del equipo
  - Un mantenedor responderá y, si es necesario, asignará o transformará el issue en una tarea/PR.

4) Plantilla y contenido mínimo del PR

Tu PR debe incluir al menos:

- Resumen: qué y por qué.
- Cambios clave (lista corta).
- Cómo probar (pasos concretos).
- Checklist:
  - [ ] Compila y corre localmente
  - [ ] Pruebas/linters ejecutados
  - [ ] Documentación actualizada (si aplica)
  - [ ] No se exponen secrets

5) Formato de commits (Conv. Commits)

- Ejemplos:
  - `feat(events): agregar endpoint para inscripciones`
  - `fix(auth): manejar error 401 en login`
  - `docs: actualizar README con ejemplos curl`

6) Revisión de PR (qué revisar)

- Funcionalidad: hace lo que promete?
- Seguridad: no filtra credenciales ni datos sensibles?
- Calidad: claridad, legibilidad, complejidad adecuada.
- Tests: se añadieron/actualizaron tests cuando corresponde.

7) Configuración local (rápida)

```powershell
git clone <repo-url>
cd ProyectoMyCS2

# Backend
cd backend
npm install
cp .env.example .env  # si existe, editar con credenciales

# Frontend (desde la raíz)
cd ..
npm install
```

8) Base de datos

- Importa `uta_fisei_eventosconfig.sql` como se indica en el README.

9) Seguridad y datos sensibles

- Nunca subir credenciales ni tokens.
- Usa `.env` y añade `.env` a `.gitignore`.

10) Qué hacer si no conoces Git/GitHub

- Abre un issue explicando lo que quieres cambiar y pide que un miembro del equipo cree la rama/PR si prefieres.

11) Plantilla de PR (archivo .github/PULL_REQUEST_TEMPLATE.md)

- Hemos añadido una plantilla automática para PRs. Asegúrate de completarla.

12) Contacto y soporte

- Para preguntas sobre el flujo, abre un issue con etiqueta `question`.

Gracias por contribuir — tu trabajo mejora el proyecto.

## Forks (para colaboradores sin permisos de escritura)

Si no tienes permisos de escritura en este repositorio, el flujo recomendado es usar un *fork* y abrir Pull Requests desde tu fork hacia `develop`.

Pasos rápidos (fork → PR):

1. Haz fork del repositorio desde la interfaz de GitHub (botón "Fork").
2. Clona tu fork localmente:

```powershell
git clone https://github.com/<tu-usuario>/ProyectoMyCS2.git
cd ProyectoMyCS2
```

3. Sincroniza con el repo upstream y crea una rama a partir de `develop`:

```powershell
git remote add upstream https://github.com/JumboJhon04/ProyectoMyCS2.git
git fetch upstream
git checkout -b feature/tu-cambio upstream/develop
```

4. Haz tus cambios, commits y push a tu fork:

```powershell
git add .
git commit -m "feat: descripción corta"
git push origin feature/tu-cambio
```

5. Abre un Pull Request en GitHub: desde tu fork/branch hacia `JumboJhon04/ProyectoMyCS2:develop`.

Buenas prácticas y notas:

- Activa "Allow edits from maintainers" en el PR para que el equipo pueda hacer pequeños fixes si es necesario.
- Si tu PR necesita que CI use secretos, ten en cuenta que los workflows pueden no tener acceso a secretos desde forks; el equipo puede crear un branch temporal en el repo para ejecutar workflows con secretos si es estrictamente necesario.
- Incluye la plantilla de PR y la checklist como en las instrucciones generales.

Si quieres, creo ahora las plantillas automáticas en `.github/` para PRs y issues (bug/feature). Esto guiará aún más a los contribuidores.

