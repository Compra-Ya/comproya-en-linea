# Imagen del backend (NestJS) para Cloud Run.
# Multi-stage: build con devDependencies, runtime solo con lo necesario.

# node:22-slim no trae OpenSSL y Prisma no carga su motor sin él: se instala en las dos etapas.
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
# Imágenes del catálogo curado: main.ts las sirve en /media desde /app/public.
COPY public ./public

# Cloud Run inyecta PORT; NestJS debe escuchar en process.env.PORT (por defecto 8080)
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/main.js"]
