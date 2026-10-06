import { useState } from "react";
import { usePlanningData } from "@/shared/viewmodel/usePlanningData";
import type { Table } from "@/core/database/repository";
import { recordsFor } from "@/shared/models/recordLists";
import { titleOf, detailOf, sortDate } from "@/shared/models/collectionPresentation";
export function useCollectionViewModel(kind: Table) {
  const state=usePlanningData();
  const [query,setQuery]=useState("");
  const rows = (state.data ? recordsFor(state.data,kind) : [])
    .filter(r => titleOf(r).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .sort((a,b) => sortDate(a).localeCompare(sortDate(b),"pt-BR"))
    .map(r => ({id:r.id,title:titleOf(r),subtitle:detailOf(r)}));
  return {...state,loading:!state.data,query,setQuery,rows};
}
