import { useSubtasksViewModel } from "@/features/planning/viewmodel/useSubtasksViewModel";
import { View, Pressable } from "react-native";
import { SectionHeader, AppText, Button, ErrorMessage, layout } from "@/shared/components/ui";
import { Field } from "@/shared/components/fields";
import { confirmDelete } from "@/shared/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/core/theme/theme";
export function SubtaskList({
  weddingId,
  taskId,
}: {
  weddingId: string;
  taskId: string;
}) {
  const { items,title,setTitle,loadError,action,reload,toggle,remove,add,completed } = useSubtasksViewModel(weddingId,taskId);
  return (
    <>
      <SectionHeader
        title="Pequenos passos"
        detail={`${completed} de ${items.length}`}
      />
      <ErrorMessage message={loadError} />
      {loadError && (
        <Button
          secondary
          title="Tentar novamente"
          onPress={() => void reload()}
        />
      )}
      {items.map((item) => (
        <View key={item.id} style={layout.row}>
          <Pressable
            disabled={action.busy}
            accessibilityRole="checkbox"
            accessibilityLabel={item.title}
            accessibilityState={{ checked: Boolean(item.completed) }}
            style={[layout.grow, layout.row]}
            onPress={() => void toggle(item)}
          >
            <Ionicons
              name={item.completed ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={colors.primary}
            />
            <AppText
              style={{
                flex: 1,
                textDecorationLine: item.completed ? "line-through" : "none",
              }}
            >
              {item.title}
            </AppText>
          </Pressable>
          <Pressable
            disabled={action.busy}
            accessibilityRole="button"
            accessibilityLabel={`Excluir subtarefa ${item.title}`}
            style={{ padding: 12 }}
            onPress={() =>
              confirmDelete(
                "subtarefa",
                () =>
                  void remove(item),
              )
            }
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      ))}
      <Field label="Nova subtarefa" value={title} onChange={setTitle} />
      <ErrorMessage message={action.error} />
      <Button
        secondary
        title={action.busy ? "Salvando…" : "Adicionar subtarefa"}
        disabled={action.busy}
        onPress={() => void add()}
      />
    </>
  );
}
