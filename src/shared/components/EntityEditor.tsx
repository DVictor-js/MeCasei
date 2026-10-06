import { router, useLocalSearchParams, type Href } from "expo-router";
import {
  Screen,
  AppHeader,
  AppText,
  Button,
  SectionHeader,
  ErrorMessage,
  LoadState,
  Badge,
} from "@/shared/components/ui";
import { FormFields } from "@/shared/components/FormFields";
import { SelectField } from "@/shared/components/fields";
import { SubtaskList } from "@/features/planning/view/SubtaskList";
import { VendorSummary } from "@/features/finances/view/VendorSummary";
import { rsvp } from "@/core/theme/options";
import { confirmDelete } from "@/shared/utils/confirm";
import { formatDate } from "@/shared/utils/dates";
import type { Table } from "@/core/database/repository";
import { useEntityEditorViewModel } from "@/shared/viewmodel/useEntityEditorViewModel";
export function EntityEditor({
  kind,
  create = false,
}: {
  kind: Table;
  create?: boolean;
}) {
  const params = useLocalSearchParams<{ id?: string; vendorId?: string }>();
  const id = create ? undefined : params.id;
  const {data,error,reload,action,values,invitations,setInvitations,initError,ready,meta,set,save,currentTitle,task,payment,vendor,toggleTask,togglePayment,remove,fields} = useEntityEditorViewModel(kind,id,params.vendorId);
  if (!data || !ready)
    return (
      <Screen>
        <AppHeader title={meta.title} back />
        <LoadState error={error ?? initError} retry={() => void reload()} />
      </Screen>
    );
  return (
    <Screen>
      <AppHeader
        title={id ? currentTitle : `Adicionar ${meta.singular}`}
        subtitle={id ? meta.title.toLocaleUpperCase() : "UM NOVO PASSO"}
        back
      />
      {task && (
        <>
          <Badge
            label={task.status === "completed" ? "Concluída" : "Em andamento"}
            tone={task.status === "completed" ? "success" : "neutral"}
          />
          <Button
            secondary
            disabled={action.busy}
            title={
              task.status === "completed" ? "Reabrir tarefa" : "Concluir tarefa"
            }
            onPress={() => void toggleTask()}
          />
        </>
      )}
      {payment && (
        <>
          <Badge
            label={
              payment.status === "paid"
                ? `Pago em ${formatDate(payment.paid_date, true)}`
                : "Aguardando pagamento"
            }
            tone={payment.status === "paid" ? "success" : "warning"}
          />
          <Button
            secondary
            disabled={action.busy}
            title={
              payment.status === "paid"
                ? "Desfazer pagamento"
                : "Marcar como pago"
            }
            onPress={() => void togglePayment()}
          />
        </>
      )}
      {vendor && <VendorSummary vendor={vendor} data={data} />}
      <FormFields fields={fields} values={values} set={set} />
      {kind === "guests" && (
        <>
          <Button
            secondary
            title="Criar grupo / família"
            onPress={() => router.push("/groups/new")}
          />
          <SectionHeader title="Eventos convidados" />
          {data.events.length === 0 ? (
            <AppText muted variant="bodySmall">
              Crie os momentos do casamento para escolher os convites de cada
              pessoa.
            </AppText>
          ) : (
            data.events.map((event) => (
              <SelectField
                key={event.id}
                label={event.title}
                value={invitations[event.id] ?? ""}
                options={[{ value: "", label: "Não convidado" }, ...rsvp]}
                onChange={(value) =>
                  setInvitations((old) => ({ ...old, [event.id]: value }))
                }
              />
            ))
          )}
          <Button
            secondary
            title="Criar evento"
            onPress={() => router.push("/events/new")}
          />
        </>
      )}
      <ErrorMessage message={action.error} />
      <Button
        disabled={action.busy}
        title={action.busy ? "Salvando…" : "Salvar"}
        onPress={() => void save(savedId => { if(id) router.back(); else router.replace(`/${meta.route}/${savedId}` as Href); })}
      />
      <Button
        secondary
        title="Cancelar"
        disabled={action.busy}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      />
      {task && (
        <SubtaskList weddingId={data.wedding.id} taskId={task.id} />
      )}
      {id && (
        <Button
          danger
          title={`Excluir ${meta.singular}`}
          disabled={action.busy}
          onPress={() =>
            confirmDelete(
              meta.singular,
              () =>
                void remove(() => router.back()),
              kind === "vendors"
                ? "Os pagamentos serão preservados, sem vínculo com este fornecedor."
                : kind === "wedding_events"
                  ? "Os convites deste evento também serão removidos."
                  : "Esta ação não pode ser desfeita.",
            )
          }
        />
      )}
    </Screen>
  );
}
