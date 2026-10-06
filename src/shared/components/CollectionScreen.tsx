import { useCollectionViewModel } from "@/shared/viewmodel/useCollectionViewModel";
import { router, type Href } from "expo-router";
import {
  Screen,
  AppHeader,
  AppText,
  Button,
  ListRow,
  EmptyState,
  LoadState,
  ErrorMessage,
} from "@/shared/components/ui";
import { Field } from "@/shared/components/fields";
import type { Table } from "@/core/database/repository";
import { entityMeta } from "@/shared/models/entityDefinitions";
const titles: Partial<Record<Table, string>> = {
  vendors: "Meus fornecedores",
  payments: "Pagamentos",
  guest_groups: "Grupos e famílias",
  wedding_events: "Eventos do casamento",
  appointments: "Compromissos",
};
export function CollectionScreen({ kind }: { kind: Table }) {
  const { data, error, reload, query, setQuery, rows } = useCollectionViewModel(kind);
  const meta = entityMeta[kind];
  if (!data)
    return (
      <Screen>
        <AppHeader title={titles[kind] ?? meta.title} back />
        <LoadState error={error} retry={() => void reload()} />
      </Screen>
    );
  return (
    <Screen>
      <AppHeader title={titles[kind] ?? meta.title} back />
      <Button
        title={`Adicionar ${meta.singular}`}
        onPress={() => router.push(`/${meta.route}/new` as Href)}
      />
      <Field label="Buscar" value={query} onChange={setQuery} />
      <ErrorMessage message={error} />
      {rows.length ? (
        rows.map((row) => (
          <ListRow
            key={row.id}
            title={row.title}
            subtitle={row.subtitle}
            onPress={() => router.push(`/${meta.route}/${row.id}` as Href)}
          />
        ))
      ) : (
        <EmptyState
          title={
            query ? "Vamos tentar outra busca?" : "Cada detalhe tem seu lugar."
          }
          description={
            query
              ? "Experimente outro nome."
              : kind === "guest_groups"
                ? "Reúna família, amigos e pessoas queridas em grupos."
                : kind === "vendors"
                  ? "Adicione os profissionais que vão ajudar a construir o grande dia."
                  : kind === "payments"
                    ? "Cadastre as parcelas para acompanhar os vencimentos."
                    : kind === "wedding_events"
                      ? "Cerimônia, recepção, brunch: organizem os momentos desse dia."
                      : "Planejem visitas, reuniões e degustações."
          }
        />
      )}
      <AppText muted variant="caption">
        {rows.length} {rows.length === 1 ? "item" : "itens"}
      </AppText>
    </Screen>
  );
}
