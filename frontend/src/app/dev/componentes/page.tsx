"use client";

import { useState } from "react";
import {
  AcademicFooter,
  AddedToCart,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CategoryCard,
  CategoryCarousel,
  Checkbox,
  CheckoutSteps,
  CouponField,
  EmptyState,
  Field,
  Icon,
  IconButton,
  InfoTip,
  LineItem,
  NOMBRES_DE_ICONO,
  Notice,
  OrderRow,
  OrderStatus,
  OrderSummary,
  ProductCard,
  ProductImage,
  QuantityStepper,
  ShippingSummary,
  ShopHeader,
  Skeleton,
  Spinner,
  Tooltip,
  formatCOP,
} from "@/components/ui";
import type { OrderStatusKey } from "@/components/ui";

// Tablero interno (no enlazado) con cada componente del sistema de diseño en sus estados, como
// design/rediseno/pantallas/Componentes.dc.html. Los datos son de demostración. Los tooltips se muestran
// abiertos donde se indica; en la tienda aparecen al pasar el mouse o al enfocar con teclado.
const TV = "/productos/curados/televisor.webp";
const LICUADORA = "/productos/curados/licuadora.webp";
const SILLA = "/productos/retail/silla-01.webp";
const CATEGORIAS = [
  ["Electrodomésticos", "electrodomesticos"],
  ["Portátiles", "laptops"],
  ["Celulares", "smartphones"],
  ["Muebles", "furniture"],
  ["Utensilios de cocina", "kitchen-accessories"],
  ["Belleza", "beauty"],
  ["Motos", "motorcycle"],
  ["Carros", "vehicle"],
].map(([name, slug]) => ({ name, image: `/categorias/${slug}.webp`, href: "#", active: slug === "laptops" }));
const ESTADOS: OrderStatusKey[] = ["creado", "pagado", "en-alistamiento", "entregado", "cancelado", "pago-fallido"];

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 className="heading" style={{ margin: 0 }}>{titulo}</h2>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>{children}</div>
    </section>
  );
}

const fila: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" };

export default function ComponentesPage() {
  const [cantidad, setCantidad] = useState(2);
  const [cupon, setCupon] = useState("LEALTAD10");
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 72px", display: "flex", flexDirection: "column", gap: 40, background: "var(--surface-muted)" }}>
      <header>
        <h1 className="display" style={{ margin: 0 }}>Componentes</h1>
        <p style={{ color: "var(--ink-soft)", marginTop: 8 }}>
          Los 29 componentes del sistema de diseño ComproYa en Línea, en sus estados. Ruta interna: no está enlazada desde la tienda.
        </p>
      </header>

      <Seccion titulo="Cabecera">
        <ShopHeader active="catalogo" cartCount={3} cartTotal={2257900} customerName="Duvan" />
        <ShopHeader variant="compact" active="carrito" cartCount={3} cartTotal={2257900} />
        <ShopHeader active="catalogo" />
      </Seccion>

      <Seccion titulo="Botones, botones de ícono, tooltip e InfoTip">
        <div style={{ ...fila, paddingTop: 48 }}>
          <Button icon="cart-plus" tooltip="Agregar Licuadora de vaso de vidrio 1,5 L al carrito" tooltipOpen>Agregar al carrito</Button>
          <Button size="lg" iconRight="arrow-right">Continuar al pago</Button>
          <Button size="lg" icon="lock">Pagar con tarjeta</Button>
          <Button loading>Agregando…</Button>
          <Button variant="secondary" icon="arrow-left">Volver al carrito</Button>
          <Button variant="ghost">Seguir comprando</Button>
          <Button variant="ghost-danger">Cancelar pedido</Button>
          <Button variant="navy">Sobre azul marino</Button>
          <Button size="sm" variant="secondary" icon="refresh">Reintentar</Button>
        </div>
        <div style={{ ...fila, paddingTop: 48 }}>
          <IconButton icon="chevron-left" label="Ver categorías anteriores" tooltipOpen />
          <IconButton icon="chevron-right" label="Ver más categorías" />
          <IconButton icon="pause" label="Pausar el carrusel" tooltipOpen />
          <IconButton icon="x" label="Cerrar el aviso" />
          <IconButton icon="cart-plus" label="Agregar Lámpara de mesa al carrito" tooltipOpen align="start" />
          <div style={{ width: 320 }}>
            <Button full disabled icon="cart-plus" disabledReason="Producto agotado: por ahora no hay unidades.">Agotado</Button>
          </div>
        </div>
        <div style={{ ...fila, paddingTop: 48 }}>
          <Tooltip label="Abre la página segura de la pasarela" open placement="top"><Button variant="secondary">Tooltip arriba</Button></Tooltip>
          <Tooltip label="Se muestra debajo del control" open placement="bottom"><Button variant="secondary">Tooltip abajo</Button></Tooltip>
          <InfoTip term="unidades disponibles" tip="Las que puedes comprar ahora; ya descuentan las reservadas por otros pedidos." open>Hay 285 unidades disponibles</InfoTip>
          <InfoTip term="la pasarela de pagos" tip="Página segura donde escribes tu tarjeta. ComproYa nunca la ve.">pasarela de pagos</InfoTip>
        </div>
      </Seccion>

      <Seccion titulo="Tarjeta de producto">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, alignItems: "start", paddingTop: 48 }}>
          <ProductCard name="Licuadora de vaso de vidrio 1,5 L" category="Electrodomésticos" price={179000} units={285} image={LICUADORA} href="#" tooltipOpen />
          <ProductCard name="Televisor LED 55 pulgadas 4K UHD" category="Electrodomésticos" price={1899900} units={32} image={TV} state="added" addedQuantity={2} href="#" />
          <ProductCard name="Silla de oficina ergonómica" category="Muebles" price={389000} units={54} image={SILLA} state="adding" href="#" />
          <ProductCard name="Bicicleta estática con monitor" category="Artículos deportivos" price={1150000} units={0} image="/productos/retail/bicicleta-01.webp" href="#" />
          <ProductCard name="Producto nuevo sin foto" category="Electrodomésticos" price={99000} units={12} href="#" />
          <ProductCard name="Plancha de vapor" category="Electrodomésticos" price={89000} units={20} image={LICUADORA} state="error" href="#" />
        </div>
      </Seccion>

      <Seccion titulo="Categorías: tarjeta y carrusel">
        <div style={{ ...fila, gap: 8 }}>
          <CategoryCard name="Electrodomésticos" image="/categorias/electrodomesticos.webp" count={4} />
          <CategoryCard name="Portátiles" image="/categorias/laptops.webp" active />
          <CategoryCard name="Categoría sin foto" />
        </div>
        <div style={{ paddingTop: 40, borderTop: "1px solid var(--line)" }}>
          <CategoryCarousel categories={CATEGORIAS} tipOpen="next" paused />
        </div>
      </Seccion>

      <Seccion titulo="Cantidad, fila del carrito, pasos y migas">
        <div style={{ ...fila, gap: 32, paddingTop: 48 }}>
          <QuantityStepper value={cantidad} onChange={setCantidad} max={10} hint="Máximo 10 unidades por pedido" tipOpen="plus" />
          <QuantityStepper defaultValue={1} max={10} tipOpen="minus" />
          <QuantityStepper defaultValue={10} max={10} tipOpen="plus" />
        </div>
        <LineItem name="Televisor LED 55 pulgadas 4K UHD" image={TV} unitPrice={1899900} quantity={1} max={10} tipOpen="remove" />
        <LineItem name="Licuadora de vaso de vidrio 1,5 L" image={LICUADORA} unitPrice={179000} quantity={2} readOnly />
        <CheckoutSteps current={1} back={{ label: "Seguir comprando", href: "#" }} />
        <CheckoutSteps current={2} back={{ label: "Volver al carrito", href: "#" }} />
        <CheckoutSteps current={3} back={{ label: "Volver a tus datos", href: "#" }} />
        <CheckoutSteps current={4} />
        <Breadcrumbs items={[{ label: "Inicio", href: "#" }, { label: "Electrodomésticos", href: "#" }, { label: "Licuadora de vaso de vidrio 1,5 L" }]} />
      </Seccion>

      <Seccion titulo="Avisos y confirmaciones">
        <AddedToCart quantity={2} />
        <Notice tone="danger" title="No pudimos cargar los productos." action={<Button size="sm" variant="secondary" icon="refresh">Reintentar</Button>}>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
        </Notice>
        <Notice tone="progress" progress title="Estamos confirmando tu pago…"><p>Suele tardar unos segundos. No cierres esta página.</p></Notice>
        <Notice tone="warn" icon="clock" title="Reservamos tus unidades mientras pagas."><p>Si no completas el pago, las liberamos.</p></Notice>
        <Notice tone="test" icon="card" title="Modo de prueba"><p>Usa la tarjeta 4242 4242 4242 4242, cualquier fecha futura y cualquier código de seguridad.</p></Notice>
        <Notice tone="ok" title="Pedido confirmado."><p>Recibimos tu pago.</p></Notice>
        <Notice tone="info" icon="lock"><p>Escribirás tu tarjeta en la página segura de la pasarela de pagos. ComproYa nunca la ve.</p></Notice>
      </Seccion>

      <Seccion titulo="Campos, casilla y cupón">
        <div style={{ paddingTop: 48 }}>
          <Field label="Nombre completo" defaultValue="Duvan Serrano" valid />
          <Field label="Teléfono" icon="phone" defaultValue="310 55" error="Faltan dígitos: escribe los 10 números de tu celular, sin espacios." hint="Celular de 10 dígitos para coordinar la entrega." />
          <Field label="Dirección" icon="map-pin" placeholder="Calle 45 # 13-20, apto 301" hint="Calle o carrera, número y apartamento si aplica." labelTip="Es donde te enviamos el pedido." tipOpen />
          <Field label="Ciudad" as="select" options={[{ value: "", label: "Elige tu ciudad" }, { value: "bogota", label: "Bogotá" }]} />
          <Field label="Indicaciones para la entrega" as="textarea" optional placeholder="Ej.: portería, timbre 3" />
          <Checkbox label="Acepto el tratamiento de mis datos personales. Podré administrar mi consentimiento después de registrarme." error="Acepta el tratamiento de datos para crear tu cuenta." />
        </div>
        <CouponField value={cupon} onChange={setCupon} status="idle" />
        <CouponField value="LEALTAD10" status="applied" appliedText="Cupón LEALTAD10 aplicado: 10 % de descuento ($ 225.790)." tipOpen />
        <CouponField value="GRATIS50" status="invalid" />
        <CouponField value="LEALTAD10" status="checking" />
      </Seccion>

      <Seccion titulo="Estados, carga y vacíos">
        <div style={fila}>
          {ESTADOS.map((e) => <OrderStatus key={e} status={e} />)}
          <Badge tone="brand" icon="truck">Envío a la dirección que escribas</Badge>
          <Badge tone="ok">Con unidades</Badge>
        </div>
        <div style={fila}><Spinner label="Cargando el producto…" /><Spinner /></div>
        <Skeleton variant="category" count={6} label="Cargando categorías…" />
        <Skeleton variant="product-card" count={4} label="Cargando productos…" />
        <Skeleton variant="line-item" count={2} label="Cargando tu carrito…" />
        <EmptyState icon="cart" title="Tu carrito está vacío" text="Explora el catálogo y agrega lo que te guste." action={<Button icon="grid" href="#">Ver productos</Button>} />
        <EmptyState imageSrc="/categorias/laptops.webp" title="Aún no hay productos aquí" text="Mira otra categoría." action={<Button variant="secondary" href="#">Volver al catálogo</Button>} />
      </Seccion>

      <Seccion titulo="Resumen, envío, pedido, tarjeta">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
          <OrderSummary
            itemsCount={3}
            subtotal={2257900}
            discount={225790}
            discountLabel="Descuento por cupón LEALTAD10"
            total={2032110}
            totalLabel="Total a pagar"
            items={[{ name: "Televisor LED 55 pulgadas 4K UHD", image: TV, quantity: 1, lineTotal: 1899900 }, { name: "Licuadora de vaso de vidrio 1,5 L", image: LICUADORA, quantity: 2, lineTotal: 358000 }]}
            note="Tus unidades están reservadas mientras pagas."
            secure
          >
            <Button size="lg" full icon="lock">Pagar con tarjeta</Button>
          </OrderSummary>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ShippingSummary name="Ana Pérez" address="Calle 45 # 13-20, apto 301" city="Bogotá" notes="Portería, timbre 3" phone="310 555 0198" editHref="#" />
            <Card title="Tarjeta de contenido" icon="package" aside={<span className="small" style={{ color: "var(--ink-soft)" }}>{formatCOP(1899900)}</span>}>
              <p className="body" style={{ margin: 0 }}>Contenedor de sección con borde y título con ícono.</p>
            </Card>
            <ProductImage src={LICUADORA} alt="Licuadora" size="mini" />
          </div>
        </div>
        <OrderRow number={10482} date="8 de octubre de 2026" status="pagado" itemsCount={3} total={2032110} city="Bogotá" images={[TV, LICUADORA]} viewHref="#" />
        <OrderRow number={10477} date="7 de octubre de 2026" status="creado" itemsCount={1} total={389000} city="Medellín" images={[SILLA]} payHref="#" onCancel={() => undefined} />
        <OrderRow number={10431} date="2 de octubre de 2026" status="pago-fallido" itemsCount={1} total={8499000} city="Bogotá" payHref="#" reason="La pasarela no completó el pago con tarjeta. No se hizo ningún cobro; puedes pagarlo de nuevo." />
      </Seccion>

      <Seccion titulo="Íconos">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {NOMBRES_DE_ICONO.map((n) => (
            <span key={n} className="small" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name={n} size={22} />
              {n}
            </span>
          ))}
        </div>
      </Seccion>

      <AcademicFooter />
    </div>
  );
}
