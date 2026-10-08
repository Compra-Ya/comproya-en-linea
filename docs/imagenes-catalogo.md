# Origen de las imágenes del catálogo curado

Cuatro productos del catálogo (`backend/prisma/lib/generate-curated.ts`, códigos `CURA-000001` a `CURA-000004`) llevan una fotografía real descargada de Unsplash (banco de imágenes de uso libre, [licencia Unsplash](https://unsplash.com/license)) y guardada en `backend/public/productos-curados/`. El resto del catálogo (~1200 productos DummyJSON/Faker) no lleva imagen — sigue usando el ícono genérico del frontend.

| Producto | Archivo | URL de origen (Unsplash) |
|---|---|---|
| Refrigerador French Door 508L | `refrigerador.jpg` | https://unsplash.com/photos/1588854337115-1c67d9247e4d |
| Lavadora Carga Frontal 18kg | `lavadora.jpg` | https://unsplash.com/photos/1626806787461-102c1bfaaea1 |
| Televisor LED 55'' 4K | `televisor.jpg` | https://unsplash.com/photos/1595935736128-db1f0a261263 |
| Licuadora de Vaso 1.5L | `licuadora.jpg` | https://unsplash.com/photos/1585237672814-8f85a8118bf6 |

Servidas por el backend en `http://localhost:3001/media/productos-curados/*.jpg` (`backend/src/main.ts`, `useStaticAssets`), fuera del prefijo `/api`.

## Imágenes reales del catálogo (Tarea B del handoff de diseño)

Las fotos de producto viven en `frontend/public/productos/` (WebP, ancho máximo 800 px) y se sirven desde el propio frontend; **no** se enlaza en caliente a ningún sitio externo. Decisión: carpeta local por ahora; migrar a un bucket de Cloud Storage (`docs/despliegue-gcp.md`, sección 4) solo si el catálogo crece.

- `frontend/public/productos/dummyjson/{id}.webp` — foto oficial de cada producto de DummyJSON (nombre real).
- `frontend/public/productos/retail/{tipo}-NN.webp` — fotos de Alkosto y Ktronix para los productos sintéticos, elegidas por el **tipo de producto** del nombre (silla, mesa, teclado…), porque el nombre sintético no coincide con la categoría.
- `frontend/public/productos/curados/*.webp` — los 4 productos curados (Unsplash, tabla anterior), convertidos a WebP.
- `backend/prisma/data/imagenes-manifest.json` — origen de cada foto (tienda, URL de la página, URL original, fecha de descarga).
- `design/imagenes-origen.csv` — una fila por producto con imagen (productId, nombre, tienda, URL de la página, URL de la imagen, fecha de descarga, archivo local).

Cómo se obtuvieron: `backend/scripts/scrape-images.ts` lee los sitemaps de producto de Alkosto y Ktronix (permitidos por su `robots.txt`; se descartó la búsqueda interna y la API de Éxito, que sus `robots.txt` prohíben), con máximo 1 solicitud por segundo por sitio, User-Agent identificable y caché local en `backend/scripts/.cache/` (no versionada). Ante 403, 429 o CAPTCHA el sitio se marca como no disponible y no se reintenta: Éxito respondió 429 en la primera solicitud y quedó descartado.

Cómo se aplican a la base: `backend/scripts/apply-product-images.ts` (idempotente; `--dry-run` para ensayar), con su prueba en `backend/prisma/lib/product-images.spec.ts`. Plan para la base desplegada: `design/plan-ejecucion-bd-desplegada.md`.

Fotos libres: para los tipos que el retail no cubre (comida, jabón, calzado) se descargan fotos de **Unsplash** (Unsplash License) desde su búsqueda pública, permitida por su `robots.txt`: 6 por tipo, guardadas en `frontend/public/productos/retail/` y registradas en el manifiesto como tienda "Unsplash".

Sitios probados y descartados (sin evasión, según las reglas del scraper): **Éxito** (429 a la primera solicitud; su `robots.txt` prohíbe `/api/`), **Jumbo** (el CDN de imágenes respondió 429), **Pexels** (403), **Olímpica**, **Carulla**, **Open Food Facts** y **Wikimedia Commons** (sus `robots.txt` prohíben el acceso automático a la API). Alkosto y Ktronix no venden comida.

Fotos de categoría: `backend/scripts/scrape-category-images.ts` baja una foto de Unsplash por categoría (`frontend/public/categorias/`, origen en `design/imagenes-categorias-origen.csv`). Unsplash respondió 429 a mitad de la corrida; las 11 categorías restantes usan la foto de un producto representativo (`completar-categorias-con-productos.ts`) y se reemplazan por la de Unsplash al volver a correr el primer script cuando el límite se levante.

Nombres en español y categorías coherentes (catálogo de pruebas): `backend/scripts/traducir-nombres-de-productos.ts` y `backend/scripts/categorizar-sinteticos.ts` (idempotentes, `--dry-run`). Orden en una base recién sembrada: 1) `apply-product-images.ts`, 2) `traducir-nombres-de-productos.ts`, 3) `categorizar-sinteticos.ts`, 4) `publicar-solo-con-imagen.ts`. Los dos primeros entienden nombres en inglés y en español, así que correrlos en otro orden no rompe la asignación de fotos.

Catálogo de pruebas: `backend/scripts/publicar-solo-con-imagen.ts` (idempotente, `--dry-run`) deja publicados solo los productos con foto. Las categorías se ajustan solas porque `listarCategorias` solo lista las que tienen productos publicados.
