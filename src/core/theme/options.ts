export const taskCategories = [
  "Local",
  "Convidados",
  "Fornecedores",
  "Cerimônia",
  "Festa",
  "Documentação",
  "Trajes",
  "Financeiro",
];
export const priorities = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];
export const responsible = [
  { value: "self", label: "Eu" },
  { value: "partner", label: "Meu par" },
  { value: "both", label: "Nós dois" },
];
export const rsvp = [
  { value: "pending", label: "Aguardando" },
  { value: "confirmed", label: "Confirmado" },
  { value: "declined", label: "Não irá" },
];
export const vendorStatuses = [
  { value: "researching", label: "Pesquisando" },
  { value: "negotiating", label: "Em negociação" },
  { value: "contracted", label: "Contratado" },
  { value: "canceled", label: "Cancelado" },
];
export function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((o) => o.value === value)?.label ?? value;
}
