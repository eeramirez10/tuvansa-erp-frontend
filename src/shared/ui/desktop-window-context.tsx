import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react"

import {
  selectRestoreDesktopWindow,
  useDesktopWindowStore,
} from "@/shared/ui/desktop-window-store"

const DesktopWindowIdContext = createContext<string | null>(null)

export function DesktopWindowIdentity({
  id,
  children,
}: PropsWithChildren<{ id: string }>) {
  return (
    <DesktopWindowIdContext.Provider value={id}>
      {children}
    </DesktopWindowIdContext.Provider>
  )
}

export function useDesktopWindowId(fallbackId: string) {
  return useContext(DesktopWindowIdContext) ?? fallbackId
}

type WindowCollectionEntry<T> = {
  id: string
  payload: T
}

export function useDesktopWindowCollection<T>() {
  const [windows, setWindows] = useState<WindowCollectionEntry<T>[]>([])
  const restoreWindow = useDesktopWindowStore(selectRestoreDesktopWindow)

  const openWindow = useCallback(
    (id: string, payload: T) => {
      restoreWindow(id)
      setWindows((current) =>
        current.some((window) => window.id === id)
          ? current
          : [...current, { id, payload }],
      )
    },
    [restoreWindow],
  )

  const closeWindow = useCallback((id: string) => {
    setWindows((current) => current.filter((window) => window.id !== id))
  }, [])

  return useMemo(
    () => ({ windows, openWindow, closeWindow }),
    [closeWindow, openWindow, windows],
  )
}

