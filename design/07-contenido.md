# 07 — Contenido disponible por producto

Cifras medidas sobre la base local sembrada (2117 productos) después de la Tarea B. Cada número salió de una consulta o comando; las fuentes se indican al final.

## 1. Datos disponibles por producto

Los entrega el servicio de catálogo (`GET /catalogo/productos`, `GET /catalogo/productos/{id}`, `GET /catalogo/productos/{id}/disponibilidad`).

| Dato | Campo | Disponible | Observaciones para el diseño |
|---|---|---|---|
| Nombre | `name` | Siempre | Largo variable (de "Apple" a "Knoll Saarinen Executive Conference Chair"); prever dos líneas. En 1921 productos es un nombre generado en inglés ("Awesome Aluminum Keyboard") |
| Precio digital | `digitalPrice` | Siempre | En pesos colombianos (COP), enteros: todo el catálogo está normalizado a COP (DummyJSON convertido a 4000 COP por dólar; sintéticos con un precio plausible por tipo, por ejemplo una silla entre $ 89.000 y $ 650.000 y un atún entre $ 4.500 y $ 16.000). Mostrar como "$ 179.000", sin decimales |
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

**Cómo se armó el catálogo de pruebas (para el diseño):** los nombres de producto están en español (los 194 títulos de DummyJSON con un mapa explícito y los 1921 sintéticos con un diccionario con concordancia de género y número, por ejemplo "Silla de madera ergonómica"). Los nombres sintéticos siguen siendo aleatorios ("Atún de aluminio práctico"), así que el material y el adjetivo no tienen sentido comercial: el diseño no debe depender de ellos. La **categoría** de cada producto sintético se asignó por su tipo (una silla en Muebles, un atún en Alimentos y bebidas, un balón en Artículos deportivos), con lo que cada página de categoría es coherente. La foto también se eligió por el tipo. Cada tipo reutiliza entre 4 y 6 fotos, por lo que en una grilla se repiten. Las fotos de retail (Alkosto, Ktronix) son de estudio sobre fondo blanco; las de comida, jabón y calzado (Unsplash) son fotografías de ambiente, con fondos de color y composiciones verticales u horizontales.

Productos publicados por categoría (después de reasignar): Alimentos y bebidas (groceries) 740, Ropa de hombre (mens-shirts) 258, Artículos deportivos (sports-accessories) 243, Portátiles (laptops) 232, Muebles (furniture) 192, Calzado de hombre (mens-shoes) 88, Cuidado de la piel (skin-care) 86, Decoración del hogar (home-decoration) 84, Carros (vehicle) 71, Utensilios de cocina (kitchen-accessories) 30, Celulares (smartphones) 16, Accesorios para celular (mobile-accessories) 14, Relojes de hombre (mens-watches) 6, y entre 3 y 5 en Belleza, Fragancias, Motos, Gafas de sol, Tabletas, Moda casual de mujer, Bolsos de mujer, Vestidos y trajes de mujer, Joyería de mujer, Calzado de mujer, Relojes de mujer y Electrodomésticos. El diseño debe verse bien con categorías de 3 productos y de 700.

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

Las 25 categorías ya tienen nombre en español, descripción corta y foto (`frontend/src/lib/categorias.ts`, fotos en `frontend/public/categorias/`, origen en `design/imagenes-categorias-origen.csv`). La base guarda el identificador en inglés; la traducción es solo de pantalla. La lista completa y el número de productos de cada una están en la captura `01-catalogo-exito` y en `GET /catalogo/categorias`.

## 5. Cómo se calcularon estas cifras

| Cifra | Comando o fuente |
|---|---|
| Productos, con imagen, por categoría, publicados | Consulta con Prisma a la base local (`backend`, `product.count` y `category.findMany`) |
| Origen de las fotos | Salida de `npx ts-node scripts/apply-product-images.ts` y `imagenes-origen.csv` |
| Publicación | Salida de `npx ts-node scripts/publicar-solo-con-imagen.ts` |
| Ancho, relación, peso | Lectura de metadatos con `sharp` sobre `frontend/public/productos/**` |
| Datos por producto | Esquema `backend/prisma/schema.prisma` y respuestas del servidor |

La base de datos desplegada puede diferir de la local (la siembra usa datos aleatorios); las cifras de este archivo describen la local. Ver `design/plan-ejecucion-bd-desplegada.md`.
