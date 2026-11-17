"""Texto de cada historia (Jira) y su criterio de aceptación con la prueba TEST-nnn (PGR-001, Anexo 6.5)."""

CRITERIOS = {
    "HU-101": ("Como Coordinador de Canal Digital, quiero crear y publicar un producto con su código homologado, su precio digital "
               "y sus existencias, para que los clientes lo puedan comprar.", "Producto visible en ≤ 5 minutos; rechazo de código "
               "no homologado y de precio bajo el costo (TEST-001).", "1.1.1"),
    "HU-102": ("Como Cliente digital, quiero buscar por texto o por categoría, para encontrar el producto que quiero comprar.",
               "Búsqueda desde 3 caracteres solo con productos publicados; filtro por categoría (TEST-002).", "1.1.2"),
    "HU-103": ("Como Cliente digital, quiero ver cuántas unidades puedo pedir de un producto, para no pedir lo que no hay.",
               "Existencias 20, umbral 5 y sin reservas → 15 unidades; nunca cifra negativa (TEST-003, RN-03).", "1.1.3"),
    "HU-104": ("Necesidad técnica: leer las existencias y validar los códigos homologados a través de la interfaz con el ERP "
               "(simulada).", "Existencias y códigos solo por la interfaz con el ERP (TEST-004).", "1.1.4"),
    "HU-105": ("Como Cliente digital, quiero crear mi cuenta e ingresar con mi correo, para comprar y ver mis pedidos.",
               "Cuenta con documento y correo únicos, contraseña de 8 o más caracteres; ingreso rechazado con datos "
               "incorrectos (TEST-005).", "1.2.1"),
    "HU-106": ("Como Cliente digital, quiero aceptar o revocar el tratamiento de mis datos y pedir que los supriman, para "
               "controlar mi información.", "Aceptar o revocar en ≤ 2 interacciones; supresión ejecutada en ≤ 72 h "
               "(TEST-006, RN-08).", "1.2.2"),
    "HU-107": ("Como Cliente digital, quiero agregar, cambiar y quitar productos de mi carrito, para armar mi compra antes de pagar.",
               "Máximo 10 unidades por producto; el carrito de invitado se une al de la cuenta (TEST-008).", "1.3.1"),
    "HU-108": ("Como Cliente digital, quiero confirmar mi pedido con mi dirección de envío, para que me lo despachen a mi casa.",
               "Pedido con totales del servidor y unidades reservadas antes del cobro (TEST-009, RN-04).", "1.3.2"),
    "HU-109": ("Como Cliente digital, quiero aplicar un código de descuento a mi pedido, para pagar menos.",
               "El código se redime una sola vez por pedido aunque se reintente (TEST-010, RN-06).", "1.3.3"),
    "HU-110": ("Necesidad técnica: reservar y liberar las unidades de un pedido a través de la interfaz con el ERP (simulada).",
               "Reserva al confirmar; liberación al cancelar o al fallar el pago (TEST-011).", "1.3.4"),
    "HU-111": ("Como Cliente digital, quiero pagar mi pedido con tarjeta en la página de la pasarela, para no entregar mis datos "
               "de tarjeta a la tienda.", "Pedido Pagado en ≤ 60 s con la notificación de la pasarela; solo se guarda el token "
               "(TEST-014, RN-05).", "1.4.1"),
    "HU-112": ("Como Cliente digital, quiero ver el comprobante cuando mi pago se confirme, para tener prueba de mi compra.",
               "El comprobante existe solo tras el pago confirmado y solo para el dueño del pedido (TEST-015).", "1.4.2"),
    "HU-113": ("Como Cliente digital, quiero ver la lista de mis pedidos y su estado, para saber cómo va mi compra.",
               "Pedidos con productos, total y estado; con la sesión de otro cliente el acceso se rechaza (TEST-012).", "1.3.5"),
    "HU-114": ("Como Coordinador de Canal Digital, quiero ver la lista de ventas por fecha y estado con el total vendido, para "
               "saber qué se ha vendido sin armar planillas.", "20 ventas por página, filtros por fecha y estado y total del "
               "periodo; solo con la cuenta interna (TEST-012).", "1.3.5"),
    "HU-115": ("Como Cliente digital, quiero cancelar un pedido que aún no pagué, para liberar lo que reservé.",
               "Pedido propio no pagado queda Cancelado y libera sus unidades en ≤ 5 min; uno pagado o ajeno no (TEST-013, RN-07).",
               "1.3.6"),
    "HU-116": ("Como Coordinador de Canal Digital, quiero ingresar con mi cuenta interna por la dirección /admin, para que solo yo "
               "pueda publicar productos y ver las ventas.", "Sin sesión interna las funciones de administración se rechazan; "
               "ninguna pantalla de la tienda enlaza a /admin (TEST-007).", "1.2.3"),
    "HU-117": ("Necesidad de calidad: medir el rendimiento de la búsqueda y de la confirmación, y aplicar la prueba con usuarios.",
               "Búsqueda P95 ≤ 1,5 s; confirmación P95 ≤ 3 s; 5 participantes con ≥ 80 % de tareas completadas (TEST-016, "
               "TEST-017).", "1.5.3"),
}
