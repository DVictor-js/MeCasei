from conftest import headers, register, wedding


def assert_status(response, code):
    assert response.status_code == code, response.text
    return response.json() if response.content else None


def test_auth_register_login_refresh_me_logout(client):
    tokens = register(client)
    me = assert_status(client.get("/api/v1/auth/me", headers=headers(tokens)), 200)
    assert me["email"] == "alex@example.com"
    assert "password_hash" not in me
    assert_status(client.post("/api/v1/auth/login", json={"email": "alex@example.com", "password": "wrong"}), 401)
    logged_in = assert_status(client.post("/api/v1/auth/login", json={"email": "alex@example.com", "password": "mecasei-2026"}), 200)
    refreshed = assert_status(client.post("/api/v1/auth/refresh", json={"refresh_token": logged_in["refresh_token"]}), 200)
    assert_status(client.get("/api/v1/auth/me", headers=headers(logged_in)), 401)
    assert_status(client.get("/api/v1/auth/me", headers=headers(refreshed)), 200)
    assert_status(client.post("/api/v1/auth/logout", headers=headers(refreshed)), 204)
    assert_status(client.get("/api/v1/auth/me", headers=headers(refreshed)), 401)
    assert_status(client.post("/api/v1/auth/register", json={"name": "Other", "email": "ALEX@example.com", "password": "anotherpass"}), 409)


def test_wedding_and_cross_user_authorization(client):
    a = register(client)
    b = register(client, "B", "b@example.com")
    wa = wedding(client, a)
    wid = wa["id"]
    assert_status(client.get(f"/api/v1/weddings/{wid}", headers=headers(b)), 404)
    assert_status(client.patch(f"/api/v1/weddings/{wid}", headers=headers(b), json={"city": "Rio"}), 404)
    assert_status(client.get(f"/api/v1/weddings/{wid}/tasks", headers=headers(b)), 404)
    task = assert_status(client.post(f"/api/v1/weddings/{wid}/tasks", headers=headers(a), json={"title": "Pesquisar local", "category": "Local"}), 201)
    assert_status(client.get(f"/api/v1/tasks/{task['id']}", headers=headers(b)), 404)
    assert_status(client.patch(f"/api/v1/tasks/{task['id']}", headers=headers(b), json={"title": "Invadida"}), 404)
    assert_status(client.delete(f"/api/v1/tasks/{task['id']}", headers=headers(b)), 404)
    assert_status(client.get(f"/api/v1/weddings/{wid}/budget", headers=headers(b)), 404)
    assert len(assert_status(client.get("/api/v1/weddings", headers=headers(b)), 200)) == 0


def test_every_resource_requires_membership(client):
    a = register(client)
    b = register(client, "B", "b@example.com")
    wid = wedding(client, a)["id"]
    base = f"/api/v1/weddings/{wid}"
    examples = [
        ("guest-groups", {"name": "Família"}, {"name": "Outro"}),
        ("guests", {"name": "Maria"}, {"name": "Outra"}),
        ("events", {"title": "Cerimônia", "event_date": "2027-05-22T15:00:00-03:00"}, {"title": "Outro"}),
        ("budget-categories", {"name": "Foto", "planned_cents": 1000}, {"planned_cents": 2000}),
        ("vendors", {"name": "Bella", "category": "Foto"}, {"name": "Outro"}),
        ("payments", {"title": "Entrada", "amount_cents": 1000, "due_date": "2027-01-01"}, {"title": "Outro"}),
        ("appointments", {"title": "Reunião", "appointment_date": "2027-01-01T10:00:00-03:00"}, {"title": "Outra"}),
    ]
    for plural, payload, change in examples:
        resource = assert_status(client.post(base + "/" + plural, headers=headers(a), json=payload), 201)
        direct = f"/api/v1/{plural}/{resource['id']}"
        assert_status(client.get(base + "/" + plural, headers=headers(b)), 404)
        assert_status(client.post(base + "/" + plural, headers=headers(b), json=payload), 404)
        assert_status(client.get(direct, headers=headers(b)), 404)
        assert_status(client.patch(direct, headers=headers(b), json=change), 404)
        assert_status(client.delete(direct, headers=headers(b)), 404)


def test_links_must_belong_to_same_wedding(client):
    a = register(client)
    one = wedding(client, a)["id"]
    two = wedding(client, a)["id"]
    category = assert_status(client.post(f"/api/v1/weddings/{one}/budget-categories", headers=headers(a), json={"name": "Foto"}), 201)
    assert_status(client.post(f"/api/v1/weddings/{two}/vendors", headers=headers(a), json={"name": "Bella", "category": "Foto", "budget_category_id": category["id"]}), 400)


def test_cruds_relations_and_finance(client):
    t = register(client)
    wid = wedding(client, t)["id"]
    h = headers(t)
    base = f"/api/v1/weddings/{wid}"
    cat = assert_status(client.post(base + "/budget-categories", headers=h, json={"name": "Fotografia", "planned_cents": 800000}), 201)
    group = assert_status(client.post(base + "/guest-groups", headers=h, json={"name": "Família Souza"}), 201)
    event = assert_status(client.post(base + "/events", headers=h, json={"title": "Cerimônia", "event_date": "2027-05-22T15:00:00-03:00"}), 201)
    guest = assert_status(client.post(base + "/guests", headers=h, json={"name": "Maria", "group_id": group["id"], "companion_count": 1}), 201)
    assert_status(client.patch(f"/api/v1/guests/{guest['id']}", headers=h, json={"rsvp_status": "confirmed"}), 200)
    invite = assert_status(client.put(f"/api/v1/guests/{guest['id']}/events/{event['id']}", headers=h, json={"event_id": event["id"], "rsvp_status": "confirmed"}), 200)
    assert invite["guest_id"] == guest["id"]
    vendor = assert_status(client.post(base + "/vendors", headers=h, json={"name": "Bella Fotografia", "category": "Fotografia", "budget_category_id": cat["id"], "status": "contracted", "total_cost_cents": 750000}), 201)
    task = assert_status(client.post(base + "/tasks", headers=h, json={"title": "Confirmar fotógrafo", "category": "Fornecedores", "related_vendor_id": vendor["id"]}), 201)
    sub = assert_status(client.post(f"/api/v1/tasks/{task['id']}/subtasks", headers=h, json={"title": "Pedir orçamento"}), 201)
    assert_status(client.patch(f"/api/v1/subtasks/{sub['id']}", headers=h, json={"completed": True}), 200)
    paid = assert_status(client.post(base + "/payments", headers=h, json={"title": "Entrada", "amount_cents": 250000, "due_date": "2026-09-20", "vendor_id": vendor["id"], "status": "paid"}), 201)
    assert paid["paid_date"] is not None
    pending = assert_status(client.post(base + "/payments", headers=h, json={"title": "Segunda parcela", "amount_cents": 250000, "due_date": "2026-10-20", "vendor_id": vendor["id"]}), 201)
    appt = assert_status(client.post(base + "/appointments", headers=h, json={"title": "Reunião", "appointment_date": "2026-10-01T15:00:00-03:00", "vendor_id": vendor["id"], "task_id": task["id"]}), 201)
    budget = assert_status(client.get(base + "/budget", headers=h), 200)
    assert budget == {"budget_target_cents": 6000000, "distributed_cents": 800000, "undistributed_cents": 5200000, "contracted_cents": 750000, "paid_cents": 250000, "pending_installments_cents": 250000, "remaining_contracted_cents": 500000}
    assert_status(client.get(base + "/guests?rsvp_status=confirmed&search=Mar", headers=h), 200)
    assert_status(client.get(base + "/tasks?status=pending&limit=1", headers=h), 200)
    assert_status(client.patch(f"/api/v1/payments/{pending['id']}", headers=h, json={"status": "paid"}), 200)
    assert_status(client.patch(f"/api/v1/payments/{pending['id']}", headers=h, json={"status": "pending"}), 200)
    assert_status(client.delete(f"/api/v1/budget-categories/{cat['id']}", headers=h), 409)
    for path in [f"/api/v1/appointments/{appt['id']}", f"/api/v1/payments/{pending['id']}", f"/api/v1/subtasks/{sub['id']}", f"/api/v1/tasks/{task['id']}", f"/api/v1/guests/{guest['id']}", f"/api/v1/events/{event['id']}", f"/api/v1/guest-groups/{group['id']}", f"/api/v1/vendors/{vendor['id']}", f"/api/v1/budget-categories/{cat['id']}"]:
        assert_status(client.delete(path, headers=h), 204)


def test_import_atomic_idempotent_and_maps_relations(client):
    t = register(client)
    h = headers(t)
    bundle = {
        "client_import_id": "device-local-wedding",
        "wedding": {"local_id": "local-wedding", "data": {"partner_one_name": "Alex", "partner_two_name": "Dani", "wedding_date": "2027-05-22", "city": "São Paulo", "guest_target": 120, "budget_target_cents": 6000000, "onboarding_completed": 1}},
        "budget_categories": [{"local_id": "photo", "data": {"name": "Fotografia", "planned_cents": 800000}}],
        "vendors": [{"local_id": "bella", "data": {"name": "Bella", "category": "Fotografia", "budget_category_id": "photo", "status": "contracted", "total_cost_cents": 750000}}],
        "tasks": [{"local_id": "task", "data": {"title": "Confirmar Bella", "category": "Fornecedores", "related_vendor_id": "bella"}}],
        "task_subtasks": [{"local_id": "sub", "data": {"task_id": "task", "title": "Orçamento"}}],
        "payments": [{"local_id": "pay", "data": {"title": "Entrada", "vendor_id": "bella", "amount_cents": 250000, "due_date": "2026-09-20", "status": "paid"}}],
    }
    first = assert_status(client.post("/api/v1/imports", headers=h, json=bundle), 201)
    second = assert_status(client.post("/api/v1/imports", headers=h, json=bundle), 201)
    assert first == second
    assert len(assert_status(client.get("/api/v1/weddings", headers=h), 200)) == 1
    bad = {**bundle, "client_import_id": "another", "tasks": [{"local_id": "bad", "data": {"title": "Bad", "category": "x", "related_vendor_id": "missing"}}]}
    assert_status(client.post("/api/v1/imports", headers=h, json=bad), 400)
    assert len(assert_status(client.get("/api/v1/weddings", headers=h), 200)) == 1
