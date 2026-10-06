import { useHomeViewModel } from "@/features/home/viewmodel/useHomeViewModel";
import { View, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  AppText,
  AppHeader,
  SectionHeader,
  ProgressBar,
  ListRow,
  Button,
  LoadState,
  layout,
  ErrorMessage,
} from "@/shared/components/ui";
import { formatDate, formatDateTime } from "@/shared/utils/dates";
import { centsToBRL } from "@/shared/utils/money";
import { colors, spacing } from "@/core/theme/theme";
export default function Home() {
  const { data, error, reload, done, priorities, next, greeting, countdownText, progress } = useHomeViewModel();
  if (!data)
    return (
      <Screen>
        <AppHeader title="Hoje" />
        <LoadState error={error} retry={() => void reload()} />
      </Screen>
    );
  const { wedding, finance, guestStats } = data;
  return (
    <Screen>
      <View style={layout.row}>
        <View style={layout.grow}>
          <AppText variant="caption" muted>
            UM PLANO A DOIS
          </AppText>
          <AppText variant="headingLarge">Hoje</AppText>
        </View>
        <Ionicons name="sunny-outline" size={25} color={colors.primary} />
      </View>
      <AppText muted>
        {greeting}. Um
        passo de cada vez.
      </AppText>
      <View style={s.hero}>
        <AppText variant="caption" style={s.green}>
          O NOSSO GRANDE DIA
        </AppText>
        <AppText variant="display" style={s.center}>
          {wedding.partner_one_name} & {wedding.partner_two_name}
        </AppText>
        <AppText variant="heading" style={s.green}>
          {countdownText}
        </AppText>
        <AppText variant="bodySmall" muted style={s.center}>
          {formatDate(wedding.wedding_date)} · {wedding.city}
        </AppText>
      </View>
      <View style={layout.row}>
        <AppText variant="label" style={layout.grow}>
          O plano está tomando forma
        </AppText>
        <AppText variant="caption" muted>
          {done} de {data.tasks.length}
        </AppText>
      </View>
      <ProgressBar value={progress} />
      <AppText variant="bodySmall" muted>
        {done === 0
          ? "Cada pequena escolha aproxima vocês desse dia."
          : done === data.tasks.length
            ? "Vocês concluíram todos os passos. Hora de celebrar o caminho!"
            : `${done} ${done === 1 ? "passo concluído" : "passos concluídos"}. Vocês estão construindo esse dia juntos.`}
      </AppText>
      <ErrorMessage message={error} />
      <SectionHeader title="O que merece atenção" />
      {priorities.length ? (
        priorities.map((item, i) => (
          <View key={item.id} style={s.priority}>
            <AppText variant="label" style={s.green}>
              0{i + 1}
            </AppText>
            <View style={layout.grow}>
              <ListRow
                title={item.title}
                subtitle={item.detail}
                onPress={() => router.push(item.route as Href)}
              />
            </View>
          </View>
        ))
      ) : (
        <>
          <AppText muted>
            Por aqui, tudo em dia. Que tal olhar os próximos passos?
          </AppText>
          <Button
            secondary
            title="Ver planejamento"
            onPress={() => router.push("/planejar")}
          />
        </>
      )}
      <SectionHeader title="O próximo encontro" />
      {next ? (
        <View style={layout.soft}>
          <AppText variant="label">
            {formatDateTime(next.appointment_date)}
          </AppText>
          <ListRow
            title={next.title}
            subtitle={next.location ?? undefined}
            onPress={() =>
              router.push({
                pathname: "/appointments/[id]",
                params: { id: next.id },
              })
            }
          />
        </View>
      ) : (
        <ListRow
          title="Reservem um momento"
          subtitle="Adicionar visita, reunião ou degustação"
          icon="calendar-outline"
          onPress={() => router.push("/appointments/new")}
        />
      )}
      <SectionHeader title="Planos que cabem no bolso" />
      <AppText variant="caption" muted>
        ORÇAMENTO TOTAL
      </AppText>
      <AppText variant="headingLarge">
        {centsToBRL(wedding.budget_target_cents)}
      </AppText>
      <View style={layout.row}>
        <View style={layout.metric}>
          <AppText variant="caption" muted>
            Contratado
          </AppText>
          <AppText variant="heading">
            {centsToBRL(finance.contracted_cents)}
          </AppText>
        </View>
        <View style={layout.metric}>
          <AppText variant="caption" muted>
            Pago
          </AppText>
          <AppText variant="heading">{centsToBRL(finance.paid_cents)}</AppText>
        </View>
      </View>
      <ListRow
        title="Cuidar das finanças"
        subtitle={`${centsToBRL(finance.planned_cents)} distribuídos por categoria`}
        onPress={() => router.push("/financas")}
      />
      <SectionHeader title="Quem vai celebrar com vocês" />
      <AppText>{wedding.guest_target} pessoas previstas</AppText>
      <ProgressBar
        value={
          guestStats.records ? guestStats.confirmed / guestStats.records : 0
        }
      />
      <ListRow
        title={`${guestStats.confirmed} ${guestStats.confirmed === 1 ? "registro confirmado" : "registros confirmados"}`}
        subtitle={`${guestStats.pending} aguardando · ${guestStats.declined} não irão
${guestStats.records} registros · ${guestStats.people} pessoas representadas`}
        onPress={() => router.push("/convidados")}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },
  center: { textAlign: "center" },
  green: { color: colors.primary },
  priority: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
