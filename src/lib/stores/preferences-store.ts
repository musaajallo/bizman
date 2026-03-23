import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  sidebarTooltips: boolean;
  setSidebarTooltips: (enabled: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      sidebarTooltips: true,
      setSidebarTooltips: (enabled) => set({ sidebarTooltips: enabled }),
    }),
    { name: "africs-preferences" }
  )
);
