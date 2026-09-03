import { create } from "zustand"
import { persist } from "zustand/middleware"

export type InterfaceSize = "original" | "large"

type AppState = {
  sidebarOpen: boolean
  interfaceSize: InterfaceSize
  setSidebarOpen: (open: boolean) => void
  toggleInterfaceSize: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      interfaceSize: "original",
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleInterfaceSize: () =>
        set((state) => ({
          interfaceSize:
            state.interfaceSize === "original" ? "large" : "original",
        })),
    }),
    {
      name: "tuvansa-erp-interface-preferences",
      partialize: (state) => ({ interfaceSize: state.interfaceSize }),
    },
  ),
)

export const selectSidebarOpen = (state: AppState) => state.sidebarOpen
export const selectSetSidebarOpen = (state: AppState) => state.setSidebarOpen
export const selectInterfaceSize = (state: AppState) => state.interfaceSize
export const selectToggleInterfaceSize = (state: AppState) =>
  state.toggleInterfaceSize
