import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"
import { paths } from "@/app/router/paths"
import { bankAccountKeys, bankMoney, bankTransferQueryOptions } from "@/features/treasury/banking/logic"
import type { BankTransferPreview } from "@/features/treasury/banking/model"
import { transferBankReview, type BankReviewTransferInput } from "@/features/treasury/banking/services/bank-panel-settings-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

type Fields = Pick<BankReviewTransferInput, "date" | "destinationBankAccountId">

function ReviewTransferForm({ preview, saving, onSave, onClose }: {
  preview: BankTransferPreview
  saving: boolean
  onSave: (fields: Fields) => void
  onClose: () => void
}) {
  const prefix = useId()
  const destinations = preview.destinations.map(({ id, code, name }) => ({ value: String(id), label: `${code} · ${name}` }))
  const schema = z.object({
    destination: z.string().refine((value) => destinations.some(({ value: id }) => value === id), "Selecciona una cuenta destino."),
    date: z.iso.date().refine((date) => date >= preview.fiscalStart && date <= preview.fiscalEnd, "Captura una fecha del periodo activo."),
  })
  const { control, formState: { errors }, handleSubmit, register } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { destination: "", date: [preview.fiscalStart, preview.defaults.date, preview.fiscalEnd].sort()[1] },
  })
  return <form className="grid gap-2" noValidate onSubmit={handleSubmit(({ destination, date }) => onSave({
    date, destinationBankAccountId: Number(destination),
  }))}>
    <fieldset className="grid min-w-0 gap-2" disabled={saving}>
      <div className="grid content-start gap-1">
        <Label htmlFor={prefix + "-destination"}>Cuenta destino</Label>
        <Controller control={control} name="destination" render={({ field }) => (
          <Select items={destinations} value={field.value} onValueChange={(value) => field.onChange(value ?? "")}>
            <SelectTrigger id={prefix + "-destination"} aria-invalid={Boolean(errors.destination)} className="h-6 w-full">
              <SelectValue placeholder="Selecciona una cuenta" />
            </SelectTrigger>
            <SelectContent>{destinations.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        )} />
        {errors.destination && <span className="text-destructive" role="alert">{errors.destination.message}</span>}
      </div>
      <div className="grid content-start gap-1">
        <Label htmlFor={prefix + "-date"}>Fecha</Label>
        <Input id={prefix + "-date"} type="date" min={preview.fiscalStart} max={preview.fiscalEnd}
          aria-invalid={Boolean(errors.date)} className="h-6" {...register("date")} />
        {errors.date && <span className="text-destructive" role="alert">{errors.date.message}</span>}
      </div>
    </fieldset>
    <footer className="flex justify-end gap-1">
      <Button disabled={saving} onClick={onClose} size="xs" type="button" variant="outline">Cancelar</Button>
      <Button disabled={saving} size="xs" type="submit">{saving && <Spinner />}Traspasa +</Button>
    </footer>
  </form>
}

export function BankReviewTransferDialog({ accountId, revision, movementIds, net, onClose }: {
  accountId: number
  revision: number
  movementIds: number[]
  net: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const requestKeys = useRef(new Map<string, string>())
  const inFlight = useRef(false)
  const query = useQuery(bankTransferQueryOptions(accountId))
  const save = useMutation({
    networkMode: "always",
    mutationFn: (input: BankReviewTransferInput) => transferBankReview(accountId, input),
    onSuccess: async (policy) => {
      toast.success(`Póliza ${policy.number} registrada.`, {
        action: { label: "Ver póliza", onClick: () => { void navigate(paths.accountingPolicy(policy.id)) } },
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["accounting"] }),
      ])
      onClose()
    },
    onSettled: () => { inFlight.current = false },
  })
  function submit(fields: Fields) {
    if (inFlight.current) return
    const signature = JSON.stringify(fields)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...fields, revision, movementIds, requestKey })
  }
  const close = () => { if (!inFlight.current) onClose() }
  const preview = query.data
  const ready = preview?.canWrite && preview.destinations.length > 0 && !query.isFetching && !query.isError
  return <ErpDataDialog defaultWidth={440} description="Traspaso de movimientos marcados con +" title="Traspasa +" tone="banking"
    onOpenChange={(open) => { if (!open) close() }}>
    <ErpDataDialogBody className="grid gap-2">
      <div className="flex flex-wrap gap-1">
        {preview && <ErpDataMetric label="Cuenta origen" value={preview.source.code} />}
        <ErpDataMetric label="Partidas marcadas" value={String(movementIds.length)} />
        <ErpDataMetric label="Importe neto" value={bankMoney(net)} />
      </div>
      {query.isFetching && <div className="grid min-h-16 place-items-center"><Spinner /></div>}
      {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
      {preview && !query.isFetching && !ready && <Alert><AlertDescription>{preview.reason || "Sin cuentas destino disponibles."}</AlertDescription></Alert>}
      {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
      {ready && preview ? <ReviewTransferForm onClose={close} onSave={submit} preview={preview} saving={save.isPending} /> : (
        <Button className="justify-self-end" onClick={close} size="xs" type="button" variant="outline">Cerrar</Button>
      )}
    </ErpDataDialogBody>
  </ErpDataDialog>
}
