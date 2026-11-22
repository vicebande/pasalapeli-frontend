# Stage 1: Build Angular application
FROM node:20-alpine AS build

# Argumentos inyectados en build (via docker build --build-arg o CI/CD).
ARG AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
ARG AZURE_TENANT_ID=common
ARG APP_BASE_URL=https://localhost
ARG EC2_APPS_HOST=bff-service

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Reemplaza los placeholders de environment.prod.ts y nginx-k8s.conf con los valores reales
RUN sed -i "s|A_PONE_CLIENT_ID|${AZURE_CLIENT_ID}|g; s|A_PONE_TENANT_ID|${AZURE_TENANT_ID}|g; s|A_PONE_REDIRECT_URI|${APP_BASE_URL}|g" src/environments/environment.prod.ts \
    && sed -i "s|A_PONE_APPS_HOST|${EC2_APPS_HOST}|g" nginx-k8s.conf \
    && CI=false npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/pasa-la-peli-frontend/browser /usr/share/nginx/html
COPY --from=build /app/nginx-k8s.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --no-check-certificate --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]