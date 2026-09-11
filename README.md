# 💻 Pasa La Peli - Frontend (Angular SPA + MSAL)

Aplicación web Single Page Application (SPA) para clientes y administradores del cine, con diseño responsive de temática oscura y autenticación federada con **Microsoft Azure Active Directory (MSAL)**.

Parte del ecosistema Cloud Native **Pasa La Peli** para **Desarrollo Cloud Native I (DSY1107) - Duoc UC**.

---

## 🚀 Tecnologías
- **Angular 18**
- **TypeScript 5.5**
- **Microsoft Authentication Library:** `@azure/msal-browser` y `@azure/msal-angular`
- **FontAwesome 6.5** y fuentes modernas Google
- **Nginx & Dockerfile** (para despliegue en contenedor)

---

## 🔐 Integración MSAL (Pauta de Evaluación)
- **`msal.config.ts`**: Configuración de `PublicClientApplication`, redirecciones y caché local.
- **`MsalGuard`**: Protege rutas sensibles (compras, historial de tickets y panel admin).
- **`MsalInterceptor`**: Inyecta automáticamente el token Bearer JWT en peticiones dirigidas al BFF / API Gateway.
- **Modo Demostración / Toggle de Roles**: Incluye un switch visual en la barra superior para alternar entre perfil `CLIENTE` y `ADMIN` durante pruebas sin requerir una cuenta de Azure AD.

---

## 🖥️ Vistas Principales
1. **Cartelera (`/cartelera`):** Explorador de películas en cartelera con buscador interactivo y fichas de detalle.
2. **Detalle de Película (`/pelicula/:id`):** Horarios, salas y cupos en vivo.
3. **Modal de Compra:** Selección de número de entradas, cálculo de monto, método de pago, confirmación de compra y manejo visual del código **HTTP 409 Conflict** en caso de que se agoten los cupos.
4. **Ticket Digital:** Comprobante con código único y código QR simulado.
5. **Mis Tickets (`/mis-tickets`):** Historial de compras del usuario autenticado.
6. **Panel de Administración (`/admin`):** Formulario para registrar nuevas películas con subida de portadas a **Amazon S3** y programación de nuevas funciones.

---

## 🛠️ Ejecución Local
```bash
npm install
npm start
# Abre en http://localhost:4200
```
O con Docker y Nginx:
```bash
docker build -t frontend-pasalapeli .
docker run -p 80:80 frontend-pasalapeli
```

---

## ☁️ Despliegue CI/CD (GitHub Actions → EC2)

Este repo se despliega sobre una instancia **EC2 (Ubuntu 24.04)** que ya porta el stack completo. El orquestador vive en el repo [`pasalapeli-database`](https://github.com) (contiene el `docker-compose.yml` global en `/opt/pasalapeli/`).

### Workflow `.github/workflows/deploy.yml`
En cada `push` a `main`:
1. SSH al EC2 (acción `appleboy/ssh-action`).
2. `git pull` del código del frontend en `/opt/pasalapeli/pasalapeli-frontend`.
3. `docker compose up -d --build frontend`.
4. Verifica HTTPS y el estado `healthy` del contenedor.

### GitHub Secrets requeridos en este repo
| Secret | Descripción |
|---|---|
| `EC2_HOST` | IP pública del EC2 |
| `EC2_USER` | Usuario SSH (usualmente `ubuntu`) |
| `EC2_SSH_KEY` | Clave privada SSH (.pem) |

### Variables de entorno en producción (definidas en el `.env` del orquestador)
Los valores de Azure AD se inyectan al **build** como argumentos Docker (no son secretos; un *Public Client* de MSAL los expone igualmente):
- `AZURE_CLIENT_ID` → `ARG AZURE_CLIENT_ID` (build)
- `AZURE_TENANT_ID` → `ARG AZURE_TENANT_ID` (build)
- `APP_BASE_URL=https://<tu-dominio>` → `ARG APP_BASE_URL` (build: `redirectUri`, `postLogoutRedirectUri`)

### HTTPS
- El `nginx.conf` sirve en **443** (certs en `/etc/nginx/certs/`, montados por el compose) y redirige **80 → 443**.
- Los certificados los emite **Let's Encrypt** (`scripts/` del repo orquestador) y se renuevan automáticamente vía cron.
- **Requisito:** dominio apuntando al EC2. Azure AD exige redirect URIs HTTPS.
