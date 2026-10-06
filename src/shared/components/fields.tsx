import { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  type KeyboardTypeOptions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText, Button } from "@/shared/components/ui";
import { colors, radius, spacing, typography } from "@/core/theme/theme";
export type Option = { value: string; label: string };
export function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard = "default",
  multiline = false,
  required = false,
  secure = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboard?: KeyboardTypeOptions;
  multiline?: boolean;
  required?: boolean;
  secure?: boolean;
}) {
  return (
    <View style={s.field}>
      <AppText variant="label">
        {label}
        {required ? " *" : ""}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboard}
        multiline={multiline}
        secureTextEntry={secure}
        autoCapitalize={keyboard === "email-address" || secure ? "none" : "sentences"}
        style={[s.input, multiline && s.multiline]}
      />
    </View>
  );
}
export function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={s.field}>
      {label && <AppText variant="label">{label}</AppText>}
      <View style={s.chips}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{
              selected: value === o.value,
              checked: value === o.value,
            }}
            onPress={() => onChange(o.value)}
            style={[s.chip, value === o.value && s.selected]}
          >
            <AppText
              variant="label"
              style={{
                color:
                  value === o.value ? colors.surface : colors.textSecondary,
              }}
            >
              {o.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  return (
    <View style={s.field}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${options.find((o) => o.value === value)?.label ?? "Selecionar"}`}
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
        style={s.select}
      >
        <AppText style={{ flex: 1 }}>
          {options.find((o) => o.value === value)?.label ?? "Selecionar"}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.primary} />
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={s.modal}>
          <AppText variant="heading">{label}</AppText>
          <Field label="Buscar opção" value={query} onChange={setQuery} />
          <ScrollView keyboardShouldPersistTaps="handled">
            {options
              .filter((o) =>
                o.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
              )
              .map((o) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: value === o.value,
                    checked: value === o.value,
                  }}
                  key={o.value}
                  style={s.select}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <AppText style={{ flex: 1 }}>{o.label}</AppText>
                  {value === o.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
          </ScrollView>
          <Button secondary title="Cancelar" onPress={() => setOpen(false)} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={s.select}>
      <AppText style={{ flex: 1 }}>{label}</AppText>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    </View>
  );
}
const s = StyleSheet.create({
  field: { gap: spacing.sm },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    justifyContent: "center",
  },
  selected: { backgroundColor: colors.primary },
  select: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    minHeight: 52,
  },
  modal: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
});
