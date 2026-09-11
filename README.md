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
