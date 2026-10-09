import { cx } from "./formato";
import type { SkeletonProps } from "./tipos";

// Estructura gris que late suavemente mientras llega la respuesta: la persona ve que algo carga y dónde
// aparecerá. Mismo número de elementos que se verán; la cabecera y el pie nunca se reemplazan.
export function Skeleton({ variant = "text", count = 1, label, className }: SkeletonProps) {
  const elementos = Array.from({ length: count }, (_, i) => {
    if (variant === "product-card") {
      return (
        <div key={i} className="cy-skel-card">
          <div className="cy-skel cy-skel-thumb" />
          <div className="cy-skel cy-skel-line" style={{ width: "40%" }} />
          <div className="cy-skel cy-skel-line" />
          <div className="cy-skel cy-skel-line" style={{ width: "55%" }} />
          <div className="cy-skel cy-skel-btn" />
        </div>
      );
    }
    if (variant === "category") {
      return (
        <div key={i} className="cy-skel-cat">
          <div className="cy-skel cy-skel-circle" />
          <div className="cy-skel cy-skel-line" style={{ width: "70%", margin: "8px auto 0" }} />
        </div>
      );
    }
    if (variant === "line-item") {
      return (
        <div key={i} className="cy-skel-li">
          <div className="cy-skel cy-skel-sq" />
          <div style={{ flex: 1 }}>
            <div className="cy-skel cy-skel-line" style={{ width: "60%" }} />
            <div className="cy-skel cy-skel-line" style={{ width: "30%" }} />
          </div>
        </div>
      );
    }
    return <div key={i} className="cy-skel cy-skel-line" />;
  });
  return (
    <div className={cx("cy-skeleton", `cy-skeleton-${variant}`, className)} aria-busy="true">
      <span className="cy-sr" role="status">
        {label || "Cargando…"}
      </span>
      {elementos}
    </div>
  );
}
