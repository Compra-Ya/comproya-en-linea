# Brief de mockups — ComproYa en Línea

Este documento acompaña el canvas de mockups publicado y le da a cada pantalla su trazabilidad al canon, su módulo de backend y sus componentes reutilizables del repositorio `comproya` (ya construido), para que el equipo empiece a implementar sin tener que reinterpretar nada.

**Canvas de mockups (fuente visual, un solo lienzo con pan/zoom):**
https://claude.ai/code/artifact/80701909-a131-45bb-b82a-ce6c8cc572ad

El canvas trae, de arriba hacia abajo: la landing y los accesos (login/registro), y luego las 17 pantallas del canon en el orden de sprint de `docs/mockups-plan.md`.

## 1. Qué NO es parte del canon (léase antes de implementar)

Tres pantallas del canvas no tienen código `P-n` ni `CU-XX` propio — no son alcance nuevo, son presentación:

| Pantalla | Qué es en realidad | Por qué existe |
|---|---|---|
| Landing | Ampliación de **P-2 / CU-02** (Búsqueda de productos) | El canon no define una "página de inicio" separada; esta es la misma pantalla de catálogo con una cabecera de presentación (hero, confianza, categorías, vitrinas) antes de la búsqueda |
| Modal de login | Mecanismo de sesión de `docs/arquitectura.md` sección 7 (JWT propio) | No es un caso de uso del canon — es el requisito técnico de "cuenta" que habilita CU-04 en adelante |
| Modal de registro | **P-4 / CU-04** (Registro de cuenta), en formato overlay en vez de página completa | Mismo caso de uso, otra presentación, a pedido del equipo |

Si el docente pide justificar estas tres pantallas en el entregable académico, la respuesta es la de esta tabla — no inventarles un código nuevo.

## 2. Sistema de diseño (ya existe en el repo `comproya`, los mockups solo lo siguen)

Todos los tokens de color, tipografía y radios vienen de `src/app/globals.css` y `src/components/ui/*` del repo `comproya` — los mockups no inventaron ninguno:

| Token | Valor | Uso |
|---|---|---|
| `--primary` / `--brand-orange` | `#f2661d` | Acciones primarias (CTA), precios destacados, insignias de descuento |
| `--secondary` / `--brand-navy` | `#163d6d` | Barra de utilidad, footer, estado activo de navegación interna |
| `--accent` | `#fef1e7` | Fondos suaves detrás de iconos e insignias |
| `--destructive` | ~`#dc2626` (oklch 0.577 0.245 27.325) | Estados de riesgo/cancelación |
| Verde de éxito | `#059669` / `#d1fae5` | Confirmaciones, "sincronizado", "publicado" |
| Tipografía | Geist (`--font-geist-sans`) | Único tipo de letra, sin pareja tipográfica nueva |
| Radios | `--radius: 0.625rem` (botones/inputs), `xl` en tarjetas de producto | Igual que `button.tsx` / `product-card.tsx` |

**Componentes ya existentes que los mockups reutilizan tal cual** (implementar contra estos, no rehacerlos):

- `src/components/layout/header.tsx` → cabecera de Landing, P-2, P-3, P-5, P-7, P-9, P-11
- `src/components/product/product-card.tsx` → tarjetas de producto en Landing y P-2
- `src/components/admin/admin-shell.tsx` → sidebar de P-1, P-12, P-14
- `src/components/ui/dialog.tsx` → estructura del modal de login/registro
- `src/components/auth/login-form.tsx` y `signup-form.tsx` → contenido de los modales (mover de página completa a `DialogContent`)
- `src/components/layout/footer.tsx`, `home/trust-badges.tsx`, `home/category-grid.tsx`, `home/promo-banner-grid.tsx`, `home/wide-banner.tsx`, `home/product-section.tsx` → secciones de la Landing

## 3. Pantallas por sprint, con su módulo y sus reglas de negocio

Mismas tareas que `docs/plan-de-trabajo.md` — aquí solo se cruzan con el mockup correspondiente para que el frontend arranque directo.

### Sprint 1 · módulo `catalogo` (SP-01, SP-02) — sin sesión

| Mockup | CU | Actor | RN/C que valida | Frontend |
|---|---|---|---|---|
| P-1 | CU-01 Publicación de producto | Coordinador de Canal Digital | RN-01 (código homologado + publicación explícita), RN-02 (precio digital ≥ costo) | Panel interno, formulario + tabla de publicados |
| P-2 / Landing | CU-02 Búsqueda de productos | Cliente digital | Umbral P95 ≤ 1,5 s desde 3 caracteres | Buscador + grilla de tarjetas de producto |
| P-3 | CU-03 Disponibilidad por sucursal | Cliente digital | RN-03 (existencias − umbral − reservas), RN-04 (>15 min sin sync deshabilita retiro) | Selector de sucursal + tabla de disponibilidad |

### Sprint 2 · módulo `cuenta` (SP-07, SP-08)

| Mockup | CU | Actor | RN/C que valida | Frontend |
|---|---|---|---|---|
| P-4 / Modal de registro | CU-04 Registro de cuenta | Cliente digital | C-14 (vínculo a identificador de lealtad) | Formulario de registro (página o modal) |
| — Modal de login | (mecanismo de sesión, no CU) | Cliente digital | — | Formulario de login (arquitectura §7) |
| P-5 | CU-05 Administración del consentimiento | Cliente digital · Oficial de Protección de Datos | Activar/revocar ≤ 2 interacciones; RN-11 (supresión ≤ 72 h) | Switch de consentimiento + botón de supresión |

### Sprint 3 · módulo `carrito` (SP-03)

| Mockup | CU | Actor | RN/C que valida | Frontend |
|---|---|---|---|---|
| P-7 | CU-07 Administración del carrito | Cliente digital | Persistencia y fusión entre dispositivos ≤ 30 s | Lista de líneas + resumen |
| P-8 | CU-08 Productos complementarios | Cliente digital · Analista de Marketing | Tope de 4 productos (C-05) | Panel adjunto al carrito, no pantalla aparte |

### Sprint 4 · módulo `pedido`, confirmación (SP-04)

| Mockup | CU | Actor | RN/C que valida | Frontend |
|---|---|---|---|---|
| P-9 | CU-09 Confirmación del pedido | Cliente digital | RN-05 (reserva antes de cobrar) | Resumen + botón de confirmar |
| P-10 | CU-10 Cupón de lealtad | Cliente digital | RN-07 (redención única), reflejo ≤ 2 s | Campo de cupón dentro de la confirmación |

### Sprint 5 · módulo `pago` (SP-05)

| Mockup | CU | Actor | RN/C que valida | Frontend |
|---|---|---|---|---|
| P-15 | CU-15 Pago con tarjeta | Cliente digital | RN-06 (solo token de la pasarela) | Formulario de tarjeta con pestaña activa |
| P-16 | CU-16 Pago con débito bancario | Cliente digital | Cancelación a los 30 min sin confirmar | Selector de banco + estado pendiente |
| P-17 | CU-17 Emisión del comprobante | Cliente digital · Gerente de Tienda | RN-08 (código de retiro, 5 días, un solo uso) | Comprobante con código e identificador de correlación |

### Sprint 6 · módulo `operacion` (SP-06)

| Mockup | CU | Actor | RN/C que valida | Frontend |
|---|---|---|---|---|
| P-11 | CU-11 Estado del pedido | Cliente digital | Notificación de cambio ≤ 5 min | Línea de tiempo de estados |
| P-12 | CU-12 Alistamiento y entrega | Gerente de Tienda | Descuento de inventario tras alistar ≤ 5 min | Panel interno con tabla + validación de código |
| P-13 | CU-13 Cancelación del pedido | Cliente digital | RN-09 (solo antes de alistamiento) | Botón de cancelar junto al seguimiento |
| P-14 | CU-14 Pedidos en riesgo | Coordinador de Canal Digital | C-13 (riesgo a las 4 h hábiles) | Panel interno con tabla de riesgo |

## 4. Pendiente para el equipo (no resuelto en el mockup, decisión de producto)

- **Login como modal**: implica que el `Header` deba poder abrir un `Dialog` de auth desde cualquier ruta pública, en vez de redirigir a `/cuenta/iniciar-sesion`. Definir si la ruta de página completa se mantiene como *fallback* (por ejemplo para el enlace directo que llega por correo) o se retira.
- **Landing vs. catálogo**: decidir si la Landing es la ruta `/` real y `/categoria/[slug]` reutiliza los mismos componentes de vitrina, o si la Landing es exclusivamente la home y el resto del catálogo usa el layout más denso de P-2.
- Ninguna pantalla del canvas incluye código de producción — son referencia visual en formato `.dc.html` estático, no componentes React. La implementación se hace contra los componentes reales listados en la sección 2.
