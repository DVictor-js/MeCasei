import type { PropsWithChildren } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  type TextProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, radius, spacing, typography } from "@/core/theme/theme";
import { centsToBRL } from "@/shared/utils/money";
import { useFeedback } from "@/shared/viewmodel/useAction";
export function Screen({ children }: PropsWithChildren) {
  const { message } = useFeedback();
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={s.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={s.screen}
        >
          {message ? (
            <View accessibilityLiveRegion="polite" style={s.notice}>
              <AppText variant="bodySmall">{message}</AppText>
            </View>
          ) : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function AppText({
  variant = "body",
  muted = false,
  style,
  ...props
}: TextProps & { variant?: keyof typeof typography; muted?: boolean }) {
  return (
    <Text
      {...props}
      style={[
        typography[variant],
        { color: muted ? colors.textSecondary : colors.text },
        style,
      ]}
    />
  );
}
export function AppHeader({
  title,
  subtitle,
  back = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  return (
    <View style={s.header}>
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={s.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
          <AppText variant="label">Voltar</AppText>
        </Pressable>
      )}
      {subtitle && (
        <AppText variant="caption" muted>
          {subtitle}
        </AppText>
      )}
      <AppText variant="headingLarge">{title}</AppText>
    </View>
  );
}
export function SectionHeader({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <View style={s.section}>
      <AppText variant="heading">{title}</AppText>
      {detail && (
        <AppText variant="caption" muted>
          {detail}
        </AppText>
      )}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && s.danger,
        (pressed || disabled) && s.faded,
      ]}
    >
      <AppText
        variant="label"
        style={{
          color: danger
            ? colors.danger
            : secondary
              ? colors.text
              : colors.surface,
        }}
      >
        {title}
      </AppText>
    </Pressable>
  );
}
export function Divider() {
  return <View style={s.divider} />;
}
export function ProgressBar({ value }: { value: number }) {
  const progress = Math.round(
    Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) * 100,
  );
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: progress }}
      style={s.track}
    >
      <View style={[s.fill, { width: `${progress}%` }]} />
    </View>
  );
}
export function MoneyText({ cents }: { cents: number }) {
  return <AppText variant="heading">{centsToBRL(cents)}</AppText>;
}
export function ListRow({
  title,
  subtitle,
  icon = "chevron-forward-outline",
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && s.faded]}
    >
      <View style={s.grow}>
        <AppText>{title}</AppText>
        {subtitle && (
          <AppText muted variant="bodySmall">
            {subtitle}
          </AppText>
        )}
      </View>
      <Ionicons name={icon} size={21} color={colors.primary} />
    </Pressable>
  );
}
export function EmptyState({
  title,
  description,
  icon = "leaf-outline",
}: {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={24} color={colors.primary} />
      <AppText variant="heading">{title}</AppText>
      <AppText muted variant="bodySmall">
        {description}
      </AppText>
    </View>
  );
}
export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <View style={s.badge}>
      <AppText
        variant="caption"
        style={{ color: tone === "neutral" ? colors.primary : colors[tone] }}
      >
        {label}
      </AppText>
    </View>
  );
}
export function LoadState({
  error,
  retry,
}: {
  error: string | null;
  retry: () => void;
}) {
  return error ? (
    <>
      <AppText accessibilityRole="alert">{error}</AppText>
      <Button title="Tentar novamente" onPress={retry} />
    </>
  ) : (
    <ActivityIndicator color={colors.primary} />
  );
}
export function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <AppText accessibilityRole="alert" style={{ color: colors.danger }}>
      {message}
    </AppText>
  ) : null;
}
export const layout = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    alignItems: "center",
  },
  grow: { flex: 1, minWidth: 110 },
  surface: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  soft: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metric: { flexGrow: 1, flexBasis: 120, gap: spacing.xs },
  gap: { gap: spacing.md },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 64,
    gap: spacing.md,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    alignSelf: "flex-start",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    minHeight: 50,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: { backgroundColor: colors.primarySoft },
  danger: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  faded: { opacity: 0.65 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  track: {
    height: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  grow: { flex: 1, gap: spacing.xs },
  empty: { paddingVertical: spacing.md, gap: spacing.sm },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  notice: {
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
});
