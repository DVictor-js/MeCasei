import { useState } from "react";
import { usePlanningData } from "@/shared/viewmodel/usePlanningData";
export function useGuestsViewModel() {
  const state = usePlanningData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const guests = (state.data?.guests ?? []).filter(g =>
    (filter === "all" || g.rsvp_status === filter) &&
    g.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name,"pt-BR"));
  return { ...state, loading: !state.data, query, setQuery, filter, setFilter, guests };
}
