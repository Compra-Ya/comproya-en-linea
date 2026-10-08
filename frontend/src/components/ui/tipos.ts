// Tipos públicos de los componentes de ui/, tomados de
// design/design-system/components/index.d.ts (solo los que ya están implementados).
import type * as React from "react";

export type IconName =
  | "cart" | "search" | "check" | "check-circle" | "alert" | "warn" | "info" | "clock" | "store" | "user"
  | "package" | "chevron-left" | "chevron-right" | "minus" | "plus" | "x" | "ticket" | "card" | "bank" | "receipt";

export interface IconProps {
  name: IconName;
  size?: number;
  title?: string;
  className?: string;
}

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  /** primary: una por pantalla · secondary: salidas · ghost: dentro de avisos · danger: solo "Cancelar pedido" */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** lg (46 px) solo para la acción que avanza un paso */
  size?: "md" | "lg";
  full?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  /** Con href se pinta un enlace con forma de botón */
  href?: string;
  className?: string;
}

export interface NoticeProps {
  tone?: "info" | "ok" | "warn" | "danger" | "progress";
  /** Qué pasó */
  title?: React.ReactNode;
  /** Qué hacer ahora */
  children?: React.ReactNode;
  /** El botón o enlace que lo hace */
  action?: React.ReactNode;
  className?: string;
}

export interface ShopHeaderProps {
  variant?: "full" | "compact";
  active?: "catalogo" | "carrito" | "pedidos" | "cuenta";
  cartCount?: number;
  /** Subtotal del carrito, en pesos */
  cartTotal?: number;
  customerName?: string;
  logoutHref?: string;
  /** Extensión del sistema de diseño: acción de cerrar sesión cuando no basta un enlace. */
  onLogout?: () => void;
  /** Número real de sucursales con retiro; omitir si no se conoce */
  branchesWithPickup?: number;
  /** Texto de la barra superior; por defecto el del modo de entrega vigente. */
  topMessage?: string;
  query?: string;
  onSearch?: (q: string) => void;
  className?: string;
}

export interface CheckoutStepsProps {
  current: 1 | 2 | 3 | 4;
  /** Nombres de los cuatro pasos; por defecto los del canon (Carrito, Confirmar pedido, Pago, Comprobante). */
  steps?: string[];
  back?: { label: string; href: string };
  className?: string;
}
