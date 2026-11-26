import { useMutation, useQuery } from "@tanstack/react-query"
import { useRef, useState } from "react"
import type { FormEvent } from "react"
import { accountingPolicyKeys } from "@/features/accounting/policies/logic"
import type { AccountingPolicy, PolicyLiabilityDraft, PolicyLiabilityInput } from "@/features/accounting/policies/model"
import { duplicatePolicyLiability, getPolicyLiabilityOptions, previewPolicyLiability } from "@/features/accounting/policies/services/accounting-policy-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function AccountingPolicyLiabilityDialog({ policy, onClose, onSaved }: {
  policy: AccountingPolicy
  onClose: () => void
  onSaved: (policy: AccountingPolicy) => void
}) {
  const options = useQuery({
    queryKey: [...accountingPolicyKeys.detail(policy.id), "duplicate-liability"],
    queryFn: ({ signal }) => getPolicyLiabilityOptions(policy.id, signal),
    staleTime: 0,
  })
  const draft = useRef<PolicyLiabilityDraft | null>(null)
  const confirmation = useRef<PolicyLiabilityInput | null>(null)
  const inFlight = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const review = useMutation({
    mutationFn: (input: PolicyLiabilityDraft) => previewPolicyLiability(policy.id, input),
    onSettled: () => { inFlight.current = false },
  })
  const save = useMutation({
    mutationFn: (input: PolicyLiabilityInput) => duplicatePolicyLiability(policy.id, input),
    onSuccess: onSaved,
    onSettled: () => { inFlight.current = false },
  })
  const busy = review.isPending || save.isPending
  const close = () => { if (!inFlight.current) onClose() }
  const error = options.error ?? review.error ?? save.error
  const preview = review.data

  function edit() {
    draft.current = null
    confirmation.current = null
    setFormError(null)
    review.reset()
    save.reset()
  }

  function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const fields = new FormData(event.currentTarget)
    const amount = String(fields.get("amount"))
    const supplierCode = String(fields.get("supplierCode")).trim()
    const reference = String(fields.get("reference")).trim()
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(amount) || !supplierCode || !reference) {
      setFormError("Captura monto con hasta dos decimales, proveedor y referencia.")
      return
    }
    const input = { date: String(fields.get("date")), amount: Number(amount.replace(",", ".")), supplierCode, reference }
    if (input.amount <= 0 || input.amount > 999_999_999.99) {
      setFormError("Captura un monto mayor que cero y hasta 999,999,999.99.")
      return
    }
    setFormError(null)
    save.reset()
    draft.current = input
    inFlight.current = true
    review.mutate(input)
  }

  function confirm() {
    if (inFlight.current || !draft.current || !preview?.canConfirm) return
    if (confirmation.current?.revision !== preview.revision) {
      confirmation.current = { ...draft.current, revision: preview.revision, requestKey: crypto.randomUUID(), confirmed: true }
    }
    inFlight.current = true
    save.mutate(confirmation.current)
  }

  return (
    <ErpDataDialog defaultWidth={600} description={`Duplicar el pasivo de la póliza ${policy.number}`}
      onOpenChange={open => { if (!open) close() }} title="Duplicar pasivo">
      <ErpDataDialogBody className="grid gap-2 text-xs">
        <ErpDataMetric label="Póliza original" value={policy.number} />
        {options.isFetching && <p className="flex items-center gap-1" role="status"><Spinner /> Consultando póliza…</p>}
        {(error || formError) && <Alert variant="destructive"><AlertDescription>{formError ?? getApiErrorMessage(error)}</AlertDescription></Alert>}
        {options.data?.reason && <Alert><AlertDescription>{options.data.reason}</AlertDescription></Alert>}
        {options.data && !options.data.reason && !options.isError && (
          <form className="grid gap-2" onChange={edit} onSubmit={inspect}>
            <fieldset className="grid grid-cols-2 gap-2" disabled={busy}>
              <Label className="grid gap-1">Fecha
                <Input className="h-7" defaultValue={options.data.date} max={options.data.fiscalEnd ?? undefined}
                  min={options.data.fiscalStart ?? undefined} name="date" required type="date" />
              </Label>
              <Label className="grid gap-1">Monto
                <Input className="h-7" inputMode="decimal" maxLength={13} name="amount" required />
              </Label>
              <Label className="grid gap-1">Proveedor
                <Input className="h-7" maxLength={12} name="supplierCode" required />
              </Label>
              <Label className="grid gap-1">Referencia
                <Input className="h-7" maxLength={20} name="reference" required />
              </Label>
            </fieldset>
            <div className="flex justify-end">
              <Button disabled={busy} size="xs" type="submit" variant="outline">
                {review.isPending && <Spinner />} Revisar pasivo
              </Button>
            </div>
          </form>
        )}
        {preview && <>
          {preview.reason && <Alert variant="destructive"><AlertDescription>{preview.reason}</AlertDescription></Alert>}
          <div className="grid grid-cols-2 gap-2">
            <ErpDataMetric label="Proveedor" value={`${preview.payable.supplier.code} · ${preview.payable.supplier.name}`} />
            <ErpDataMetric label="Vencimiento" value={preview.payable.dueDate} />
            <ErpDataMetric label="Moneda" value={preview.payable.supplier.currency === 2 ? "USD" : "MXN"} />
            <ErpDataMetric label="Tipo de cambio" value={String(preview.payable.supplier.exchangeRate)} />
            <ErpDataMetric label="Subtotal" value={money.format(preview.payable.subtotal)} />
            <ErpDataMetric label="IVA" value={money.format(preview.payable.tax)} />
            <ErpDataMetric label="Total del pasivo" value={money.format(preview.payable.amount)} />
          </div>
          <div className="max-h-52 overflow-auto">
            <table aria-label="Partidas del pasivo" className="w-full">
              <thead className="sticky top-0 bg-background">
                <tr><th className="text-left">Cuenta</th><th className="text-right">Cargos</th><th className="text-right">Abonos</th></tr>
              </thead>
              <tbody>{preview.lines.map((line, index) => (
                <tr className="border-t" key={index}>
                  <td>{line.accountCode} {line.name}</td>
                  <td className="text-right tabular-nums">{money.format(line.debit)}</td>
                  <td className="text-right tabular-nums">{money.format(line.credit)}</td>
                </tr>
              ))}</tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <th scope="row" className="text-left">Totales</th>
                  <td className="text-right tabular-nums">{money.format(preview.totals.debit)}</td>
                  <td className="text-right tabular-nums">{money.format(preview.totals.credit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>}
        <footer className="flex justify-end gap-1">
          <Button disabled={busy} onClick={close} size="xs" type="button" variant="outline">Cerrar</Button>
          {preview && <Button disabled={busy || !preview.canConfirm || options.isError} onClick={confirm} size="xs" type="button">
            {save.isPending && <Spinner />} Confirmar duplicación
          </Button>}
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
