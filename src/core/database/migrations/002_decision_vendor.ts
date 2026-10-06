// Trace the chosen option into the contracted vendor without duplicating decision data.
export const decisionVendorSchema = `
ALTER TABLE vendors ADD COLUMN source_decision_option_id TEXT REFERENCES decision_options(id) ON DELETE SET NULL;
CREATE INDEX idx_vendors_source_option ON vendors(source_decision_option_id);
CREATE TRIGGER validate_selected_option_insert BEFORE INSERT ON decisions
WHEN NEW.selected_option_id IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM decision_options WHERE id = NEW.selected_option_id AND decision_id = NEW.id
) BEGIN SELECT RAISE(ABORT, 'Selected option must belong to decision'); END;
CREATE TRIGGER validate_selected_option_update BEFORE UPDATE OF selected_option_id ON decisions
WHEN NEW.selected_option_id IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM decision_options WHERE id = NEW.selected_option_id AND decision_id = NEW.id
) BEGIN SELECT RAISE(ABORT, 'Selected option must belong to decision'); END;
`;
