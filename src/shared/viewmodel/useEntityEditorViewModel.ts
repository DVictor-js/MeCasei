import { useEffect, useRef, useState } from "react";
import type { RSVPStatus } from "@/shared/types/models";
import type { Table } from "@/core/database/repository";
import { deleteRecord } from "@/core/database/repository";
import { recordsFor } from "@/shared/models/recordLists";
import { guestInvitations } from "@/features/guests/model/guestService";
import { setTaskCompleted } from "@/features/planning/model/taskService";
import { setPaymentPaid } from "@/features/finances/model/financeService";
import { saveEditor, valuesFromRecord } from "@/shared/models/editorService";
import {
  fieldsFor,
  formDefaults,
  entityMeta,
  type FormValues,
} from "@/shared/models/entityDefinitions";
import { usePlanningData } from "@/shared/viewmodel/usePlanningData";
import { useAction } from "@/shared/viewmodel/useAction";
import { triggerSync } from "@/core/sync/trigger";
export function useEntityEditorViewModel(kind: Table, id?: string, vendorId?: string) {
  const { data, error, reload, db } = usePlanningData();
  const action = useAction();
  const [values, setValues] = useState<FormValues>(() => formDefaults(kind));
  const [invitations, setInvitations] = useState<Record<string, string>>({});
  const [initError, setInitError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);
  const meta = entityMeta[kind];
  useEffect(() => {
    if (!data || loaded.current) return;
    let active = true;
    async function init() {
      if (!data) return;
      try {
        const record = id
          ? recordsFor(data, kind).find((r) => r.id === id)
          : null;
        if (id && !record)
          throw new Error("Este item não está mais disponível.");
        const initial = record
          ? valuesFromRecord(kind, record)
          : formDefaults(kind);
        if (!id && vendorId) {
          initial.vendor_id = vendorId;
          initial.budget_category_id =
            data.vendors.find((v) => v.id === vendorId)
              ?.budget_category_id ?? "";
        }
        const invited =
          id && kind === "guests"
            ? await guestInvitations(db, data.wedding.id, id)
            : [];
        if (active) {
          setValues(initial);
          setInvitations(
            Object.fromEntries(invited.map((i) => [i.event_id, i.rsvp_status])),
          );
          loaded.current = true;
          setReady(true);
          setInitError(null);
        }
      } catch (e) {
        if (active)
          setInitError(
            e instanceof Error ? e.message : "Não foi possível abrir.",
          );
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [data, id, kind, db, vendorId]);
  const set = (key: string, value: string) =>
    setValues((old) => ({ ...old, [key]: value }));
  async function save(onSaved: (savedId: string) => void) {
    if (!data) return;
    await action.run(async () => {
      const invited = data.events
        .filter((e) => invitations[e.id])
        .map((e) => ({
          event_id: e.id,
          rsvp_status: invitations[e.id] as RSVPStatus,
        }));
      const saved = await saveEditor(
        db,
        kind,
        data.wedding.id,
        values,
        id,
        invited,
      );
      void triggerSync(db, data.wedding.id);
      onSaved(saved);
    }, "Alterações salvas.");
  }
  const current = data && id ? recordsFor(data, kind).find((r) => r.id === id) : null;
  const currentTitle = current
    ? "name" in current
      ? current.name
      : current.title
    : meta.title;
  const task = kind === "tasks" ? data?.tasks.find((t) => t.id === id) : null;
  const payment =
    kind === "payments" ? data?.payments.find((p) => p.id === id) : null;
  const vendor =
    kind === "vendors" ? data?.vendors.find((v) => v.id === id) : null;
  async function toggleTask() {
    if (!task || !data) return;
    await action.run(async () => {
      await setTaskCompleted(db,data.wedding.id,task.id,task.status !== "completed");
      await reload();
    }, "Tarefa atualizada.");
  }
  async function togglePayment() {
    if (!payment || !data) return;
    await action.run(async () => {
      await setPaymentPaid(db,data.wedding.id,payment.id,payment.status !== "paid");
      await reload();
    }, "Pagamento atualizado.");
  }
  async function remove(onDeleted: () => void) {
    if(!id || !data) return;
    await action.run(async () => {
      await deleteRecord(db,kind,data.wedding.id,id); onDeleted();
    }, `${meta.title} excluído.`);
  }
  return {data,error,reload,action,values,invitations,setInvitations,initError,ready,meta,set,save,currentTitle,task,payment,vendor,toggleTask,togglePayment,remove,fields:data ? fieldsFor(kind,data) : []};
}
