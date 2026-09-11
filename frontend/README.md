# Frontend — ComproYa en Línea

Next.js (App Router, TypeScript). Las pantallas del Cliente digital y las de los roles internos (por ahora solo `/interno/publicar`, del Coordinador de Canal Digital) viven en este mismo proyecto, separadas por ruta — no son dos aplicaciones distintas (`../docs/arquitectura.md` sección 4).

Construido directamente sobre el canvas de mockups del equipo ("Mockups ComproYa en Línea", `docs/mockups-plan.md`) — misma paleta (naranja `#f2661d` / navy `#163d6d`), tipografía Geist, layout de header/nav y componentes (`src/app/globals.css` es esa hoja de estilos consolidada). `src/components/ShopHeader.tsx` es el cromo de tienda (utility bar + header + nav de categorías) compartido por catálogo, ficha de producto, carrito y cuenta.

## Pantallas construidas

| Ruta | Mockup | Caso de uso |
|---|---|---|
| `/` | P-2 | CU-02 Búsqueda de productos |
| `/producto/[id]` | P-3 | CU-03 Disponibilidad por sucursal — "Retirar aquí" fija la sucursal del pedido y agrega al carrito |
| `/interno/publicar` | P-1 | CU-01 Publicación de producto |
| `/registro` | P-4 | CU-04 Registro de cuenta |
| `/ingresar` | — | Login (soporte de CU-04; el mockup de este modal ofrecía "Continuar con Google", que no se implementa — el canon exige JWT propio, arquitectura.md §7) |
| `/privacidad` | P-5 | CU-05 Administración del consentimiento (incluye RN-11) |
| `/carrito` | P-7, P-8 | CU-07 Administración del carrito, CU-08 Productos complementarios |
| `/pedido/confirmar` | P-9, P-10 | CU-09 Confirmación del pedido, CU-10 Cupón de lealtad |
| `/pago/[orderId]` | P-15, P-16 | CU-15 Pago con tarjeta (Stripe), CU-16 Pago con débito bancario |
| `/comprobante/[orderId]` | P-17 | CU-17 Emisión del comprobante |
| `/pedidos` | — | Listado propio, sin mockup — solo enlaza a pago/comprobante |

**Diferencias deliberadas frente al mockup** (documentadas también en el código):
- P-15 muestra campos de tarjeta en el mockup; aquí solo hay un botón "Pagar con tarjeta" que redirige a Stripe Checkout — RN-06 exige que ComproYa nunca reciba el número de tarjeta.
- P-17 tiene un botón "Descargar comprobante"; no hay generación de PDF en esta entrega (fuera de alcance, `arquitectura.md` §5), se reemplazó por "Volver al catálogo".

## Cómo correr en local

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL, por defecto http://localhost:3001/api
npm run dev                    # http://localhost:3000 (necesita el backend corriendo)
```

## Sesión, carrito de invitado y sucursal elegida

El token JWT, el `X-Cart-Token` de invitado (C-04) y la sucursal elegida en la ficha de producto se guardan en `localStorage` (`src/lib/api.ts`) — es una conveniencia del navegador, no la fuente de verdad (que es el backend). Tanto `/ingresar` como `/registro` llaman a `POST /carrito/fusionar` si había un carrito de invitado activo, para no perder lo que ya se había agregado.
