// Cliente HTTP hacia el backend (NestJS). Un solo punto de entrada para que
// cada pantalla no repita el manejo de token / X-Cart-Token / errores.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("comproya_token");
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

// Solo para mostrar "Hola, <nombre>" en el encabezado sin una llamada extra
// por pantalla — el backend sigue siendo la única fuente de verdad de la sesión.
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

// Sucursal de retiro elegida en la ficha de producto (P-3) y llevada a la
// confirmación del pedido (P-9) — el pedido solo admite una sucursal.
export function getSelectedBranch(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("comproya_branch_id");
  return raw ? Number(raw) : null;
}

export function setSelectedBranch(branchId: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem("comproya_branch_id", String(branchId));
}

export function cerrarSesion() {
  setToken(null);
  setStoredCustomer(null);
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; cartToken?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  if (options.cartToken !== false) {
    const cartToken = getCartToken();
    if (cartToken) headers["X-Cart-Token"] = cartToken;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? "Error inesperado del servidor");
  }
  return data as T;
}
