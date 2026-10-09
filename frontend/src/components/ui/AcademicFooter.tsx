import { Enlace } from "./Enlace";
import { cx } from "./formato";
import type { AcademicFooterProps } from "./tipos";

// Pie azul marino con el logo en blanco, enlaces de ayuda y el aviso académico obligatorio (literal).
// Los enlaces de ayuda apuntan a las secciones del catálogo (/#envio, /#pago, /#cupon).
function Columna({ titulo, enlaces }: { titulo: string; enlaces: Array<[string, string]> }) {
  return (
    <div className="cy-footer-col">
      <h2>{titulo}</h2>
      <ul>
        {enlaces.map(([texto, href]) => (
          <li key={texto}>
            <Enlace href={href}>{texto}</Enlace>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AcademicFooter({ logoSrc = "/marca/logo-horizontal-blanco.svg", className }: AcademicFooterProps) {
  return (
    <footer className={cx("cy-footer", className)}>
      <div className="cy-footer-inner">
        <div className="cy-footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="ComproYa" className="cy-footer-logo" />
          <p>Compra en línea, paga con tarjeta en la pasarela segura y recibe tu pedido en casa.</p>
        </div>
        <Columna titulo="Comprar" enlaces={[["Catálogo", "/"], ["Carrito", "/carrito"], ["Cómo funciona el envío", "/#envio"]]} />
        <Columna titulo="Tu cuenta" enlaces={[["Mis pedidos", "/pedidos"], ["Mi cuenta", "/cuenta"], ["Privacidad y consentimiento", "/privacidad"]]} />
        <Columna titulo="Pagos" enlaces={[["Pago con tarjeta", "/#pago"], ["Cupón de lealtad", "/#cupon"]]} />
      </div>
      <div className="cy-footer-legal">
        <p>Proyecto académico — Ingeniería de Software II, Universidad Central. Sin fines comerciales. Las imágenes de producto pertenecen a sus respectivos titulares.</p>
        <p>© 2026 ComproYa. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
