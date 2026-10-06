require("./aliases.cjs");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");
const { DatabaseSync } = require("node:sqlite");
for (const ext of [".ts", ".tsx"])
  require.extensions[ext] = (mod, file) =>
    mod._compile(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText,
      file,
    );
function adapter(native) {
  return {
    execAsync: async (sql) => native.exec(sql),
    getFirstAsync: async (sql, ...params) =>
      native.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql, ...params) => native.prepare(sql).all(...params),
    runAsync: async (sql, ...params) => native.prepare(sql).run(...params),
    withTransactionAsync: async function (fn) {
      native.exec("BEGIN IMMEDIATE");
      try {
        await fn();
        native.exec("COMMIT");
      } catch (e) {
        native.exec("ROLLBACK");
        throw e;
      }
    },
  };
}
const wedding = {
  partner_one_name: "Alex",
  partner_two_name: "Dani",
  wedding_date: "2027-05-22",
  city: "São Paulo",
  guest_target: 120,
  budget_target_cents: 6000000,
};
const guest = (name) => ({
  name,
  group_id: null,
  phone: null,
  email: null,
  rsvp_status: "pending",
  companion_count: 0,
  dietary_restrictions: null,
  table_name: null,
  invitation_sent: 0,
});
async function database(configure = true) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "mecasei-mvp-"));
  const file = path.join(folder, "case.db");
  let native = new DatabaseSync(file);
  let db = adapter(native);
  const { migrate } = require("@/core/database/migrate");
  await migrate(db);
  if (configure)
    await require("@/features/wedding/model/weddingService").completeOnboarding(
      db,
      wedding,
    );
  return {
    get db() {
      return db;
    },
    get native() {
      return native;
    },
    file,
    async reopen() {
      native.close();
      native = new DatabaseSync(file);
      db = adapter(native);
      await migrate(db);
    },
    close() {
      native.close();
      fs.rmSync(folder, { recursive: true, force: true });
    },
  };
}
module.exports = { adapter, database, wedding, guest };
