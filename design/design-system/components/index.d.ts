import type * as React from 'react';

/** Nombres de ícono disponibles. */
export type IconName = 'cart' | 'search' | 'check' | 'check-circle' | 'alert' | 'warn' | 'info' | 'clock' | 'store' | 'user' | 'package' | 'chevron-left' | 'chevron-right' | 'minus' | 'plus' | 'x' | 'ticket' | 'card' | 'bank' | 'receipt';

/** Estados del pedido del canon. */
export type OrderStatusKey = 'creado' | 'pagado' | 'en-alistamiento' | 'listo-para-retiro' | 'entregado' | 'cancelado' | 'pago-fallido';

export interface IconProps { name: IconName; size?: number; title?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: una por pantalla · secondary: salidas · ghost: dentro de avisos · danger: solo "Cancelar pedido" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** lg (46 px) solo para la acción que avanza un paso */
  size?: 'md' | 'lg';
  full?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  /** Con href se pinta un enlace con forma de botón */
  href?: string;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface NoticeProps {
  tone?: 'info' | 'ok' | 'warn' | 'danger' | 'progress';
  /** Qué pasó */
  title?: React.ReactNode;
  /** Qué hacer ahora */
  children?: React.ReactNode;
  /** El botón o enlace que lo hace */
  action?: React.ReactNode;
  className?: string;
}
export declare function Notice(props: NoticeProps): React.ReactElement;

export interface BadgeProps { tone?: 'neutral' | 'info' | 'ok' | 'warn' | 'danger' | 'brand'; icon?: IconName; children?: React.ReactNode; className?: string }
export declare function Badge(props: BadgeProps): React.ReactElement;

export interface OrderStatusProps { status: OrderStatusKey; className?: string }
export declare function OrderStatus(props: OrderStatusProps): React.ReactElement;

export interface SpinnerProps { label?: string; className?: string }
export declare function Spinner(props: SpinnerProps): React.ReactElement;

export interface SkeletonProps { variant?: 'text' | 'product-card' | 'line-item'; count?: number; label?: string; className?: string }
export declare function Skeleton(props: SkeletonProps): React.ReactElement;

export interface FieldOption { value: string; label: string; disabled?: boolean }
export interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  /** La regla antes de equivocarse */
  hint?: string;
  /** Qué pasó y qué hacer; conserva el valor escrito */
  error?: string;
  optional?: boolean;
  as?: 'input' | 'select';
  options?: FieldOption[];
}
export declare function Field(props: FieldProps): React.ReactElement;

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { label: React.ReactNode; error?: string }
export declare function Checkbox(props: CheckboxProps): React.ReactElement;

export interface TabsItem { id: string; label: string; icon?: IconName }
export interface TabsProps { items: TabsItem[]; value: string; onChange?: (id: string) => void; label?: string; className?: string }
export declare function Tabs(props: TabsProps): React.ReactElement;

export interface QuantityStepperProps { value: number; onChange?: (value: number) => void; min?: number; max?: number; label?: string; className?: string }
export declare function QuantityStepper(props: QuantityStepperProps): React.ReactElement;

export interface CouponFieldProps {
  value: string;
  onChange?: (value: string) => void;
  onApply?: () => void;
  onRemove?: () => void;
  status?: 'idle' | 'checking' | 'applied' | 'invalid';
  /** Ej.: "Cupón LEALTAD10 aplicado: 10 % de descuento." con el dato del servidor */
  appliedText?: string;
  errorText?: string;
  id?: string;
  className?: string;
}
export declare function CouponField(props: CouponFieldProps): React.ReactElement;

export interface ShopHeaderProps {
  variant?: 'full' | 'compact';
  active?: 'catalogo' | 'carrito' | 'pedidos' | 'cuenta';
  cartCount?: number;
  /** Subtotal que devuelve el servidor */
  cartTotal?: number;
  customerName?: string;
  logoutHref?: string;
  /** Número real de sucursales con retiro; omitir si no se conoce */
  branchesWithPickup?: number;
  query?: string;
  onSearch?: (q: string) => void;
  className?: string;
}
export declare function ShopHeader(props: ShopHeaderProps): React.ReactElement;

export interface CheckoutStepsProps { current: 1 | 2 | 3 | 4; back?: { label: string; href: string }; className?: string }
export declare function CheckoutSteps(props: CheckoutStepsProps): React.ReactElement;

export interface AcademicFooterProps { pickupHelpHref?: string; className?: string }
export declare function AcademicFooter(props: AcademicFooterProps): React.ReactElement;

export interface ProductImageProps { src?: string | null; alt: string; category?: string; size?: 'card' | 'thumb'; className?: string }
export declare function ProductImage(props: ProductImageProps): React.ReactElement;

export interface ProductCardProps {
  name: string;
  category?: string;
  /** digitalPrice del servidor, en pesos */
  price: number;
  image?: string | null;
  href?: string;
  onAdd?: () => void;
  state?: 'idle' | 'adding' | 'added' | 'error';
  className?: string;
}
export declare function ProductCard(props: ProductCardProps): React.ReactElement;

export interface Branch { id: number | string; name: string; city?: string; units: number; canPickup: boolean }
export interface BranchAvailabilityProps { branches: Branch[]; onPickup?: (branch: Branch) => void; selectedId?: number | string | null; className?: string }
export declare function BranchAvailability(props: BranchAvailabilityProps): React.ReactElement;

export interface LineItemProps {
  name: string;
  image?: string | null;
  unitPrice: number;
  quantity: number;
  max?: number;
  branch?: string;
  readOnly?: boolean;
  onQuantity?: (value: number) => void;
  onRemove?: () => void;
  className?: string;
}
export declare function LineItem(props: LineItemProps): React.ReactElement;

export interface OrderSummaryProps {
  subtotal: number;
  discount?: number;
  discountLabel?: string;
  /** Total que devuelve el servidor, sin recalcular */
  total: number;
  itemsCount?: number;
  title?: string;
  totalLabel?: string;
  children?: React.ReactNode;
  className?: string;
}
export declare function OrderSummary(props: OrderSummaryProps): React.ReactElement;

export interface PickupCodeProps { code: string; expiresOn: string; branch?: string; city?: string; className?: string }
export declare function PickupCode(props: PickupCodeProps): React.ReactElement;

export interface OrderRowProps {
  number: number | string;
  date: string;
  branch: string;
  total: number;
  status: OrderStatusKey;
  reason?: string;
  reservedUntil?: string;
  note?: string;
  payHref?: string;
  receiptHref?: string;
  onCancel?: () => void;
  className?: string;
}
export declare function OrderRow(props: OrderRowProps): React.ReactElement;

export interface CardProps { title?: string; aside?: React.ReactNode; children?: React.ReactNode; className?: string }
export declare function Card(props: CardProps): React.ReactElement;

/** $ 1.899.900 */
export declare function formatCOP(value: number): string;

declare global {
  interface Window {
    ComproYa: {
      Button: typeof Button; Notice: typeof Notice; Badge: typeof Badge; OrderStatus: typeof OrderStatus;
      Spinner: typeof Spinner; Skeleton: typeof Skeleton; Field: typeof Field; Checkbox: typeof Checkbox;
      Tabs: typeof Tabs; QuantityStepper: typeof QuantityStepper; CouponField: typeof CouponField;
      ShopHeader: typeof ShopHeader; CheckoutSteps: typeof CheckoutSteps; AcademicFooter: typeof AcademicFooter;
      ProductImage: typeof ProductImage; ProductCard: typeof ProductCard; BranchAvailability: typeof BranchAvailability;
      LineItem: typeof LineItem; OrderSummary: typeof OrderSummary; PickupCode: typeof PickupCode;
      OrderRow: typeof OrderRow; Card: typeof Card; Icon: typeof Icon; formatCOP: typeof formatCOP;
    };
  }
}
