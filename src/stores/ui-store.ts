import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  quickRecordOpen: boolean;
  quickRecordClientId: string | null;
  openQuickRecord: (clientId?: string | null) => void;
  closeQuickRecord: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  quickRecordOpen: false,
  quickRecordClientId: null,
  openQuickRecord: (clientId = null) => set({ quickRecordOpen: true, quickRecordClientId: clientId }),
  closeQuickRecord: () => set({ quickRecordOpen: false, quickRecordClientId: null }),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
