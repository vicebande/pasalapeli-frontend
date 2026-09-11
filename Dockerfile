# Stage 1: Build Angular application
FROM node:20-alpine AS build

# Argumentos inyectados en build (via docker-compose o CI/CD).
# AZURE_CLIENT_ID/TENANT son publicos (Public Client) -> seguros como build args.
ARG AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
ARG AZURE_TENANT_ID=common
ARG APP_BASE_URL=https://localhost

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Reemplaza los placeholders de environment.prod.ts con los valores reales
RUN sed -i "s|A_PONE_CLIENT_ID|${AZURE_CLIENT_ID}|g; s|A_PONE_TENANT_ID|${AZURE_TENANT_ID}|g; s|A_PONE_REDIRECT_URI|${APP_BASE_URL}|g" src/environments/environment.prod.ts \
    && npm run build -- --configuration production

# Stage 2: Serve with Nginx (HTTP + HTTPS)
FROM nginx:alpine
COPY --from=build /app/dist/pasa-la-peli-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --no-check-certificate --tries=1 --spider https://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]