export const initialSchema = `
CREATE TABLE weddings (
 id TEXT PRIMARY KEY NOT NULL,
  partner_one_name TEXT NOT NULL,
  partner_two_name TEXT NOT NULL,
  wedding_date TEXT,
  city TEXT,
  guest_target INTEGER CHECK(guest_target >= 0),
  budget_target_cents INTEGER NOT NULL DEFAULT 0 CHECK (budget_target_cents >= 0 AND typeof(budget_target_cents) = 'integer'),
  onboarding_completed INTEGER NOT NULL DEFAULT 0 CHECK(onboarding_completed IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE budget_categories (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  planned_cents INTEGER NOT NULL DEFAULT 0 CHECK (planned_cents >= 0 AND typeof(planned_cents) = 'integer'),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(wedding_id,name)
);

CREATE TABLE wedding_events (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  location TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE decisions (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','decided')),
  selected_option_id TEXT REFERENCES decision_options(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE decision_options (
 id TEXT PRIMARY KEY NOT NULL,
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER CHECK(price_cents >= 0 AND typeof(price_cents) = 'integer'),
  pros TEXT,
  cons TEXT,
  notes TEXT,
  favorite INTEGER NOT NULL DEFAULT 0 CHECK(favorite IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE vendors (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  budget_category_id TEXT REFERENCES budget_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact TEXT,
  total_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cost_cents >= 0 AND typeof(total_cost_cents) = 'integer'),
  status TEXT NOT NULL DEFAULT 'researching' CHECK(status IN ('researching','negotiating','contracted','canceled')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE tasks (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
  responsible TEXT NOT NULL DEFAULT 'both' CHECK(responsible IN ('self','partner','both')),
  related_vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  related_decision_id TEXT REFERENCES decisions(id) ON DELETE SET NULL,
  related_event_id TEXT REFERENCES wedding_events(id) ON DELETE SET NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE task_subtasks (
 id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE guest_groups (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE guests (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES guest_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK(rsvp_status IN ('pending','confirmed','declined')),
  companion_count INTEGER NOT NULL DEFAULT 0 CHECK(companion_count >= 0),
  dietary_restrictions TEXT,
  table_name TEXT,
  invitation_sent INTEGER NOT NULL DEFAULT 0 CHECK(invitation_sent IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE guest_event_invitations (
 id TEXT PRIMARY KEY NOT NULL,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES wedding_events(id) ON DELETE CASCADE,
  invited INTEGER NOT NULL DEFAULT 1 CHECK(invited IN (0,1)),
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK(rsvp_status IN ('pending','confirmed','declined')),
  UNIQUE(guest_id,event_id)
);

CREATE TABLE payments (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  budget_category_id TEXT REFERENCES budget_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0 AND typeof(amount_cents) = 'integer'),
  due_date TEXT NOT NULL,
  paid_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE appointments (
 id TEXT PRIMARY KEY NOT NULL,
  wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date TEXT NOT NULL,
  location TEXT,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_budget_categories_wedding_id ON budget_categories(wedding_id);
CREATE INDEX idx_wedding_events_wedding_id ON wedding_events(wedding_id);
CREATE INDEX idx_decisions_wedding_id ON decisions(wedding_id);
CREATE INDEX idx_decision_options_decision_id ON decision_options(decision_id);
CREATE INDEX idx_vendors_wedding_id ON vendors(wedding_id);
CREATE INDEX idx_vendors_budget_category_id ON vendors(budget_category_id);
CREATE INDEX idx_tasks_wedding_id ON tasks(wedding_id);
CREATE INDEX idx_tasks_related_vendor_id ON tasks(related_vendor_id);
CREATE INDEX idx_tasks_related_decision_id ON tasks(related_decision_id);
CREATE INDEX idx_tasks_related_event_id ON tasks(related_event_id);
CREATE INDEX idx_task_subtasks_task_id ON task_subtasks(task_id);
CREATE INDEX idx_guest_groups_wedding_id ON guest_groups(wedding_id);
CREATE INDEX idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX idx_guests_group_id ON guests(group_id);
CREATE INDEX idx_guest_event_invitations_guest_id ON guest_event_invitations(guest_id);
CREATE INDEX idx_guest_event_invitations_event_id ON guest_event_invitations(event_id);
CREATE INDEX idx_payments_wedding_id ON payments(wedding_id);
CREATE INDEX idx_payments_vendor_id ON payments(vendor_id);
CREATE INDEX idx_payments_budget_category_id ON payments(budget_category_id);
CREATE INDEX idx_appointments_wedding_id ON appointments(wedding_id);
CREATE INDEX idx_appointments_task_id ON appointments(task_id);
CREATE INDEX idx_appointments_vendor_id ON appointments(vendor_id);
`;
