FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
WORKDIR /app
COPY package*.json ./
COPY packages/engine/package*.json ./packages/engine/
COPY packages/server/package*.json ./packages/server/
COPY packages/web/package*.json ./packages/web/
COPY tsconfig.base.json ./
RUN npm ci
COPY . .
RUN npm run build --workspace @boxio/engine
RUN npm run build --workspace @boxio/server

FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
COPY packages/engine/package*.json ./packages/engine/
COPY packages/server/package*.json ./packages/server/
COPY tsconfig.base.json ./
RUN npm ci --omit=dev

COPY --from=build /app/packages/engine/dist ./packages/engine/dist
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY packages/server/migrations ./packages/server/migrations

USER node
EXPOSE 8080
CMD ["node", "packages/server/dist/start.js"]
