"use client";
import { useState } from "react";
import { urlImagenProducto } from "../lib/api";
import { infoCategoria } from "../lib/categorias";

// Íconos del placeholder por familia de categoría (categorías de DummyJSON).
const FAMILIAS: Array<[RegExp, string]> = [
  [/laptop|smartphone|tablet|mobile|electrodom/i, "M5 2h14v20H5zM5 18h14"],
  [/shirt|tops|dress|shoes|bags|watches|jewel|sunglass/i, "M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4a4 4 0 0 1-8 0z"],
  [/furniture|home|kitchen/i, "M4 11h16v6H4zM6 17v3M18 17v3M6 11V6h12v5"],
];
const ICONO_GENERICO = "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10";

function iconoDe(categoria?: string): string {
  return FAMILIAS.find(([re]) => re.test(categoria ?? ""))?.[1] ?? ICONO_GENERICO;
}

/**
 * Foto del producto o, si no la hay o no carga, un placeholder consistente
 * por categoría — nunca una imagen rota. `tamano` es el lado del ícono.
 */
export function ProductImage({
  imageUrl,
  nombre,
  categoria,
  tamano = 48,
}: {
  imageUrl?: string | null;
  nombre?: string;
  categoria?: string;
  tamano?: number;
}) {
  const [fallo, setFallo] = useState(false);
  const src = urlImagenProducto(imageUrl);
  if (src && !fallo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={nombre ?? ""}
        loading="lazy"
        onError={() => setFallo(true)}
        style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fff" }}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={`Sin foto: ${nombre ?? (categoria ? infoCategoria(categoria).nombre : "producto")}`}
      style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--ink-faint)" }}
    >
      <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d={iconoDe(categoria)} />
      </svg>
      {categoria && <span style={{ fontSize: 12 }}>{infoCategoria(categoria).nombre}</span>}
    </div>
  );
}
