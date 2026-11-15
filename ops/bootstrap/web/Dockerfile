FROM nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de

COPY ops/bootstrap/web/nginx.conf /etc/nginx/nginx.conf
COPY ops/bootstrap/web/index.html /usr/share/nginx/html/index.html

USER nginx
EXPOSE 8080
