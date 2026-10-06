import { useFinancesViewModel } from "@/features/finances/viewmodel/useFinancesViewModel";
import { View } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  AppHeader,
  AppText,
  Button,
  ProgressBar,
  SectionHeader,
  ListRow,
  MoneyText,
  EmptyState,
  LoadState,
  layout,
  ErrorMessage,
} from "@/shared/components/ui";
import { centsToBRL } from "@/shared/utils/money";
import { dueLabel } from "@/shared/utils/dates";
export default function Finance() {
  const { data, error, reload, target, next, categoryRows, progress, overBudget } = useFinancesViewModel();
  if (!data)
    return (
      <Screen>
        <AppHeader title="Finanças" />
        <LoadState error={error} retry={() => void reload()} />
      </Screen>
    );
  const f = data.finance, b = data.balances;
  return (
    <Screen>
      <AppHeader title="Finanças" subtitle="CLAREZA PARA ESCOLHER" />
      <View style={layout.soft}>
        <AppText variant="caption">ORÇAMENTO TOTAL</AppText>
        <AppText variant="headingLarge">{centsToBRL(target)}</AppText>
        <ProgressBar value={progress} />
        <AppText>{centsToBRL(f.contracted_cents)} contratados</AppText>
        <AppText>{centsToBRL(f.paid_cents)} pagos</AppText>
        {overBudget > 0 && (
          <AppText variant="bodySmall">
            Contratos {centsToBRL(overBudget)} acima do
            orçamento.
          </AppText>
        )}
      </View>
      <View style={layout.row}>
        <View style={layout.metric}>
          <AppText variant="caption" muted>
            {b.balance_cents >= 0
              ? "SALDO TOTAL A PAGAR"
              : "PAGO ACIMA DO CONTRATADO"}
          </AppText>
          <MoneyText cents={Math.abs(b.balance_cents)} />
        </View>
        <View style={layout.metric}>
          <AppText variant="caption" muted>
            PARCELAS PENDENTES CADASTRADAS
          </AppText>
          <MoneyText cents={f.pending_cents} />
        </View>
      </View>
      {b.unscheduled_cents > 0 && (
        <AppText variant="bodySmall" muted>
          {centsToBRL(b.unscheduled_cents)} do saldo ainda sem parcelas
          cadastradas.
        </AppText>
      )}
      <Button
        secondary
        title="Editar orçamento total"
        onPress={() => router.push("/wedding")}
      />
      <ErrorMessage message={error} />
      <SectionHeader
        title="Por categoria"
        detail={`${data.categories.length} categorias`}
      />
      <AppText variant="bodySmall" muted>
        {centsToBRL(f.planned_cents)} distribuídos
      </AppText>
      <AppText variant="bodySmall">
        {b.undistributed_cents > 0
          ? `${centsToBRL(b.undistributed_cents)} ainda não distribuídos`
          : b.undistributed_cents < 0
            ? `Planejamento por categorias está ${centsToBRL(-b.undistributed_cents)} acima do orçamento.`
            : "Todo o orçamento foi distribuído."}
      </AppText>
      {categoryRows.map(({ c, contracted }) => {
        return (
          <ListRow
            key={c.id}
            title={c.name}
            subtitle={`${centsToBRL(contracted)} contratado · ${centsToBRL(c.planned_cents)} planejado`}
            onPress={() =>
              router.push({ pathname: "/budget/[id]", params: { id: c.id } })
            }
          />
        );
      })}
      <Button
        secondary
        title="Adicionar categoria"
        onPress={() => router.push("/budget/new")}
      />
      <SectionHeader title="Próximos pagamentos" />
      {next.length ? (
        next.map((p) => (
          <ListRow
            key={p.id}
            title={p.title}
            subtitle={`${dueLabel(p.due_date)} · ${centsToBRL(p.amount_cents)}`}
            onPress={() =>
              router.push({ pathname: "/payments/[id]", params: { id: p.id } })
            }
          />
        ))
      ) : (
        <EmptyState
          title="Um espaço para os próximos vencimentos"
          description="Quando vocês criarem parcelas, elas aparecerão aqui."
        />
      )}
      <Button
        title="Adicionar pagamento"
        onPress={() => router.push("/payments/new")}
      />
      <ListRow
        title="Todos os pagamentos"
        subtitle="Pagos e pendentes"
        onPress={() => router.push("/payments")}
      />
      <SectionHeader title="Meus fornecedores" />
      {data.vendors.length ? (
        data.vendors
          .slice(0, 3)
          .map((v) => (
            <ListRow
              key={v.id}
              title={v.name}
              subtitle={`${v.category} · ${centsToBRL(v.total_cost_cents)}`}
              onPress={() =>
                router.push({ pathname: "/vendors/[id]", params: { id: v.id } })
              }
            />
          ))
      ) : (
        <EmptyState
          title="Quem vai fazer acontecer?"
          description="Adicione os profissionais que vão ajudar a construir o grande dia."
        />
      )}
      <Button
        secondary
        title="Adicionar fornecedor"
        onPress={() => router.push("/vendors/new")}
      />
      <ListRow
        title="Ver todos os fornecedores"
        onPress={() => router.push("/vendors")}
      />
    </Screen>
  );
}
