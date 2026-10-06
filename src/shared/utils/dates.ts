export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function parseDateInput(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), 12);
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  )
    return null;
  return `${y}-${m}-${d}`;
}
export function dateInput(value: string | null | undefined): string {
  if (!value) return "";
  const day = value.length > 10 ? localDay(new Date(value)) : value;
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}
export function timeInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
export function parseDateTime(date: string, time: string): string | null {
  const day = parseDateInput(date);
  if (!day || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const result = new Date(`${day}T${time}:00`);
  if (timeInput(result.toISOString()) !== time) return null;
  return result.toISOString();
}
export function daysUntil(date: string, now = new Date()): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Math.round(
    (Date.UTC(y, m - 1, d) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      86400000,
  );
}
export function countdown(date: string, now = new Date()): string {
  const days = daysUntil(date, now);
  return days < 0
    ? "O sim de vocês já faz parte da história"
    : days === 0
      ? "É hoje"
      : days === 1
        ? "É amanhã"
        : `${days} dias para celebrar`;
}
export function formatDate(value: string | null, short = false): string {
  if (!value) return "Sem prazo";
  const date =
    value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return date.toLocaleDateString(
    "pt-BR",
    short
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "long", year: "numeric" },
  );
}
export function formatDateTime(value: string): string {
  return `${formatDate(value, true)} · ${timeInput(value)}`;
}
export function dueLabel(value: string | null): string {
  if (!value) return "Sem prazo";
  const days = daysUntil(value);
  return days === 0
    ? "Hoje"
    : days === 1
      ? "Amanhã"
      : days < 0
        ? `Atrasada · ${formatDate(value, true)}`
        : formatDate(value, true);
}
export function addDays(date: string, count: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + count);
  return localDay(value);
}
