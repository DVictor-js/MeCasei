import { useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useWedding } from "@/features/wedding/model/WeddingProvider";
import { useAction } from "@/shared/viewmodel/useAction";
import {
  completeOnboarding,
  saveWedding,
  saveWeddingDraft,
  type WeddingInput,
} from "@/features/wedding/model/weddingService";
import { dateInput, parseDateInput } from "@/shared/utils/dates";
import { inputToCents, centsToBRL } from "@/shared/utils/money";
import { required } from "@/shared/models/validation";
export type WeddingStep = "couple" | "day" | "plan" | "summary" | "edit";
const titles = {
  couple: "Como podemos chamar vocês?",
  day: "O grande dia",
  plan: "O tamanho do sonho",
  summary: "O começo de um plano a dois",
  edit: "Dados do casamento",
};
export function useWeddingViewModel(step: WeddingStep) {
  const { wedding, refresh } = useWedding();
  const db = useSQLiteContext();
  const action = useAction();
  const [first, setFirst] = useState(wedding?.partner_one_name ?? "");
  const [second, setSecond] = useState(wedding?.partner_two_name ?? "");
  const [date, setDate] = useState(dateInput(wedding?.wedding_date));
  const [city, setCity] = useState(wedding?.city ?? "");
  const [guests, setGuests] = useState(wedding?.guest_target?.toString() ?? "");
  const [budget, setBudget] = useState(
    wedding?.budget_target_cents ? centsToBRL(wedding.budget_target_cents) : "",
  );
  const edit = step === "edit";
  const index = ["couple", "day", "plan", "summary"].indexOf(step) + 1;
  async function submit(onSaved: (destination: "back" | "/" | "/onboarding/casamento" | "/onboarding/planejamento" | "/onboarding/finalizar") => void) {
    await action.run(
      async () => {
        const patch: Partial<WeddingInput> = {};
        if (step === "couple" || edit) {
          patch.partner_one_name = required(first, "Seu nome");
          patch.partner_two_name = required(second, "Nome do seu par");
        }
        if (step === "day" || edit) {
          const parsed = parseDateInput(date);
          if (!parsed) throw new Error("Use uma data válida: DD/MM/AAAA.");
          patch.wedding_date = parsed;
          patch.city = required(city, "Cidade");
        }
        if (step === "plan" || edit) {
          if (!/^\d+$/.test(guests.trim()))
            throw new Error("Informe a estimativa de pessoas.");
          patch.guest_target = Number(guests);
          const cents = inputToCents(budget);
          if (cents === null)
            throw new Error("Informe o orçamento, por exemplo 60.000,00.");
          patch.budget_target_cents = cents;
        }
        if (step === "summary") {
          if (!wedding) throw new Error("Volte e preencha os dados do casal.");
          await completeOnboarding(db, wedding);
          await refresh();
          onSaved("/");
        } else if (edit) {
          await saveWedding(db, patch as WeddingInput);
          await refresh();
          onSaved("back");
        } else {
          await saveWeddingDraft(db, patch);
          await refresh();
          onSaved(
            step === "couple"
              ? "/onboarding/casamento"
              : step === "day"
                ? "/onboarding/planejamento"
                : "/onboarding/finalizar",
          );
        }
      },
      edit
        ? "Dados do casamento atualizados."
        : step === "summary"
          ? "Seu planejamento está pronto."
          : "",
    );
  }
  return { wedding, action, first, setFirst, second, setSecond, date, setDate, city, setCity, guests, setGuests, budget, setBudget, edit, index, title: titles[step], submit };
}
