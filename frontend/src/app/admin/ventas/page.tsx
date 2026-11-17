"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { EstadoDeVenta, ListaDeVentas, Venta } from "@/lib/types";
import { Badge, formatCOP } from "@/components/ui";
import PanelInterno from "@/components/PanelInterno";

// Consulta de ventas del Coordinador de Canal Digital (REQ-016): una lista con filtros, no un tablero. Los totales y
// las ventas que cuentan los decide el servidor; aquí solo se muestran.
const ESTADOS: Array<{ valor: EstadoDeVenta; texto: string }> = [
  { valor: "PAID", texto: "Pagado" },
  { valor: "PREPARING", texto: "En alistamiento" },
  { valor: "READY_FOR_PICKUP", texto: "Listo para retiro" },
  { valor: "DELIVERED", texto: "Entregado" },
];
const TEXTO_ESTADO = Object.fromEntries(ESTADOS.map((e) => [e.valor, e.texto])) as Record<EstadoDeVenta, string>;

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" });

interface Filtros {
  desde: string;
  hasta: string;
  estado: "" | EstadoDeVenta;
}
const SIN_FILTROS: Filtros = { desde: "", hasta: "", estado: "" };

export default function VentasPage() {
  const [formulario, setFormulario] = useState<Filtros>(SIN_FILTROS);
  const [aplicados, setAplicados] = useState<Filtros>(SIN_FILTROS);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState<ListaDeVentas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState<number | null>(null);

  const cargar = useCallback(async (filtros: Filtros, page: number) => {
    setCargando(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page) });
    if (filtros.desde) params.set("desde", filtros.desde);
    if (filtros.hasta) params.set("hasta", filtros.hasta);
    if (filtros.estado) params.set("estado", filtros.estado);
    try {
      setDatos(await api<ListaDeVentas>(`/ventas?${params.toString()}`, { interno: true }));
    } catch (e) {
      setDatos(null);
      setError(e instanceof ApiError ? e.message : "No se pudo consultar las ventas");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(aplicados, pagina);
  }, [aplicados, pagina, cargar]);

  function filtrar(e: React.FormEvent) {
    e.preventDefault();
    setAbierta(null);
    setPagina(1);
    setAplicados(formulario);
  }

  function limpiar() {
    setFormulario(SIN_FILTROS);
    setAbierta(null);
    setPagina(1);
    setAplicados(SIN_FILTROS);
  }

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.pageSize)) : 1;

  return (
    <PanelInterno titulo="Panel del Coordinador de Canal Digital" activa="ventas">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22 }}>Ventas</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          Pedidos con el pago confirmado. No cuentan los pedidos sin pagar, con pago fallido ni cancelados. Las fechas son las del pedido, en hora de Colombia.
        </p>
      </div>

      <form onSubmit={filtrar} className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, alignItems: "end" }}>
          <div className="field">
            <label htmlFor="ventas-desde">Desde</label>
            <input id="ventas-desde" type="date" value={formulario.desde} onChange={(e) => setFormulario({ ...formulario, desde: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="ventas-hasta">Hasta</label>
            <input id="ventas-hasta" type="date" value={formulario.hasta} onChange={(e) => setFormulario({ ...formulario, hasta: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="ventas-estado">Estado</label>
            <select id="ventas-estado" value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as Filtros["estado"] })}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e.valor} value={e.valor}>{e.texto}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button type="submit" className="btn btn-primary">Filtrar</button>
            <button type="button" className="btn" onClick={limpiar}>Limpiar</button>
          </div>
        </div>
      </form>

      {error && <div className="notice notice-danger" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      {datos && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div className="card card-pad">
            <p className="muted">Total vendido</p>
            <p style={{ fontSize: 24, fontWeight: 800 }} data-testid="total-vendido">{formatCOP(datos.totalVendido)}</p>
          </div>
          <div className="card card-pad">
            <p className="muted">Ventas</p>
            <p style={{ fontSize: 24, fontWeight: 800 }} data-testid="cantidad-ventas">{datos.total}</p>
          </div>
        </div>
      )}

      {cargando && !datos && <p className="muted">Cargando ventas…</p>}

      {datos && datos.items.length === 0 && (
        <div className="card card-pad" data-testid="sin-ventas">
          <p><strong>No hay ventas con esos filtros.</strong></p>
          <p className="muted" style={{ marginTop: 4 }}>Cambia las fechas o el estado, o limpia los filtros para ver todas.</p>
        </div>
      )}

      {datos && datos.items.length > 0 && (
        <div className="card" style={{ overflow: "auto" }} aria-busy={cargando}>
          <table>
            <thead>
              <tr>
                <th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th style={{ textAlign: "right" }}>Total</th><th>Estado</th><th>Envío</th>
              </tr>
            </thead>
            <tbody>
              {datos.items.map((v: Venta) => (
                <Fragment key={v.id}>
                  <tr>
                    <td>#{v.id}</td>
                    <td>{fechaCorta(v.fecha)}</td>
                    <td>{v.cliente.nombre}</td>
                    <td>
                      {v.productos.map((p) => `${p.cantidad} × ${p.nombre}`).join(", ")}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {formatCOP(v.total)}
                      {v.descuento > 0 && <span className="faint" style={{ display: "block" }}>con {v.codigoCupon} (−{formatCOP(v.descuento)})</span>}
                    </td>
                    <td><Badge tone={v.estado === "DELIVERED" ? "ok" : "info"}>{TEXTO_ESTADO[v.estado]}</Badge></td>
                    <td>
                      {v.envio ? (
                        <button type="button" className="btn" aria-expanded={abierta === v.id} onClick={() => setAbierta(abierta === v.id ? null : v.id)}>
                          {abierta === v.id ? "Ocultar" : "Ver envío"}
                        </button>
                      ) : (
                        <span className="faint">Retiro</span>
                      )}
                    </td>
                  </tr>
                  {v.envio && abierta === v.id && (
                    <tr>
                      <td colSpan={7} style={{ background: "var(--bg, #f6f7f9)" }}>
                        {/* Pegado al borde izquierdo: en celular la tabla se desplaza de lado y el detalle debe quedar a la vista. */}
                        <div style={{ position: "sticky", left: 14, maxWidth: "calc(100vw - 96px)" }}>
                          <p><strong>{v.envio.nombre}</strong> · {v.envio.telefono}</p>
                          <p>{v.envio.direccion}, {v.envio.ciudad}</p>
                          {v.envio.notas && <p className="muted">Notas: {v.envio.notas}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {datos && datos.total > datos.pageSize && (
        <nav aria-label="Páginas de ventas" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
          <button type="button" className="btn" disabled={pagina <= 1 || cargando} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span className="muted">Página {pagina} de {totalPaginas}</span>
          <button type="button" className="btn" disabled={pagina >= totalPaginas || cargando} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
        </nav>
      )}
    </PanelInterno>
  );
}
