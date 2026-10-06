import type { Table } from "@/core/database/repository";
import type { PlanningSnapshot } from "@/features/home/model/planningSnapshot";
import {
  priorities,
  responsible,
  rsvp,
  taskCategories,
  vendorStatuses,
} from "@/core/theme/options";
export type FormValues = Record<string, string>;
export type FieldDefinition = {
  key: string;
  label: string;
  type?:
    | "text"
    | "multiline"
    | "date"
    | "time"
    | "money"
    | "number"
    | "phone"
    | "email"
    | "select"
    | "chips"
    | "toggle";
  required?: boolean;
  options?: readonly { value: string; label: string }[];
};
export const entityMeta: Record<
  Table,
  { title: string; singular: string; route: string }
> = {
  tasks: { title: "Tarefa", singular: "tarefa", route: "tasks" },
  guests: { title: "Convidado", singular: "convidado", route: "guests" },
  guest_groups: {
    title: "Grupo / família",
    singular: "grupo",
    route: "groups",
  },
  wedding_events: {
    title: "Evento do casamento",
    singular: "evento",
    route: "events",
  },
  appointments: {
    title: "Compromisso",
    singular: "compromisso",
    route: "appointments",
  },
  vendors: { title: "Fornecedor", singular: "fornecedor", route: "vendors" },
  payments: { title: "Pagamento", singular: "pagamento", route: "payments" },
  budget_categories: {
    title: "Categoria do orçamento",
    singular: "categoria",
    route: "budget",
  },
};
const none = { value: "", label: "Sem vínculo" };
export function fieldsFor(
  kind: Table,
  data: PlanningSnapshot,
): FieldDefinition[] {
  const categories = [
    none,
    ...data.categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const vendorOptions = [
    none,
    ...data.vendors.map((v) => ({ value: v.id, label: v.name })),
  ];
  switch (kind) {
    case "tasks":
      return [
        { key: "title", label: "Título", required: true },
        { key: "description", label: "Descrição", type: "multiline" },
        {
          key: "category",
          label: "Categoria",
          type: "select",
          options: taskCategories.map((c) => ({ value: c, label: c })),
        },
        { key: "due_date", label: "Prazo", type: "date" },
        {
          key: "priority",
          label: "Prioridade",
          type: "chips",
          options: priorities,
        },
        {
          key: "responsible",
          label: "Responsável",
          type: "chips",
          options: responsible,
        },
      ];
    case "guests":
      return [
        { key: "name", label: "Nome", required: true },
        {
          key: "group_id",
          label: "Grupo / família",
          type: "select",
          options: [
            none,
            ...data.groups.map((g) => ({ value: g.id, label: g.name })),
          ],
        },
        { key: "phone", label: "Telefone", type: "phone" },
        { key: "email", label: "E-mail", type: "email" },
        { key: "rsvp_status", label: "RSVP", type: "chips", options: rsvp },
        { key: "companion_count", label: "Acompanhantes", type: "number" },
        {
          key: "dietary_restrictions",
          label: "Restrições alimentares",
          type: "multiline",
        },
        { key: "table_name", label: "Mesa" },
        { key: "invitation_sent", label: "Convite enviado", type: "toggle" },
      ];
    case "guest_groups":
      return [
        { key: "name", label: "Nome do grupo / família", required: true },
      ];
    case "wedding_events":
      return [
        { key: "title", label: "Nome", required: true },
        { key: "event_date", label: "Data", type: "date", required: true },
        { key: "time", label: "Horário", type: "time", required: true },
        { key: "location", label: "Local" },
        { key: "description", label: "Descrição", type: "multiline" },
      ];
    case "appointments":
      return [
        { key: "title", label: "Título", required: true },
        {
          key: "appointment_date",
          label: "Data",
          type: "date",
          required: true,
        },
        { key: "time", label: "Horário", type: "time", required: true },
        { key: "location", label: "Local" },
        { key: "description", label: "Descrição", type: "multiline" },
        {
          key: "vendor_id",
          label: "Fornecedor relacionado",
          type: "select",
          options: vendorOptions,
        },
        {
          key: "task_id",
          label: "Tarefa relacionada",
          type: "select",
          options: [
            none,
            ...data.tasks.map((t) => ({ value: t.id, label: t.title })),
          ],
        },
      ];
    case "vendors":
      return [
        { key: "name", label: "Nome", required: true },
        {
          key: "budget_category_id",
          label: "Categoria financeira",
          type: "select",
          options: categories,
        },
        { key: "category", label: "Especialidade / categoria textual" },
        { key: "contact", label: "Contato" },
        {
          key: "total_cost_cents",
          label: "Valor do fornecedor (R$)",
          type: "money",
          required: true,
        },
        {
          key: "status",
          label: "Status",
          type: "chips",
          options: vendorStatuses,
        },
        { key: "notes", label: "Observações", type: "multiline" },
      ];
    case "payments":
      return [
        { key: "title", label: "Título", required: true },
        {
          key: "amount_cents",
          label: "Valor (R$)",
          type: "money",
          required: true,
        },
        { key: "due_date", label: "Vencimento", type: "date", required: true },
        {
          key: "vendor_id",
          label: "Fornecedor",
          type: "select",
          options: vendorOptions,
        },
        {
          key: "budget_category_id",
          label: "Categoria financeira",
          type: "select",
          options: categories,
        },
      ];
    case "budget_categories":
      return [
        { key: "name", label: "Categoria", required: true },
        {
          key: "planned_cents",
          label: "Valor planejado (R$)",
          type: "money",
          required: true,
        },
      ];
  }
}
export function formDefaults(kind: Table): FormValues {
  return {
    category: kind === "tasks" ? "Fornecedores" : "",
    priority: "medium",
    responsible: "both",
    rsvp_status: "pending",
    companion_count: "0",
    invitation_sent: "0",
    status: "researching",
    planned_cents: "0,00",
  };
}
