# Frontend — ComproYa en Línea

Next.js (App Router, TypeScript). Las pantallas del Cliente digital y las de los roles internos (por ahora solo `/interno/publicar`, del Coordinador de Canal Digital) viven en este mismo proyecto, separadas por ruta — no son dos aplicaciones distintas (`../docs/arquitectura.md` sección 4).

## Pantallas construidas

| Ruta | Mockup | Caso de uso |
|---|---|---|
| `/` | P-2, P-3 | CU-02 Búsqueda de productos, CU-03 Disponibilidad por sucursal |
| `/interno/publicar` | P-1 | CU-01 Publicación de producto |
| `/registro` | P-4 | CU-04 Registro de cuenta |
| `/ingresar` | — | Login (soporte de CU-04, sin mockup propio) |
| `/privacidad` | P-5 | CU-05 Administración del consentimiento (incluye RN-11) |
| `/carrito` | P-7, P-8 | CU-07 Administración del carrito, CU-08 Productos complementarios |
| `/pedido/confirmar` | P-9, P-10 | CU-09 Confirmación del pedido, CU-10 Cupón de lealtad |
| `/pago/[orderId]` | P-15, P-16 | CU-15 Pago con tarjeta (Stripe), CU-16 Pago con débito bancario |
| `/comprobante/[orderId]` | P-17 | CU-17 Emisión del comprobante |
| `/pedidos` | — | Listado propio, sin mockup — solo enlaza a pago/comprobante |

## Cómo correr en local

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL, por defecto http://localhost:3001/api
npm run dev                    # http://localhost:3000 (necesita el backend corriendo)
```

## Sesión y carrito de invitado

El token JWT y el `X-Cart-Token` de invitado (C-04) se guardan en `localStorage` (`src/lib/api.ts`) — es una conveniencia del navegador, no la fuente de verdad (que es el backend). Al iniciar sesión con un carrito de invitado activo, `/ingresar` llama a `POST /carrito/fusionar` para no perder lo que ya se había agregado.
