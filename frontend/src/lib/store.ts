import { create } from "zustand";

type OperationFilter = "all" | "inbound" | "outbound";
type HorizonFilter = "now" | "2h" | "6h" | "12h" | "24h";

interface FilterState {
  operation: OperationFilter;
  horizon: HorizonFilter;
  setOperation: (operation: OperationFilter) => void;
  setHorizon: (horizon: HorizonFilter) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  operation: "all",
  horizon: "now",
  setOperation: (operation) => set({ operation }),
  setHorizon: (horizon) => set({ horizon }),
}));
