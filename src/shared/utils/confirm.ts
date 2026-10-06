import { Alert } from "react-native";
export function confirmDelete(
  label: string,
  onConfirm: () => void,
  detail = "Esta ação não pode ser desfeita.",
) {
  Alert.alert(`Excluir ${label}?`, detail, [
    { text: "Cancelar", style: "cancel" },
    { text: "Excluir", style: "destructive", onPress: onConfirm },
  ]);
}
