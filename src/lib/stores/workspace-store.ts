import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  activeWorkspace: string | null; // tenant slug or "africs"
  setActiveWorkspace: (workspace: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspace: null,
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
    }),
    { name: "africs-workspace" }
  )
);
