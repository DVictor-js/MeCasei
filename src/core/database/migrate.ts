import { mvpSchema } from "@/core/database/migrations/003_mvp";
import { writeTransaction } from "@/core/database/transaction";
import type { SQLiteDatabase } from "expo-sqlite";
import { initialSchema } from "@/core/database/migrations/001_initial";
import { decisionVendorSchema } from "@/core/database/migrations/002_decision_vendor";
import { syncSchema } from "@/core/database/migrations/004_sync";
export const migrations = [initialSchema, decisionVendorSchema, mvpSchema, syncSchema];
export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  await writeTransaction(db, async (tx) => {
    const row = await tx.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    const version = row?.user_version ?? 0;
    if (version > migrations.length)
      throw new Error(
        "Banco de uma versão mais recente. Atualize o aplicativo.",
      );
    for (let i = version; i < migrations.length; i++) {
      await tx.execAsync(migrations[i]);
      await tx.execAsync(`PRAGMA user_version = ${i + 1}`);
    }
  });
}
