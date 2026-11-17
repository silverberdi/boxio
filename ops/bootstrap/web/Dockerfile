FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages/engine/package*.json ./packages/engine/
COPY packages/server/package*.json ./packages/server/
COPY packages/web/package*.json ./packages/web/
COPY angular.json tsconfig.base.json ./
RUN npm ci
COPY . .
RUN npm run build --workspace @boxio/engine
RUN npm run build --workspace @boxio/web -- --configuration production

FROM nginx:1.29-alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de
COPY ops/bootstrap/web/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/web /usr/share/nginx/html
USER nginx
EXPOSE 8080
