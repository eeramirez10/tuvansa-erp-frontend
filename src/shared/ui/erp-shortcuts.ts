import { useDesktopWindowStore } from "./desktop-window-store"

export function isTypingOrInDialog(event: KeyboardEvent) {
  const target = event.target
  return (target instanceof Element && Boolean(target.closest(
    "input, textarea, select, [contenteditable], [role=dialog], [role=alertdialog], [role=menu], [role=listbox]",
  ))) || useDesktopWindowStore.getState().windows.some(window => !window.minimized)
}
