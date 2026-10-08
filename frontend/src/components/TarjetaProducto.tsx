"use client";

import Link from "next/link";
import { Button, Icon, formatoCOP } from "@/components/ui";
import { ProductImage } from "@/components/ProductImage";
import { infoCategoria } from "@/lib/categorias";
import type { Producto } from "@/lib/types";

// Tarjeta de producto del catálogo y de las páginas de categoría. El botón lleva ícono y texto, con
// ayuda (title); la confirmación aparece en la misma tarjeta, junto al botón que se pulsó.
export default function TarjetaProducto({
  producto,
  estado,
  onAgregar,
}: {
  producto: Producto;
  estado: "reposo" | "agregando" | "agregado" | "error";
  onAgregar: () => void;
}) {
  const categoria = infoCategoria(producto.category?.name).nombre;
  return (
    <article className="product-card">
      <Link href={`/producto/${producto.id}`} style={{ color: "inherit" }} title={`Ver detalle de ${producto.name}`}>
        <span className="tag-orange" style={{ position: "static", display: "inline-block", margin: "12px 0 0 12px" }}>
          {categoria}
        </span>
        <div className="product-thumb">
          <ProductImage imageUrl={producto.imageUrl} nombre={producto.name} categoria={producto.category?.name} />
        </div>
        <div className="product-info" style={{ paddingBottom: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: "18px" }}>{producto.name}</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{formatoCOP(producto.digitalPrice)}</span>
        </div>
      </Link>
      <div style={{ padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Button
          full
          icon="cart"
          loading={estado === "agregando"}
          title={`Agregar ${producto.name} al carrito`}
          onClick={onAgregar}
        >
          {estado === "agregando" ? "Agregando…" : "Agregar al carrito"}
        </Button>
        {estado === "agregado" && (
          <p className="tarjeta-aviso tarjeta-aviso-ok" role="status">
            <Icon name="check-circle" size={16} />
            <span>Agregado a tu carrito. <Link href="/carrito">Ver carrito</Link></span>
          </p>
        )}
        {estado === "error" && (
          <p className="tarjeta-aviso tarjeta-aviso-error" role="alert">
            <Icon name="alert" size={16} />
            <span>No pudimos agregarlo. Inténtalo de nuevo.</span>
          </p>
        )}
      </div>
    </article>
  );
}
