// Tipos del lado del cliente — reflejan la forma de las respuestas del backend
// (backend/prisma/schema.prisma y los servicios de cada módulo), no una entidad nueva. Los totales
// (subtotal, descuento, total, total de línea) y las unidades disponibles los calcula el servidor:
// la interfaz los muestra, no los recalcula.
export interface Categoria {
  id: number;
  name: string;
  productCount?: number;
}

export interface Producto {
  id: number;
  homologatedCode: string;
  name: string;
  categoryId: number;
  category?: Categoria;
  brand?: string | null;
  cost: string;
  digitalPrice: string;
  published: boolean;
  imageUrl?: string | null;
  /** Unidades que una sola sucursal puede despachar (RN-03). Viene en catálogo y detalle. */
  unidadesDisponibles?: number;
  /** Máximo que se puede pedir de una vez: el menor entre las unidades disponibles y el tope por producto. */
  maximoPorPedido?: number;
}

export interface ListaDeProductos {
  items: Producto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Sucursal {
  id: number;
  name: string;
  city: string;
}

export interface Disponibilidad {
  productId: number;
  branchId: number;
  availabilityId: number;
  erpUnits: number;
  safetyThreshold: number;
  reservedUnits: number;
  unidadesDisponibles: number;
  syncedAt: string;
  puedeRetirar: boolean;
}

export interface Cliente {
  id: number;
  document: string;
  name: string;
  email: string;
  loyaltyId?: string | null;
  createdAt: string;
}

export interface SesionCliente {
  customer: Cliente;
  accessToken: string;
}

export interface Consentimiento {
  id: number;
  customerId: number;
  active: boolean;
  updatedAt: string;
}

export interface ItemCarrito {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: Producto;
  /** Total de la línea, calculado por el servidor. */
  lineTotal: number;
}

export interface Carrito {
  id: number;
  customerId: number | null;
  guestToken: string | null;
  items: ItemCarrito[];
  subtotal: number;
  /** Suma de las cantidades de todas las líneas. */
  unidades: number;
  maxPorProducto: number;
}

/** Respuesta de POST /cupones/validar: el descuento y el total reales sobre el carrito. */
export interface CuponValidado {
  codigo: string;
  porcentaje: number;
  subtotal: number;
  descuento: number;
  total: number;
}

export interface ItemPedido {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  product: Producto;
}

export type EstadoPedido =
  | "CREATED"
  | "PAID"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "DELIVERED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export type ModalidadEntrega = "PICKUP" | "SHIPPING";

export interface DatosEnvio {
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingNotes?: string | null;
}

/** Totales del pedido calculados por el servidor (los mismos que se cobran en la pasarela). */
export interface TotalesDelPedido {
  subtotal: number;
  descuento: number;
  total: number;
  codigoCupon: string | null;
  porcentajeCupon: number | null;
}

export interface Pedido extends DatosEnvio, TotalesDelPedido {
  id: number;
  customerId: number;
  branchId: number;
  deliveryMode?: ModalidadEntrega;
  status: EstadoPedido;
  committedAt: string;
  createdAt: string;
  pickupCode: string;
  pickupCodeExpiresAt: string;
  correlationId: string;
  items: ItemPedido[];
  payment?: { method: "CARD" | "BANK_DEBIT"; status: "PENDING" | "CONFIRMED" | "FAILED" } | null;
  branch?: Sucursal;
}

export interface Comprobante extends DatosEnvio {
  idPedido: number;
  deliveryMode?: ModalidadEntrega;
  correlationId: string;
  pickupCode: string;
  pickupCodeExpiresAt: string;
  branch: Sucursal;
  items: ItemPedido[];
  pagadoEl: string;
  subtotal: number;
  descuento: number;
  codigoCupon: string | null;
  total: number;
}

// --- Cuenta interna y consulta de ventas (REQ-016, REQ-017) ---------------------------------------------------------
export interface SesionInterna {
  staff: { id: number; name: string; email: string; role: string };
  accessToken: string;
}

export type EstadoDeVenta = "PAID" | "PREPARING" | "READY_FOR_PICKUP" | "DELIVERED";

export interface Venta {
  id: number;
  fecha: string;
  estado: EstadoDeVenta;
  cliente: { id: number; nombre: string };
  productos: Array<{ nombre: string; cantidad: number }>;
  unidades: number;
  subtotal: number;
  descuento: number;
  total: number;
  codigoCupon: string | null;
  porcentajeCupon: number | null;
  envio: { nombre: string | null; telefono: string | null; direccion: string; ciudad: string | null; notas: string | null } | null;
}

export interface ListaDeVentas {
  items: Venta[];
  /** Cantidad de ventas que cumplen el filtro (todas las páginas). */
  total: number;
  page: number;
  pageSize: number;
  /** Suma de los totales de todas las ventas del filtro, calculada por el servidor. */
  totalVendido: number;
}
