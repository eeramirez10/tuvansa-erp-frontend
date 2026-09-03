import { create } from "zustand"

export type DesktopWindowEntry = {
  id: string
  title: string
  minimized: boolean
  maximized: boolean
  zIndex: number
}

type DesktopWindowState = {
  windows: DesktopWindowEntry[]
  nextZIndex: number
  registerWindow: (id: string, title: string) => void
  unregisterWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  toggleMaximizeWindow: (id: string) => void
}

const initialZIndex = 100

export const useDesktopWindowStore = create<DesktopWindowState>()((set) => ({
  windows: [],
  nextZIndex: initialZIndex,
  registerWindow: (id, title) =>
    set((state) => {
      const existing = state.windows.find((window) => window.id === id)

      if (existing) {
        return {
          windows: state.windows.map((window) =>
            window.id === id ? { ...window, title } : window,
          ),
        }
      }

      return {
        nextZIndex: state.nextZIndex + 1,
        windows: [
          ...state.windows,
          {
            id,
            title,
            minimized: false,
            maximized: false,
            zIndex: state.nextZIndex,
          },
        ],
      }
    }),
  unregisterWindow: (id) =>
    set((state) => ({
      windows: state.windows.filter((window) => window.id !== id),
    })),
  focusWindow: (id) =>
    set((state) => {
      if (!state.windows.some((window) => window.id === id)) return state

      return {
        nextZIndex: state.nextZIndex + 1,
        windows: state.windows.map((window) =>
          window.id === id
            ? { ...window, minimized: false, zIndex: state.nextZIndex }
            : window,
        ),
      }
    }),
  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((window) =>
        window.id === id ? { ...window, minimized: true } : window,
      ),
    })),
  restoreWindow: (id) =>
    set((state) => {
      if (!state.windows.some((window) => window.id === id)) return state

      return {
        nextZIndex: state.nextZIndex + 1,
        windows: state.windows.map((window) =>
          window.id === id
            ? { ...window, minimized: false, zIndex: state.nextZIndex }
            : window,
        ),
      }
    }),
  toggleMaximizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((window) =>
        window.id === id
          ? { ...window, maximized: !window.maximized }
          : window,
      ),
    })),
}))

export const selectDesktopWindows = (state: DesktopWindowState) => state.windows
export const selectRegisterDesktopWindow = (state: DesktopWindowState) =>
  state.registerWindow
export const selectUnregisterDesktopWindow = (state: DesktopWindowState) =>
  state.unregisterWindow
export const selectFocusDesktopWindow = (state: DesktopWindowState) =>
  state.focusWindow
export const selectMinimizeDesktopWindow = (state: DesktopWindowState) =>
  state.minimizeWindow
export const selectRestoreDesktopWindow = (state: DesktopWindowState) =>
  state.restoreWindow
export const selectToggleMaximizeDesktopWindow = (state: DesktopWindowState) =>
  state.toggleMaximizeWindow

