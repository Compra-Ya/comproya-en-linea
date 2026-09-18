// Clase de diseño PoliticaDatos (Plan_Pruebas_ComproYa.docx, Caso de Uso 1,
// PI-03: "PoliticaDatos simulada con una versión vigente fija"). El canon no
// versiona la política de datos personales como una entidad propia — esto es
// una constante en código, sin tabla nueva, solo para que
// GestorDeConsentimiento.otorgarConsentimiento() referencie una versión.
export class PoliticaDatos {
  constructor(
    public readonly version: string,
    public readonly vigenteDesde: Date,
  ) {}
}

export const POLITICA_DATOS_VIGENTE = new PoliticaDatos("v1", new Date("2025-01-01T00:00:00.000Z"));
