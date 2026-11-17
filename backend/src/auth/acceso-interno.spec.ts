import { ExecutionContext, ForbiddenException, INestApplication, ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import request from "supertest";
import { StaffRole } from "@prisma/client";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";
import { resetDb } from "../test-utils/reset-db";
import { AuthModule } from "./auth.module";
import { RolInternoGuard } from "./acceso-interno";
import { CatalogoModule } from "../catalogo/catalogo.module";
import { CuentaModule } from "../cuenta/cuenta.module";
import { PedidoModule } from "../pedido/pedido.module";

// REQ-017: las funciones internas (publicar un producto, consultar ventas, operar pedidos) solo se abren con la sesión
// de la cuenta interna del Coordinador de Canal Digital, y esa sesión es distinta de la del Cliente digital.
describe("Acceso interno (cuenta del Coordinador de Canal Digital)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  const CLAVE = "clave-de-prueba-1";
  const producto = { homologatedCode: "TEST-000101", name: "Producto de prueba", categoryName: "Pruebas", cost: 10000, digitalPrice: 15000 };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, CatalogoModule, CuentaModule, PedidoModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = moduleRef.get(JwtService);
  });

  beforeEach(async () => resetDb(prisma));
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function crearStaff(email = "coordinador@prueba.local", active = true) {
    return prisma.staffUser.create({
      data: { email, name: "Coordinador de prueba", passwordHash: bcrypt.hashSync(CLAVE, 4), role: StaffRole.CHANNEL_COORDINATOR, active },
    });
  }

  async function iniciarSesion(email = "coordinador@prueba.local") {
    const res = await request(app.getHttpServer()).post("/cuenta/interno/login").send({ email, password: CLAVE });
    return res.body.accessToken as string;
  }

  async function crearCliente() {
    const customer = await prisma.customer.create({
      data: { document: "CC-INT-1", name: "Cliente", email: "cliente@prueba.local", passwordHash: "x" },
    });
    return { customer, token: jwt.sign({ sub: customer.id, email: customer.email }) };
  }

  it("el inicio de sesión correcto devuelve un token y el perfil, sin la contraseña", async () => {
    await crearStaff();
    const res = await request(app.getHttpServer()).post("/cuenta/interno/login").send({ email: "Coordinador@Prueba.local", password: CLAVE });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.staff).toMatchObject({ name: "Coordinador de prueba", role: "CHANNEL_COORDINATOR" });
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);
  });

  it("contraseña equivocada y correo inexistente responden lo mismo: 401 «Credenciales inválidas»", async () => {
    await crearStaff();
    const mala = await request(app.getHttpServer()).post("/cuenta/interno/login").send({ email: "coordinador@prueba.local", password: "otra-clave-123" });
    const sinCuenta = await request(app.getHttpServer()).post("/cuenta/interno/login").send({ email: "nadie@prueba.local", password: CLAVE });
    expect(mala.status).toBe(401);
    expect(sinCuenta.status).toBe(401);
    expect(mala.body.message).toBe("Credenciales inválidas");
    expect(sinCuenta.body.message).toBe(mala.body.message);
  });

  it("una cuenta desactivada no inicia sesión, y su token ya emitido deja de servir", async () => {
    const staff = await crearStaff();
    const token = await iniciarSesion();
    const antes = await request(app.getHttpServer()).get("/cuenta/interno/yo").set("Authorization", `Bearer ${token}`);
    expect(antes.status).toBe(200);

    await prisma.staffUser.update({ where: { id: staff.id }, data: { active: false } });
    const despues = await request(app.getHttpServer()).get("/cuenta/interno/yo").set("Authorization", `Bearer ${token}`);
    const login = await request(app.getHttpServer()).post("/cuenta/interno/login").send({ email: "coordinador@prueba.local", password: CLAVE });
    expect(despues.status).toBe(401);
    expect(login.status).toBe(401);
  });

  it("POST /catalogo/productos: sin sesión -> 401 y con la sesión de un cliente -> 401; no se crea nada", async () => {
    const { token } = await crearCliente();
    const sinSesion = await request(app.getHttpServer()).post("/catalogo/productos").send(producto);
    const comoCliente = await request(app.getHttpServer()).post("/catalogo/productos").set("Authorization", `Bearer ${token}`).send(producto);
    expect(sinSesion.status).toBe(401);
    expect(comoCliente.status).toBe(401);
    expect(await prisma.product.count()).toBe(0);
  });

  it("POST /catalogo/productos con la sesión interna -> 201, crea el producto y deja auditado quién lo publicó", async () => {
    const staff = await crearStaff();
    const token = await iniciarSesion();
    const res = await request(app.getHttpServer()).post("/catalogo/productos").set("Authorization", `Bearer ${token}`).send(producto);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ homologatedCode: "TEST-000101", published: true });
    expect(await prisma.product.count()).toBe(1);
    const auditoria = await prisma.auditLog.findFirst({ where: { action: "producto.publicar:TEST-000101" } });
    expect(auditoria?.actor).toBe(`coordinador:${staff.id}`);
  });

  it("RN-01 sigue valiendo con la sesión interna: un código no homologado responde 400", async () => {
    await crearStaff();
    const token = await iniciarSesion();
    const res = await request(app.getHttpServer())
      .post("/catalogo/productos")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...producto, homologatedCode: "codigo-libre" });
    expect(res.status).toBe(400);
  });

  it("la sesión interna no sirve como sesión de cliente: GET /pedidos -> 401", async () => {
    await crearStaff();
    const token = await iniciarSesion();
    const res = await request(app.getHttpServer()).get("/pedidos").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("un token de cliente cuyo id coincide con el de una cuenta interna tampoco abre las rutas internas", async () => {
    const staff = await crearStaff();
    const falso = jwt.sign({ sub: staff.id, email: staff.email });
    const res = await request(app.getHttpServer()).get("/cuenta/interno/yo").set("Authorization", `Bearer ${falso}`);
    expect(res.status).toBe(401);
  });

  it("operación de pedidos y sincronización: sin sesión interna -> 401", async () => {
    const { token } = await crearCliente();
    const rutas = ["/pedidos/1/iniciar-alistamiento", "/pedidos/1/listo-para-retiro", "/catalogo/sucursales/1/sincronizar"];
    for (const ruta of rutas) {
      const comoCliente = await request(app.getHttpServer()).post(ruta).set("Authorization", `Bearer ${token}`);
      const sinSesion = await request(app.getHttpServer()).post(ruta);
      expect([comoCliente.status, sinSesion.status]).toEqual([401, 401]);
    }
    const retirar = await request(app.getHttpServer()).post("/pedidos/1/retirar").set("Authorization", `Bearer ${token}`).send({ pickupCode: "RET-XXXXXXXX" });
    expect(retirar.status).toBe(401);
  });
});

// Hoy solo existe el rol Coordinador de Canal Digital, así que el rechazo por rol no se puede provocar por HTTP;
// se prueba el guard directo con un rol que la ruta no admite.
describe("RolInternoGuard", () => {
  const contexto = (rol: string): ExecutionContext =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user: { staffId: 1, email: "x@y.z", role: rol } }) }),
    }) as unknown as ExecutionContext;
  const guardConRoles = (roles?: StaffRole[]) => new RolInternoGuard({ getAllAndOverride: () => roles } as unknown as Reflector);

  it("deja pasar el rol que la ruta admite", () => {
    expect(guardConRoles([StaffRole.CHANNEL_COORDINATOR]).canActivate(contexto("CHANNEL_COORDINATOR"))).toBe(true);
  });

  it("rechaza con 403 un rol que la ruta no admite", () => {
    expect(() => guardConRoles([StaffRole.CHANNEL_COORDINATOR]).canActivate(contexto("OTRO_ROL"))).toThrow(ForbiddenException);
  });

  it("si la ruta no pide un rol concreto, basta con la sesión interna", () => {
    expect(guardConRoles(undefined).canActivate(contexto("OTRO_ROL"))).toBe(true);
    expect(guardConRoles([]).canActivate(contexto("OTRO_ROL"))).toBe(true);
  });
});
