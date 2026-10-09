"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryCard } from "./CategoryCard";
import { IconButton } from "./IconButton";
import { cx } from "./formato";
import type { CategoryCarouselProps } from "./tipos";

// Una sola fila infinita de categorías: avanza sola (unos 3 s por categoría), se detiene al pasar el mouse o
// al enfocar, tiene "Pausar el carrusel" y flechas con tooltip, y se desliza con el dedo. Al tocar o usar una
// flecha pasa a desplazamiento manual, que sigue siendo infinito. Con "reducir movimiento" no se mueve solo.
// La copia que hace el bucle se oculta a lectores de pantalla y no recibe foco.
export function CategoryCarousel({ categories, title, paused: pausadoInicial, tipOpen, className }: CategoryCarouselProps) {
  const ventana = useRef<HTMLDivElement>(null);
  const [manual, setManual] = useState(!!pausadoInicial);
  const [pausado, setPausado] = useState(!!pausadoInicial);

  // Preferencia de movimiento: se lee en el cliente para no desajustar la hidratación.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setManual(true);
  }, []);

  const mitad = () => (ventana.current ? ventana.current.scrollWidth / 2 : 0);

  function alDesplazar() {
    const el = ventana.current;
    if (!el || !manual) return;
    const m = mitad();
    if (el.scrollLeft >= m) el.scrollLeft -= m;
    else if (el.scrollLeft <= 0) el.scrollLeft += m;
  }

  function ir(direccion: 1 | -1) {
    const el = ventana.current;
    if (!el) return;
    if (!manual) {
      setManual(true);
      el.scrollLeft = mitad() / 2;
    }
    const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direccion * el.clientWidth * 0.8, behavior: reducido ? "auto" : "smooth" });
  }

  const animado = !manual && !pausado;
  const tarjetas = [...categories.map((c, i) => ({ c, i, copia: false })), ...categories.map((c, i) => ({ c, i, copia: true }))];

  return (
    <section className={cx("cy-carousel", animado && "cy-carousel-anim", className)} aria-label={title || "Categorías"} aria-roledescription="carrusel">
      <div className="cy-carousel-head">
        <h2 className="cy-carousel-title">{title || "Explora por categoría"}</h2>
        <div className="cy-carousel-ctrls">
          {manual ? null : (
            <IconButton
              icon={pausado ? "play" : "pause"}
              label={pausado ? "Reanudar el carrusel" : "Pausar el carrusel"}
              onClick={() => setPausado(!pausado)}
              tooltipOpen={tipOpen === "pause"}
            />
          )}
          <IconButton icon="chevron-left" label="Ver categorías anteriores" onClick={() => ir(-1)} tooltipOpen={tipOpen === "prev"} />
          <IconButton icon="chevron-right" label="Ver más categorías" align="end" onClick={() => ir(1)} tooltipOpen={tipOpen === "next"} />
        </div>
      </div>
      <div
        className="cy-carousel-vp"
        ref={ventana}
        onScroll={alDesplazar}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") setManual(true);
        }}
      >
        <ul className="cy-carousel-track" style={{ animationDuration: `${Math.max(20, categories.length * 3)}s` }}>
          {tarjetas.map(({ c, i, copia }) => (
            <li key={`${copia ? "d" : "a"}${i}`} aria-hidden={copia ? true : undefined}>
              <CategoryCard name={c.name} image={c.image} href={c.href} active={c.active} tabIndex={copia ? -1 : undefined} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
