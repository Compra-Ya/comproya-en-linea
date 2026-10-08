# Plan de ejecución contra la base desplegada (imágenes del catálogo)

**Estado: escrito, NO ejecutado.** Ningún paso de este plan se corre sin la confirmación explícita de quien administra el despliegue. Lo hecho hasta ahora afectó solo la base local.

## 0. Qué cambia y qué no

- Cambia únicamente la columna `products.image_url` (un texto por producto). No hay migración de esquema: el campo ya existe.
- No se tocan precios, disponibilidad, pedidos, carritos ni cuentas.
- El script (`backend/scripts/apply-product-images.ts`) es idempotente: una segunda corrida no escribe nada. Nunca borra una imagen existente.
- **Las asignaciones se calculan de nuevo en cada base**: la siembra usa datos aleatorios, así que los ids y los nombres de los productos sintéticos de la base desplegada pueden diferir de los locales. Las cifras de cobertura (cuántos productos quedan con foto) deben recalcularse con el modo de prueba (paso 3); no asumir las locales.

## 1. Requisitos previos

1. Hacer pull de la rama con los cambios y **desplegar primero el frontend** (Vercel): las fotos viven en `frontend/public/productos/` y deben existir en el sitio antes de que la base apunte a ellas. Si la base se actualizara antes, el frontend mostraría el placeholder por categoría (no una imagen rota), pero sin foto.
2. Comprobar que `https://<frontend>/productos/curados/televisor.webp` responde 200.
3. El backend desplegado exige dos variables nuevas que llegaron con los últimos cambios del Caso de Uso 2: `PAYMENT_TOKEN_ENCRYPTION_KEY` y `DEBITO_NOTIFICATION_SECRET`. No son parte de este cambio, pero sin ellas el pago no funciona; verificarlas en Railway antes de la sesión de pruebas.
4. Tener a mano la `DATABASE_URL` pública de la base de Railway. No pegarla en el chat ni en el repositorio.

## 2. Respaldo (obligatorio)

```bash
pg_dump --no-owner --format=custom --table=products "$DATABASE_URL_DESPLEGADA" -f respaldo-products-$(date +%Y%m%d-%H%M).dump
```

Guardar el archivo fuera del repositorio. Alternativa mínima, solo las imágenes actuales:

```sql
\copy (SELECT id, homologated_code, image_url FROM products) TO 'respaldo-image-url.csv' CSV HEADER
```

## 3. Ensayo sin escribir

```bash
cd backend
DATABASE_URL="<url desplegada>" npx ts-node scripts/apply-product-images.ts --dry-run
```

Imprime `evaluados / actualizados / sinCambio / sinImagen` y los productos con imagen por tienda de origen. Revisar con quien confirma:

- `evaluados` coincide con el número de productos esperado en la base desplegada.
- Los cuatro productos curados (`CURA-000001` a `CURA-000004`) aparecen como actualizados (cambian de `/media/…jpg` a `/productos/curados/…webp`).
- `sinImagen` es plausible (productos de comida, jabón y de prueba).

## 4. Aplicación

Solo tras confirmación:

```bash
DATABASE_URL="<url desplegada>" npx ts-node scripts/apply-product-images.ts --csv=../design/imagenes-origen-desplegada.csv
```

Usar `--csv=` con otro nombre para no sobrescribir `design/imagenes-origen.csv` (el de la base local). El CSV de la base desplegada debe revisarse y versionarse igual: **ninguna imagen sin fila de origen**.

## 4b. Publicación del catálogo de pruebas (confirmación aparte)

Cambia `products.published`: deja publicados solo los productos con foto. Es un cambio de datos de negocio, así que se confirma por separado del paso 4.

```bash
DATABASE_URL="<url desplegada>" npx ts-node scripts/publicar-solo-con-imagen.ts --dry-run
DATABASE_URL="<url desplegada>" npx ts-node scripts/publicar-solo-con-imagen.ts
```

Reversión: `UPDATE products SET published = true;` (o restaurar el respaldo del paso 2; incluir `published` en el respaldo).

## 4c. Nombres en español y categorías (confirmación aparte, con respaldo)

Cambian `products.name` (~1900 productos) y `products.category_id` (~1800). No hay reversión automática del nombre (el original en inglés no se guarda): hacer antes el respaldo del paso 2 con las columnas `name` y `category_id`.

```bash
DATABASE_URL="<url desplegada>" npx ts-node scripts/traducir-nombres-de-productos.ts --dry-run
DATABASE_URL="<url desplegada>" npx ts-node scripts/categorizar-sinteticos.ts --dry-run
# con confirmación: repetir sin --dry-run, en ese orden
```

Orden recomendado de todo el plan: paso 4 (imágenes), 4c (nombres y categorías), 4b (publicación).

## 5. Verificación

1. Repetir el paso 4 con `--dry-run`: debe informar `actualizados: 0`.
2. Abrir el portal desplegado: catálogo, detalle de un producto con foto, detalle de uno sin foto (placeholder), carrito.
3. Comprobar `https://<frontend>/robots.txt` (debe bloquear todo) y la cabecera `X-Robots-Tag: noindex, nofollow, noarchive`.
4. Comprobar el pie de página con el aviso del proyecto académico.

## 6. Reversión

```sql
-- Quita las imágenes asignadas por este cambio
UPDATE products SET image_url = NULL WHERE image_url LIKE '/productos/%';
-- Restaura los cuatro curados al estado anterior (el backend sigue sirviendo /media)
UPDATE products SET image_url = '/media/productos-curados/refrigerador.jpg' WHERE homologated_code = 'CURA-000001';
UPDATE products SET image_url = '/media/productos-curados/lavadora.jpg'     WHERE homologated_code = 'CURA-000002';
UPDATE products SET image_url = '/media/productos-curados/televisor.jpg'    WHERE homologated_code = 'CURA-000003';
UPDATE products SET image_url = '/media/productos-curados/licuadora.jpg'    WHERE homologated_code = 'CURA-000004';
```

También sirve restaurar desde el respaldo del paso 2.

## 7. Riesgos

- **Derechos de las imágenes.** Las fotos de Alkosto y Ktronix pertenecen a sus titulares. Mitigaciones: sitio con `noindex`, `robots.txt` que bloquea todo, aviso en el pie, trazabilidad por producto, uso académico sin fines comerciales. No retirar estas protecciones.
- **Repetición de fotos.** Un tipo de producto reutiliza entre 4 y 6 fotos.
- **Desfase foto–categoría** en productos sintéticos (el nombre es aleatorio).
- **Peso del repositorio:** 8,71 MB de imágenes; aceptable. Si el catálogo crece, pasar a un bucket de Cloud Storage (`docs/despliegue-gcp.md`, sección 4).
