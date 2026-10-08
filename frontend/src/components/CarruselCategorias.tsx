"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { infoCategoria } from "@/lib/categorias";
import type { Categoria } from "@/lib/types";

// Carrusel infinito de categorías: ocupa una sola fila para dejar el espacio a los productos.
// Avanza solo, se detiene al pasar el mouse, enfocar con teclado o tocar, y no se mueve si la
// persona pidió menos animación (prefers-reduced-motion): entonces solo se desplaza a mano.
// Cada categoría lleva su descripción como ayuda (title) y enlaza a su página.
const VELOCIDAD_PX_POR_FRAME = 0.6;

export default function CarruselCategorias({ categorias }: { categorias: Categoria[] }) {
  const pista = useRef<HTMLDivElement>(null);
  const pausado = useRef(false);

  // La lista se pinta dos veces: al pasar la mitad del ancho se vuelve al inicio sin salto visible.
  const normalizar = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    const mitad = el.scrollWidth / 2;
    if (mitad <= el.clientWidth) return;
    if (el.scrollLeft >= mitad) el.scrollLeft -= mitad;
    else if (el.scrollLeft <= 0) el.scrollLeft += mitad;
  }, []);

  useEffect(() => {
    const el = pista.current;
    if (!el || categorias.length === 0) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollLeft = el.scrollWidth / 4;
    if (reducir) return;
    let id = 0;
    const paso = () => {
      if (!pausado.current) {
        el.scrollLeft += VELOCIDAD_PX_POR_FRAME;
        normalizar();
      }
      id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [categorias.length, normalizar]);

  function mover(direccion: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: direccion * Math.max(240, el.clientWidth * 0.7), behavior: "smooth" });
  }

  if (categorias.length === 0) return null;
  // Las categorías con más productos primero.
  const ordenadas = [...categorias].sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0));
  const items = [...ordenadas, ...ordenadas];

  return (
    <section className="carrusel" aria-label="Categorías">
      <button type="button" className="carrusel-flecha" title="Ver categorías anteriores" aria-label="Ver categorías anteriores" onClick={() => mover(-1)}>
        <Icon name="chevron-left" size={18} />
      </button>
      <div
        ref={pista}
        className="carrusel-pista"
        onScroll={normalizar}
        onMouseEnter={() => (pausado.current = true)}
        onMouseLeave={() => (pausado.current = false)}
        onFocus={() => (pausado.current = true)}
        onBlur={() => (pausado.current = false)}
        onTouchStart={() => (pausado.current = true)}
        onTouchEnd={() => setTimeout(() => (pausado.current = false), 2500)}
      >
        {items.map((c, i) => {
          const info = infoCategoria(c.name);
          const repetida = i >= ordenadas.length;
          return (
            <Link
              key={`${c.id}-${i}`}
              href={`/categoria/${c.id}`}
              className="carrusel-item"
              title={`${info.nombre}: ${info.descripcion} (${c.productCount} productos)`}
              aria-hidden={repetida ? true : undefined}
              tabIndex={repetida ? -1 : undefined}
            >
              {info.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={info.imagen} alt="" loading="lazy" />
              ) : (
                <span className="carrusel-sin-foto"><Icon name="package" size={22} /></span>
              )}
              <span className="carrusel-nombre">{info.nombre}</span>
            </Link>
          );
        })}
      </div>
      <button type="button" className="carrusel-flecha" title="Ver más categorías" aria-label="Ver más categorías" onClick={() => mover(1)}>
        <Icon name="chevron-right" size={18} />
      </button>
    </section>
  );
}
