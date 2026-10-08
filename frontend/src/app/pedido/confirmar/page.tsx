"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getSelectedBranch, getStoredCustomer, setSelectedBranch } from "@/lib/api";
import { ETIQUETAS_ENVIO, MODO_ENVIO, PASOS_COMPRA } from "@/lib/modo";
import type { Carrito, Pedido, Sucursal } from "@/lib/types";
import ShopHeaderConectado from "@/components/ShopHeaderConectado";
import { Button, CheckoutSteps, Icon, Notice, formatoCOP } from "@/components/ui";

// P-9 Confirmación del pedido (CU-09) + P-10 Aplicación de cupón de lealtad (CU-10, extensión de
// CU-09, vive dentro del mismo resumen). RN-05: confirmar reserva las unidades antes de que exista la
// posibilidad de pagar. Paso 2 de 4. En la venta digital (modo por defecto) el cliente escribe sus
// datos y su dirección de envío; en el modo retiro (canon) elige la sucursal de retiro.

type Aviso = {
  titulo: string;
  texto: string;
  /** Dónde se muestra: junto al cupón o junto al botón de continuar. */
  donde: "cupon" | "resumen";
  accion?: "carrito" | "productos" | "quitar-cupon" | "login";
};

// El servidor responde con identificadores internos (producto 209, sucursal 6): la pantalla los
// traduce a lenguaje de cliente y dice qué hacer (design/06-copy.md, sección 3.4).
function explicarError(mensaje: string, estado: number | null, sucursal: string | undefined): Aviso {
  if (estado === 401) {
    return { titulo: "Inicia sesión para continuar", texto: "Necesitamos saber quién hace el pedido. Tu carrito se conserva.", donde: "resumen", accion: "login" };
  }
  const unidades = /Solo hay (\d+) unidades disponibles/.exec(mensaje);
  if (unidades) {
    return {
      titulo: "Ya no hay tantas unidades disponibles",
      texto: `Solo quedan ${unidades[1]} unidades disponibles${MODO_ENVIO || !sucursal ? "" : ` en ${sucursal}`}. Ajusta la cantidad en tu carrito.`,
      donde: "resumen",
      accion: "carrito",
    };
  }
  if (/Ninguna sucursal tiene unidades/.test(mensaje)) {
    return { titulo: "No hay unidades para todo el pedido", texto: "Ajusta las cantidades en tu carrito e inténtalo de nuevo.", donde: "resumen", accion: "carrito" };
  }
  if (/lleva más de 15 minutos sin sincronizar/.test(mensaje)) {
    return {
      titulo: `${sucursal ?? "Esa sucursal"} no ofrece retiro por ahora`,
      texto: "Lleva más de 15 minutos sin actualizar su información. Elige otra sucursal para retirar.",
      donde: "resumen",
    };
  }
  if (/cupón de lealtad no existe/.test(mensaje)) {
    return { titulo: "Ese cupón no es válido o ya venció", texto: "Revisa el código o continúa sin cupón.", donde: "cupon", accion: "quitar-cupon" };
  }
  if (/unidades disponibles cambiaron/.test(mensaje)) {
    return { titulo: "Las unidades de este producto cambiaron justo ahora", texto: "Vuelve a intentarlo.", donde: "resumen" };
  }
  if (/carrito está vacío/.test(mensaje)) {
    return { titulo: "Tu carrito está vacío", texto: "Agrega productos para poder continuar.", donde: "resumen", accion: "productos" };
  }
  return { titulo: "No pudimos continuar con tu pedido", texto: "Inténtalo de nuevo en unos segundos.", donde: "resumen" };
}

interface Envio {
  nombre: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  notas: string;
}
type CampoEnvio = keyof Envio;
const BORRADOR = "comproya_envio";

// Mismas reglas que valida el servidor (DatosEnvioDto), para avisar antes de enviar.
function validar(e: Envio): Partial<Record<CampoEnvio, string>> {
  const errores: Partial<Record<CampoEnvio, string>> = {};
  if (e.nombre.trim().length < 3) errores.nombre = "Escribe tu nombre completo.";
  if (!/^[0-9+()\s-]{7,20}$/.test(e.telefono.trim())) errores.telefono = "Escribe un teléfono válido, por ejemplo 300 123 4567.";
  if (e.direccion.trim().length < 6) errores.direccion = "Escribe la dirección completa, con calle y número.";
  if (e.ciudad.trim().length < 2) errores.ciudad = "Escribe tu ciudad.";
  return errores;
}

export default function ConfirmarPedidoPage() {
  const router = useRouter();
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [cargandoCarrito, setCargandoCarrito] = useState(true);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [envio, setEnvio] = useState<Envio>({ nombre: "", telefono: "", direccion: "", ciudad: "", notas: "" });
  const [errores, setErrores] = useState<Partial<Record<CampoEnvio, string>>>({});
  const [conSesion, setConSesion] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const campos = useRef<Partial<Record<CampoEnvio, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  useEffect(() => {
    const cliente = getStoredCustomer();
    setConSesion(!!cliente);
    let guardado: Partial<Envio> = {};
    try {
      guardado = JSON.parse(localStorage.getItem(BORRADOR) ?? "{}");
    } catch {
      guardado = {};
    }
    setEnvio((prev) => ({ ...prev, nombre: cliente?.name ?? "", ...guardado }));

    api<Carrito>("/carrito")
      .then(setCarrito)
      .catch(() => undefined)
      .finally(() => setCargandoCarrito(false));
    if (!MODO_ENVIO) {
      api<Sucursal[]>("/catalogo/sucursales", { auth: false, cartToken: false }).then((lista) => {
        setSucursales(lista);
        const guardada = getSelectedBranch();
        setBranchId(guardada && lista.some((s) => s.id === guardada) ? guardada : lista[0]?.id ?? null);
      });
    }
  }, []);

  const sucursalElegida = sucursales.find((s) => s.id === branchId)?.name;

  function cambiar(campo: CampoEnvio, valor: string) {
    const siguiente = { ...envio, [campo]: valor };
    setEnvio(siguiente);
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: validar(siguiente)[campo] }));
    try {
      localStorage.setItem(BORRADOR, JSON.stringify(siguiente));
    } catch {
      /* sin almacenamiento: el borrador solo se pierde al recargar */
    }
  }

  async function continuar() {
    setAviso(null);
    if (MODO_ENVIO) {
      const e = validar(envio);
      setErrores(e);
      const primero = (Object.keys(e) as CampoEnvio[])[0];
      if (primero) {
        campos.current[primero]?.focus();
        return;
      }
    } else if (!branchId) {
      setAviso({ titulo: "Elige una sucursal de retiro", texto: "Necesitamos saber dónde vas a retirar tu pedido.", donde: "resumen" });
      return;
    } else {
      setSelectedBranch(branchId);
    }
    setConfirmando(true);
    try {
      const couponOpt = cuponAplicado && couponCode ? couponCode : undefined;
      const pedido = await api<Pedido>("/pedidos/confirmar", {
        method: "POST",
        body: MODO_ENVIO
          ? {
              tipoEntrega: "ENVIO",
              envio: {
                nombre: envio.nombre.trim(),
                telefono: envio.telefono.trim(),
                direccion: envio.direccion.trim(),
                ciudad: envio.ciudad.trim(),
                notas: envio.notas.trim() || undefined,
              },
              couponCode: couponOpt,
            }
          : { branchId, couponCode: couponOpt },
      });
      router.push(`/pago/${pedido.id}`);
    } catch (e) {
      const error = explicarError(e instanceof ApiError ? e.message : "", e instanceof ApiError ? e.status : null, sucursalElegida);
      // Un cupón inválido reemplaza el aviso de "se usará el cupón": nunca dos a la vez.
      if (error.donde === "cupon") setCuponAplicado(false);
      setAviso(error);
      setConfirmando(false);
    }
  }

  function accionDe(a: Aviso) {
    if (a.accion === "carrito") return <Button variant="secondary" href="/carrito">Volver al carrito</Button>;
    if (a.accion === "productos") return <Button variant="secondary" href="/">Ver productos</Button>;
    if (a.accion === "login") {
      return (
        <>
          <Button href="/ingresar?volver=/pedido/confirmar" icon="user">Iniciar sesión</Button>
          <Button variant="ghost" href="/registro">Crear cuenta</Button>
        </>
      );
    }
    if (a.accion === "quitar-cupon") {
      return (
        <Button
          variant="secondary"
          onClick={() => {
            setCouponCode("");
            setCuponAplicado(false);
            setAviso(null);
          }}
        >
          Quitar cupón
        </Button>
      );
    }
    return undefined;
  }

  // El subtotal se calcula igual que en el carrito; el servidor valida precios al confirmar.
  const total = carrito?.items.reduce((acc, i) => acc + Number(i.product.digitalPrice) * i.quantity, 0) ?? 0;
  const vacio = !cargandoCarrito && !carrito?.items.length;

  function campo(id: CampoEnvio, opciones: { tipo?: string; ayuda?: string; opcional?: boolean; autoComplete: string; area?: boolean }) {
    const mensaje = errores[id];
    const comun = {
      id: `envio-${id}`,
      name: id,
      value: envio[id],
      autoComplete: opciones.autoComplete,
      "aria-invalid": mensaje ? true : undefined,
      "aria-describedby": mensaje ? `envio-${id}-error` : opciones.ayuda ? `envio-${id}-ayuda` : undefined,
      onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => cambiar(id, ev.target.value),
      onBlur: () => setErrores((e) => ({ ...e, [id]: validar(envio)[id] })),
    };
    return (
      <div className="campo">
        <label htmlFor={`envio-${id}`}>
          {ETIQUETAS_ENVIO[id]} {opciones.opcional && <span className="opcional">(opcional)</span>}
        </label>
        {opciones.area ? (
          <textarea {...comun} ref={(el) => { campos.current[id] = el; }} />
        ) : (
          <input {...comun} type={opciones.tipo ?? "text"} ref={(el) => { campos.current[id] = el; }} />
        )}
        {mensaje ? (
          <p className="error-campo" id={`envio-${id}-error`} role="alert">
            <Icon name="alert" size={16} />
            {mensaje}
          </p>
        ) : opciones.ayuda ? (
          <p className="ayuda" id={`envio-${id}-ayuda`}>{opciones.ayuda}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <ShopHeaderConectado variant="compact" active="carrito" />

      <main className="pantalla">
        <CheckoutSteps current={2} steps={PASOS_COMPRA} back={{ label: "Volver al carrito", href: "/carrito" }} />
        <h1 className="pantalla-titulo">{MODO_ENVIO ? "Datos y envío" : "Confirmar pedido"}</h1>

        {!conSesion && !vacio && (
          <Notice
            tone="info"
            title="Inicia sesión para hacer tu pedido"
            action={
              <>
                <Button href="/ingresar?volver=/pedido/confirmar" icon="user">Iniciar sesión</Button>
                <Button variant="ghost" href="/registro">Crear cuenta</Button>
              </>
            }
          >
            Puedes llenar tus datos ahora; tu carrito se conserva.
          </Notice>
        )}

        {cargandoCarrito ? (
          <Notice tone="progress">Cargando tu carrito…</Notice>
        ) : vacio ? (
          <Notice tone="info" title="Tu carrito está vacío" action={<Button variant="secondary" href="/">Ver productos</Button>}>
            Agrega productos para poder continuar.
          </Notice>
        ) : (
          <div className="confirmar-grid">
            <div className="confirmar-principal">
              <section className="card card-pad">
                <h2 className="pantalla-seccion">Productos</h2>
                {carrito?.items.map((item) => (
                  <div className="li" key={item.id}>
                    <span>{item.product.name}{item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
                    <span>{formatoCOP(Number(item.product.digitalPrice) * item.quantity)}</span>
                  </div>
                ))}
              </section>

              {MODO_ENVIO ? (
                <section className="card card-pad">
                  <h2 className="pantalla-seccion">Dónde te lo enviamos</h2>
                  <form className="formulario" noValidate onSubmit={(e) => { e.preventDefault(); continuar(); }}>
                    {campo("nombre", { autoComplete: "name" })}
                    {campo("telefono", { tipo: "tel", autoComplete: "tel", ayuda: "Lo usamos solo para coordinar la entrega." })}
                    {campo("direccion", { autoComplete: "street-address", ayuda: "Calle, número, barrio y apartamento o casa." })}
                    {campo("ciudad", { autoComplete: "address-level2" })}
                    {campo("notas", { opcional: true, area: true, autoComplete: "off", ayuda: "Por ejemplo: portería, piso, horario." })}
                  </form>
                </section>
              ) : (
                <section className="card card-pad">
                  <h2 className="pantalla-seccion">Retiro en sucursal</h2>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor="sucursal">Sucursal</label>
                    <select id="sucursal" value={branchId ?? ""} onChange={(e) => setBranchId(Number(e.target.value))}>
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                      ))}
                    </select>
                  </div>
                  <p className="faint" style={{ marginTop: 8 }}>
                    Al confirmar el pedido se genera tu código de retiro; lo verás en el comprobante cuando pagues. Se puede
                    usar una sola vez y vence 5 días calendario después.
                  </p>
                </section>
              )}
            </div>

            <aside className="confirmar-lateral">
              <section className="card card-pad">
                <h2 className="pantalla-seccion">Resumen del pedido</h2>
                <div className="totalsrow"><span>Subtotal</span><span>{formatoCOP(total)}</span></div>
                <div className="totalsrow grand"><span>Total</span><span>{formatoCOP(total)}</span></div>

                <div className="cupon">
                  <label htmlFor="cupon" className="cupon-etiqueta">Cupón de lealtad <span className="opcional">(opcional)</span></label>
                  <div className="cupon-fila">
                    <input
                      id="cupon"
                      value={couponCode}
                      placeholder="Escribe tu código"
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCuponAplicado(false);
                        if (aviso?.donde === "cupon") setAviso(null);
                      }}
                    />
                    <Button variant="secondary" disabled={!couponCode} title={couponCode ? "Usar este cupón en el pedido" : "Escribe un código para aplicarlo"} onClick={() => setCuponAplicado(true)}>
                      Aplicar
                    </Button>
                  </div>
                  {cuponAplicado && aviso?.donde !== "cupon" && (
                    <Notice tone="info">Usaremos el cupón {couponCode} al confirmar el pedido. Si no es válido, te avisamos aquí.</Notice>
                  )}
                  {aviso?.donde === "cupon" && (
                    <Notice tone="danger" title={aviso.titulo} action={accionDe(aviso)}>{aviso.texto}</Notice>
                  )}
                  <p className="faint">Cada cupón se usa una sola vez por pedido.</p>
                </div>
              </section>

              {aviso?.donde === "resumen" && (
                <Notice tone="danger" title={aviso.titulo} action={accionDe(aviso)}>{aviso.texto}</Notice>
              )}

              <Notice tone="info">
                {MODO_ENVIO
                  ? "Reservamos tus unidades mientras pagas. En el siguiente paso pagas con tarjeta en la pasarela segura."
                  : "Al confirmar el pedido reservamos tus unidades hasta que pagues."}
              </Notice>

              <Button size="lg" full icon="chevron-right" loading={confirmando} onClick={continuar}>
                {MODO_ENVIO ? "Continuar al pago" : "Confirmar pedido"}
              </Button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
