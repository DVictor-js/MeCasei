import { useVendorViewModel } from "@/features/finances/viewmodel/useVendorViewModel";
import { optionLabel, vendorStatuses } from "@/core/theme/options";
import { router } from "expo-router";
import type { PlanningSnapshot } from "@/features/home/model/planningSnapshot";
import type { Vendor } from "@/shared/types/models";
import {
  AppText,
  SectionHeader,
  ListRow,
  Button,
  MoneyText,
  Badge,
  layout,
} from "@/shared/components/ui";
import { View } from "react-native";
import { centsToBRL } from "@/shared/utils/money";
import { formatDate, formatDateTime } from "@/shared/utils/dates";
export function VendorSummary({
  data,
  vendor,
}: {
  data: PlanningSnapshot;
  vendor: Vendor;
}) {
  const { payments, paid, pending, balance, next } = useVendorViewModel(data, vendor);
  return (
    <>
      <Badge
        label={optionLabel(vendorStatuses, vendor.status)}
        tone={vendor.status === "contracted" ? "success" : "neutral"}
      />
      <AppText muted>
        {data.categories.find((c) => c.id === vendor.budget_category_id)
          ?.name ?? vendor.category}
      </AppText>
      {vendor.contact && <AppText>{vendor.contact}</AppText>}
      <View style={layout.soft}>
        <AppText muted variant="caption">
          {vendor.status === "contracted"
            ? "Valor contratado"
            : "Valor informado"}
        </AppText>
        <MoneyText cents={vendor.total_cost_cents} />
        <AppText>Pago · {centsToBRL(paid)}</AppText>
        <AppText>
          {balance >= 0 ? "Saldo a pagar" : "Pago acima do valor"} ·{" "}
          {centsToBRL(Math.abs(balance))}
        </AppText>
        {pending[0] && (
          <AppText variant="bodySmall">
            Próximo pagamento: {formatDate(pending[0].due_date, true)} ·{" "}
            {centsToBRL(pending[0].amount_cents)}
          </AppText>
        )}
      </View>
      <SectionHeader title="Pagamentos deste fornecedor" />
      {payments.map((p) => (
        <ListRow
          key={p.id}
          title={p.title}
          subtitle={`${centsToBRL(p.amount_cents)} · ${p.status === "paid" ? "Pago" : formatDate(p.due_date, true)}`}
          onPress={() =>
            router.push({ pathname: "/payments/[id]", params: { id: p.id } })
          }
        />
      ))}
      <Button
        secondary
        title="Adicionar pagamento"
        onPress={() =>
          router.push({
            pathname: "/payments/new",
            params: { vendorId: vendor.id },
          })
        }
      />
      {next && (
        <ListRow
          title={next.title}
          subtitle={formatDateTime(next.appointment_date)}
          onPress={() =>
            router.push({
              pathname: "/appointments/[id]",
              params: { id: next.id },
            })
          }
        />
      )}
      <Button
        secondary
        title="Criar compromisso"
        onPress={() =>
          router.push({
            pathname: "/appointments/new",
            params: { vendorId: vendor.id },
          })
        }
      />
    </>
  );
}
