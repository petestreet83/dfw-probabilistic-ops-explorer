import { create } from "zustand";

interface CommandCenterState {
  selectedNodeId: string | null;
  selectedCommunityId: string | null;
  selectedQueryId: string;
  searchTerm: string;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedCommunityId: (communityId: string | null) => void;
  setSelectedQueryId: (queryId: string) => void;
  setSearchTerm: (value: string) => void;
  resetSelections: () => void;
}

export const useCommandCenterStore = create<CommandCenterState>((set) => ({
  selectedNodeId: null,
  selectedCommunityId: null,
  selectedQueryId: "q1",
  searchTerm: "",
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSelectedCommunityId: (selectedCommunityId) => set({ selectedCommunityId }),
  setSelectedQueryId: (selectedQueryId) => set({ selectedQueryId }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  resetSelections: () =>
    set({
      selectedNodeId: null,
      selectedCommunityId: null,
      selectedQueryId: "q1",
      searchTerm: "",
    }),
}));
