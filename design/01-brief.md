# 01 — Brief

## 1. Qué es el producto

**ComproYa en Línea** es el canal de comercio electrónico B2C de Tiendas ComproYa (cadena de retail ficticia). Proyecto académico de Ingeniería de Software II, Universidad Central: "Aplicación Web de Comercio Electrónico — Venta de Electrodomésticos y Productos de Retail". El cliente compra en el portal, paga en línea y **retira en una sucursal** con un código de retiro.

Repositorio: https://github.com/Compra-Ya/comproya-en-linea (frontend Next.js, backend NestJS, Prisma sobre PostgreSQL).

## 2. Quién usa esta parte: el Cliente digital

Es el único actor del flujo. Compra por su cuenta, sin ayuda de nadie en tienda: **no existe asesor en tienda** (la aplicación de sala está fuera del alcance). Puede comprar como invitado (carrito sin cuenta) o registrado. No se asume conocimiento del ERP, de los procesos de la cadena ni de términos técnicos.

Qué necesita saber en cada momento: dónde está, qué producto y qué precio, en qué sucursal puede retirar, si su pago se está procesando, y qué hacer si algo falla.

## 3. Objetivo del rediseño

Hoy la UI/UX está muy por debajo de lo necesario. El objetivo es **pasar los 12 casos de prueba de usabilidad** (ver [04-requisitos-usabilidad.md](04-requisitos-usabilidad.md)) aplicados con un usuario real sobre el portal desplegado:

- 7 de comprensibilidad: propósito de la pantalla, íconos y textos, flujo de una tarea simple, mensajes de error, uso sin documentación, navegación entre 3 módulos, estado del sistema.
- 5 de facilidad de aprendizaje: tiempo para una función básica, errores durante el aprendizaje, necesidad de asistencia, retención al día 2, tiempo para una función avanzada.

## 4. Alcance (no negociable)

**Pantallas del Caso de Uso 2:**

1. Catálogo y búsqueda (`/`)
2. Detalle de producto con disponibilidad por sucursal (`/producto/[id]`)
3. Carrito, de invitado y de cliente registrado (`/carrito`)
4. Confirmación del pedido: sucursal de retiro y cupón de lealtad (`/pedido/confirmar`)
5. Pago: tarjeta vía Stripe Checkout o débito bancario (`/pago/[orderId]`)
6. Comprobante con código de retiro (`/comprobante/[orderId]`)
7. Mis pedidos (`/pedidos`)

**Solo como paso previo:** registro (`/registro`) e inicio de sesión (`/ingresar`) del cliente. La pantalla de consentimiento (`/privacidad`) es el destino del registro; se incluye en el inventario, pero no es parte del rediseño principal.

**Fuera de alcance — no proponer:** recomendación automática, reseñas o calificaciones, lista de deseos, devoluciones, facturación, logística propia, campañas, catálogo de terceros, aplicación de sala para asesores. Los **productos complementarios** (hasta 4) existen, pero pertenecen a otro caso de uso: pueden aparecer en el diseño, sin protagonismo.

**No cambiar la lógica de negocio.** El comprobante muestra el total que devuelve el servidor, sin recalcularlo.

## 5. Vocabulario de la interfaz (español)

| Usar | No usar |
|---|---|
| confirmar pedido | checkout |
| pago con débito bancario | PSE |
| unidades disponibles | stock |
| código de retiro | — |
| producto complementario | cross-sell |

Tampoco usar en la interfaz: SKU, API, SaaS, ni adjetivos sin umbral ("rápido", "escalable"). Si hay que prometer un tiempo, dar la cifra (por ejemplo "5 días calendario").

## 6. Reglas de negocio que la interfaz debe hacer visibles

| Regla | Qué debe ver el usuario |
|---|---|
| Una sucursal sin sincronizar hace más de 15 minutos no ofrece retiro | La sucursal aparece como no disponible para retiro, con el motivo en lenguaje claro |
| El código de retiro es de un solo uso y vence a los 5 días calendario | Fecha de vencimiento y "de un solo uso" junto al código |
| Un pedido solo se cancela antes del alistamiento | Acción "Cancelar pedido" visible mientras sea posible, y el motivo cuando ya no lo es |
| Un cupón se redime una vez por pedido | Que el cupón se aplica al confirmar, una sola vez; resultado claro (aplicado o inválido) |
| El canal nunca captura datos de tarjeta | Que la tarjeta se ingresa en la pasarela, no en ComproYa |

## 7. Qué no se debe tocar

- Cifras, plazos y umbrales (15 minutos, 5 días, 30 minutos del débito, hasta 4 complementarios).
- Nombres de actor del canon: **Cliente digital**. No inventar roles.
- Estados del pedido: Creado (pendiente de pago), Pagado, En alistamiento, Listo para retiro, Entregado, Cancelado, Pago fallido.
