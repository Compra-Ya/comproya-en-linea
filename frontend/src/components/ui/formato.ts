/** Une nombres de clase omitiendo los vacíos. */
export function cx(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(" ");
}

/** Pesos colombianos sin decimales y con punto de miles: $ 1.899.900 (el mismo formato de todo el sitio).
 *  El espacio es no separable para que el signo y la cifra nunca queden en líneas distintas. */
export function formatCOP(valor: number | string | null | undefined): string {
  const n = Math.round(Number(valor) || 0);
  const digitos = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "-\u00a0" : ""}$\u00a0${digitos}`;
}

/** "1 unidad" / "2 unidades". */
export function unidades(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}
