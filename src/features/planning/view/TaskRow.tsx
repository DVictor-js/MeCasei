import { Pressable, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Task } from "@/shared/types/models";
import { AppText, Badge } from "@/shared/components/ui";
import { colors, spacing } from "@/core/theme/theme";
import { responsible, optionLabel } from "@/core/theme/options";
import { dueLabel } from "@/shared/utils/dates";
export function TaskRow({
  task,
  onToggle,
  disabled,
}: {
  task: Task;
  onToggle: () => void;
  disabled: boolean;
}) {
  const done = task.status === "completed";
  return (
    <View style={s.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${done ? "Reabrir" : "Concluir"} ${task.title}`}
        accessibilityState={{ checked: done, disabled }}
        disabled={disabled}
        style={s.check}
        onPress={onToggle}
      >
        <Ionicons
          name={done ? "checkmark-circle" : "ellipse-outline"}
          size={27}
          color={colors.primary}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir tarefa ${task.title}`}
        style={s.content}
        onPress={() =>
          router.push({ pathname: "/tasks/[id]", params: { id: task.id } })
        }
      >
        <AppText style={done ? s.done : undefined}>{task.title}</AppText>
        <AppText variant="bodySmall" muted>
          {done ? "Concluída" : `${task.category} · ${dueLabel(task.due_date)}`}
        </AppText>
        {!done && (
          <AppText variant="caption" muted>
            Responsável: {optionLabel(responsible, task.responsible)}
          </AppText>
        )}
        {!done && task.priority === "high" && <Badge label="Alta prioridade" />}
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  check: { minWidth: 44, minHeight: 44, alignItems: "center", paddingTop: 2 },
  content: { flex: 1, gap: spacing.xs },
  done: { textDecorationLine: "line-through", color: colors.textSecondary },
});
