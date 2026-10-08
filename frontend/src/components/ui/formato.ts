/** Pesos colombianos sin decimales y con separador de miles: $ 1.899.900 */
export function formatoCOP(valor: number | string | undefined): string {
  const n = Math.round(Number(valor) || 0);
  const digitos = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${n < 0 ? "- " : ""}$ ${digitos}`;
}
