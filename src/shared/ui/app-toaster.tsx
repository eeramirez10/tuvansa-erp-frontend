import { Toaster } from "sonner"

export function AppToaster() {
  return (
    <Toaster
      closeButton
      expand
      position="bottom-right"
      richColors
      theme="system"
      toastOptions={{
        duration: 5_000,
        classNames: {
          toast: "[font-family:Tahoma,'Segoe_UI',sans-serif] text-[11px]",
          description: "text-[10px]",
        },
      }}
      visibleToasts={5}
    />
  )
}
