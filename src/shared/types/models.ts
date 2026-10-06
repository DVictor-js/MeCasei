export type ID = string;
export type ISODate = string;
export type Cents = number;
export type TaskStatus = "pending" | "completed";
export type Priority = "low" | "medium" | "high";
export type Responsible = "self" | "partner" | "both";
export type RSVPStatus = "pending" | "confirmed" | "declined";
export type VendorStatus =
  | "researching"
  | "negotiating"
  | "contracted"
  | "canceled";
export type PaymentStatus = "pending" | "paid";
export type DecisionStatus = "open" | "decided";
export interface Wedding {
  id: ID;
  partner_one_name: string;
  partner_two_name: string;
  wedding_date: ISODate | null;
  city: string | null;
  guest_target: number | null;
  budget_target_cents: Cents;
  onboarding_completed: 0 | 1;
  planning_generated: 0 | 1;
  created_at: ISODate;
  updated_at: ISODate;
}
export interface FinancialSummary {
  planned_cents: Cents;
  contracted_cents: Cents;
  paid_cents: Cents;
  pending_cents: Cents;
}

interface Entity {
  id: ID;
  created_at: ISODate;
  updated_at: ISODate;
}
interface WeddingEntity extends Entity {
  wedding_id: ID;
}
export interface Task extends WeddingEntity {
  title: string;
  description: string | null;
  category: string;
  due_date: ISODate | null;
  status: TaskStatus;
  priority: Priority;
  responsible: Responsible;
  related_vendor_id: ID | null;
  related_decision_id: ID | null;
  related_event_id: ID | null;
  completed_at: ISODate | null;
}
export interface TaskSubtask {
  id: ID;
  task_id: ID;
  title: string;
  completed: 0 | 1;
  sort_order: number;
  created_at: ISODate;
}
export interface GuestGroup {
  id: ID;
  wedding_id: ID;
  name: string;
  created_at: ISODate;
}
export interface Guest extends WeddingEntity {
  group_id: ID | null;
  name: string;
  phone: string | null;
  email: string | null;
  rsvp_status: RSVPStatus;
  companion_count: number;
  dietary_restrictions: string | null;
  table_name: string | null;
  invitation_sent: 0 | 1;
}
export interface WeddingEvent extends WeddingEntity {
  title: string;
  description: string | null;
  event_date: ISODate;
  location: string | null;
}
export interface GuestEventInvitation {
  id: ID;
  guest_id: ID;
  event_id: ID;
  invited: 0 | 1;
  rsvp_status: RSVPStatus;
}
export interface BudgetCategory extends WeddingEntity {
  name: string;
  planned_cents: Cents;
}
export interface Vendor extends WeddingEntity {
  budget_category_id: ID | null;
  source_decision_option_id: ID | null;
  name: string;
  category: string;
  contact: string | null;
  total_cost_cents: Cents;
  status: VendorStatus;
  notes: string | null;
}
export interface Payment extends WeddingEntity {
  vendor_id: ID | null;
  budget_category_id: ID | null;
  title: string;
  amount_cents: Cents;
  due_date: ISODate;
  paid_date: ISODate | null;
  status: PaymentStatus;
}
export interface Appointment extends WeddingEntity {
  title: string;
  description: string | null;
  appointment_date: ISODate;
  location: string | null;
  vendor_id: ID | null;
  task_id: ID | null;
}
export interface Decision extends WeddingEntity {
  title: string;
  category: string;
  status: DecisionStatus;
  selected_option_id: ID | null;
}
export interface DecisionOption extends Entity {
  decision_id: ID;
  name: string;
  price_cents: Cents | null;
  pros: string | null;
  cons: string | null;
  notes: string | null;
  favorite: 0 | 1;
}
