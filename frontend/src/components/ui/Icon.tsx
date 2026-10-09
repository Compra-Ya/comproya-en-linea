import type { IconName, IconProps } from "./tipos";

// Íconos de línea 24 × 24, trazo 1,7, puntas redondeadas, currentColor. Los trazos son los de PATHS de
// design/design-system/components/bundle.js ("c:cx,cy,r" es un círculo; lo demás, un camino SVG).
// Todo ícono va con una palabra visible; los de solo ícono van en IconButton, con tooltip.
const TRAZOS: Record<IconName, string[]> = {
  "cart": ["c:9,20,1.3", "c:18,20,1.3", "M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H5.3"],
  "cart-plus": ["c:9,20,1.3", "c:18,20,1.3", "M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H5.3", "M13.5 8.5v5", "M11 11h5"],
  "trash": ["M4 7h16", "M9.5 7V4.5h5V7", "M6.5 7l1 12.5a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-12.5", "M10.3 11v5.5", "M13.7 11v5.5"],
  "truck": ["M2.5 6.5h11v9h-11z", "M13.5 9.5h4l3 3.5v2.5h-7", "c:6.5,17.5,1.8", "c:16.5,17.5,1.8"],
  "package": ["M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z", "M3.5 7.5L12 12l8.5-4.5", "M12 12v9", "M7.8 5.3l8.5 4.5"],
  "card": ["M3 6h18v12H3z", "M3 10h18", "M6.5 14.5h4"],
  "ticket": ["M3.5 7.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.5a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4z", "M14.5 6.5v2", "M14.5 11v2", "M14.5 15.5v2"],
  "clock": ["c:12,12,9", "M12 7v5l3.5 2"],
  "receipt": ["M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z", "M9 8h6", "M9 11.5h6", "M9 15h3.5"],
  "map-pin": ["M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z", "c:12,10,2.4"],
  "info": ["c:12,12,9", "M12 11v5.5", "M12 7.8v.3"],
  "alert": ["c:12,12,9", "M12 7.5v5.5", "M12 16.2v.3"],
  "warn": ["M12 3.5l9.5 16.5h-19z", "M12 10v4.5", "M12 17.2v.3"],
  "check-circle": ["c:12,12,9", "M8 12.5l2.8 2.8L16.2 9.6"],
  "check": ["M5 12.5l4.5 4.5L19 7.5"],
  "search": ["c:11,11,6.5", "M20 20l-4.2-4.2"],
  "user": ["c:12,8,4", "M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5"],
  "grid": ["M4 4h6.5v6.5H4z", "M13.5 4H20v6.5h-6.5z", "M4 13.5h6.5V20H4z", "M13.5 13.5H20V20h-6.5z"],
  "home": ["M3.5 11L12 4l8.5 7", "M5.5 9.5V20h13V9.5", "M10 20v-5.5h4V20"],
  "lock": ["M5.5 10.5h13v10h-13z", "M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3", "M12 14.5v2.5"],
  "shield": ["M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z", "M8.8 12l2.3 2.3 4.3-4.6"],
  "phone": ["M6.5 3.5h3l1.5 4.5-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2 4.5 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z"],
  "help": ["c:12,12,9", "M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6", "M12 16.8v.3"],
  "chevron-left": ["M14.5 5.5L8 12l6.5 6.5"],
  "chevron-right": ["M9.5 5.5L16 12l-6.5 6.5"],
  "chevron-down": ["M5.5 9.5L12 16l6.5-6.5"],
  "arrow-right": ["M4.5 12h15", "M13.5 6l6 6-6 6"],
  "arrow-left": ["M19.5 12h-15", "M10.5 6l-6 6 6 6"],
  "refresh": ["M19.5 12a7.5 7.5 0 1 1-2.2-5.3", "M19.5 4.5v4.5H15"],
  "minus": ["M6 12h12"],
  "plus": ["M12 6v12", "M6 12h12"],
  "x": ["M6.5 6.5l11 11", "M17.5 6.5l-11 11"],
  "pause": ["M8.5 6v12", "M15.5 6v12"],
  "play": ["M8 5.5v13l10.5-6.5z"],
  "logout": ["M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14", "M9.5 8l-4 4 4 4", "M5.5 12h10"],
  "smile": ["c:12,12,9", "M8.5 14a4.2 4.2 0 0 0 7 0", "M9 9.5v.3", "M15 9.5v.3"],
};

export const NOMBRES_DE_ICONO = Object.keys(TRAZOS) as IconName[];

export function Icon({ name, size = 20, title, className }: IconProps) {
  const partes = TRAZOS[name] ?? TRAZOS.info;
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
      focusable="false"
    >
      {partes.map((p, i) => {
        if (p.startsWith("c:")) {
          const [cx, cy, r] = p.slice(2).split(",");
          return <circle key={i} cx={cx} cy={cy} r={r} />;
        }
        return <path key={i} d={p} />;
      })}
    </svg>
  );
}
