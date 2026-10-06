"""Initial PostgreSQL schema for MeCasei API. Static SQL generated once from models."""
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.execute('CREATE TABLE users (\n\tname VARCHAR(200) NOT NULL, \n\temail VARCHAR(320) NOT NULL, \n\tpassword_hash VARCHAR(255) NOT NULL, \n\tis_active BOOLEAN NOT NULL, \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tPRIMARY KEY (id)\n);')
    op.execute('CREATE UNIQUE INDEX ix_users_email ON users (email);')
    op.execute('CREATE TABLE weddings (\n\tpartner_one_name VARCHAR(200) NOT NULL, \n\tpartner_two_name VARCHAR(200) NOT NULL, \n\twedding_date DATE, \n\tcity VARCHAR(200), \n\tguest_target INTEGER, \n\tbudget_target_cents BIGINT NOT NULL, \n\tonboarding_completed BOOLEAN NOT NULL, \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tPRIMARY KEY (id), \n\tCHECK (guest_target IS NULL OR guest_target >= 0), \n\tCHECK (budget_target_cents >= 0)\n);')
    op.execute('CREATE TABLE auth_sessions (\n\tuser_id UUID NOT NULL, \n\texpires_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\trevoked_at TIMESTAMP WITH TIME ZONE, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tid UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE\n);')
    op.execute('CREATE INDEX ix_auth_sessions_user_id ON auth_sessions (user_id);')
    op.execute('CREATE TABLE budget_categories (\n\tname VARCHAR(200) NOT NULL, \n\tplanned_cents BIGINT NOT NULL, \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\twedding_id UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tUNIQUE (wedding_id, name), \n\tCHECK (planned_cents >= 0), \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);')
    op.execute('CREATE INDEX ix_budget_categories_wedding_id ON budget_categories (wedding_id);')
    op.execute('CREATE TABLE guest_groups (\n\tname VARCHAR(200) NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tid UUID NOT NULL, \n\twedding_id UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);')
    op.execute('CREATE INDEX ix_guest_groups_wedding_id ON guest_groups (wedding_id);')
    op.execute('CREATE TABLE import_jobs (\n\tuser_id UUID NOT NULL, \n\tclient_import_id VARCHAR(200) NOT NULL, \n\twedding_id UUID NOT NULL, \n\tmapping JSON NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tid UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tUNIQUE (user_id, client_import_id), \n\tFOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);')
    op.execute('CREATE INDEX ix_import_jobs_user_id ON import_jobs (user_id);')
    op.execute('CREATE TABLE wedding_events (\n\ttitle VARCHAR(200) NOT NULL, \n\tdescription TEXT, \n\tevent_date TIMESTAMP WITH TIME ZONE NOT NULL, \n\tlocation VARCHAR(300), \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\twedding_id UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);')
    op.execute('CREATE INDEX ix_wedding_events_wedding_id ON wedding_events (wedding_id);')
    op.execute("CREATE TABLE wedding_members (\n\twedding_id UUID NOT NULL, \n\tuser_id UUID NOT NULL, \n\trole VARCHAR(20) NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tid UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tUNIQUE (wedding_id, user_id), \n\tCHECK (role IN ('owner','partner')), \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE, \n\tFOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE\n);")
    op.execute('CREATE INDEX ix_wedding_members_user_id ON wedding_members (user_id);')
    op.execute('CREATE INDEX ix_wedding_members_wedding_id ON wedding_members (wedding_id);')
    op.execute("CREATE TABLE guests (\n\tgroup_id UUID, \n\tname VARCHAR(200) NOT NULL, \n\tphone VARCHAR(80), \n\temail VARCHAR(320), \n\trsvp_status VARCHAR(20) NOT NULL, \n\tcompanion_count INTEGER NOT NULL, \n\tdietary_restrictions TEXT, \n\ttable_name VARCHAR(200), \n\tinvitation_sent BOOLEAN NOT NULL, \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\twedding_id UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tCHECK (rsvp_status IN ('pending','confirmed','declined')), \n\tCHECK (companion_count >= 0), \n\tFOREIGN KEY(group_id) REFERENCES guest_groups (id) ON DELETE SET NULL, \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);")
    op.execute('CREATE INDEX ix_guests_wedding_id ON guests (wedding_id);')
    op.execute("CREATE TABLE vendors (\n\tbudget_category_id UUID, \n\tname VARCHAR(200) NOT NULL, \n\tcategory VARCHAR(200) NOT NULL, \n\tcontact VARCHAR(300), \n\ttotal_cost_cents BIGINT NOT NULL, \n\tstatus VARCHAR(20) NOT NULL, \n\tnotes TEXT, \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\twedding_id UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tCHECK (total_cost_cents >= 0), \n\tCHECK (status IN ('researching','negotiating','contracted','canceled')), \n\tFOREIGN KEY(budget_category_id) REFERENCES budget_categories (id) ON DELETE SET NULL, \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);")
    op.execute('CREATE INDEX ix_vendors_wedding_id ON vendors (wedding_id);')
    op.execute("CREATE TABLE guest_event_invitations (\n\tguest_id UUID NOT NULL, \n\tevent_id UUID NOT NULL, \n\tinvited BOOLEAN NOT NULL, \n\trsvp_status VARCHAR(20) NOT NULL, \n\tid UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tUNIQUE (guest_id, event_id), \n\tCHECK (rsvp_status IN ('pending','confirmed','declined')), \n\tFOREIGN KEY(guest_id) REFERENCES guests (id) ON DELETE CASCADE, \n\tFOREIGN KEY(event_id) REFERENCES wedding_events (id) ON DELETE CASCADE\n);")
    op.execute('CREATE INDEX ix_guest_event_invitations_event_id ON guest_event_invitations (event_id);')
    op.execute('CREATE INDEX ix_guest_event_invitations_guest_id ON guest_event_invitations (guest_id);')
    op.execute("CREATE TABLE payments (\n\tvendor_id UUID, \n\tbudget_category_id UUID, \n\ttitle VARCHAR(300) NOT NULL, \n\tamount_cents BIGINT NOT NULL, \n\tdue_date DATE NOT NULL, \n\tpaid_date DATE, \n\tstatus VARCHAR(20) NOT NULL, \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\twedding_id UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tCHECK (amount_cents >= 0), \n\tCHECK (status IN ('pending','paid')), \n\tFOREIGN KEY(vendor_id) REFERENCES vendors (id) ON DELETE SET NULL, \n\tFOREIGN KEY(budget_category_id) REFERENCES budget_categories (id) ON DELETE SET NULL, \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);")
    op.execute('CREATE INDEX ix_payments_wedding_id ON payments (wedding_id);')
    op.execute('CREATE INDEX ix_payments_wedding_due ON payments (wedding_id, status, due_date);')
    op.execute("CREATE TABLE tasks (\n\ttitle VARCHAR(300) NOT NULL, \n\tdescription TEXT, \n\tcategory VARCHAR(200) NOT NULL, \n\tdue_date DATE, \n\tstatus VARCHAR(20) NOT NULL, \n\tpriority VARCHAR(20) NOT NULL, \n\tresponsible VARCHAR(20) NOT NULL, \n\trelated_vendor_id UUID, \n\trelated_event_id UUID, \n\tcompleted_at TIMESTAMP WITH TIME ZONE, \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\twedding_id UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tCHECK (status IN ('pending','completed')), \n\tCHECK (priority IN ('low','medium','high')), \n\tCHECK (responsible IN ('self','partner','both')), \n\tFOREIGN KEY(related_vendor_id) REFERENCES vendors (id) ON DELETE SET NULL, \n\tFOREIGN KEY(related_event_id) REFERENCES wedding_events (id) ON DELETE SET NULL, \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);")
    op.execute('CREATE INDEX ix_tasks_wedding_due ON tasks (wedding_id, status, due_date);')
    op.execute('CREATE INDEX ix_tasks_wedding_id ON tasks (wedding_id);')
    op.execute('CREATE TABLE appointments (\n\ttitle VARCHAR(300) NOT NULL, \n\tdescription TEXT, \n\tappointment_date TIMESTAMP WITH TIME ZONE NOT NULL, \n\tlocation VARCHAR(300), \n\tvendor_id UUID, \n\ttask_id UUID, \n\tid UUID NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tupdated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\twedding_id UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(vendor_id) REFERENCES vendors (id) ON DELETE SET NULL, \n\tFOREIGN KEY(task_id) REFERENCES tasks (id) ON DELETE SET NULL, \n\tFOREIGN KEY(wedding_id) REFERENCES weddings (id) ON DELETE CASCADE\n);')
    op.execute('CREATE INDEX ix_appointments_wedding_id ON appointments (wedding_id);')
    op.execute('CREATE TABLE task_subtasks (\n\ttask_id UUID NOT NULL, \n\ttitle VARCHAR(300) NOT NULL, \n\tcompleted BOOLEAN NOT NULL, \n\tsort_order INTEGER NOT NULL, \n\tcreated_at TIMESTAMP WITH TIME ZONE NOT NULL, \n\tid UUID NOT NULL, \n\tPRIMARY KEY (id), \n\tFOREIGN KEY(task_id) REFERENCES tasks (id) ON DELETE CASCADE\n);')
    op.execute('CREATE INDEX ix_task_subtasks_task_id ON task_subtasks (task_id);')

def downgrade() -> None:
    op.drop_table("task_subtasks")
    op.drop_table("appointments")
    op.drop_table("tasks")
    op.drop_table("payments")
    op.drop_table("guest_event_invitations")
    op.drop_table("vendors")
    op.drop_table("guests")
    op.drop_table("wedding_members")
    op.drop_table("wedding_events")
    op.drop_table("import_jobs")
    op.drop_table("guest_groups")
    op.drop_table("budget_categories")
    op.drop_table("auth_sessions")
    op.drop_table("weddings")
    op.drop_table("users")
