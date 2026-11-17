import { BadRequestException } from "@nestjs/common";
import { rangoDeFechas } from "./ventas";

describe("rangoDeFechas (REQ-016)", () => {
  it("toma el día completo en hora de Colombia: de las 00:00 a las 23:59:59.999 (UTC−5)", () => {
    const { gte, lte } = rangoDeFechas("2026-10-12", "2026-10-12");
    expect(gte?.toISOString()).toBe("2026-10-12T05:00:00.000Z");
    expect(lte?.toISOString()).toBe("2026-10-13T04:59:59.999Z");
  });

  it("acepta un solo extremo", () => {
    expect(rangoDeFechas("2026-10-12").lte).toBeUndefined();
    expect(rangoDeFechas(undefined, "2026-10-12").gte).toBeUndefined();
    expect(rangoDeFechas()).toEqual({});
  });

  it("rechaza una fecha inicial posterior a la final", () => {
    expect(() => rangoDeFechas("2026-10-13", "2026-10-12")).toThrow(BadRequestException);
  });

  it("rechaza días que no existen, aunque Date los corra al mes siguiente", () => {
    expect(() => rangoDeFechas("2026-02-31")).toThrow(BadRequestException);
    expect(() => rangoDeFechas(undefined, "2026-13-01")).toThrow(BadRequestException);
  });
});
