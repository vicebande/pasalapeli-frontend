FROM nginx:alpine

WORKDIR /app
COPY dist/pasa-la-peli-frontend/browser /usr/share/nginx/html

COPY nginx-k8s.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --no-check-certificate --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]