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

| Medida | Valor |
|---|---|
| Productos en la base local | 2117 |
| Con imagen | 1236 |
| Sin imagen (placeholder) | 881 |
| Publicados | 1896 |
| Publicados con imagen | 1105 |

Con imagen, por origen de la foto (de `imagenes-origen.csv`): DummyJSON 194, Alkosto 741, Ktronix 297, Unsplash 4. Detalle de la procedencia en [imagenes-origen.csv](imagenes-origen.csv).

Los productos **sin foto** son: los sintéticos de comida y jabón (tocino, pescado, queso, pizza, ensalada, atún, salchichas, pollo, papas fritas y "Soap"), para los que no se encontró una fuente que permita la descarga automática (ver `docs/imagenes-catalogo.md`), y los 2 productos de prueba. "Car" muestra carros de juguete a control remoto y "Pants" pantalones de motociclista, porque son los únicos que venden Alkosto y Ktronix. Para ellos el frontend muestra un placeholder por categoría (ícono y nombre de la categoría sobre fondo gris claro), nunca una imagen rota.

**Advertencia de calidad para el diseño:** en los 1921 productos sintéticos el nombre es aleatorio y no coincide con la categoría (por ejemplo "Awesome Bamboo Hat" en la categoría `motorcycle`). La foto se eligió por el **tipo de producto del nombre** (una "Chair" muestra una silla), no por la categoría. Un mismo tipo reutiliza entre 4 y 6 fotos, por lo que en una grilla se repiten. El diseño no debe depender de que foto y categoría coincidan.

Cobertura de fotos por categoría (productos con foto / productos de la categoría): beauty 44/89, fragrances 54/97, furniture 57/86, groceries 70/107, home-decoration 43/85, kitchen-accessories 71/113, laptops 53/95, mens-shirts 46/89, mens-shoes 41/73, mens-watches 53/95, mobile-accessories 62/99, motorcycle 50/93, skin-care 52/78, smartphones 56/85, sports-accessories 49/75, sunglasses 46/82, tablets 49/85, tops 59/92, vehicle 56/100, womens-bags 43/83, womens-dresses 45/77, womens-jewellery 44/69, womens-shoes 42/83, womens-watches 47/81, Electrodomésticos 4/4, Pruebas 0/2.

## 3. Proporciones y tamaños de imagen que el diseño debe asumir

Medido sobre los 269 archivos en `frontend/public/productos/`:

| Medida | Valor |
|---|---|
| Formato | WebP |
| Ancho | entre 300 y 800 px (máximo 800 px por regla de la Tarea B) |
| Peso total | 3,84 MB (curados 0,16 MB · DummyJSON 1,63 MB · retail 2,05 MB) |
| Relación ancho/alto | 265 de 269 son cuadradas (1:1); 3 son 3:2 horizontales; 1 es casi cuadrada |
| Fondo | Blanco en la gran mayoría (fotos de producto); las 4 fotos de los productos curados son fotografías de ambiente, no de estudio |

Recomendaciones de diseño derivadas:

1. **Contenedor cuadrado (1:1)** para tarjeta y detalle, con la imagen **contenida** (sin recortar) sobre fondo blanco. Es lo que hace hoy `ProductImage` (`object-fit: contain`).
2. **Tamaños de uso:** tarjeta de catálogo ≈ 180–260 px de lado; detalle ≈ 360–480 px; miniatura de carrito 64 px y de complementario 46 px. Para el detalle de 480 px o más en pantallas de alta densidad, las fotos de DummyJSON (300 px de ancho) se verán suaves: no prometer zoom.
3. **Imagen de reemplazo obligatoria:** 881 de 2117 productos no tienen foto. El placeholder es parte del diseño, no una excepción.
4. Las fotos son estáticas, locales y sin variantes de tamaño (una sola resolución por producto).
5. Texto alternativo: el nombre del producto. Para el placeholder: "Sin foto: {producto}".

## 4. Categorías: nombres de pantalla pendientes

Hoy 24 de 26 categorías se muestran con su nombre en inglés. El diseño necesita un nombre en español y, opcionalmente, un ícono con etiqueta por categoría. La lista completa y el número de productos de cada una están en la captura `01-catalogo-exito` y en `GET /catalogo/categorias`. La categoría "Pruebas" (2 productos de prueba) no debe mostrarse a clientes.

## 5. Cómo se calcularon estas cifras

| Cifra | Comando o fuente |
|---|---|
| Productos, con imagen, por categoría, publicados | Consulta con Prisma a la base local (`backend`, `product.count` y `category.findMany`) |
| Origen de las fotos | Salida de `npx ts-node scripts/apply-product-images.ts` y `imagenes-origen.csv` |
| Ancho, relación, peso | Lectura de metadatos con `sharp` sobre `frontend/public/productos/**` |
| Datos por producto | Esquema `backend/prisma/schema.prisma` y respuestas del servidor |

La base de datos desplegada puede diferir de la local (la siembra usa datos aleatorios); las cifras de este archivo describen la local. Ver `design/plan-ejecucion-bd-desplegada.md`.
