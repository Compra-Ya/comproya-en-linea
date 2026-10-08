# 07 — Contenido disponible por producto

Cifras medidas sobre la base local sembrada (2117 productos) después de la Tarea B. Cada número salió de una consulta o comando; las fuentes se indican al final.

## 1. Datos disponibles por producto

Los entrega el servicio de catálogo (`GET /catalogo/productos`, `GET /catalogo/productos/{id}`, `GET /catalogo/productos/{id}/disponibilidad`).

| Dato | Campo | Disponible | Observaciones para el diseño |
|---|---|---|---|
| Nombre | `name` | Siempre | Largo variable (de "Apple" a "Knoll Saarinen Executive Conference Chair"); prever dos líneas. En 1921 productos es un nombre generado en inglés ("Awesome Aluminum Keyboard") |
| Precio digital | `digitalPrice` | Siempre | Número con decimales; en pesos colombianos. Rango desde menos de 10 hasta millones; formatear con separador de miles |
| Categoría | `category.name` | Siempre | Nombres en inglés tal cual la fuente ("mens-shirts", "home-decoration", "Electrodomésticos"): hace falta un nombre de pantalla en español por categoría (ver sección 4) |
| Marca | `brand` | Casi siempre (puede ser nula) | No se muestra hoy |
| Imagen | `imageUrl` | Parcial (sección 2) | Nunca hay más de una imagen por producto |
| Código homologado | `homologatedCode` | Siempre | Dato interno; no mostrar al cliente |
| Unidades disponibles por sucursal | `unidadesDisponibles`, `branchId` | Por producto y sucursal | Ya descuentan el umbral de seguridad y las reservas |
| ¿Puede retirar? | `puedeRetirar` | Por sucursal | `false` si la sucursal lleva más de 15 minutos sin sincronizar |
| Última sincronización | `syncedAt` | Por sucursal | Fecha y hora; la pantalla calcula los minutos |
| Descripción, especificaciones, galería, reseñas | — | **No existen** | No diseñar espacio para ellos (reseñas están fuera de alcance; el modelo no tiene descripción) |
| Sucursales | `name`, `city` | 9 en la base local | El detalle hoy muestra "Sucursal #id"; el nombre está disponible en `GET /catalogo/sucursales` |

Productos complementarios: hasta 4 por producto, con los mismos datos que cualquier producto.

## 2. Imágenes: cuántos productos tienen foto

Catálogo de pruebas (base local, después de `publicar-solo-con-imagen`): **todo producto publicado tiene foto**.

| Medida | Valor |
|---|---|
| Productos en la base local | 2117 |
| Con imagen | 2115 |
| Sin imagen | 2 (los productos de prueba, despublicados) |
| Publicados | 2115 |
| Publicados con imagen | 2115 |
| Categorías visibles | 25 (la categoría "Pruebas" desaparece al no tener productos publicados) |

Con imagen, por origen de la foto (de `imagenes-origen.csv`, 2115 filas): Unsplash 883, Alkosto 741, Ktronix 297, DummyJSON 194. Las de Unsplash incluyen los 4 productos curados. Detalle de la procedencia en [imagenes-origen.csv](imagenes-origen.csv).

**Advertencia de calidad para el diseño:** en los 1921 productos sintéticos el nombre es aleatorio y no coincide con la categoría (por ejemplo "Awesome Bamboo Hat" en la categoría `motorcycle`). La foto se eligió por el **tipo de producto del nombre** (una "Chair" muestra una silla), no por la categoría. Cada tipo reutiliza entre 4 y 6 fotos, por lo que en una grilla se repiten. Las fotos de retail (Alkosto, Ktronix) son de estudio sobre fondo blanco; las de comida, jabón y calzado (Unsplash) son fotografías de ambiente, con fondos de color y composiciones verticales u horizontales. El diseño no debe depender de que foto y categoría coincidan ni de que el fondo sea blanco.

Productos publicados por categoría: beauty 89, fragrances 97, furniture 86, groceries 107, home-decoration 85, kitchen-accessories 113, laptops 95, mens-shirts 89, mens-shoes 73, mens-watches 95, mobile-accessories 99, motorcycle 93, skin-care 78, smartphones 85, sports-accessories 75, sunglasses 82, tablets 85, tops 92, vehicle 100, womens-bags 83, womens-dresses 77, womens-jewellery 69, womens-shoes 83, womens-watches 81, Electrodomésticos 4.

El placeholder por categoría (ícono y nombre de la categoría sobre fondo gris claro) sigue siendo parte del diseño para cuando un producto nuevo no tenga foto o la foto no cargue; en el catálogo de pruebas ya no aparece (la captura `42` lo simula).

## 3. Proporciones y tamaños de imagen que el diseño debe asumir

Medido sobre los 335 archivos en `frontend/public/productos/`:

| Medida | Valor |
|---|---|
| Formato | WebP |
| Ancho | entre 300 y 800 px (máximo 800 px por regla de la Tarea B) |
| Peso total | 8,71 MB (curados 0,16 MB · DummyJSON 1,63 MB · retail y fotos libres 6,92 MB) |
| Relación ancho/alto | 269 cuadradas (1:1); 34 horizontales (de 1,1:1 a 1,8:1); 32 verticales (de 0,6:1 a 0,8:1) |
| Fondo | Blanco en las fotos de estudio (DummyJSON, Alkosto, Ktronix); de color en las de Unsplash |

Recomendaciones de diseño derivadas:

1. **Contenedor cuadrado (1:1)** para tarjeta y detalle, con la imagen **contenida** (sin recortar) sobre fondo blanco. Es lo que hace hoy `ProductImage` (`object-fit: contain`); las fotos verticales y horizontales dejan franjas laterales o superiores.
2. **Tamaños de uso:** tarjeta de catálogo ≈ 180–260 px de lado; detalle ≈ 360–480 px; miniatura de carrito 64 px y de complementario 46 px. Para el detalle de 480 px o más en pantallas de alta densidad, las fotos de DummyJSON (300 px de ancho) se verán suaves: no prometer zoom.
3. **Imagen de reemplazo:** mantener el placeholder por si un producto nuevo no tiene foto.
4. Las fotos son estáticas, locales y sin variantes de tamaño (una sola resolución por producto).
5. Texto alternativo: el nombre del producto. Para el placeholder: "Sin foto: {producto}".

## 4. Categorías: nombres de pantalla pendientes

Hoy 24 de las 25 categorías visibles se muestran con su nombre en inglés. El diseño necesita un nombre en español y, opcionalmente, un ícono con etiqueta por categoría. La lista completa y el número de productos de cada una están en la captura `01-catalogo-exito` y en `GET /catalogo/categorias`.

## 5. Cómo se calcularon estas cifras

| Cifra | Comando o fuente |
|---|---|
| Productos, con imagen, por categoría, publicados | Consulta con Prisma a la base local (`backend`, `product.count` y `category.findMany`) |
| Origen de las fotos | Salida de `npx ts-node scripts/apply-product-images.ts` y `imagenes-origen.csv` |
| Publicación | Salida de `npx ts-node scripts/publicar-solo-con-imagen.ts` |
| Ancho, relación, peso | Lectura de metadatos con `sharp` sobre `frontend/public/productos/**` |
| Datos por producto | Esquema `backend/prisma/schema.prisma` y respuestas del servidor |

La base de datos desplegada puede diferir de la local (la siembra usa datos aleatorios); las cifras de este archivo describen la local. Ver `design/plan-ejecucion-bd-desplegada.md`.
