require("./helpers/aliases.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
// Compile production TypeScript without a test runtime dependency.
require.extensions[".ts"] = (mod, file) => {
  const result = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  mod._compile(result.outputText, file);
};
const sampleWedding = {
  partner_one_name: "Alex",
  partner_two_name: "Dani",
  wedding_date: "2027-05-22",
  city: "S�o Paulo",
  guest_target: 120,
  budget_target_cents: 6000000,
};
const { migrate, migrations } = require("@/core/database/migrate");
const {
  getWedding,
  completeOnboarding,
} = require("@/features/wedding/model/weddingService");
const { getFinancialSummary } = require("@/features/finances/model/financeService");
const { centsToBRL, inputToCents } = require("@/shared/utils/money");
const { daysUntil } = require("@/shared/utils/dates");
// SQLite adapter exercises the exact production migrations and service SQL.
function adapter(native) {
  return {
    execAsync: async (sql) => native.exec(sql),
    getFirstAsync: async (sql, ...params) =>
      native.prepare(sql).get(...params) ?? null,
    runAsync: async (sql, ...params) => native.prepare(sql).run(...params),
    withTransactionAsync: async function (fn) {
      native.exec("BEGIN IMMEDIATE");
      try {
        await fn(this);
        native.exec("COMMIT");
      } catch (error) {
        native.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
test("migrations, onboarding, restart persistence, relationships and derived finance", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wedding-test-"));
  const file = path.join(dir, "test.db");
  let native = new DatabaseSync(file);
  try {
    let db = adapter(native);
    await migrate(db);
    assert.equal(native.prepare("PRAGMA foreign_keys").get().foreign_keys, 1);
    assert.equal(
      native.prepare("PRAGMA journal_mode").get().journal_mode,
      "wal",
    );
    assert.equal(await getWedding(db), null);
    assert.equal(
      native
        .prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .get().n,
      15,
    );
    await Promise.all([
      completeOnboarding(db, sampleWedding),
      completeOnboarding(db, sampleWedding),
    ]);
    assert.equal(native.prepare("SELECT COUNT(*) n FROM weddings").get().n, 1);
    assert.equal(
      native.prepare("SELECT COUNT(*) n FROM budget_categories").get().n,
      8,
    );
    assert.equal((await getWedding(db)).onboarding_completed, 1);
    native.close();
    native = new DatabaseSync(file);
    db = adapter(native);
    await migrate(db);
    assert.equal((await getWedding(db)).onboarding_completed, 1);
    assert.equal(
      native.prepare("PRAGMA user_version").get().user_version,
      migrations.length,
    );
    native.exec(`UPDATE budget_categories SET planned_cents=10000 WHERE name='Local';
   INSERT INTO decisions VALUES ('d','local-wedding','Espaço','Local','open',NULL,'now','now');
   INSERT INTO decision_options VALUES ('o','d','Jardim',8000,NULL,NULL,NULL,0,'now','now');
   UPDATE decisions SET selected_option_id='o', status='decided' WHERE id='d';
   INSERT INTO vendors (id,wedding_id,name,category,total_cost_cents,status,source_decision_option_id,created_at,updated_at) VALUES ('v','local-wedding','Jardim','Local',8000,'contracted','o','now','now');
   INSERT INTO payments (id,wedding_id,vendor_id,title,amount_cents,due_date,status,created_at,updated_at) VALUES ('p','local-wedding','v','Entrada',2000,'2027-01-01','paid','now','now'), ('p2','local-wedding','v','Saldo',6000,'2027-02-01','pending','now','now');`);
    assert.deepEqual(
      { ...(await getFinancialSummary(db, "local-wedding")) },
      {
        planned_cents: 10000,
        contracted_cents: 8000,
        paid_cents: 2000,
        pending_cents: 6000,
      },
    );
    assert.throws(() => native.exec("UPDATE payments SET amount_cents=1.5"));
    assert.throws(() => native.exec("UPDATE payments SET status='invalid'"));
    assert.throws(() => native.exec("UPDATE payments SET vendor_id='missing'"));
    native.exec(
      "INSERT INTO decisions VALUES ('other','local-wedding','Outro','Local','open',NULL,'now','now')",
    );
    assert.throws(() =>
      native.exec(
        "UPDATE decisions SET selected_option_id='o' WHERE id='other'",
      ),
    );
    native.exec("DELETE FROM vendors WHERE id='v'");
    assert.equal(
      native.prepare("SELECT vendor_id FROM payments WHERE id='p'").get()
        .vendor_id,
      null,
    );
    assert.equal(native.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally {
    native.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("upgrade existing version 1 without destroying data", async () => {
  const native = new DatabaseSync(":memory:");
  const db = adapter(native);
  try {
    native.exec(migrations[0]);
    native.exec("PRAGMA user_version=1");
    native.exec(
      "INSERT INTO weddings (id,partner_one_name,partner_two_name,created_at,updated_at) VALUES ('local-wedding','Alex','Dani','2026-01-01','2026-01-01')",
    );
    await migrate(db);
    await completeOnboarding(db, sampleWedding);
    assert.equal((await getWedding(db)).id, "local-wedding");
    assert.equal(
      native.prepare("SELECT COUNT(*) n FROM budget_categories").get().n,
      8,
    );
  } finally {
    native.close();
  }
});

test("version 3 wedding and tasks survive sync mapping migration", async () => {
  const native = new DatabaseSync(":memory:");
  const db = adapter(native);
  try {
    native.exec(migrations.slice(0, 3).join("\n"));
    native.exec("PRAGMA user_version=3");
    native.exec("INSERT INTO weddings (id,partner_one_name,partner_two_name,created_at,updated_at) VALUES ('local-wedding','Alex','Dani','2026-01-01','2026-01-01')");
    native.exec("INSERT INTO tasks (id,wedding_id,title,category,created_at,updated_at) VALUES ('task-1','local-wedding','Definir local','Local','2026-01-01','2026-01-01')");
    await migrate(db);
    assert.equal(native.prepare("PRAGMA user_version").get().user_version, 4);
    assert.equal(native.prepare("SELECT title FROM tasks WHERE id='task-1'").get().title, "Definir local");
    assert.equal(native.prepare("PRAGMA foreign_keys").get().foreign_keys, 1);
    assert.equal(native.prepare("SELECT COUNT(*) n FROM sync_entities").get().n, 0);
  } finally {
    native.close();
  }
});
test("migration failure rolls back schema and version", async () => {
  const native = new DatabaseSync(":memory:");
  const db = adapter(native);
  migrations.push("CREATE TABLE rollback_probe(id INTEGER); INVALID SQL;");
  try {
    await assert.rejects(migrate(db));
    assert.equal(native.prepare("PRAGMA user_version").get().user_version, 0);
    assert.equal(
      native
        .prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table'")
        .get().n,
      0,
    );
  } finally {
    migrations.pop();
    native.close();
  }
});
test("money input uses integer cents and rejects malformed values", () => {
  for (const [value, expected] of [
    ["R$ 1.500,00", 150000],
    ["0,01", 1],
    ["1500", 150000],
    ["2,5", 250],
    ["0", 0],
  ])
    assert.equal(inputToCents(value), expected);
  for (const value of ["", "-1", "1.50", "1,234", "abc", "900719925474099100"])
    assert.equal(inputToCents(value), null);
  assert.match(centsToBRL(150000), /1\.500,00/);
  assert.throws(() => centsToBRL(1.1));
});
test("countdown compares local calendar days", () => {
  assert.equal(daysUntil("2027-05-22", new Date(2027, 4, 21, 23, 59)), 1);
  assert.equal(daysUntil("2027-05-22", new Date(2027, 4, 22, 0, 0)), 0);
});
