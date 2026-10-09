# Notice

Aviso en línea: error, estado del sistema, regla de negocio o modo de prueba. Todo error dice qué pasó, qué hacer y ofrece el botón que lo hace.

## Tonos

- `danger`: algo falló. `role="alert"`, siempre con `action`.
- `progress`: el sistema trabaja ("Estamos confirmando tu pago…"); con `progress` muestra una barra indeterminada.
- `warn`: algo espera al usuario (reserva de unidades mientras paga, pago pendiente).
- `test`: aviso de modo de prueba con la tarjeta 4242; borde punteado para que no se confunda con un error.
- `ok`: resultado confirmado.
- `info`: una regla explicada donde se aplica.

## Qué aporta quien lo usa

`title` (qué pasó), `children` (qué hacer ahora), `action` (uno o dos `Button` `secondary`/`ghost` tamaño `sm`), `icon` para cambiar el ícono del tono, `progress`.

## Reglas

- Nunca un mensaje técnico del servidor: nada de códigos, "Unauthorized" ni números internos.
- Nunca dos avisos que se contradicen: al cambiar de estado se reemplaza.
- Va junto a lo que lo causó. Aparece con un desvanecido de 200 ms.
