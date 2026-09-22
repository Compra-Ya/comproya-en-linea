# Fuente de los mockups — ComproYa en Línea

Esta carpeta guarda el código fuente real de las 18 pantallas del canvas de mockups (17 `P-n` del canon + el componente `ProductCard` reutilizable), en formato `.dc.html` (Claude Design Components: HTML con plantillas `{{ }}`, `<sc-if>`, `<sc-for>` y una clase `DCLogic` opcional para estado).

**Por qué está acá:** el canvas vive publicado como Artifact en claude.ai, pero ese link no tiene historial de versiones en git — si algo hay que auditar, revertir o retomar en otra sesión, la fuente de verdad reproducible es esta carpeta, no el link.

**Canvas publicado (vista visual, pan/zoom):**
https://claude.ai/code/artifact/83b70b5e-3664-4b08-abfb-a89cf8ecbe94

## Qué es cada cosa

- `Main.dc.html` — Landing / P-2 (búsqueda de productos), con modo oscuro funcional, mega-menú de categorías, hero animado.
- `Main-Movil.dc.html` — misma Landing en versión móvil (390px), con el menú hamburguesa abierto.
- `ModalLogin.dc.html` — mecanismo de sesión (no es un CU del canon).
- `P4-Registro.dc.html` — CU-04, como modal.
- `P1-Publicacion.dc.html`, `P3-Disponibilidad.dc.html`, `P5-Consentimiento.dc.html`, `P7-Carrito.dc.html`, `P8-Complementarios.dc.html`, `P9-Confirmacion.dc.html`, `P10-Cupon.dc.html`, `P11-EstadoPedido.dc.html`, `P12-Alistamiento.dc.html`, `P13-Cancelacion.dc.html`, `P14-PedidosRiesgo.dc.html`, `P15-PagoTarjeta.dc.html`, `P16-PagoDebito.dc.html`, `P17-Comprobante.dc.html` — el resto de los CU del canon, uno por archivo.
- `ProductCard.dc.html` — tarjeta de producto reutilizable (importada por `Main.dc.html`).
- `canvas.json` — layout: posición, tamaño y página de cada artboard en el canvas.

El detalle de qué caso de uso, actor y regla de negocio corresponde a cada pantalla está en `docs/mockups-plan.md` y `docs/mockups-brief.md` — esta carpeta es el código, esos documentos son la trazabilidad al canon.

## Cómo se regenera el canvas publicado a partir de esto

Estos `.dc.html` no son el archivo que se publica directamente — se empaquetan con el helper del skill `design` de Claude Code (`seed-canvas.mjs`) dentro de una copia del runtime del editor, y ese resultado sí se publica como Artifact. Para reconstruirlo:

```bash
node seed-canvas.mjs \
  --template payload.template.html \
  --out comproya-mockups-soft.html \
  --title "ComproYa Mockups" \
  --artboard Main.dc.html --artboard Main-Movil.dc.html \
  --artboard ModalLogin.dc.html --artboard P4-Registro.dc.html \
  --artboard P1-Publicacion.dc.html --artboard P3-Disponibilidad.dc.html \
  --artboard P5-Consentimiento.dc.html --artboard P7-Carrito.dc.html \
  --artboard P8-Complementarios.dc.html --artboard P9-Confirmacion.dc.html \
  --artboard P10-Cupon.dc.html --artboard P15-PagoTarjeta.dc.html \
  --artboard P16-PagoDebito.dc.html --artboard P17-Comprobante.dc.html \
  --artboard P11-EstadoPedido.dc.html --artboard P12-Alistamiento.dc.html \
  --artboard P13-Cancelacion.dc.html --artboard P14-PedidosRiesgo.dc.html \
  --artboard ProductCard.dc.html \
  --canvas canvas.json
```

El archivo resultante (`comproya-mockups-soft.html`) no se guarda en el repositorio — es un artefacto de build (~2 MB, incluye el runtime del editor completo), regenerable en cualquier momento a partir de esta carpeta. Solo la fuente se versiona.

## Estilo

Manrope, navy `#17457F`, naranja `#E8681C`, fondo `#F4F6F8`, radios generosos, sombras difusas. Ver `docs/mockups-brief.md` sección 2 para la tabla completa de tokens.
