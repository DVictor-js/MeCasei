require("./helpers/aliases.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { database, wedding, guest } = require("./helpers/runtime.cjs");
const {
  completeOnboarding,
  getWedding,
  saveWeddingDraft,
  saveWedding,
  isConfigured,
} = require("@/features/wedding/model/weddingService");
const { starterPlan } = require("@/features/planning/model/planningService");
const {
  saveTask,
  setTaskCompleted,
  addSubtask,
  changeSubtask,
  listSubtasks,
} = require("@/features/planning/model/taskService");
const {
  saveGuest,
  saveGroup,
  guestSummary,
  guestInvitations,
} = require("@/features/guests/model/guestService");
const {
  saveEvent,
  saveAppointment,
} = require("@/features/organization/model/organizationService");
const {
  saveVendor,
  saveBudgetCategory,
  savePayment,
  setPaymentPaid,
  getFinancialSummary,
  financialBalances,
} = require("@/features/finances/model/financeService");
const {
  listRecords,
  getRecord,
  deleteRecord,
} = require("@/core/database/repository");
const {
  loadPlanning,
  homePriorities,
  upcomingAppointments,
} = require("@/features/home/model/planningSnapshot");
const {
  countdown,
  parseDateInput,
  parseDateTime,
  dateInput,
} = require("@/shared/utils/dates");
const wid = "local-wedding";
const task = {
  title: "Confirmar fotógrafo",
  description: "Alinhar cobertura",
  category: "Fornecedores",
  due_date: "2027-04-01",
  priority: "high",
  responsible: "both",
};
const vendor = {
  name: "Bella Fotografia",
  budget_category_id: null,
  category: "Fotografia",
  contact: "bella@example.com",
  total_cost_cents: 750000,
  status: "contracted",
  notes: null,
};
const payment = {
  title: "Entrada",
  amount_cents: 250000,
  due_date: "2026-10-20",
  vendor_id: null,
  budget_category_id: null,
};
const event = {
  title: "Cerimônia",
  description: "O nosso sim",
  event_date: "2027-05-22T18:00:00.000Z",
  location: "São Paulo",
};
test("legacy wedding is updated; repeated/concurrent onboarding preserves id, categories and tasks", async () => {
  const c = await database(false);
  try {
    await saveWeddingDraft(c.db, { partner_one_name: "Nome antigo" });
    const old = await getWedding(c.db);
    const category = await saveBudgetCategory(c.db, wid, "Fotografia", 800000);
    await Promise.all([
      completeOnboarding(c.db, wedding),
      completeOnboarding(c.db, wedding),
    ]);
    const current = await getWedding(c.db);
    assert.equal(current.id, old.id);
    assert.equal(current.partner_one_name, "Alex");
    assert.equal(current.budget_target_cents, 6000000);
    assert.ok(isConfigured(current));
    assert.equal((await listRecords(c.db, "budget_categories", wid)).length, 8);
    assert.equal(
      (await getRecord(c.db, "budget_categories", wid, category)).planned_cents,
      800000,
    );
    const tasks = await listRecords(c.db, "tasks", wid);
    assert.equal(tasks.length, 12);
    await deleteRecord(c.db, "tasks", wid, tasks[0].id);
    await completeOnboarding(c.db, wedding);
    assert.equal((await listRecords(c.db, "tasks", wid)).length, 11);
    await saveWedding(c.db, {
      ...wedding,
      city: "Campinas",
      budget_target_cents: 6500000,
    });
    assert.equal((await getWedding(c.db)).city, "Campinas");
    assert.equal((await listRecords(c.db, "tasks", wid)).length, 11);
    await assert.rejects(
      completeOnboarding(c.db, { ...wedding, partner_one_name: "" }),
    );
    assert.equal((await getWedding(c.db)).city, "Campinas");
  } finally {
    c.close();
  }
});
test("starter plan is deterministic, small and never after wedding, including short/past timelines", () => {
  for (const date of ["2027-05-22", "2026-09-16", "2026-09-15", "2026-08-20"]) {
    const now = new Date(2026, 8, 15);
    const plan = starterPlan(date, now);
    assert.equal(plan.length, 12);
    assert.deepEqual(plan, starterPlan(date, now));
    assert.ok(plan.every((t) => t.due_date <= date));
    if (date >= "2026-09-15")
      assert.ok(plan.every((t) => t.due_date >= "2026-09-15"));
  }
});
test("tasks CRUD, completion/reopen and subtasks preserve status and cascade on deletion", async () => {
  const c = await database();
  try {
    const id = await saveTask(c.db, wid, task);
    await saveTask(
      c.db,
      wid,
      { ...task, title: "Fotografia escolhida", responsible: "partner" },
      id,
    );
    assert.equal(
      (await getRecord(c.db, "tasks", wid, id)).responsible,
      "partner",
    );
    await setTaskCompleted(c.db, wid, id, true);
    assert.ok((await getRecord(c.db, "tasks", wid, id)).completed_at);
    await setTaskCompleted(c.db, wid, id, false);
    assert.equal((await getRecord(c.db, "tasks", wid, id)).completed_at, null);
    const sub = await addSubtask(c.db, wid, id, "Pedir orçamento");
    await changeSubtask(c.db, wid, id, sub, "complete");
    assert.equal((await listSubtasks(c.db, wid, id))[0].completed, 1);
    await changeSubtask(c.db, wid, id, sub, "reopen");
    assert.equal((await listSubtasks(c.db, wid, id))[0].completed, 0);
    await changeSubtask(c.db, wid, id, sub, "delete");
    assert.equal((await listSubtasks(c.db, wid, id)).length, 0);
    await addSubtask(c.db, wid, id, "Assinar");
    await deleteRecord(c.db, "tasks", wid, id);
    assert.equal(await getRecord(c.db, "tasks", wid, id), null);
    assert.equal(
      c.native
        .prepare("SELECT COUNT(*) n FROM task_subtasks WHERE task_id=?")
        .get(id).n,
      0,
    );
    await assert.rejects(saveTask(c.db, wid, { ...task, title: "" }));
  } finally {
    c.close();
  }
});
test("groups, guests, RSVP, companions and event invitations are transactional", async () => {
  const c = await database();
  try {
    const group = await saveGroup(c.db, wid, "Família Souza");
    await assert.rejects(saveGroup(c.db, wid, "Família Souza"));
    await saveGroup(c.db, wid, "Souza", group);
    const ev = await saveEvent(c.db, wid, event);
    const id = await saveGuest(
      c.db,
      wid,
      { ...guest("Maria"), group_id: group, companion_count: 2 },
      [{ event_id: ev, rsvp_status: "pending" }],
    );
    await saveGuest(
      c.db,
      wid,
      {
        ...guest("Maria Souza"),
        group_id: group,
        companion_count: 2,
        rsvp_status: "confirmed",
      },
      [{ event_id: ev, rsvp_status: "confirmed" }],
      id,
    );
    const stats = await guestSummary(c.db, wid);
    assert.equal(stats.records, 1);
    assert.equal(stats.people, 3);
    assert.equal(stats.confirmed_people, 3);
    assert.equal(
      (await guestInvitations(c.db, wid, id))[0].rsvp_status,
      "confirmed",
    );
    assert.equal((await getWedding(c.db)).guest_target, 120);
    await assert.rejects(
      saveGuest(c.db, wid, guest("Inválido"), [
        { event_id: "missing", rsvp_status: "pending" },
      ]),
    );
    assert.equal((await guestSummary(c.db, wid)).records, 1);
    await saveEvent(c.db, wid, { ...event, title: "Cerimônia e votos" }, ev);
    await deleteRecord(c.db, "guest_groups", wid, group);
    assert.equal((await getRecord(c.db, "guests", wid, id)).group_id, null);
    await deleteRecord(c.db, "wedding_events", wid, ev);
    assert.equal((await guestInvitations(c.db, wid, id)).length, 0);
    await deleteRecord(c.db, "guests", wid, id);
    assert.equal((await guestSummary(c.db, wid)).records, 0);
  } finally {
    c.close();
  }
});
test("budget total differs from distributed categories; balance differs from pending installments", async () => {
  const c = await database();
  try {
    const category = (await listRecords(c.db, "budget_categories", wid)).find(
      (c) => c.name === "Fotografia",
    );
    await saveBudgetCategory(c.db, wid, category.name, 800000, category.id);
    const vid = await saveVendor(c.db, wid, {
      ...vendor,
      total_cost_cents: 1000000,
      budget_category_id: category.id,
    });
    const first = await savePayment(c.db, wid, {
      ...payment,
      vendor_id: vid,
      amount_cents: 200000,
    });
    await setPaymentPaid(c.db, wid, first, true);
    await savePayment(c.db, wid, {
      ...payment,
      title: "Parcela 2",
      vendor_id: vid,
      amount_cents: 300000,
    });
    const f = await getFinancialSummary(c.db, wid);
    assert.deepEqual(
      { ...f },
      {
        planned_cents: 800000,
        contracted_cents: 1000000,
        paid_cents: 200000,
        pending_cents: 300000,
      },
    );
    const b = financialBalances(6000000, f);
    assert.equal(b.balance_cents, 800000);
    assert.equal(b.unscheduled_cents, 500000);
    assert.equal(b.undistributed_cents, 5200000);
    assert.notEqual(b.balance_cents, f.pending_cents);
    assert.notEqual(
      (await getWedding(c.db)).budget_target_cents,
      f.planned_cents,
    );
    await saveBudgetCategory(c.db, wid, "Fotografia", 7000000, category.id);
    assert.equal(
      financialBalances(6000000, await getFinancialSummary(c.db, wid))
        .undistributed_cents,
      -1000000,
    );
    await saveVendor(
      c.db,
      wid,
      { ...vendor, total_cost_cents: 1000000, status: "canceled" },
      vid,
    );
    assert.equal((await getFinancialSummary(c.db, wid)).contracted_cents, 0);
  } finally {
    c.close();
  }
});
test("payment and vendor CRUD, paid timestamp, undo and retained payments after vendor deletion", async () => {
  const c = await database();
  try {
    const vid = await saveVendor(c.db, wid, vendor);
    const id = await savePayment(c.db, wid, { ...payment, vendor_id: vid });
    await savePayment(
      c.db,
      wid,
      {
        ...payment,
        title: "Entrada revisada",
        vendor_id: vid,
        amount_cents: 200000,
      },
      id,
    );
    await setPaymentPaid(c.db, wid, id, true);
    assert.ok((await getRecord(c.db, "payments", wid, id)).paid_date);
    await setPaymentPaid(c.db, wid, id, false);
    assert.equal((await getRecord(c.db, "payments", wid, id)).paid_date, null);
    await assert.rejects(
      savePayment(c.db, wid, { ...payment, amount_cents: 1.5 }),
    );
    await assert.rejects(
      savePayment(c.db, wid, { ...payment, due_date: "2027-02-30" }),
    );
    await deleteRecord(c.db, "vendors", wid, vid);
    assert.equal((await getRecord(c.db, "payments", wid, id)).vendor_id, null);
    await deleteRecord(c.db, "payments", wid, id);
    assert.equal(await getRecord(c.db, "payments", wid, id), null);
  } finally {
    c.close();
  }
});
test("appointments CRUD, related task/vendor and isolation by wedding", async () => {
  const c = await database();
  try {
    const vid = await saveVendor(c.db, wid, vendor);
    const tid = await saveTask(c.db, wid, task);
    const ap = {
      title: "Reunião",
      description: null,
      appointment_date: "2027-01-10T15:00:00.000Z",
      location: "Estúdio",
      vendor_id: vid,
      task_id: tid,
    };
    const id = await saveAppointment(c.db, wid, ap);
    await saveAppointment(c.db, wid, { ...ap, title: "Reunião com Bella" }, id);
    assert.equal((await getRecord(c.db, "appointments", wid, id)).task_id, tid);
    await assert.rejects(
      saveAppointment(c.db, wid, { ...ap, vendor_id: "missing" }),
    );
    await deleteRecord(c.db, "tasks", wid, tid);
    assert.equal(
      (await getRecord(c.db, "appointments", wid, id)).task_id,
      null,
    );
    await deleteRecord(c.db, "appointments", wid, id);
    assert.equal(await getRecord(c.db, "appointments", wid, id), null);
    c.native.exec(
      "INSERT INTO weddings (id,partner_one_name,partner_two_name,created_at,updated_at) VALUES ('other','A','B','2026','2026')",
    );
    await assert.rejects(
      savePayment(c.db, "other", { ...payment, vendor_id: vid }),
    );
    assert.equal(await getRecord(c.db, "vendors", "other", vid), null);
  } finally {
    c.close();
  }
});
test("required end-to-end scenario persists across database close/reopen and feeds Home", async () => {
  const c = await database(false);
  try {
    await completeOnboarding(c.db, wedding);
    const tasks = await listRecords(c.db, "tasks", wid);
    assert.equal(tasks.length, 12);
    await setTaskCompleted(c.db, wid, tasks[0].id, true);
    await addSubtask(c.db, wid, tasks[0].id, "Revisar juntos");
    const group = await saveGroup(c.db, wid, "Família Souza");
    const g1 = await saveGuest(
      c.db,
      wid,
      { ...guest("Maria Souza"), group_id: group },
      [],
    );
    const g2 = await saveGuest(
      c.db,
      wid,
      { ...guest("João Souza"), group_id: group },
      [],
    );
    const ev = await saveEvent(c.db, wid, event);
    await saveGuest(
      c.db,
      wid,
      { ...guest("Maria Souza"), group_id: group, rsvp_status: "confirmed" },
      [{ event_id: ev, rsvp_status: "confirmed" }],
      g1,
    );
    await saveGuest(
      c.db,
      wid,
      { ...guest("João Souza"), group_id: group },
      [{ event_id: ev, rsvp_status: "pending" }],
      g2,
    );
    const cat = (await listRecords(c.db, "budget_categories", wid)).find(
      (c) => c.name === "Fotografia",
    );
    await saveBudgetCategory(c.db, wid, cat.name, 800000, cat.id);
    const vid = await saveVendor(c.db, wid, {
      ...vendor,
      budget_category_id: cat.id,
    });
    const entry = await savePayment(c.db, wid, {
      ...payment,
      vendor_id: vid,
      budget_category_id: cat.id,
    });
    await setPaymentPaid(c.db, wid, entry, true);
    await savePayment(c.db, wid, {
      ...payment,
      title: "Segunda parcela",
      vendor_id: vid,
      budget_category_id: cat.id,
      due_date: "2027-02-20",
    });
    await saveAppointment(c.db, wid, {
      title: "Reunião com Bella Fotografia",
      description: null,
      appointment_date: "2027-01-10T15:00:00.000Z",
      location: "Estúdio Bella",
      vendor_id: vid,
      task_id: null,
    });
    await c.reopen();
    const data = await loadPlanning(c.db);
    assert.equal(data.wedding.partner_one_name, "Alex");
    assert.equal(data.wedding.partner_two_name, "Dani");
    assert.equal(data.tasks.filter((t) => t.status === "completed").length, 1);
    assert.equal(data.guestStats.confirmed, 1);
    assert.equal(data.guestStats.pending, 1);
    assert.equal(data.guestStats.records, 2);
    assert.equal(data.finance.planned_cents, 800000);
    assert.equal(data.finance.contracted_cents, 750000);
    assert.equal(data.finance.paid_cents, 250000);
    assert.equal(data.finance.pending_cents, 250000);
    assert.equal(data.balances.balance_cents, 500000);
    assert.equal((await guestInvitations(c.db, wid, g2)).length, 1);
    assert.equal((await listSubtasks(c.db, wid, tasks[0].id)).length, 1);
    assert.ok(
      homePriorities(data, new Date("2026-09-15T12:00:00Z")).length <= 3,
    );
    assert.equal(
      upcomingAppointments(data, new Date("2026-09-15T12:00:00Z"))[0].title,
      "Reunião com Bella Fotografia",
    );
    assert.equal(c.native.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    c.close();
  }
});
test("countdown edge cases and Brazilian date validation avoid negative countdowns", () => {
  assert.equal(countdown("2027-05-22", new Date(2027, 4, 22)), "É hoje");
  assert.equal(countdown("2027-05-22", new Date(2027, 4, 21)), "É amanhã");
  assert.match(countdown("2027-05-22", new Date(2027, 4, 20)), /2 dias/);
  assert.doesNotMatch(countdown("2027-05-22", new Date(2027, 4, 23)), /-1/);
  assert.equal(parseDateInput("31/02/2027"), null);
  assert.equal(parseDateInput("22/05/2027"), "2027-05-22");
  assert.equal(dateInput("2027-05-22"), "22/05/2027");
  assert.equal(parseDateTime("22/05/2027", "25:00"), null);
});
