import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"
import { PurchaseOrderSupplierChangeDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-supplier-change-dialog"
import { purchaseOrderAuthorizationQueryOptions, purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderAuthorization, PurchaseOrderAuthorizationDirection, PurchaseOrderAuthorizationLevel } from "@/features/purchasing/purchase-orders/model"
import { authorizePurchaseOrder } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

type Change = {
  level: PurchaseOrderAuthorizationLevel
  direction: PurchaseOrderAuthorizationDirection
  state: PurchaseOrderAuthorization
}

const levels: readonly PurchaseOrderAuthorizationLevel[] = ["A", "B", "C", "D", "E", "F"]

export function PurchaseOrderAuthorizationDialog({ purchaseOrder, onClose }: {
  purchaseOrder: PurchaseOrder
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { id, number } = purchaseOrder
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const key = useRef("")
  const [revoke, setRevoke] = useState(false)
  const [message, setMessage] = useState("")
  const supplierWindows = useDesktopWindowCollection<PurchaseOrderAuthorization>()
  const query = useQuery(purchaseOrderAuthorizationQueryOptions(id))
  const state = query.data

  async function refreshOrder(order: PurchaseOrder) {
    const detail = purchaseOrderKeys.detail(id)
    await queryClient.cancelQueries({ queryKey: detail })
    queryClient.setQueryData(detail, order)
    await queryClient.invalidateQueries({ queryKey: detail, predicate: (entry) => entry.queryKey.length > detail.length })
    void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
  }

  const write = useMutation({
    networkMode: "always",
    mutationFn: (change: Change) => {
      const credential = key.current
      key.current = ""
      return authorizePurchaseOrder(id, change.level, change.direction, change.state, credential)
        .catch((error: unknown) => { throw new Error(getApiErrorMessage(error)) })
    },
    onSuccess: async (order, change) => {
      await refreshOrder(order)
      setRevoke(false)
      setMessage(change.direction === "approve" ? `Nivel ${change.level} autorizado.` : `Nivel ${change.level} desautorizado.`)
    },
  })

  function sign(level: PurchaseOrderAuthorizationLevel, direction: PurchaseOrderAuthorizationDirection) {
    if (!state?.canWrite || query.isFetching || write.isPending) return
    const option = state.options.find((item) => item.level === level)
    const allowed = direction === "approve" ? option?.canApprove : option?.canRevoke
    write.reset()
    if (!allowed) {
      setMessage(direction === "revoke" ? "El estado actual no permite desautorizar este nivel."
        : "Usa Shift + clic o activa Desautorizar para revertir este nivel.")
      return
    }
    const value = input.current?.value.trim() ?? ""
    if (!/^[0-9a-f]{64}$/i.test(value)) {
      setMessage("Ingresa una clave de autorización válida.")
      input.current?.focus()
      return
    }
    setMessage("")
    key.current = value
    if (input.current) input.current.value = ""
    write.mutate({ level, direction, state })
  }

  const ready = state?.canWrite && !query.isFetching && !query.isError
  const error = write.isError ? getApiErrorMessage(write.error) : query.isError ? getApiErrorMessage(query.error) : ""
  return <>
    <ErpDataDialog defaultWidth={605} title="Autoriza O.C." description={number}
      onOpenChange={(open) => { if (!open && !write.isPending) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        <div onKeyDown={(event) => {
          if (event.key === "Escape" && !write.isPending) {
            event.preventDefault()
            event.stopPropagation()
            onClose()
          }
        }} className="grid gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {levels.map((level) => {
              const option = state?.options.find((item) => item.level === level)
              const enabled = revoke ? option?.canRevoke : option?.canApprove || option?.canRevoke
              return <Button key={level} disabled={!ready || !enabled || write.isPending} size="sm"
                onClick={(event) => sign(level, revoke || event.shiftKey ? "revoke" : "approve")}
                title={option?.canRevoke ? `Shift + clic para desautorizar ${level}` : undefined}
                variant={state?.status === `9${level}` ? "default" : "outline"}>O.K. {level}</Button>
            })}
            <span title={state?.supplierChange?.reason || undefined}>
              <Button disabled={!state?.supplierChange?.canWrite || query.isFetching || query.isError || write.isPending}
                onClick={() => {
                  if (state?.supplierChange?.canWrite) supplierWindows.openWindow(`purchase-orders:${id}:authorization:supplier`, state)
                }} size="sm" variant="outline">Cambia proveedor</Button>
            </span>
            {(query.isFetching || write.isPending) && <Spinner />}
          </div>
          {state && <p className="text-muted-foreground">Orden {number} · Autorización {state.status === "9" ? "pendiente" : state.status || "pendiente"}</p>}
          {ready && <div className="flex flex-wrap items-center gap-1.5">
            <Label htmlFor={inputId}>Clave de autorización</Label>
            <Input autoComplete="off" className="h-6 min-w-36 max-w-52" disabled={write.isPending} id={inputId}
              maxLength={64} ref={input} spellCheck={false} type="password" />
            {state?.options.some((option) => option.canRevoke) && (
              <Button aria-pressed={revoke} disabled={write.isPending} onClick={() => { setMessage(""); setRevoke(!revoke) }}
                size="sm" variant={revoke ? "default" : "outline"}>Desautorizar</Button>
            )}
          </div>}
          {state && !state.canWrite && <Alert><AlertDescription>{state.reason}</AlertDescription></Alert>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {message && <p role="status">{message}</p>}
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
    {supplierWindows.windows.map(({ id: windowId, payload }) => (
      <DesktopWindowIdentity id={windowId} key={windowId}>
        <PurchaseOrderSupplierChangeDialog state={payload} onClose={() => supplierWindows.closeWindow(windowId)} onChange={(order) => {
          supplierWindows.closeWindow(windowId)
          void refreshOrder(order)
          void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
          setMessage(`Proveedor actualizado a ${order.supplier.code}.`)
        }} />
      </DesktopWindowIdentity>
    ))}
  </>
}
