# Smile and Health – Sistema de gestión odontológica

Agenda, pacientes, odontograma FDI, notas de evolución (NOM-004-SSA3-2012) y consentimientos con firma digital.
Es una aplicación web estática (HTML + CSS + JavaScript) con **dos modos de funcionamiento**:

| | Modo demo (por defecto) | Modo servidor (Supabase) |
|---|---|---|
| Datos | En el navegador (`localStorage`) | En PostgreSQL, compartidos entre equipos |
| Inicio de sesión | No hay | Sí (correo y contraseña) |
| Roles | Selector de rol en la cabecera (solo para demostrar) | Impuestos por el servidor (admin / odontólogo / recepcionista) |
| Notas de evolución | Hash simulado, editable desde el navegador | Selladas e **inmutables** en el servidor, con hash SHA-256 real |
| Auditoría | Local | En servidor, sin posibilidad de editar o borrar |
| Cómo se activa | `js/config.js` vacío | Poner URL y clave en `js/config.js` |

## Estructura

```
index.html
css/styles.css
js/
  config.js          ← aquí se activa el modo servidor
  data.js            ← datos de demostración y catálogos
  store.js           ← estado, persistencia y permisos
  remote.js          ← conexión con Supabase y pantalla de login
  app.js
  components/        ← agenda, pacientes, odontograma, notas, consentimientos, firma
supabase/
  schema.sql         ← tablas, roles, seguridad (RLS), sellado de notas
  seed.sql           ← datos ficticios opcionales
```

---

## Parte A – Publicar en GitHub Pages (modo demo)

**Necesitas:** una cuenta de GitHub y [Git](https://git-scm.com/downloads) instalado.

1. En GitHub: **New repository** → nombre `smile-and-health` → *Create repository* (sin README ni .gitignore, ya vienen incluidos).
2. En una terminal, dentro de esta carpeta:
   ```bash
   git init
   git config user.name  "Tu Nombre"
   git config user.email "tu-correo@ejemplo.com"
   git add .
   git commit -m "Smile and Health v1"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/smile-and-health.git
   git push -u origin main
   ```
3. Al hacer `push`, GitHub pedirá autenticarte. Opciones: iniciar sesión por el navegador cuando Git lo ofrezca,
   usar [GitHub CLI](https://cli.github.com/) (`gh auth login`) o un *Personal Access Token* como contraseña.
   **Nunca compartas tu contraseña ni tu token con nadie.**
4. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
5. En 1–2 minutos queda en `https://TU_USUARIO.github.io/smile-and-health/`.

> Si el repositorio está en una **organización de la escuela**, necesitas permiso de escritura (*Write*) para hacer `push`
> y permiso de administrador para activar Pages. Pídeselo al profesor o administrador de la organización.

Para actualizar después: `git add . && git commit -m "cambios" && git push`.

---

## Parte B – Conectar el servidor (Supabase)

1. **Crear el proyecto.** Entra a [supabase.com](https://supabase.com) → *New project*. Guarda la contraseña de la base de datos.
2. **Crear las tablas.** *SQL Editor → New query* → pega **todo** `supabase/schema.sql` → *Run*. Puedes ejecutarlo varias veces sin problema.
3. **Cerrar el registro público.** *Authentication* → ajustes del proveedor *Email* → desactiva **Allow new users to sign up**
   (el nombre del menú puede variar un poco). Así solo entra quien tú crees.
4. **Crear usuarios.** *Authentication → Users → Add user → Create new user* (marca *Auto Confirm User*). Crea al menos uno por rol.
5. **Asignar roles.** Todo usuario nuevo nace como *recepcionista*. En el *SQL Editor* ejecuta (cambia correos y cédula):
   ```sql
   update public.profiles set role = 'admin', full_name = 'Administrador General'
    where email = 'admin@tu-escuela.mx';

   update public.profiles set role = 'odontologo', full_name = 'Dr. Alejandro Mendoza Herrera', license = '8472910'
    where email = 'doctor@tu-escuela.mx';

   update public.profiles set full_name = 'Lic. Patricia Morales'
    where email = 'recepcion@tu-escuela.mx';
   ```
6. **(Opcional) Datos de demostración.** Pega y ejecuta `supabase/seed.sql`. Todos los datos son ficticios.
7. **Conectar la app.** En Supabase: *Project Settings → API* (URL del proyecto) y *Settings → API Keys* (**Publishable key**, empieza con `sb_publishable_`).
   Pégalas en `js/config.js`:
   ```js
   window.APP_CONFIG = {
     SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
     SUPABASE_KEY: 'sb_publishable_xxxxxxxxxxxx'
   };
   ```
   - La clave *publishable* (o la *anon* antigua) **sí** puede subirse a Git: es pública por diseño.
   - La clave *secret* / *service_role* **jamás** va en el código ni en Git.
8. **Probar en tu computadora:** `python3 -m http.server 8000` y abre `http://localhost:8000`. Debe aparecer el login.
9. **Publicar:** `git add . && git commit -m "Conectar Supabase" && git push`.

### Comprobar que la seguridad funciona
- Entra como *recepcionista*: el botón de redactar nota debe estar bloqueado, y el odontograma en solo lectura.
- Entra como *odontólogo*, redacta una nota: el código de seguridad pasa de "Sellando…" a un hash `SHA256-…` real.
- Intenta modificar esa nota desde el SQL Editor (`update public.evolution_notes set data = '{}' where id = '…'`): debe responder *"Registro inmutable"*.
- Verifica la integridad de una nota: `select public.verify_evolution_note('ID_DE_LA_NOTA');` → `true`.

---

## Limitaciones conocidas (conviene mencionarlas en la presentación)

- **Sin tiempo real:** si otro equipo cambia algo, pulsa **🔄 Sincronizar** en la cabecera.
- **Doctores, sillones y catálogo de tratamientos** siguen definidos en `js/data.js` (no hay pantalla para editarlos).
- **Las citas** se validan contra choques de horario en el navegador, pero no en el servidor; dos equipos podrían agendar a la misma hora a la vez.
- **Proyecto escolar:** usa solo datos ficticios. Operar con pacientes reales exige cumplir la LFPDPPP, la NOM-004-SSA3-2012 y la NOM-024-SSA3-2012,
  con asesoría legal y de seguridad; esta aplicación por sí sola no constituye cumplimiento normativo.
- **Seguridad en el navegador:** `index.html` incluye una política CSP que bloquea la ejecución de scripts inyectados en textos de pacientes.
  Si agregas código nuevo con `onclick="..."` en línea, el navegador lo bloqueará: usa `addEventListener`.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| Pantalla sin estilos ni scripts | Las carpetas `css/` y `js/` no están en la raíz del repositorio |
| No aparece el login | `js/config.js` está vacío (modo demo) |
| "No se pudo cargar la librería de Supabase" | Sin internet o bloqueo del CDN `cdn.jsdelivr.net` |
| "Tu usuario no tiene perfil asignado" | El usuario se creó antes de ejecutar `schema.sql`; vuelve a ejecutarlo (crea los perfiles faltantes) |
| `permission denied for table …` | Ejecuta de nuevo `schema.sql` completo (incluye los `GRANT`) |
| "Correo o contraseña incorrectos" | Usuario no confirmado: créalo con *Auto Confirm User* |
| Aviso "No se pudo guardar en el servidor" | Rol sin permiso para esa acción, o sin conexión. Pulsa Sincronizar |
