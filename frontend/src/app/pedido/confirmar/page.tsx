"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getStoredCustomer, haySesion, urlImagenProducto } from "@/lib/api";
import { avisarCambioDeCarrito } from "@/lib/eventos";
import { agregarAlCarrito, useCarrito } from "@/lib/useCarrito";
import type { CuponValidado, Pedido } from "@/lib/types";
import Pantalla from "@/components/Pantalla";
import { Button, CheckoutSteps, CouponField, EmptyState, Field, Icon, Notice, OrderSummary, Skeleton, Spinner, formatCOP } from "@/components/ui";

// P-9 Datos y envío (CU-09) + P-10 Aplicación de cupón de lealtad (CU-10). Paso 2 de 4: quién recibe el pedido,
// a dónde se envía y el cupón opcional; "Continuar al pago" crea el pedido (RN-05: reserva las unidades antes de
// poder pagar). Subtotal, descuento y total son los del servidor. Estados de design/rediseno/pantallas/Datos.dc.html:
// normal, errores por campo, cupón válido, cupón inválido y sin sesión.
interface Datos {
  nombre: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  notas: string;
}
type Campo = keyof Datos;
type Errores = Partial<Record<Campo, string>>;
const BORRADOR = "comproya_envio";
const URL_ACTUAL = "/pedido/confirmar";

// Mismas reglas que valida el servidor (DatosEnvioDto), con los mensajes del diseño: dicen cómo corregir.
function validar(d: Datos): Errores {
  const e: Errores = {};
  if (d.nombre.trim().length < 3) e.nombre = "Escribe tu nombre completo.";
  const digitos = d.telefono.replace(/\D/g, "");
  if (digitos.length === 0) e.telefono = "Escribe tu celular de 10 dígitos.";
  else if (digitos.length < 10) e.telefono = "Faltan dígitos: escribe los 10 números de tu celular, sin espacios.";
  else if (digitos.length > 10) e.telefono = "Sobran dígitos: escribe solo los 10 números de tu celular.";
  const direccion = d.direccion.trim();
  if (direccion.length < 6) e.direccion = "Escribe la dirección completa, por ejemplo «Calle 45 # 13-20».";
  else if (!/\d/.test(direccion)) e.direccion = "Falta el número: escribe la dirección completa, por ejemplo «Calle 45 # 13-20».";
  if (d.ciudad.trim().length < 2) e.ciudad = "Escribe la ciudad donde recibes el pedido.";
  return e;
}

interface Aviso {
  titulo: string;
  texto: string;
  accion?: "carrito" | "sesion";
}

// El servidor responde con identificadores internos (producto 209): se traduce a lenguaje de cliente y se dice qué hacer.
function explicar(e: unknown): { aviso?: Aviso; cupon?: boolean } {
  const mensaje = e instanceof ApiError ? e.message : "";
  const estado = e instanceof ApiError ? e.status : 0;
  if (estado === 401) return { aviso: { titulo: "Inicia sesión para continuar", texto: "Necesitamos saber quién hace el pedido. Tu carrito se conserva.", accion: "sesion" } };
  const unidades = /Solo hay (\d+) unidades disponibles/.exec(mensaje);
  if (unidades) return { aviso: { titulo: "Ya no hay tantas unidades disponibles", texto: `Solo quedan ${unidades[1]} unidades de uno de tus productos. Ajusta la cantidad en tu carrito.`, accion: "carrito" } };
  if (/Ninguna sucursal tiene unidades/.test(mensaje)) return { aviso: { titulo: "No hay unidades para todo el pedido", texto: "Ajusta las cantidades en tu carrito e inténtalo de nuevo.", accion: "carrito" } };
  if (/cupón de lealtad no existe/.test(mensaje)) return { cupon: true };
  if (/unidades disponibles cambiaron/.test(mensaje)) return { aviso: { titulo: "Las unidades de un producto cambiaron justo ahora", texto: "Vuelve a intentarlo en un momento." } };
  if (/carrito está vacío/.test(mensaje)) return { aviso: { titulo: "Tu carrito está vacío", texto: "Agrega productos para poder continuar.", accion: "carrito" } };
  return { aviso: { titulo: "No pudimos continuar con tu pedido", texto: "Inténtalo de nuevo en unos segundos. Lo que escribiste se conserva." } };
}

export default function DatosYEnvioPage() {
  const router = useRouter();
  const { carrito, estado, recargar } = useCarrito();
  const [datos, setDatos] = useState<Datos>({ nombre: "", telefono: "", direccion: "", ciudad: "", notas: "" });
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [intentado, setIntentado] = useState(false);
  const [conSesion, setConSesion] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [estadoCupon, setEstadoCupon] = useState<"idle" | "checking" | "applied" | "invalid">("idle");
  const [cupon, setCupon] = useState<CuponValidado | null>(null);
  const [errorCupon, setErrorCupon] = useState<string | undefined>(undefined);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);

  // Sesión y borrador: lo escrito se conserva aunque haya errores, se vaya a iniciar sesión o se vuelva desde el pago.
  useEffect(() => {
    setConSesion(haySesion());
    let guardado: Partial<Datos> = {};
    try {
      guardado = JSON.parse(localStorage.getItem(BORRADOR) ?? "{}");
    } catch {
      guardado = {};
    }
    setDatos((d) => ({ ...d, nombre: getStoredCustomer()?.name ?? "", ...guardado }));
  }, []);

  // Al volver desde el pago (?pedido=N) el pedido sin pagar se cancela (libera las unidades) y sus productos
  // regresan al carrito, para poder cambiar los datos sin perder nada.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("pedido");
    if (!id) return;
    let vigente = true;
    (async () => {
      setRestaurando(true);
      try {
        const pedido = await api<Pedido>(`/pedidos/${Number(id)}`);
        if (pedido.status === "CREATED" || pedido.status === "PAYMENT_FAILED") {
          // Un pedido con pago fallido ya liberó sus unidades; uno sin pagar se cancela para liberarlas.
          if (pedido.status === "CREATED") await api(`/pedidos/${pedido.id}/cancelar`, { method: "POST" });
          for (const item of pedido.items) await agregarAlCarrito(item.productId, item.quantity);
        }
      } catch {
        if (vigente) setAviso({ titulo: "No pudimos devolver tu pedido al carrito", texto: "Revisa tu carrito y, si falta algo, agrégalo de nuevo desde el catálogo.", accion: "carrito" });
      } finally {
        if (vigente) {
          setRestaurando(false);
          router.replace(URL_ACTUAL);
          recargar();
        }
      }
    })();
    return () => {
      vigente = false;
    };
  }, [router, recargar]);

  const errores = validar(datos);
  const visibles: Errores = {};
  for (const c of Object.keys(errores) as Campo[]) if (tocados[c] || intentado) visibles[c] = errores[c];
  const cantidadErrores = Object.keys(errores).length;

  function cambiar(campo: Campo, valor: string) {
    const siguiente = { ...datos, [campo]: valor };
    setDatos(siguiente);
    try {
      localStorage.setItem(BORRADOR, JSON.stringify(siguiente));
    } catch {
      /* sin almacenamiento: el borrador solo se pierde al recargar */
    }
  }

  const aplicarCupon = useCallback(async () => {
    const texto = codigo.trim();
    if (!texto) {
      setErrorCupon("Escribe el código de tu cupón.");
      setEstadoCupon("invalid");
      return;
    }
    if (!haySesion()) {
      setErrorCupon("Inicia sesión para aplicar tu cupón de lealtad.");
      setEstadoCupon("invalid");
      return;
    }
    setEstadoCupon("checking");
    try {
      const v = await api<CuponValidado>("/cupones/validar", { method: "POST", body: { codigo: texto } });
      setCupon(v);
      setCodigo(v.codigo);
      setErrorCupon(undefined);
      setEstadoCupon("applied");
    } catch (e) {
      setCupon(null);
      setErrorCupon(e instanceof ApiError && e.status === 400 ? undefined : "No pudimos validar el cupón. Inténtalo de nuevo.");
      setEstadoCupon("invalid");
    }
  }, [codigo]);

  function quitarCupon() {
    setCupon(null);
    setCodigo("");
    setErrorCupon(undefined);
    setEstadoCupon("idle");
  }

  async function continuar() {
    setAviso(null);
    setIntentado(true);
    const primero = (Object.keys(errores) as Campo[])[0];
    if (primero) {
      document.getElementById(`envio-${primero}`)?.focus();
      return;
    }
    setEnviando(true);
    try {
      const pedido = await api<Pedido>("/pedidos/confirmar", {
        method: "POST",
        body: {
          tipoEntrega: "ENVIO",
          envio: {
            nombre: datos.nombre.trim(),
            telefono: datos.telefono.replace(/\D/g, ""),
            direccion: datos.direccion.trim(),
            ciudad: datos.ciudad.trim(),
            notas: datos.notas.trim() || undefined,
          },
          couponCode: estadoCupon === "applied" ? codigo : undefined,
        },
      });
      avisarCambioDeCarrito();
      router.push(`/pago/${pedido.id}`);
    } catch (e) {
      const r = explicar(e);
      if (r.cupon) {
        setCupon(null);
        setErrorCupon(undefined);
        setEstadoCupon("invalid");
      }
      if (e instanceof ApiError && e.status === 401) setConSesion(false);
      if (r.aviso) setAviso(r.aviso);
      setEnviando(false);
    }
  }

  const campo = (id: Campo, props: Parameters<typeof Field>[0]) => (
    <Field
      {...props}
      id={`envio-${id}`}
      value={datos[id]}
      error={visibles[id]}
      valid={!errores[id] && !!datos[id].trim() && !!tocados[id]}
      onChange={(ev) => cambiar(id, ev.target.value)}
      onBlur={() => setTocados((t) => ({ ...t, [id]: true }))}
    />
  );

  const cargandoCarrito = estado === "cargando" || restaurando;
  const vacio = estado === "listo" && carrito?.items.length === 0 && !restaurando;
  const lleno = estado === "listo" && !!carrito && carrito.items.length > 0 && !restaurando;
  const subtotal = carrito?.subtotal ?? 0;
  const descuento = estadoCupon === "applied" && cupon ? cupon.descuento : 0;
  const total = estadoCupon === "applied" && cupon ? cupon.total : subtotal;

  return (
    <Pantalla active="carrito" variant="compact">
      <div className="wrap" style={{ paddingTop: 24 }}>
        <CheckoutSteps current={2} back={{ label: "Volver al carrito", href: "/carrito" }} />

        <div style={{ margin: "24px 0 16px" }}>
          <h1 className="h-title">Datos y envío</h1>
          <p className="muted" style={{ marginTop: 4 }}>Dinos quién recibe el pedido y a dónde te lo enviamos.</p>
        </div>

        {vacio && (
          <div className="panel">
            <EmptyState icon="cart" title="Tu carrito está vacío" text="Agrega productos para poder continuar con tus datos de envío.">
              <Button icon="grid" href="/">Ver productos</Button>
            </EmptyState>
          </div>
        )}

        {estado === "error" && (
          <Notice tone="danger" title="No pudimos cargar tu carrito." action={<Button variant="secondary" size="sm" icon="refresh" onClick={recargar}>Reintentar</Button>}>
            <p>Revisa tu conexión e inténtalo de nuevo. Lo que escribiste se conserva.</p>
          </Notice>
        )}

        {cargandoCarrito && estado !== "error" && (
          <div className="checkout">
            <div className="stack">
              {restaurando && (
                <Notice tone="progress" progress title="Estamos devolviendo tu pedido al carrito…">
                  <p>Así puedes cambiar tus datos sin perder nada. No cierres esta ventana.</p>
                </Notice>
              )}
              <div className="panel"><Skeleton variant="line-item" count={2} label="Cargando tu pedido…" /></div>
            </div>
            <div className="panel stack-sm">
              <Spinner label="Calculando el resumen…" />
              <div className="cy-skel" style={{ height: 48, marginTop: 12 }} />
            </div>
          </div>
        )}

        {lleno && (
          <div className="checkout">
            <div className="stack">
              {!conSesion && (
                <div className="panel" style={{ borderColor: "var(--navy-700)" }}>
                  <div className="pay-hero">
                    <span className="pay-ic"><Icon name="user" size={26} /></span>
                    <div className="stack-sm" style={{ flex: 1 }}>
                      <h2 style={{ fontSize: 18, lineHeight: "24px", fontWeight: 700 }}>Inicia sesión para continuar</h2>
                      <p className="muted">Necesitamos tu cuenta para guardar el pedido y que puedas seguirlo en Mis pedidos. Tu carrito se conserva y vuelves a este paso.</p>
                      <div className="row" style={{ marginTop: 8 }}>
                        <Button href={`/ingresar?volver=${URL_ACTUAL}`} icon="user">Iniciar sesión</Button>
                        <Button variant="secondary" href={`/registro?volver=${URL_ACTUAL}`}>Crear cuenta</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {intentado && cantidadErrores > 0 && (
                <Notice tone="danger" title={`Faltan ${cantidadErrores} ${cantidadErrores === 1 ? "dato" : "datos"} para continuar.`}>
                  <p>Los marcamos abajo con lo que hay que corregir. Lo que ya escribiste se conserva.</p>
                </Notice>
              )}

              {aviso && (
                <Notice
                  tone="danger"
                  title={aviso.titulo}
                  action={
                    aviso.accion === "carrito" ? (
                      <Button variant="secondary" size="sm" href="/carrito" icon="cart">Volver al carrito</Button>
                    ) : aviso.accion === "sesion" ? (
                      <Button size="sm" href={`/ingresar?volver=${URL_ACTUAL}`} icon="user">Iniciar sesión</Button>
                    ) : undefined
                  }
                >
                  <p>{aviso.texto}</p>
                </Notice>
              )}

              <section className="panel" aria-labelledby="quien">
                <h2 id="quien" className="panel-title"><Icon name="user" size={20} />¿Quién recibe el pedido?</h2>
                <div className="grid-2">
                  {campo("nombre", { label: "Nombre completo", autoComplete: "name" })}
                  {campo("telefono", { label: "Teléfono", icon: "phone", inputMode: "tel", autoComplete: "tel", hint: "Celular de 10 dígitos para coordinar la entrega." })}
                </div>
              </section>

              <section className="panel" aria-labelledby="donde">
                <h2 id="donde" className="panel-title"><Icon name="map-pin" size={20} />Dirección de envío</h2>
                {campo("direccion", { label: "Dirección", icon: "map-pin", autoComplete: "street-address", hint: "Calle o carrera, número y apartamento si aplica. Ej.: Calle 45 # 13-20, apto 301" })}
                <div className="grid-2">
                  {campo("ciudad", { label: "Ciudad", autoComplete: "address-level2", hint: "Ej.: Bogotá, Medellín, Cali" })}
                  <Field
                    as="textarea"
                    id="envio-notas"
                    label="Indicaciones para la entrega"
                    optional
                    rows={2}
                    placeholder="Ej.: portería, timbre 3, casa de reja blanca"
                    value={datos.notas}
                    onChange={(ev) => cambiar("notas", ev.target.value)}
                  />
                </div>
              </section>

              <section className="panel" aria-label="Cupón de lealtad">
                <CouponField
                  value={codigo}
                  onChange={(v) => {
                    setCodigo(v.toUpperCase());
                    if (estadoCupon === "invalid") setEstadoCupon("idle");
                  }}
                  status={estadoCupon}
                  onApply={aplicarCupon}
                  onRemove={quitarCupon}
                  errorText={errorCupon}
                  appliedText={cupon ? `Cupón ${cupon.codigo} aplicado: ${cupon.porcentaje} % de descuento (${formatCOP(cupon.descuento)}).` : undefined}
                />
              </section>
            </div>

            <div className="sticky">
              <OrderSummary
                items={carrito.items.map((i) => ({ name: i.product.name, image: urlImagenProducto(i.product.imageUrl) ?? undefined, quantity: i.quantity, lineTotal: i.lineTotal }))}
                itemsCount={carrito.unidades}
                subtotal={subtotal}
                discount={descuento}
                discountLabel={cupon ? `Descuento por cupón ${cupon.codigo}` : undefined}
                total={total}
                note="Al continuar, reservamos tus unidades mientras pagas."
                secure
              >
                <Button
                  size="lg"
                  full
                  iconRight="arrow-right"
                  loading={enviando}
                  disabled={!conSesion}
                  disabledReason="Inicia sesión para continuar al pago."
                  onClick={continuar}
                >
                  {enviando ? "Reservando tus unidades…" : "Continuar al pago"}
                </Button>
              </OrderSummary>
            </div>
          </div>
        )}
      </div>
    </Pantalla>
  );
}
