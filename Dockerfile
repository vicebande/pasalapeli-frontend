# Stage 1: Build Angular application
FROM node:20-alpine AS build

# Argumentos inyectados en build (via docker-compose o CI/CD).
# AZURE_CLIENT_ID/TENANT son publicos (Public Client) -> seguros como build args.
ARG AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
ARG AZURE_TENANT_ID=common
ARG APP_BASE_URL=https://localhost
# Host/IP al que nginx proxy'ea el /api/ (bff-service en single-EC2,
# <IP EC2-APPS> en la topologia de 3 EC2).
ARG EC2_APPS_HOST=bff-service

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Reemplaza los placeholders de environment.prod.ts y nginx.conf con los valores reales
RUN sed -i "s|A_PONE_CLIENT_ID|${AZURE_CLIENT_ID}|g; s|A_PONE_TENANT_ID|${AZURE_TENANT_ID}|g; s|A_PONE_REDIRECT_URI|${APP_BASE_URL}|g" src/environments/environment.prod.ts \
    && sed -i "s|A_PONE_APPS_HOST|${EC2_APPS_HOST}|g" nginx.conf \
    && npm run build -- --configuration production

# Stage 2: Serve with Nginx (HTTP + HTTPS)
FROM nginx:alpine
COPY --from=build /app/dist/pasa-la-peli-frontend/browser /usr/share/nginx/html
# El nginx.conf modificado (sed con EC2_APPS_HOST) vive en /app del stage build.
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --no-check-certificate --tries=1 --spider https://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]