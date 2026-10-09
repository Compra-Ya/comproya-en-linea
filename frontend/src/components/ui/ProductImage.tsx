"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { cx } from "./formato";
import type { ProductImageProps } from "./tipos";

// Foto del producto en contenedor 1:1, contenida sin recortar (las horizontales y verticales dejan franjas
// blancas). Si falta o falla, el placeholder con el nombre de la categoría: nunca una imagen rota.
// Texto alternativo: el nombre del producto; placeholder: "Sin foto: {producto}".
export function ProductImage({ src, alt, category, size = "card", className }: ProductImageProps) {
  const [fallo, setFallo] = useState(false);
  if (!src || fallo) {
    return (
      <div className={cx("cy-pimg", `cy-pimg-${size}`, "cy-pimg-empty", className)} role="img" aria-label={`Sin foto: ${alt || "producto"}`}>
        <Icon name="package" size={size === "card" ? 40 : 22} />
        {size === "card" ? <span>{category || "Sin foto"}</span> : null}
      </div>
    );
  }
  return (
    <div className={cx("cy-pimg", `cy-pimg-${size}`, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || ""} loading="lazy" onError={() => setFallo(true)} />
    </div>
  );
}
