"use client";

import { cloneElement, useEffect, useId, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { cx } from "./formato";
import type { TooltipProps } from "./tipos";

// Etiqueta de una línea que aparece al pasar el mouse (tras 250 ms, en CSS) y al enfocar con teclado;
// Esc la cierra. Nunca guarda información que solo esté ahí: lo esencial va en texto visible.
// Extensión del diseño: al abrirse se mide y, si se saldría de la ventana (control pegado al borde en 390 px),
// se desplaza lo justo para quedar dentro; la flecha sigue apuntando al control (ver globals.css).
const MARGEN_VENTANA = 8;
export function Tooltip({ label, children, placement = "top", align = "center", open, describe = true, block, className }: TooltipProps) {
  const id = useId();
  const [oculto, setOculto] = useState(false);
  const [desvio, setDesvio] = useState(0);
  const desvioActual = useRef(0);
  const etiquetaRef = useRef<HTMLSpanElement>(null);
  // Se reacciona cuando la etiqueta pasa a mostrarse (hover, foco o un botón que aparece bajo el cursor).
  useEffect(() => {
    const el = etiquetaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observador = new IntersectionObserver(
      (entradas) => {
        const entrada = entradas[entradas.length - 1];
        if (!entrada.isIntersecting) return;
        const r = entrada.boundingClientRect;
        const ancho = document.documentElement.clientWidth;
        const izquierda = r.left - desvioActual.current;
        const derecha = r.right - desvioActual.current;
        let d = 0;
        if (derecha > ancho - MARGEN_VENTANA) d = ancho - MARGEN_VENTANA - derecha;
        else if (izquierda < MARGEN_VENTANA) d = MARGEN_VENTANA - izquierda;
        if (d !== desvioActual.current) {
          desvioActual.current = d;
          setDesvio(d);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);
  const estilo: CSSProperties | undefined = desvio
    ? ({ transform: align === "center" ? `translateX(calc(-50% + ${desvio}px))` : `translateX(${desvio}px)`, "--cy-tip-shift": `${desvio}px` } as CSSProperties)
    : undefined;
  const hijo = children as ReactElement<Record<string, unknown>>;
  const disparador = describe
    ? cloneElement(hijo, { "aria-describedby": cx(hijo.props["aria-describedby"] as string | undefined, id) })
    : hijo;
  return (
    <span
      className={cx("cy-tip-wrap", block && "cy-tip-block", open && "cy-tip-forced", oculto && "cy-tip-hidden", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOculto(true);
      }}
      onMouseLeave={() => setOculto(false)}
      onBlur={() => setOculto(false)}
    >
      {disparador}
      <span
        id={id}
        ref={etiquetaRef}
        style={estilo}
        role="tooltip"
        className={cx("cy-tip", `cy-tip-${placement}`, align === "end" && "cy-tip-end", align === "start" && "cy-tip-start")}
        aria-hidden={describe ? undefined : true}
      >
        {label}
      </span>
    </span>
  );
}
