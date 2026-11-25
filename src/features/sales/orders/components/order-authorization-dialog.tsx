import { useMutation } from "@tanstack/react-query"
import { useId, useRef, useState, type FormEvent } from "react"
import type { Order } from "@/features/sales/orders/model"
import { setOrderAuthorization } from "@/features/sales/orders/services/order-capture-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

export function OrderAuthorizationDialog({ order, onClose, onSaved }: {
  order: Order
  onClose: () => void
  onSaved: (order: Order) => void
}) {
  const authorized = order.authorization !== "O.K."
  const action = authorized ? "Autorizar" : "Desautorizar"
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const credential = useRef("")
  const inFlight = useRef(false)
  const [validation, setValidation] = useState("")
  const save = useMutation({
    networkMode: "always",
    retry: false,
    mutationFn: () => {
      const key = credential.current
      credential.current = ""
      return setOrderAuthorization(order.id, authorized, order.storage?.revision ?? 0, key)
        .catch((error: unknown) => { throw new Error(getApiErrorMessage(error)) })
    },
    onSuccess: onSaved,
    onSettled: () => { inFlight.current = false },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || !input.current) return
    const key = input.current.value.trim()
    if (!/^[a-f0-9]{64}$/i.test(key)) {
      setValidation("Ingresa una clave de autorización válida.")
      input.current.focus()
      return
    }
    setValidation("")
    inFlight.current = true
    credential.current = key
    input.current.value = ""
    save.mutate()
  }

  const error = validation || save.error?.message
  const dismiss = () => { if (!inFlight.current) onClose() }
  return (
    <ErpDataDialog defaultWidth={420} title={`${action} pedido`} description={order.number} tone="sales"
      onOpenChange={(open) => { if (!open) dismiss() }}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={submit}>
          <div className="grid gap-1">
            <Label htmlFor={inputId}>Clave de autorización</Label>
            <Input aria-invalid={Boolean(validation)} autoComplete="off" autoFocus disabled={save.isPending} id={inputId}
              maxLength={64} ref={input} spellCheck={false} type="password" />
          </div>
          {error && <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex justify-end gap-1">
            <Button disabled={save.isPending} onClick={dismiss} size="sm" type="button" variant="outline">Cancelar</Button>
            <Button disabled={save.isPending} size="sm" type="submit">{save.isPending && <Spinner />}{action}</Button>
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
