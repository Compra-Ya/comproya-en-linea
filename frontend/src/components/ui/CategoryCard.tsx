import { Enlace } from "./Enlace";
import { Icon } from "./Icon";
import { cx, unidades } from "./formato";
import type { CategoryCardProps } from "./tipos";

// Categoría con foto redonda y nombre debajo; es el elemento del carrusel. En la categoría actual
// (`active`) el anillo pasa a naranja. `tabIndex` es una extensión: las copias del bucle no reciben foco.
export function CategoryCard({ name, image, href, count, active, className, tabIndex }: CategoryCardProps & { tabIndex?: number }) {
  return (
    <Enlace
      className={cx("cy-catcard", active && "cy-catcard-active", className)}
      href={href || "#"}
      aria-current={active ? "page" : undefined}
      tabIndex={tabIndex}
    >
      <span className="cy-catcard-img">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" />
        ) : (
          <Icon name="grid" size={28} />
        )}
      </span>
      <span className="cy-catcard-name">{name}</span>
      {count != null ? <span className="cy-catcard-count">{unidades(count, "producto", "productos")}</span> : null}
    </Enlace>
  );
}
