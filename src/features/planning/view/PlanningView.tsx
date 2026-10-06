import { usePlanningViewModel } from "@/features/planning/viewmodel/usePlanningViewModel";
import { router } from "expo-router";
import {
  Screen,
  AppHeader,
  AppText,
  Button,
  ProgressBar,
  SectionHeader,
  ListRow,
  EmptyState,
  LoadState,
  ErrorMessage,
} from "@/shared/components/ui";
import { Chips } from "@/shared/components/fields";
import { TaskRow } from "@/features/planning/view/TaskRow";
const filters = [
  { value: "now", label: "Agora" },
  { value: "next", label: "Próximas" },
  { value: "done", label: "Concluídas" },
  { value: "all", label: "Todas" },
];
export default function Planning() {
  const { data, error, reload, filter, setFilter, done, tasks, progress, busy, toggleTask } = usePlanningViewModel();
  if (!data)
    return (
      <Screen>
        <AppHeader title="Planejamento" />
        <LoadState error={error} retry={() => void reload()} />
      </Screen>
    );
  return (
    <Screen>
      <AppHeader title="Planejamento" subtitle="UM PASSO DE CADA VEZ" />
      <AppText>
        {done} de {data.tasks.length} concluídas
      </AppText>
      <ProgressBar value={progress} />
      <Button
        title="Adicionar tarefa"
        onPress={() => router.push("/tasks/new")}
      />
      <Chips options={filters} value={filter} onChange={setFilter} />
      {filter === "now" && (
        <AppText variant="caption" muted>
          Atrasadas, próximos 7 dias e prioridades altas.
        </AppText>
      )}
      <ErrorMessage message={error} />
      {tasks.length ? (
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            disabled={busy}
            onToggle={() => void toggleTask(task)}
          />
        ))
      ) : (
        <EmptyState
          title={
            data.tasks.length
              ? "Tudo em ordem por aqui."
              : "Seu planejamento começa aqui."
          }
          description={
            data.tasks.length
              ? "Explore os outros filtros ou adicione um novo passo."
              : "Adicione a primeira tarefa e construam o plano de vocês."
          }
        />
      )}
      <SectionHeader title="Momentos para organizar" />
      <ListRow
        title="Compromissos"
        subtitle="Visitas, reuniões e degustações"
        icon="calendar-outline"
        onPress={() => router.push("/appointments")}
      />
      <ListRow
        title="Eventos do casamento"
        subtitle="Cerimônia, recepção e outros encontros"
        icon="heart-outline"
        onPress={() => router.push("/events")}
      />
    </Screen>
  );
}
