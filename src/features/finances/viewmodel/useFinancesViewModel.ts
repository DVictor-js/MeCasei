import { usePlanningData } from "@/shared/viewmodel/usePlanningData";
import { pendingPayments } from "@/features/home/model/planningSnapshot";
export function useFinancesViewModel() {
  const state = usePlanningData();
  const data = state.data;
  const target = data?.wedding.budget_target_cents ?? 0;
  const contracted = data?.finance.contracted_cents ?? 0;
  const categoryRows = (data?.categories ?? []).map(c => ({ c, contracted:
    (data?.vendors ?? []).filter(v => v.budget_category_id === c.id && v.status === "contracted")
      .reduce((sum,v) => sum + v.total_cost_cents,0) }));
  return { ...state, loading: !data, target, progress: target ? contracted / target : 0,
    overBudget: Math.max(0, contracted-target), categoryRows,
    next: data ? pendingPayments(data).slice(0,3) : [] };
}
