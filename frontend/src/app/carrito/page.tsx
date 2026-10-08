"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, setCartToken } from "@/lib/api";
import { MODO_ENVIO, PASOS_COMPRA } from "@/lib/modo";
import type { Carrito, Producto } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import { ProductImage } from "@/components/ProductImage";
import { Button, CheckoutSteps, Notice, QuantityStepper, formatoCOP } from "@/components/ui";

// P-7 Administración del carrito (CU-07) + P-8 Productos complementarios (CU-08, hasta 4 — tope del
// canon, C-05; extensión de P-7, no una pantalla aparte). Paso 1 de 4 de la compra: el cliente elige
// la cantidad de cada producto y pasa a sus datos de envío (o a confirmar el pedido en el modo retiro).
export default function CarritoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [complementarios, setComplementarios] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorLinea, setErrorLinea] = useState<{ productId: number; texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const actual = await api<Carrito>("/carrito");
      if (actual.guestToken) setCartToken(actual.guestToken);
      setCarrito(actual);
      if (actual.items[0]) {
        const sugeridos = await api<{ suggestedProduct: Producto }[]>(
          `/carrito/complementarios/${actual.items[0].productId}`,
          { auth: false, cartToken: false },
        );
        setComplementarios(sugeridos.map((s) => s.suggestedProduct));
      } else {
        setComplementarios([]);
      }
    } catch (e) {
      void (e instanceof ApiError);
      setError("No pudimos cargar tu carrito. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function actualizarCantidad(productId: number, quantity: number) {
    if (!carrito) return;
    setErrorLinea(null);
    try {
      const actualizado = await api<Carrito>(`/carrito/${carrito.id}/items/${productId}`, {
        method: "PATCH",
        body: { quantity },
      });
      setCarrito(actualizado);
    } catch {
      setErrorLinea({ productId, texto: "No pudimos cambiar la cantidad. Inténtalo de nuevo." });
    }
  }

  async function agregarComplementario(productId: number) {
    try {
      const actualizado = await api<Carrito>("/carrito/items", { method: "POST", body: { productId, quantity: 1 } });
      if (actualizado.guestToken) setCartToken(actualizado.guestToken);
      setCarrito(actualizado);
    } catch {
      setError("No pudimos agregar el producto. Inténtalo de nuevo.");
    }
  }

  const total = carrito?.items.reduce((acc, i) => acc + Number(i.product.digitalPrice) * i.quantity, 0) ?? 0;
  const unidades = carrito?.items.reduce((acc, i) => acc + i.quantity, 0) ?? 0;
  const vacio = !cargando && !error && !carrito?.items.length;

  return (
    <div>
      <ShopHeaderConectado active="carrito" />
      <main className="pantalla">
        <CheckoutSteps current={1} steps={PASOS_COMPRA} back={{ label: "Seguir comprando", href: "/" }} />
        <h1 className="pantalla-titulo">Tu carrito</h1>

        {cargando && <Notice tone="progress">Cargando tu carrito…</Notice>}
        {error && (
          <Notice tone="danger" title="No pudimos cargar tu carrito" action={<Button variant="secondary" onClick={cargar}>Reintentar</Button>}>
            Revisa tu conexión e inténtalo de nuevo.
          </Notice>
        )}
        {vacio && (
          <Notice tone="info" title="Tu carrito está vacío" action={<Button variant="secondary" href="/">Ver productos</Button>}>
            Agrega productos para continuar con tu compra.
          </Notice>
        )}

        {!cargando && !error && !!carrito?.items.length && (
          <div className="confirmar-grid">
            <div className="confirmar-principal">
              <section className="card card-pad">
                {carrito.items.map((item) => (
                  <div className="linea-carrito" key={item.id}>
                    <div className="linea-foto">
                      <ProductImage imageUrl={item.product.imageUrl} nombre={item.product.name} categoria={item.product.category?.name} tamano={28} />
                    </div>
                    <div className="linea-info">
                      <p className="linea-nombre">{item.product.name}</p>
                      <p className="faint">{formatoCOP(item.product.digitalPrice)} cada uno</p>
                      {errorLinea?.productId === item.productId && (
                        <p className="error-campo" role="alert">{errorLinea.texto}</p>
                      )}
                    </div>
                    <QuantityStepper
                      value={item.quantity}
                      label={`Cantidad de ${item.product.name}`}
                      onChange={(v) => actualizarCantidad(item.productId, v)}
                    />
                    <p className="linea-total">{formatoCOP(Number(item.product.digitalPrice) * item.quantity)}</p>
                    <Button
                      variant="ghost"
                      icon="x"
                      title={`Quitar ${item.product.name} del carrito`}
                      onClick={() => actualizarCantidad(item.productId, 0)}
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </section>

              {complementarios.length > 0 && (
                <section className="card card-pad">
                  <h2 className="pantalla-seccion">Productos complementarios</h2>
                  {complementarios.map((p) => (
                    <div className="linea-carrito" key={p.id}>
                      <div className="linea-foto" style={{ width: 46, height: 46 }}>
                        <ProductImage imageUrl={p.imageUrl} nombre={p.name} categoria={p.category?.name} tamano={22} />
                      </div>
                      <div className="linea-info">
                        <p className="linea-nombre">{p.name}</p>
                        <p className="faint">{formatoCOP(p.digitalPrice)}</p>
                      </div>
                      <Button variant="secondary" icon="cart" title={`Agregar ${p.name} al carrito`} onClick={() => agregarComplementario(p.id)}>
                        Agregar
                      </Button>
                    </div>
                  ))}
                </section>
              )}
            </div>

            <aside className="confirmar-lateral">
              <section className="card card-pad">
                <h2 className="pantalla-seccion">Resumen</h2>
                <div className="totalsrow"><span>Productos</span><span>{unidades}</span></div>
                <div className="totalsrow"><span>Subtotal</span><span>{formatoCOP(total)}</span></div>
                <div className="totalsrow grand"><span>Total</span><span>{formatoCOP(total)}</span></div>
              </section>
              <Button size="lg" full icon="chevron-right" onClick={() => router.push("/pedido/confirmar")}>
                {MODO_ENVIO ? "Continuar con tus datos de envío" : "Confirmar pedido"}
              </Button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
