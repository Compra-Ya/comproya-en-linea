// Límites de negocio compartidos entre módulos (evita que catálogo y carrito se importen entre sí).

/** Máximo de unidades de un mismo producto en un pedido. Lo hace cumplir el carrito y lo muestra la interfaz. */
export const MAX_UNIDADES_POR_PRODUCTO = 10;
