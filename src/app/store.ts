import { create } from "zustand"

type AppState = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))

export const selectSidebarOpen = (state: AppState) => state.sidebarOpen
export const selectSetSidebarOpen = (state: AppState) => state.setSidebarOpen
