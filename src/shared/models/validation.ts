export function required(value: string, label: string): string {
  const result = value.trim();
  if (!result) throw new Error(`${label} é obrigatório.`);
  return result;
}
export function money(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("Informe um valor monetário válido.");
  return value;
}
export function count(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("Informe uma quantidade inteira, a partir de zero.");
  return value;
}
export function oneOf<T extends string>(value: T, allowed: readonly T[]): T {
  if (!allowed.includes(value)) throw new Error("Seleção inválida.");
  return value;
}
export function isoDay(value: string): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value
  )
    throw new Error("Informe uma data válida.");
  return value;
}
export function isoTime(value: string): string {
  if (Number.isNaN(Date.parse(value)) || !value.includes("T"))
    throw new Error("Informe data e hora válidas.");
  return new Date(value).toISOString();
}
export function optional(value: string | null | undefined): string | null {
  return value?.trim() || null;
}
