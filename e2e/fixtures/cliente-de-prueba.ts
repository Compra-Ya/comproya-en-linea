import { APIRequestContext, Page } from "@playwright/test";

// Helpers de preparación para las pruebas de sistema CU-09-01/CU-09-02 —
// registran el cliente y sincronizan una sucursal directo contra la API
// (evita flakiness de UI en el setup; el recorrido de compra en sí SÍ es UI).
const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api";

export interface ClienteDePrueba {
  customerId: number;
  name: string;
  accessToken: string;
}

export async function registrarClienteDePrueba(request: APIRequestContext, sufijo: string): Promise<ClienteDePrueba> {
  const name = `Cliente E2E ${sufijo}`;
  const res = await request.post(`${API_URL}/cuenta/registro`, {
    data: {
      document: `E2E${sufijo}`,
      name,
      email: `e2e${sufijo}@comproya-test.local`,
      password: "claveClave1",
    },
  });
  if (!res.ok()) throw new Error(`No se pudo registrar el cliente de prueba: ${await res.text()}`);
  const body = await res.json();
  await request.post(`${API_URL}/cuenta/consentimiento`, {
    headers: { Authorization: `Bearer ${body.accessToken}` },
    data: { activo: true },
  });
  return { customerId: body.customer.id, name, accessToken: body.accessToken };
}

// Deja al navegador "con sesión iniciada" sin pasar por el formulario de
// login — el registro/login en sí ya lo cubren las pruebas de unidad e
// integración de CU-1 (GestorDeRegistro, GestorDeConsentimiento).
export async function iniciarSesionEnNavegador(page: Page, cliente: ClienteDePrueba) {
  await page.goto("/");
  await page.evaluate(
    ({ token, customerId, name }) => {
      localStorage.setItem("comproya_token", token);
      localStorage.setItem("comproya_customer", JSON.stringify({ id: customerId, name }));
    },
    { token: cliente.accessToken, customerId: cliente.customerId, name: cliente.name },
  );
  await page.reload();
}

export interface SucursalSincronizada {
  id: number;
  name: string;
}

// RN-04: solo una sucursal sincronizada hace menos de 15 minutos ofrece
// retiro — se sincroniza explícitamente antes de confirmar el pedido, igual
// que haría el proceso por lotes real del ERP.
export async function sucursalSincronizada(request: APIRequestContext): Promise<SucursalSincronizada> {
  const res = await request.get(`${API_URL}/catalogo/sucursales`);
  const sucursales = (await res.json()) as SucursalSincronizada[];
  const elegida = sucursales[0];
  await request.post(`${API_URL}/catalogo/sucursales/${elegida.id}/sincronizar`);
  return elegida;
}
