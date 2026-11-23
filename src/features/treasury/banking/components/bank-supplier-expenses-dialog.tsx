import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"
import { paths } from "@/app/router/paths"
import { supplierKeys } from "@/features/accounts-payable/suppliers/logic"
import type { SupplierPayment } from "@/features/accounts-payable/suppliers/model"
import { purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import { BankPanelTable } from "@/features/treasury/banking/components/bank-panel-table"
import { bankAccountKeys, bankMoney } from "@/features/treasury/banking/logic"
import type { BankAccount } from "@/features/treasury/banking/model"
import { apiClient } from "@/shared/api/api-client"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

type Receipt = {
  receiptId: number
  receiptNumber: string
  supplierId: number
  supplierCode: string
  supplierName: string
  remaining: number
  revision: number
  receivedAt: string
}
type Preview = { canWrite: boolean; reason: string | null; defaults: { date: string }; receipts: Receipt[] }
type Draft = { amount: number; date: string; description: string; receiptId: number; supplierId: number; revision: number }
const path = (id: number) => `/treasury/bank-accounts/${id}/actions/supplier-expenses`

function CheckForm({ receipt, date, pending, onSave, onCancel }: {
  receipt: Receipt
  date: string
  pending: boolean
  onSave: (value: Draft) => void
  onCancel: () => void
}) {
  const id = useId()
  const rule = z.object({
    amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Captura un importe válido.")
      .refine((value) => Number(value) > 0 && Number(value) <= receipt.remaining, "El importe debe estar dentro del saldo."),
    date: z.iso.date().refine((value) => value >= receipt.receivedAt.slice(0, 10), "La fecha debe ser posterior o igual a la recepción."),
    description: z.string().trim().max(90),
  })
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(rule),
    defaultValues: { amount: receipt.remaining.toFixed(2), date, description: "" },
  })
  return <form className="grid gap-2" onSubmit={handleSubmit((draft) => {
    onSave({ ...draft, amount: Number(draft.amount), receiptId: receipt.receiptId, supplierId: receipt.supplierId, revision: receipt.revision })
  })}>
    <div className="flex gap-2">
      <ErpDataMetric label="Documento" value={receipt.receiptNumber} />
      <ErpDataMetric label="Beneficiario" value={receipt.supplierName} />
      <ErpDataMetric label="Saldo" value={bankMoney(receipt.remaining)} />
    </div>
    <fieldset className="grid gap-1 sm:grid-cols-3" disabled={pending}>
      <div className="grid gap-1"><Label htmlFor={`${id}-date`}>Fecha</Label>
        <Input id={`${id}-date`} min={receipt.receivedAt.slice(0, 10)} type="date" {...register("date")} />
        {errors.date && <span className="text-destructive" role="alert">{errors.date.message}</span>}
      </div>
      <div className="grid gap-1"><Label htmlFor={`${id}-amount`}>Importe</Label>
        <Input id={`${id}-amount`} inputMode="decimal" {...register("amount")} />
        {errors.amount && <span className="text-destructive" role="alert">{errors.amount.message}</span>}
      </div>
      <div className="grid gap-1"><Label htmlFor={`${id}-description`}>Concepto</Label>
        <Input id={`${id}-description`} maxLength={90} {...register("description")} />
      </div>
    </fieldset>
    <div className="flex justify-end gap-1">
      <Button disabled={pending} onClick={onCancel} size="sm" type="button" variant="outline">Cancelar</Button>
      <Button disabled={pending} size="sm" type="submit">{pending && <Spinner />}OK</Button>
    </div>
  </form>
}

export function BankSupplierExpensesDialog({ account, onOpenChange }: { account: BankAccount; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [selected, setSelected] = useState<number | null>(null)
  const [filter, setFilter] = useState("")
  const keys = useRef(new Map<string, string>())
  const inFlight = useRef(false)
  const preview = useQuery({
    queryKey: [...bankAccountKeys.detail(account.id), "supplier-expenses", "capture"],
    queryFn: async ({ signal }) => (await apiClient.get<{ data: Preview }>(`${path(account.id)}/capture`, { signal })).data.data,
    refetchOnMount: "always",
  })
  const save = useMutation({
    mutationFn: async (input: Draft & { requestKey: string }) =>
      (await apiClient.post<{ data: SupplierPayment }>(path(account.id), input)).data.data,
    onSuccess: async (payment) => {
      setSelected(null)
      toast.success(`Cheque ${payment.number} registrado.`, {
        description: payment.policyNumber,
        action: { label: "Ver póliza", onClick: () => { void navigate(paths.accountingPolicy(payment.id)) } },
      })
      await Promise.all([
        client.invalidateQueries({ queryKey: bankAccountKeys.all }),
        client.invalidateQueries({ queryKey: supplierKeys.all }),
        client.invalidateQueries({ queryKey: purchaseReceptionKeys.all }),
        client.invalidateQueries({ queryKey: ["accounting"] }),
      ])
    },
    onSettled: () => { inFlight.current = false },
  })
  const receipt = preview.data?.receipts.find((item) => item.receiptId === selected)
  const needle = filter.trim().toLocaleLowerCase("es-MX")
  const rows = preview.data?.receipts.filter((item) => [item.supplierCode, item.supplierName, item.receiptNumber].some((value) =>
    value.toLocaleLowerCase("es-MX").includes(needle),
  )) ?? []
  function submit(draft: Draft) {
    if (inFlight.current || preview.isFetching || !preview.data?.canWrite) return
    const signature = JSON.stringify(draft)
    const requestKey = keys.current.get(signature) ?? crypto.randomUUID()
    keys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...draft, requestKey })
  }
  return <ErpDataDialog onOpenChange={(open) => { if (!inFlight.current) onOpenChange(open) }}
    description={`Recepciones web por pagar desde ${account.code}`} title="Pago a proveedores (cheque)" tone="banking">
    <ErpDataDialogBody className="grid gap-2">
      {preview.isPending && <Spinner />}
      {preview.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(preview.error)}</AlertDescription></Alert>}
      {preview.data && !preview.data.canWrite && <Alert><AlertDescription>{preview.data.reason}</AlertDescription></Alert>}
      {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
      {preview.data?.canWrite && (receipt ? <CheckForm date={preview.data.defaults.date} key={receipt.revision}
        onCancel={() => { setSelected(null); save.reset() }} onSave={submit} pending={save.isPending || preview.isFetching} receipt={receipt} />
        : <div className="grid gap-1">
          <Label htmlFor="bank-search-payable">Proveedor o documento</Label>
          <Input id="bank-search-payable" onChange={(event) => setFilter(event.target.value)} value={filter} />
          {rows.length ? <BankPanelTable columns={[
            { label: "Proveedor", key: "supplierCode" }, { label: "Beneficiario", key: "supplierName" },
            { label: "Doc.", key: "receiptNumber" }, { label: "Saldo", key: "remaining", numeric: true },
            { label: "Pagar", key: "pay", render: (row) => <Button onClick={() => setSelected(Number(row.receiptId))}
              size="xs" variant="outline">Elegir {String(row.receiptNumber)}</Button> },
          ]} rows={rows.map((row) => ({ ...row, movementId: row.receiptId }))} minWidth="min-w-[580px]" />
            : <p className="text-muted-foreground">Sin recepciones pendientes para esta consulta.</p>}
        </div>)}
      <div className="flex justify-end"><Button disabled={save.isPending} onClick={() => onOpenChange(false)}
        size="sm" variant="outline">Cerrar</Button></div>
    </ErpDataDialogBody>
  </ErpDataDialog>
}
