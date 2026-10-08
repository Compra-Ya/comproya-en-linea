// Modo de entrega del portal. La prueba de usabilidad se hace con venta digital y envío: el cliente
// agrega al carrito, elige la cantidad, escribe sus datos y su dirección, paga en la pasarela y ve el
// pedido confirmado (sin retiro en sucursal). El modo del canon (retiro en sucursal con código de
// retiro) sigue disponible: NEXT_PUBLIC_MODO_ENTREGA=retiro. Ver docs/modo-venta-digital.md.
export const MODO_ENVIO = process.env.NEXT_PUBLIC_MODO_ENTREGA !== "retiro";

/** Nombres de los cuatro pasos de la compra (los mismos que los títulos de cada pantalla). */
export const PASOS_COMPRA: string[] = MODO_ENVIO
  ? ["Carrito", "Datos y envío", "Pago", "Pedido confirmado"]
  : ["Carrito", "Confirmar pedido", "Pago", "Comprobante"];

export const TEXTOS = {
  mensajeSuperior: MODO_ENVIO ? "Compra en línea y recibe tu pedido en casa" : "Compra en línea y retira en sucursal",
  heroTitulo: MODO_ENVIO ? "Encuentra tu producto y recíbelo en tu casa" : "Encuentra tu producto y retíralo en tu sucursal",
  heroSubtitulo: MODO_ENVIO
    ? "Elige tus productos, escribe tu dirección y paga en línea de forma segura."
    : "Mira las unidades disponibles en cada sucursal, paga en línea y retira con tu código de retiro.",
  pasosHero: MODO_ENVIO ? ["Elige", "Paga en línea", "Recíbelo en casa"] : ["Elige", "Paga en línea", "Retira en sucursal"],
};

/** Colombia: departamentos y ciudades principales no hacen falta; la ciudad se escribe libre. */
export const ETIQUETAS_ENVIO = {
  nombre: "Nombre completo",
  telefono: "Teléfono de contacto",
  direccion: "Dirección de envío",
  ciudad: "Ciudad",
  notas: "Indicaciones para la entrega",
};
