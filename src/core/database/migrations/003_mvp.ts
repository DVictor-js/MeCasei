// Preserve existing weddings/categories and remember the one-time starter plan.
export const mvpSchema = `
ALTER TABLE weddings ADD COLUMN planning_generated INTEGER NOT NULL DEFAULT 0 CHECK(planning_generated IN (0,1));
CREATE INDEX idx_tasks_wedding_due ON tasks(wedding_id,status,due_date);
CREATE INDEX idx_payments_wedding_due ON payments(wedding_id,status,due_date);
CREATE INDEX idx_appointments_wedding_date ON appointments(wedding_id,appointment_date);
`;
