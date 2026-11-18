# Imagen del frontend (Next.js) para Cloud Run.
# Usa la salida "standalone" de Next.js (next.config.js: output: "standalone"),
# que es la que hace que esta imagen quede liviana.
#
# NEXT_PUBLIC_API_URL se incrusta en el JavaScript al compilar (Next.js no la lee
# en tiempo de ejecución): hay que pasarla con --build-arg, por ejemplo
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://<servicio-backend>.run.app/api ./frontend
# Si no se pasa, la tienda desplegada llamaría a http://localhost:3001/api.

FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
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
