# Origen de las imágenes del catálogo curado

Cuatro productos del catálogo (`backend/prisma/lib/generate-curated.ts`, códigos `CURA-000001` a `CURA-000004`) llevan una fotografía real descargada de Unsplash (banco de imágenes de uso libre, [licencia Unsplash](https://unsplash.com/license)) y guardada en `backend/public/productos-curados/`. El resto del catálogo (~1200 productos DummyJSON/Faker) no lleva imagen — sigue usando el ícono genérico del frontend.

| Producto | Archivo | URL de origen (Unsplash) |
|---|---|---|
| Refrigerador French Door 508L | `refrigerador.jpg` | https://unsplash.com/photos/1588854337115-1c67d9247e4d |
| Lavadora Carga Frontal 18kg | `lavadora.jpg` | https://unsplash.com/photos/1626806787461-102c1bfaaea1 |
| Televisor LED 55'' 4K | `televisor.jpg` | https://unsplash.com/photos/1595935736128-db1f0a261263 |
| Licuadora de Vaso 1.5L | `licuadora.jpg` | https://unsplash.com/photos/1585237672814-8f85a8118bf6 |

Servidas por el backend en `http://localhost:3001/media/productos-curados/*.jpg` (`backend/src/main.ts`, `useStaticAssets`), fuera del prefijo `/api`.
