// Avisos entre pantallas y cabecera: cuando cambia el carrito o la sesión, la cabecera (que muestra la
// cantidad y el subtotal del servidor) vuelve a pedirlos sin recargar la página.
const EVENTO_CARRITO = "comproya:carrito";
const EVENTO_SESION = "comproya:sesion";

function avisar(nombre: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(nombre));
}

function escuchar(nombre: string, alAvisar: () => void): () => void {
  window.addEventListener(nombre, alAvisar);
  return () => window.removeEventListener(nombre, alAvisar);
}

export const avisarCambioDeCarrito = () => avisar(EVENTO_CARRITO);
export const alCambiarElCarrito = (cb: () => void) => escuchar(EVENTO_CARRITO, cb);
export const avisarCambioDeSesion = () => avisar(EVENTO_SESION);
export const alCambiarLaSesion = (cb: () => void) => escuchar(EVENTO_SESION, cb);
