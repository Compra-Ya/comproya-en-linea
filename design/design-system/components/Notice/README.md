# Notice

Aviso en línea para errores, estado del sistema y reglas de negocio: todo error dice qué pasó, qué hacer y ofrece el botón que lo hace (UT-04).

## Tonos

- `danger`: algo falló y el usuario debe actuar. `role="alert"`. Siempre con `action`.
- `warn`: algo vence o espera al usuario (reserva de unidades, pago pendiente).
- `progress`: el sistema está trabajando ("Procesando el pago…", "Esperando la confirmación de tu banco"). Lleva spinner y, si hay plazo, la hora límite (UT-07).
- `ok`: resultado confirmado.
- `info`: una regla explicada donde se aplica, en una línea (UT-05).

## Qué aporta quien lo usa

`title` (qué pasó, una frase), `children` (qué hacer ahora), `action` (un `Button` `secondary` o `ghost`, o varios). Usa los textos de `06-copy.md`.

## Reglas

- Nunca un mensaje del servidor tal cual: nada de "Unauthorized", "X-Debito-Secreto", "RN-04", "ERP", ni números de sucursal o producto. Usa nombres.
- Nunca dos avisos que se contradicen a la vez (A-08): al cambiar de estado, reemplaza el aviso.
- Colócalo junto a lo que lo causó (bajo el campo, bajo el botón), no arriba de la página.
- Un error no espera 30 s detrás de un "cargando": si el servidor ya respondió 400 o 403, muéstralo de inmediato.
