FROM node:24-bookworm-slim AS base

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3333 \
    APP_URL=http://localhost:3333 \
    LOG_LEVEL=info \
    SESSION_DRIVER=cookie

FROM base AS build

WORKDIR /app

ENV APP_KEY=build-only-key-not-used-by-the-running-app \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_USER=nasaweb \
    DB_PASSWORD=nasaweb \
    DB_DATABASE=nasaweb

COPY app/package*.json ./
RUN npm ci --include=dev

COPY app/ ./
RUN npm run build

FROM base

WORKDIR /app

COPY --from=build /app/build/ ./
RUN npm ci --omit=dev

EXPOSE 3333

CMD ["sh", "-c", "if [ -z \"$APP_KEY\" ]; then if [ ! -s tmp/app.key ]; then node -e \"process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))\" > tmp/app.key && chmod 600 tmp/app.key; fi; export APP_KEY=\"$(cat tmp/app.key)\"; fi; node ace migration:run --force && exec node bin/server.js"]
