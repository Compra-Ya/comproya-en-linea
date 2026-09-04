# Imagen del backend (NestJS) para Cloud Run.
# Multi-stage: build con devDependencies, runtime solo con lo necesario.
#
# Asume que package.json ya tiene un script "build" (nest build, salida en
# dist/main.js) y una dependencia de framework HTTP — es decir, asume que
# el scaffold de NestJS de docs/plan-de-trabajo.md (Fase 0) ya se hizo.
# Hasta entonces esta imagen no construye nada útil todavía.

FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# Cloud Run inyecta PORT; NestJS debe escuchar en process.env.PORT (por defecto 8080)
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/main.js"]
