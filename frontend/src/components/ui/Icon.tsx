import type { IconName, IconProps } from "./tipos";

// Íconos de línea de 24 × 24, trazo 1,7, currentColor — mismo estilo que el carrito
// original (design/design-system/components/Icon/README.md). Todo ícono va con una
// etiqueta de texto visible al lado (UT-02); sin `title` se oculta a lectores de pantalla.
// Cada trazo es un círculo ({ c: [cx, cy, r] }) o un camino SVG.
type Trazo = string | { c: [number, number, number] };

const TRAZOS: Record<IconName, Trazo[]> = {
  cart: [{ c: [9, 20, 1.3] }, { c: [18, 20, 1.3] }, "M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H5.3"],
  search: [{ c: [11, 11, 6.5] }, "M20 20l-4.2-4.2"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  "check-circle": [{ c: [12, 12, 9] }, "M8 12.5l2.8 2.8L16.2 9.6"],
  alert: [{ c: [12, 12, 9] }, "M12 7.5v5.5", "M12 16.2v.3"],
  warn: ["M12 3.5l9.5 16.5h-19z", "M12 10v4.5", "M12 17.2v.3"],
  info: [{ c: [12, 12, 9] }, "M12 11v5.5", "M12 7.8v.3"],
  clock: [{ c: [12, 12, 9] }, "M12 7v5l3.5 2"],
  store: ["M3.5 9.5L5 4h14l1.5 5.5", "M3.5 9.5h17a3 3 0 0 1-5.7 1.2 3 3 0 0 1-5.6 0 3 3 0 0 1-5.7-1.2z", "M5 12v8h14v-8", "M10 20v-5h4v5"],
  user: [{ c: [12, 8, 4] }, "M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5"],
  package: ["M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z", "M3.5 7.5L12 12l8.5-4.5", "M12 12v9"],
  "chevron-left": ["M14.5 5.5L8 12l6.5 6.5"],
  "chevron-right": ["M9.5 5.5L16 12l-6.5 6.5"],
  minus: ["M6 12h12"],
  plus: ["M12 6v12", "M6 12h12"],
  x: ["M6.5 6.5l11 11", "M17.5 6.5l-11 11"],
  ticket: ["M3.5 7.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.5a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4z", "M14.5 6.5v11"],
  card: ["M3 6.5h18v11H3z", "M3 10h18", "M6.5 14.5h4"],
  bank: ["M3.5 9L12 4l8.5 5", "M4.5 9.5h15", "M6 10v7", "M10 10v7", "M14 10v7", "M18 10v7", "M3.5 19.5h17"],
  receipt: ["M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z", "M9 8h6", "M9 11.5h6", "M9 15h3.5"],
};

export function Icon({ name, size = 18, title, className }: IconProps) {
  const trazos = TRAZOS[name] ?? TRAZOS.info;
  return (
    <svg
      className={["cy-icon", className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {trazos.map((t, i) =>
        typeof t === "string" ? <path key={i} d={t} /> : <circle key={i} cx={t.c[0]} cy={t.c[1]} r={t.c[2]} />,
      )}
    </svg>
  );
}
