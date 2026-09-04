# Imagen del frontend (Next.js) para Cloud Run.
# Asume salida "standalone" de Next.js (next.config.js: output: "standalone"),
# que es la que hace que esta imagen quede liviana. Todavía no hay proyecto
# Next.js scaffoldeado en esta carpeta — ver docs/plan-de-trabajo.md, Fase 0.

FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
