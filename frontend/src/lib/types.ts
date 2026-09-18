// Tipos del lado del cliente — reflejan la forma de las respuestas del
// backend (backend/prisma/schema.prisma), no una entidad nueva.
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
}

export interface Carrito {
  id: number;
  customerId: number | null;
  guestToken: string | null;
  items: ItemCarrito[];
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

export interface Pedido {
  id: number;
  customerId: number;
  branchId: number;
  status: EstadoPedido;
  committedAt: string;
  pickupCode: string;
  pickupCodeExpiresAt: string;
  correlationId: string;
  items: ItemPedido[];
  payment?: { method: "CARD" | "BANK_DEBIT"; status: "PENDING" | "CONFIRMED" | "FAILED" } | null;
  branch?: Sucursal;
}

export interface Comprobante {
  idPedido: number;
  correlationId: string;
  pickupCode: string;
  pickupCodeExpiresAt: string;
  branch: Sucursal;
  items: ItemPedido[];
  pagadoEl: string;
}
