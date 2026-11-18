// GENERADO por scripts/sincronizar-ui.mjs a partir de design/design-system/components/index.d.ts.
// No editar a mano: cambiar el sistema de diseño y volver a sincronizar (npm run ui:sincronizar).
import type * as React from 'react';

export type IconName = 'cart' | 'cart-plus' | 'trash' | 'truck' | 'package' | 'card' | 'ticket' | 'clock' | 'receipt' | 'map-pin' | 'info' | 'alert' | 'warn' | 'check-circle' | 'check' | 'search' | 'user' | 'grid' | 'home' | 'lock' | 'shield' | 'phone' | 'help' | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'arrow-right' | 'arrow-left' | 'refresh' | 'minus' | 'plus' | 'x' | 'pause' | 'play' | 'logout' | 'smile';
export type OrderStatusKey = 'creado' | 'pagado' | 'en-alistamiento' | 'entregado' | 'cancelado' | 'pago-fallido';

export interface IconProps { name: IconName; size?: number; title?: string; className?: string }

export interface TooltipProps { label: string; children: React.ReactElement; placement?: 'top' | 'bottom'; align?: 'center' | 'start' | 'end'; open?: boolean; describe?: boolean; block?: boolean; className?: string }

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'ghost-danger' | 'danger' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  href?: string;
  /** Una línea que precisa la acción: "Agregar {producto} al carrito" */
  tooltip?: string;
  tooltipOpen?: boolean;
  /** Obligatorio si disabled: por qué no se puede */
  disabledReason?: string;
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Verbo claro; es el aria-label y el tooltip */
  label: string;
  tooltip?: string;
  tooltipOpen?: boolean;
  placement?: 'top' | 'bottom';
  align?: 'center' | 'start' | 'end';
  variant?: 'secondary' | 'plain';
}

export interface InfoTipProps { term: string; tip: string; children?: React.ReactNode; open?: boolean; placement?: 'top' | 'bottom'; className?: string }

export interface NoticeProps { tone?: 'info' | 'ok' | 'warn' | 'danger' | 'progress' | 'test'; title?: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode; icon?: IconName; progress?: boolean; className?: string }

export interface AddedToCartProps { quantity: number; cartHref?: string; continueHref?: string; onContinue?: () => void; compact?: boolean; className?: string }

export interface BadgeProps { tone?: 'neutral' | 'info' | 'ok' | 'warn' | 'danger' | 'brand'; icon?: IconName; children?: React.ReactNode; className?: string }

export interface OrderStatusProps { status: OrderStatusKey; className?: string }

export interface SpinnerProps { label?: string; className?: string }

export interface SkeletonProps { variant?: 'text' | 'product-card' | 'category' | 'line-item'; count?: number; label?: string; className?: string }

export interface EmptyStateProps { icon?: IconName; imageSrc?: string; title: string; text?: string; action?: React.ReactNode; className?: string }

export interface FieldOption { value: string; label: string; disabled?: boolean }
export interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  hint?: string;
  /** Qué pasó y cómo corregirlo; conserva lo escrito */
  error?: string;
  valid?: boolean;
  icon?: IconName;
  optional?: boolean;
  labelTip?: string;
  tipOpen?: boolean;
  as?: 'input' | 'select' | 'textarea';
  options?: FieldOption[];
}

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { label: React.ReactNode; error?: string }

export interface QuantityStepperProps { value?: number; defaultValue?: number; onChange?: (value: number) => void; min?: number; max?: number; hint?: string; label?: string; tipOpen?: 'minus' | 'plus'; className?: string }

export interface CouponFieldProps { value: string; onChange?: (v: string) => void; onApply?: () => void; onRemove?: () => void; status?: 'idle' | 'checking' | 'applied' | 'invalid'; appliedText?: string; errorText?: string; tipOpen?: boolean; id?: string; className?: string }

export interface ShopHeaderProps { logoSrc?: string; variant?: 'full' | 'compact'; active?: 'catalogo' | 'carrito' | 'pedidos' | 'cuenta'; cartCount?: number; cartTotal?: number; customerName?: string; logoutHref?: string; query?: string; onSearch?: (q: string) => void; categories?: { name: string; href: string; count?: number; active?: boolean }[]; className?: string }

export interface CheckoutStepsProps { current: 1 | 2 | 3 | 4; back?: { label: string; href: string }; className?: string }

export interface BreadcrumbsProps { items: { label: string; href?: string }[]; className?: string }

export interface AcademicFooterProps { logoSrc?: string; className?: string }

export interface ProductImageProps { src?: string | null; alt: string; category?: string; size?: 'card' | 'thumb' | 'mini'; className?: string }

export interface ProductCardProps { name: string; category?: string; price: number; units?: number; image?: string | null; href?: string; onAdd?: () => void; state?: 'idle' | 'adding' | 'added' | 'error'; addedQuantity?: number; tooltipOpen?: boolean; className?: string }

export interface CategoryCardProps { name: string; image?: string; href?: string; count?: number; active?: boolean; className?: string }

export interface CategoryCarouselProps { categories: { name: string; image?: string; href?: string; active?: boolean }[]; title?: string; paused?: boolean; tipOpen?: 'prev' | 'next' | 'pause'; className?: string }

export interface LineItemProps { name: string; image?: string | null; unitPrice: number; quantity: number; max?: number; lineTotal?: number; readOnly?: boolean; compact?: boolean; onQuantity?: (v: number) => void; onRemove?: () => void; tipOpen?: 'minus' | 'plus' | 'remove'; className?: string }

export interface OrderSummaryProps { itemsCount: number; subtotal: number; discount?: number; discountLabel?: string; shippingLabel?: string; total: number; items?: { name: string; image?: string; quantity: number; lineTotal: number }[]; note?: string; noteIcon?: IconName; secure?: boolean; title?: string; totalLabel?: string; children?: React.ReactNode; className?: string }

export interface ShippingSummaryProps { name: string; address: string; city: string; notes?: string; phone?: string; editHref?: string; title?: string; className?: string }

export interface OrderRowProps { number: number | string; date: string; status: OrderStatusKey; itemsCount: number; total: number; city: string; images?: string[]; reason?: string; note?: string; payHref?: string; viewHref?: string; onCancel?: () => void; className?: string }

export interface CardProps { title?: string; icon?: IconName; aside?: React.ReactNode; children?: React.ReactNode; className?: string }
