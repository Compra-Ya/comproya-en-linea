// Tipos de las filas de siembra (seed), un bloque por módulo del canon.
// Los comentarios citan en español los identificadores del canon para
// mantener trazabilidad; los nombres de tipo/campo van en inglés.

// --- Módulo catalogo (SP-01, SP-02) ---

export interface ProductSeed {
  homologatedCode: string;
  name: string;
  category: string;
  brand: string | null;
  cost: number;
  digitalPrice: number;
  published: boolean;
  source: "DUMMYJSON" | "SYNTHETIC";
}

export interface BranchSeed {
  name: string;
  city: string;
}

export interface AvailabilitySeed {
  erpUnits: number;
  safetyThreshold: number;
  reservedUnits: number;
  syncedAt: Date;
}

// --- Módulo cuenta (SP-07, SP-08) ---

export interface CustomerSeed {
  document: string;
  name: string;
  email: string;
  passwordHash: string;
  loyaltyId: string | null;
  consentActive: boolean;
}

// --- Módulo carrito (SP-03) ---

export interface CartSeed {
  customerDocument: string | null; // null = carrito de invitado
  items: { productHomologatedCode: string; quantity: number }[];
}

// --- Módulo pedido (SP-04, SP-06) ---

export type OrderStatus =
  | "CREATED"
  | "PAID"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "DELIVERED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export interface OrderSeed {
  customerDocument: string;
  branchName: string;
  status: OrderStatus;
  committedAt: Date;
  pickupCode: string;
  pickupCodeExpiresAt: Date;
  correlationId: string;
  createdAt: Date;
  statusHistory: { status: OrderStatus; occurredAt: Date }[];
  items: { productHomologatedCode: string; quantity: number; unitPrice: number }[];
}

export interface LoyaltyCouponSeed {
  code: string;
  percentage: number;
  active: boolean;
}

// --- Módulo pago (SP-05) ---

export interface PaymentSeed {
  orderPickupCode: string;
  method: "CARD" | "BANK_DEBIT";
  status: "PENDING" | "CONFIRMED" | "FAILED";
  gatewayToken: string;
  confirmedAt: Date | null;
}
