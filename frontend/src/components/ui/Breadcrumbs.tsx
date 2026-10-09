import { Enlace } from "./Enlace";
import { Icon } from "./Icon";
import { cx } from "./formato";
import type { BreadcrumbsProps } from "./tipos";

// Migas de pan: Inicio › Categoría › Producto. El primer enlace lleva el ícono de casa y la palabra
// "Inicio"; el último no es enlace (aria-current). Se parten en varias líneas a 390 px.
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cx("cy-crumbs", className)} aria-label="Estás en">
      <ol>
        {items.map((it, i) => {
          const ultimo = i === items.length - 1;
          return (
            <li key={i}>
              {ultimo ? (
                <span aria-current="page">{it.label}</span>
              ) : (
                <Enlace href={it.href || "#"}>
                  {i === 0 ? <Icon name="home" size={16} /> : null}
                  {it.label}
                </Enlace>
              )}
              {ultimo ? null : <Icon name="chevron-right" size={14} className="cy-crumb-sep" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
