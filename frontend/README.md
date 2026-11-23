# Frontend — ComproYa en Línea

Next.js 15 con React 19 (App Router, TypeScript estricto; subió desde Next.js 14 el 22-nov-2026 para cerrar vulnerabilidades, NC-003). Las pantallas del Cliente digital y las de los roles internos (`/admin/publicar`, `/admin/pedidos/[id]`) viven en este mismo proyecto, separadas por ruta — no son dos aplicaciones distintas (`../docs/arquitectura.md` sección 4).

La interfaz del Cliente digital sigue el diseño aprobado en `design/rediseno/` y el sistema de diseño de `design/design-system/`. El flujo es la venta digital con envío (`../docs/modo-venta-digital.md`): catálogo → producto → carrito → datos y envío → pago con tarjeta → pedido confirmado → mis pedidos.

## Pantallas

| Ruta | Pantalla del diseño | Estados | Caso de uso |
|---|---|---|---|
| `/` y `/?q=` | Catálogo | éxito, cargando, búsqueda sin resultados, error, producto agregado | CU-02 |
| `/categoria/[id]` | Categoría | éxito, cargando, pocos productos | CU-02 |
| `/producto/[id]` | Detalle | disponible, agregado, agotado, cargando, no disponible | CU-02, CU-08 |
| `/carrito` | Carrito | con productos, vacío, cargando, error | CU-07, CU-08 |
| `/pedido/confirmar` | Datos y envío | normal, errores por campo, cupón válido, cupón inválido, sin sesión | CU-09, CU-10 |
| `/pago/[orderId]` | Pago | normal, abriendo la pasarela, no se completó (`?cancelado=1`), ya pagado, cancelado | CU-15 |
| `/comprobante/[orderId]` | Pedido confirmado | confirmado, confirmando, la confirmación tarda | CU-17 |
| `/pedidos` | Mis pedidos | con pedidos, vacío, sin sesión, cargando | — |
| `/ingresar`, `/registro` | Ingresar / Crear cuenta | ingresar, con error, crear cuenta, con errores | CU-04, CU-05 |
| `/privacidad` | — (sin rediseño) | — | CU-05 |
| `/admin/ingresar`, `/admin/publicar`, `/admin/ventas`, `/admin/pedidos/[id]` | — (sin rediseño) | — | CU-01, consulta de ventas (REQ-016) y transiciones internas |
| `/dev/componentes` | Galería de los 29 componentes | — | solo para revisión visual |

**El panel del Coordinador de Canal Digital no tiene botón en la tienda:** se entra solo escribiendo la dirección `/admin` (lleva a `/admin/ingresar` si no hay sesión interna). Usa una sesión aparte de la del Cliente digital (`comproya_staff_token` en `localStorage`, `interno: true` en `src/lib/api.ts`) y el marco `src/components/PanelInterno.tsx`. `e2e/capturas/verificar-interno.mjs` lo recorre en un navegador y comprueba que ninguna pantalla de la tienda enlace a `/admin`.

`/cuenta` redirige a `/privacidad` (`next.config.js`). El sitio no se indexa: `robots` en el layout y `X-Robots-Tag` en `next.config.js`.

## Cómo correr en local

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL, por defecto http://localhost:3001/api
npm run dev                    # http://localhost:3000 (necesita el backend corriendo)
npm run build && npm run lint  # ambos deben terminar sin errores
```

## Sistema de diseño

La fuente de verdad es `design/design-system/` (tokens, componentes, reglas). El frontend la consume así:

- `src/app/globals.css`: el bloque `:root` es una copia literal de `design/design-system/tokens.css`, más alias de los nombres anteriores (`--orange`, `--navy`…), y los estilos de `/privacidad` e `/admin`. No se editan los tokens aquí: se cambian en el sistema de diseño y se vuelven a copiar. `npm run tokens:comprobar` falla si dejan de coincidir.
- `src/components/ui/`: los 29 componentes en TSX, con las props de `design/design-system/components/index.d.ts` (`ui/tipos.ts` es copia generada). `bundle.js` es solo referencia de comportamiento y no se importa. Se importan siempre desde `@/components/ui`.
- Archivos generados por `npm run ui:sincronizar` (y verificados por `npm run ui:comprobar`): `src/components/ui/ui.css` (de `bundle.css`), `src/components/ui/tipos.ts` y `src/app/pantallas.css` (de `design/rediseno/pantallas/screens.css`). No se editan a mano.
- Extensiones al sistema de diseño, todas en `globals.css` o en el componente, nunca en los archivos generados: el `Tooltip` se desplaza para no salirse de la ventana (390 px), y el área de toque de 44 px del logo, el «?», las migas y «Buscar» se amplía con un pseudo-elemento invisible.
- Íconos: salen de los trazos del sistema (`ui/Icon.tsx`); todo ícono lleva una palabra visible y todo control de solo ícono lleva `aria-label` y tooltip con verbo.
- Precios: siempre con `formatCOP` (`$ 1.899.900`, sin decimales).
- Totales, descuentos, unidades y estados vienen del servidor; la interfaz no los recalcula.

## Estructura útil

- `src/components/Pantalla.tsx`: cabecera, `<main>` y pie académico de cada pantalla. `ShopHeaderConectado.tsx` pone la sesión y el carrito en la cabecera, y `AccesoLayout.tsx` es el marco de ingresar y crear cuenta.
- `src/lib/api.ts`: cliente del backend (token, `X-Cart-Token`, errores; una respuesta 401 con token cierra la sesión local). `src/lib/eventos.ts` avisa a la cabecera cuando cambian el carrito o la sesión. `src/lib/categorias.ts` tiene los nombres, descripciones y fotos de las categorías en español.

## Sesión y carrito de invitado

El token JWT y el `X-Cart-Token` de invitado (C-04) se guardan en `localStorage` — es una conveniencia del navegador, no la fuente de verdad (que es el backend). `/ingresar` y `/registro` llaman a `POST /carrito/fusionar` si había un carrito de invitado, y llevan a la persona de vuelta a donde estaba (`?volver=`).

## Verificación

Desde `../e2e/`, con base local, backend y frontend corriendo:

- `node capturas/verificar-rediseno.mjs`: captura los 36 estados de pantalla a 1440 y 390 px en `design/verificacion-rediseno/pantallas/`, mide el desborde horizontal y escribe `design/verificacion-rediseno/tabla-verificacion.md`.
- `node capturas/verificar-teclado.mjs`: recorre el flujo hasta la pasarela solo con teclado y escribe `design/verificacion-rediseno/teclado.md`.
