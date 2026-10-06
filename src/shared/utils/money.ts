export function centsToBRL(cents: number): string {
  if (!Number.isSafeInteger(cents))
    throw new Error("Valor inválido em centavos.");
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
/** Brazilian input: 1.500,00 or 1500. Reject ambiguous/invalid formats. */
export function inputToCents(input: string): number | null {
  const value = input.trim().replace(/^R\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.replace(/\./g, "").split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
