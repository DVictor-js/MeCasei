import { useGuestsViewModel } from "@/features/guests/viewmodel/useGuestsViewModel";
import { View } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  AppHeader,
  AppText,
  Button,
  ListRow,
  EmptyState,
  LoadState,
  SectionHeader,
  layout,
  ErrorMessage,
} from "@/shared/components/ui";
import { Chips, Field } from "@/shared/components/fields";
import { rsvp, optionLabel } from "@/core/theme/options";
const filters = [
  { value: "all", label: "Todos" },
  { value: "confirmed", label: "Confirmados" },
  { value: "pending", label: "Aguardando" },
  { value: "declined", label: "Não irão" },
];
export default function Guests() {
  const { data, error, reload, query, setQuery, filter, setFilter, guests } = useGuestsViewModel();
  if (!data)
    return (
      <Screen>
        <AppHeader title="Convidados" />
        <LoadState error={error} retry={() => void reload()} />
      </Screen>
    );
  const stats = data.guestStats;
  return (
    <Screen>
      <AppHeader title="Convidados" subtitle="QUEM FAZ PARTE DA HISTÓRIA" />
      <AppText variant="heading">
        {data.wedding.guest_target} pessoas previstas
      </AppText>
      <View style={layout.soft}>
        <AppText variant="caption" muted>
          RSVP POR REGISTRO
        </AppText>
        <View style={layout.row}>
          {[
            [stats.confirmed, "Confirmados"],
            [stats.pending, "Aguardando"],
            [stats.declined, "Não irão"],
            [stats.records, "Cadastrados"],
          ].map(([n, label]) => (
            <View key={label} style={layout.metric}>
              <AppText variant="heading">{n}</AppText>
              <AppText variant="caption" muted>
                {label}
              </AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" muted>
          {stats.people} pessoas representadas, incluindo acompanhantes.
        </AppText>
      </View>
      <Button
        title={
          stats.records ? "Adicionar convidado" : "Adicionar primeiro convidado"
        }
        onPress={() => router.push("/guests/new")}
      />
      <ListRow
        title="Grupos e famílias"
        subtitle={`${data.groups.length} grupos`}
        icon="people-outline"
        onPress={() => router.push("/groups")}
      />
      <Field
        label="Buscar convidado"
        value={query}
        onChange={setQuery}
        placeholder="Nome"
      />
      <Chips options={filters} value={filter} onChange={setFilter} />
      <ErrorMessage message={error} />
      {!data.guests.length ? (
        <EmptyState
          title="Sua lista começa aqui."
          description="Adicione as pessoas que vocês querem por perto nesse dia."
        />
      ) : !guests.length ? (
        <EmptyState
          title="Vamos tentar outra busca?"
          description="Altere o nome ou o filtro para encontrar alguém."
        />
      ) : (
        <>
          <SectionHeader
            title="Nossa lista"
            detail={`${guests.length} registros`}
          />
          {guests.map((g) => (
            <ListRow
              key={g.id}
              title={g.name}
              subtitle={`${optionLabel(rsvp, g.rsvp_status)}${g.group_id ? " · " + (data.groups.find((group) => group.id === g.group_id)?.name ?? "") : ""}${g.companion_count ? ` · +${g.companion_count} acompanhantes` : ""}`}
              onPress={() =>
                router.push({ pathname: "/guests/[id]", params: { id: g.id } })
              }
            />
          ))}
        </>
      )}
    </Screen>
  );
}
