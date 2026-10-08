import { PrismaClient } from "@prisma/client";
import { resetDb } from "../../src/test-utils/reset-db";
import { grupoPorNombre } from "./product-images";
import { traducirNombre, traducirNombresDeProductos } from "./traducir-nombres";

describe("traducirNombre", () => {
  it("traduce los sintéticos con concordancia de género", () => {
    expect(traducirNombre("Awesome Bamboo Hat")).toBe("Gorra de bambú genial");
    expect(traducirNombre("Ergonomic Wooden Chair")).toBe("Silla de madera ergonómica");
    expect(traducirNombre("Fresh Steel Computer")).toBe("Computador de acero fresco");
  });

  it("concuerda el número en los sustantivos plurales", () => {
    expect(traducirNombre("Handmade Cotton Gloves")).toBe("Guantes de algodón hechos a mano");
    expect(traducirNombre("Tasty Rubber Chips")).toBe("Papas fritas de caucho deliciosas");
    expect(traducirNombre("Oriental Gold Towels")).toBe("Toallas de oro orientales");
  });

  it("traduce los títulos de DummyJSON y conserva marcas y modelos", () => {
    expect(traducirNombre("Red Lipstick")).toBe("Labial rojo");
    expect(traducirNombre("Apple AirPods Max Silver")).toBe("Apple AirPods Max plata");
    expect(traducirNombre("Rolex Datejust")).toBe("Rolex Datejust");
    expect(traducirNombre("iPhone 13 Pro")).toBe("iPhone 13 Pro");
  });

  it("es idempotente: un nombre ya en español no cambia", () => {
    for (const nombre of ["Awesome Bamboo Hat", "Red Lipstick", "Televisor LED 55'' 4K UHD Smart TV"]) {
      const una = traducirNombre(nombre);
      expect(traducirNombre(una)).toBe(una);
    }
  });

  it("deja igual lo que no reconoce", () => {
    expect(traducirNombre("Producto de prueba")).toBe("Producto de prueba");
    expect(traducirNombre("Algo Desconocido Raro")).toBe("Algo Desconocido Raro");
  });

  it("los nombres traducidos siguen asignándose al mismo grupo de foto", () => {
    expect(grupoPorNombre("Silla de madera ergonómica")).toBe("silla");
    expect(grupoPorNombre("Papas fritas de caucho deliciosas")).toBe("papas");
    expect(grupoPorNombre("Guantes de algodón hechos a mano")).toBe("guantes");
  });
});

describe("traducirNombresDeProductos (base de pruebas)", () => {
  const prisma = new PrismaClient();
  beforeEach(async () => {
    await resetDb(prisma);
    const cat = await prisma.category.create({ data: { name: "furniture" } });
    const base = { categoryId: cat.id, cost: 10, digitalPrice: 20 };
    await prisma.product.createMany({
      data: [
        { ...base, homologatedCode: "T-1", name: "Soft Wooden Table" },
        { ...base, homologatedCode: "T-2", name: "Soft Wooden Table" },
        { ...base, homologatedCode: "T-3", name: "Producto de prueba" },
      ],
    });
  });
  afterAll(async () => {
    await resetDb(prisma);
    await prisma.$disconnect();
  });

  it("traduce por nombre distinto y la segunda corrida no cambia nada", async () => {
    expect(await traducirNombresDeProductos(prisma)).toEqual({ evaluados: 2, cambiados: 1, sinCambio: 1 });
    const nombres = (await prisma.product.findMany({ orderBy: { homologatedCode: "asc" } })).map((p) => p.name);
    expect(nombres).toEqual(["Mesa de madera suave", "Mesa de madera suave", "Producto de prueba"]);
    expect(await traducirNombresDeProductos(prisma)).toMatchObject({ cambiados: 0 });
  });

  it("dryRun no escribe", async () => {
    expect((await traducirNombresDeProductos(prisma, true)).cambiados).toBe(1);
    expect(await prisma.product.count({ where: { name: "Soft Wooden Table" } })).toBe(2);
  });
});
