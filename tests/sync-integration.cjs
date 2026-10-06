require("./helpers/aliases.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (name, parent, main) {
  if (name === "react-native") return { Platform: { OS: "web" } };
  return originalLoad.call(this, name, parent, main);
};
const { database, wedding, guest } = require("./helpers/runtime.cjs");
const { setSetting } = require("@/core/database/settings");
const { saveTask } = require("@/features/planning/model/taskService");
const { saveGroup, saveGuest } = require("@/features/guests/model/guestService");
const { saveEvent, saveAppointment } = require("@/features/organization/model/organizationService");
const { saveVendor, savePayment, setPaymentPaid, saveBudgetCategory } = require("@/features/finances/model/financeService");
const { addSubtask } = require("@/features/planning/model/taskService");
const { register } = require("@/core/api/authApi");
const { apiRequest } = require("@/core/api/apiClient");
const { importLocalWedding } = require("@/core/sync/importLocal");
const { getMapping, pendingCount } = require("@/core/sync/localMapping");
const { syncPending } = require("@/core/sync/syncCoordinator");
const { loadPlanning } = require("@/features/home/model/planningSnapshot");

test("real API: import old local data, reopen, upload task and keep offline task pending", {
  skip: process.env.MECASEI_API_INTEGRATION !== "1",
}, async () => {
  process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const store = await database();
  const wid = "local-wedding";
  try {
    const category = store.native.prepare("SELECT id FROM budget_categories WHERE wedding_id=? AND name='Fotografia'").get(wid).id;
    await saveBudgetCategory(store.db, wid, "Fotografia", 800000, category);
    const group = await saveGroup(store.db, wid, "Família Souza");
    const event = await saveEvent(store.db, wid, { title: "Cerimônia", description: null, event_date: "2027-05-22T18:00:00.000Z", location: "São Paulo" });
    const maria = await saveGuest(store.db, wid, { ...guest("Maria Souza"), group_id: group, rsvp_status: "confirmed" }, [{ event_id: event, rsvp_status: "confirmed" }]);
    await saveGuest(store.db, wid, { ...guest("João Souza"), group_id: group }, [{ event_id: event, rsvp_status: "pending" }]);
    const vendor = await saveVendor(store.db, wid, { name: "Bella Fotografia", budget_category_id: category, category: "Fotografia", contact: null, total_cost_cents: 750000, status: "contracted", notes: null });
    const task = await saveTask(store.db, wid, { title: "Confirmar Bella", description: null, category: "Fornecedores", due_date: "2027-01-01", priority: "high", responsible: "both" });
    await addSubtask(store.db, wid, task, "Pedir orçamento");
    const payment = await savePayment(store.db, wid, { title: "Entrada", amount_cents: 250000, due_date: "2026-10-20", vendor_id: vendor, budget_category_id: category });
    await setPaymentPaid(store.db, wid, payment, true);
    await savePayment(store.db, wid, { title: "Segunda parcela", amount_cents: 250000, due_date: "2026-11-20", vendor_id: vendor, budget_category_id: category });
    await saveAppointment(store.db, wid, { title: "Reunião Bella", description: null, appointment_date: "2026-10-01T18:00:00.000Z", location: null, vendor_id: vendor, task_id: task });

    const email = `phase25-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const session = await register("Alex", email, "mecasei-2026");
    await setSetting(store.db, "active_account_id", session.user.id);
    const imported = await importLocalWedding(store.db, session.user.id);
    assert.ok(imported.mapping.guests[maria]);
    assert.ok(imported.mapping.tasks[task]);
    assert.equal((await apiRequest("/weddings")).length, 1);
    const budget = await apiRequest(`/weddings/${imported.wedding_id}/budget`);
    assert.equal(budget.budget_target_cents, 6000000);
    assert.equal(budget.distributed_cents, 800000);
    assert.equal(budget.contracted_cents, 750000);
    assert.equal(budget.paid_cents, 250000);
    assert.equal(budget.pending_installments_cents, 250000);

    await store.reopen();
    const snapshot = await loadPlanning(store.db);
    assert.equal(snapshot.wedding.partner_one_name, wedding.partner_one_name);
    assert.equal(snapshot.guestStats.records, 2);
    const onlineTask = await saveTask(store.db, wid, { title: "Tarefa online", description: null, category: "Geral", due_date: null, priority: "medium", responsible: "both" });
    await syncPending(store.db);
    const mapped = await getMapping(store.db, session.user.id, "tasks", onlineTask);
    assert.ok(mapped.remote_id);
    assert.equal((await apiRequest(`/tasks/${mapped.remote_id}`)).title, "Tarefa online");

    const originalFetch = global.fetch;
    try {
      global.fetch = async () => { throw new Error("offline"); };
      const offlineTask = await saveTask(store.db, wid, { title: "Tarefa offline", description: null, category: "Geral", due_date: null, priority: "medium", responsible: "both" });
      const outcome = await syncPending(store.db);
      assert.ok(outcome.pending >= 1);
      assert.ok((await getMapping(store.db, session.user.id, "tasks", offlineTask)).sync_status === "dirty");
      assert.ok((await pendingCount(store.db, session.user.id)) >= 1);
    } finally {
      global.fetch = originalFetch;
    }
  } finally {
    store.close();
    Module._load = originalLoad;
  }
});
