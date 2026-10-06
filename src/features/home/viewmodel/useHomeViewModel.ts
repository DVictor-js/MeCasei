import { usePlanningData } from "@/shared/viewmodel/usePlanningData";
import { homePriorities, upcomingAppointments } from "@/features/home/model/planningSnapshot";
import { countdown } from "@/shared/utils/dates";
export function useHomeViewModel() {
  const state = usePlanningData();
  const data = state.data;
  const done = data?.tasks.filter(t => t.status === "completed").length ?? 0;
  const hour = new Date().getHours();
  return { ...state, loading: !data, done,
    progress: data?.tasks.length ? done / data.tasks.length : 0,
    priorities: data ? homePriorities(data) : [],
    next: data ? upcomingAppointments(data)[0] : undefined,
    greeting: hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite",
    countdownText: data?.wedding.wedding_date ? countdown(data.wedding.wedding_date) : "Um dia para celebrar",
  };
}
