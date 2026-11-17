// Cliente HTTP hacia el backend (NestJS). Un solo punto de entrada para que cada pantalla no repita el
// manejo de token / X-Cart-Token / errores.
import { avisarCambioDeSesion } from "./eventos";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
// Origen del backend sin el prefijo /api, para recursos estáticos (imágenes del catálogo curado, legado)
// servidos fuera de la API — ver backend/src/main.ts.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function urlImagenProducto(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  // /media/... lo sirve el backend (legado); /productos/... vive en frontend/public.
  return imageUrl.startsWith("/media/") ? `${API_ORIGIN}${imageUrl}` : imageUrl;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("comproya_token");
}

/** ¿Hay una sesión guardada en este navegador? (El servidor sigue siendo quien la valida.) */
export function haySesion(): boolean {
  return !!getToken();
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("comproya_token", token);
  else localStorage.removeItem("comproya_token");
}

export function getCartToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("comproya_cart_token");
}

export function setCartToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("comproya_cart_token", token);
  else localStorage.removeItem("comproya_cart_token");
}

// Solo para mostrar "Hola, <nombre>" en la cabecera sin una llamada extra por pantalla — el backend sigue
// siendo la única fuente de verdad de la sesión.
export interface CustomerResumen {
  id: number;
  name: string;
}

export function getStoredCustomer(): CustomerResumen | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("comproya_customer");
  return raw ? (JSON.parse(raw) as CustomerResumen) : null;
}

export function setStoredCustomer(customer: CustomerResumen | null) {
  if (typeof window === "undefined") return;
  if (customer) localStorage.setItem("comproya_customer", JSON.stringify(customer));
  else localStorage.removeItem("comproya_customer");
}

/** Guarda la sesión que devolvió el servidor y avisa a la cabecera. */
export function iniciarSesionLocal(accessToken: string, cliente: CustomerResumen) {
  setToken(accessToken);
  setStoredCustomer({ id: cliente.id, name: cliente.name });
  avisarCambioDeSesion();
}

export function cerrarSesion() {
  setToken(null);
  setStoredCustomer(null);
  avisarCambioDeSesion();
}

// --- Cuenta interna (Coordinador de Canal Digital) --------------------------------------------------------------
// Sesión separada de la del Cliente digital: otro token, otra clave de almacenamiento, y ninguna de las dos se envía en
// las llamadas de la otra. El servidor es quien valida (GET /cuenta/interno/yo); esto solo evita pedir lo que no se puede.
export interface CuentaInternaResumen {
  id: number;
  name: string;
  email: string;
  role: string;
}

const CLAVE_TOKEN_INTERNO = "comproya_staff_token";
const CLAVE_CUENTA_INTERNA = "comproya_staff";

function getTokenInterno(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLAVE_TOKEN_INTERNO);
}

export function haySesionInterna(): boolean {
  return !!getTokenInterno();
}

export function getCuentaInterna(): CuentaInternaResumen | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CLAVE_CUENTA_INTERNA);
  return raw ? (JSON.parse(raw) as CuentaInternaResumen) : null;
}

export function iniciarSesionInterna(accessToken: string, cuenta: CuentaInternaResumen) {
  localStorage.setItem(CLAVE_TOKEN_INTERNO, accessToken);
  localStorage.setItem(CLAVE_CUENTA_INTERNA, JSON.stringify(cuenta));
}

export function cerrarSesionInterna() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLAVE_TOKEN_INTERNO);
  localStorage.removeItem(CLAVE_CUENTA_INTERNA);
}

/** Cierra la sesión interna y lleva a la pantalla de ingreso, con la ruta actual para volver después. */
function volverAIngresoInterno() {
  cerrarSesionInterna();
  if (typeof window !== "undefined") {
    window.location.assign(`/admin/ingresar?volver=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; cartToken?: boolean; interno?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Las llamadas internas usan solo la sesión interna; nunca el token del cliente ni el del carrito.
  const token = options.interno ? getTokenInterno() : options.auth !== false ? getToken() : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.cartToken !== false && !options.interno) {
    const cartToken = getCartToken();
    if (cartToken) headers["X-Cart-Token"] = cartToken;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const esJson = res.headers.get("content-type")?.includes("application/json");
  const data = esJson ? await res.json() : null;

  if (!res.ok) {
    // Sesión vencida o inválida: se limpia para que la cabecera pida iniciar sesión en vez de mostrar un nombre viejo.
    if (res.status === 401 && token) {
      if (options.interno) volverAIngresoInterno();
      else cerrarSesion();
    }
    const mensaje = Array.isArray(data?.message) ? data.message.join(". ") : data?.message;
    throw new ApiError(res.status, mensaje ?? "Error inesperado del servidor");
  }
  return data as T;
}
