# Verificación del panel interno (REQ-016, REQ-017)

Generada por `e2e/capturas/verificar-interno.mjs` el 2026-11-17. Capturas en `design/verificacion-interno/`.

| Comprobación | Resultado | Detalle |
|---|---|---|
| [1440px] sin sesión, /admin/publicar lleva a /admin/ingresar | OK |  |
| [1440px] ingreso: sin violaciones de axe | OK |  |
| [1440px] ingreso: sin desborde horizontal | OK |  |
| [1440px] ninguna pantalla de la tienda enlaza a /admin (se entra solo por la dirección) | OK |  |
| [1440px] /admin no se indexa (X-Robots-Tag noindex) | OK | noindex, nofollow, noarchive |
| [1440px] contraseña equivocada muestra el error y no entra | OK |  |
| [1440px] con la sesión de un cliente, /admin/ventas sigue pidiendo el ingreso interno | OK |  |
| [1440px] el ingreso correcto vuelve a /admin/publicar y muestra la cuenta | OK | Coordinador de Canal Digital · coordinador@comproya.local |
| [1440px] publicar un producto con la sesión interna lo muestra en «Publicados recientemente» | OK | ZZVER-859756 |
| [1440px] el producto publicado aparece en el catálogo público con 15 unidades disponibles (20 − 5 de seguridad) | OK | unidades: 15 |
| [1440px] publicar: sin violaciones de axe | OK |  |
| [1440px] publicar: sin desborde horizontal | OK |  |
| [1440px] la lista de ventas muestra total vendido y cantidad | OK | 55 ventas, $ 38.927.384 |
| [1440px] la primera página trae a lo sumo 20 filas | OK | 20 filas |
| [1440px] ventas: sin violaciones de axe | OK |  |
| [1440px] ventas: sin desborde horizontal de la página | OK |  |
| [1440px] filtrar por «Entregado» baja la cantidad | OK | 55 → 1 |
| [1440px] un rango sin ventas dice «No hay ventas con esos filtros» | OK |  |
| [1440px] «Ver envío» muestra dirección y teléfono | OK |  |
| [1440px] después de «Salir», el panel vuelve a pedir el ingreso | OK |  |
| [1440px] sin errores de página | OK |  |
| [390px] sin sesión, /admin/publicar lleva a /admin/ingresar | OK |  |
| [390px] ingreso: sin violaciones de axe | OK |  |
| [390px] ingreso: sin desborde horizontal | OK |  |
| [390px] ninguna pantalla de la tienda enlaza a /admin (se entra solo por la dirección) | OK |  |
| [390px] /admin no se indexa (X-Robots-Tag noindex) | OK | noindex, nofollow, noarchive |
| [390px] contraseña equivocada muestra el error y no entra | OK |  |
| [390px] con la sesión de un cliente, /admin/ventas sigue pidiendo el ingreso interno | OK |  |
| [390px] el ingreso correcto vuelve a /admin/publicar y muestra la cuenta | OK | Coordinador de Canal Digital · coordinador@comproya.local |
| [390px] publicar: sin violaciones de axe | OK |  |
| [390px] publicar: sin desborde horizontal | OK |  |
| [390px] la lista de ventas muestra total vendido y cantidad | OK | 55 ventas, $ 38.927.384 |
| [390px] la primera página trae a lo sumo 20 filas | OK | 20 filas |
| [390px] ventas: sin violaciones de axe | OK |  |
| [390px] ventas: sin desborde horizontal de la página | OK |  |
| [390px] filtrar por «Entregado» baja la cantidad | OK | 55 → 1 |
| [390px] un rango sin ventas dice «No hay ventas con esos filtros» | OK |  |
| [390px] «Ver envío» muestra dirección y teléfono | OK |  |
| [390px] después de «Salir», el panel vuelve a pedir el ingreso | OK |  |
| [390px] sin errores de página | OK |  |

**40 de 40 comprobaciones sin observaciones.**
