import { useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"

const moduleToolbarSlotId = "erp-module-toolbar-slot"

function subscribeToToolbarSlot(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  return () => observer.disconnect()
}

function getToolbarSlotSnapshot() {
  return document.getElementById(moduleToolbarSlotId)
}

function getServerToolbarSlotSnapshot() {
  return null
}

export function ErpModuleToolbarSlot() {
  return <div className="flex min-h-7 justify-end" id={moduleToolbarSlotId} />
}

type ErpModuleToolbarPortalProps = {
  children: ReactNode
}

export function ErpModuleToolbarPortal({
  children,
}: ErpModuleToolbarPortalProps) {
  const target = useSyncExternalStore(
    subscribeToToolbarSlot,
    getToolbarSlotSnapshot,
    getServerToolbarSlotSnapshot,
  )

  return target ? createPortal(children, target) : null
}
