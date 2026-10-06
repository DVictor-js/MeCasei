import { router } from "expo-router";
import {
  Screen,
  AppHeader,
  AppText,
  Button,
  ProgressBar,
  ErrorMessage,
  SectionHeader,
} from "@/shared/components/ui";
import { Field } from "@/shared/components/fields";
import { formatDate } from "@/shared/utils/dates";
import { centsToBRL } from "@/shared/utils/money";
import { useWeddingViewModel, type WeddingStep } from "@/features/wedding/viewmodel/useWeddingViewModel";
export function WeddingForm({ step }: { step: WeddingStep }) {
  const { wedding, action, first, setFirst, second, setSecond, date, setDate, city, setCity, guests, setGuests, budget, setBudget, edit, index, title, submit } = useWeddingViewModel(step);
  return (
    <Screen>
      <AppHeader
        title={title}
        subtitle={edit ? "NOSSO CASAMENTO" : `${index} DE 4 · PRIMEIROS PASSOS`}
        back
      />
      {!edit && <ProgressBar value={index / 4} />}
      {(step === "couple" || edit) && (
        <>
          <Field required label="Seu nome" value={first} onChange={setFirst} />
          <Field
            required
            label="Nome do seu par"
            value={second}
            onChange={setSecond}
          />
        </>
      )}
      {(step === "day" || edit) && (
        <>
          <Field
            required
            label="Data do casamento"
            placeholder="DD/MM/AAAA"
            keyboard="numbers-and-punctuation"
            value={date}
            onChange={setDate}
          />
          <Field required label="Cidade" value={city} onChange={setCity} />
        </>
      )}
      {(step === "plan" || edit) && (
        <>
          <Field
            required
            label="Estimativa de pessoas"
            keyboard="number-pad"
            value={guests}
            onChange={setGuests}
          />
          <Field
            required
            label="Orçamento total aproximado (R$)"
            placeholder="60.000,00"
            keyboard="decimal-pad"
            value={budget}
            onChange={setBudget}
          />
          <AppText muted variant="bodySmall">
            Vocês poderão ajustar esses números depois.
          </AppText>
        </>
      )}
      {step === "summary" && wedding && (
        <>
          <AppText variant="display">
            {wedding.partner_one_name} & {wedding.partner_two_name}
          </AppText>
          <AppText>{formatDate(wedding.wedding_date)}</AppText>
          <AppText muted>{wedding.city}</AppText>
          <SectionHeader title="O que vocês imaginaram" />
          <AppText>{wedding.guest_target} pessoas previstas</AppText>
          <AppText>
            {centsToBRL(wedding.budget_target_cents)} de orçamento
          </AppText>
          <AppText muted>
            Vamos organizar 12 primeiros passos com prazos até o casamento.
            Vocês poderão ajustar cada um.
          </AppText>
        </>
      )}
      <ErrorMessage message={action.error} />
      <Button
        title={
          action.busy
            ? "Salvando…"
            : edit
              ? "Salvar alterações"
              : step === "summary"
                ? "Começar a planejar"
                : "Continuar"
        }
        disabled={action.busy}
        onPress={() => void submit(destination => { if (destination === "back") router.back(); else if (destination === "/") router.replace("/"); else router.push(destination); })}
      />
      <Button
        secondary
        title="Cancelar"
        disabled={action.busy}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/onboarding")
        }
      />
    </Screen>
  );
}
