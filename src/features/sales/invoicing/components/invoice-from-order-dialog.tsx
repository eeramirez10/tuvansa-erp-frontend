import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { clientKeys } from "@/features/accounts-receivable/clients/logic"
import { movementKeys } from "@/features/inventories/movements/logic"
import { productKeys } from "@/features/inventories/products/logic"
import { invoiceFromOrderQueryOptions, invoiceKeys } from "@/features/sales/invoicing/logic"
import type { CreateInvoiceFromOrderInput, CreateInvoiceFromOrderResult, InvoiceFromOrderPreview } from "@/features/sales/invoicing/model"
import { createInvoiceFromOrder } from "@/features/sales/invoicing/services/invoice-service"
import { orderKeys } from "@/features/sales/orders/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type DraftInput = Omit<CreateInvoiceFromOrderInput, "requestKey">

const quantityFormat = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 })
const fieldClass = "h-6 min-w-0 rounded-sm px-1 text-[10px]"
const columns = ["Producto", "Descripción", "U.M.", "Pedido", "Surtido", "Asignado", "Remitir"]
const normalizeFolio = (value: string) => value.trim().toUpperCase()

function draftSchema(preview: InvoiceFromOrderPreview) {
  return z.object({
    issuedAt: z.iso.date({ error: "Captura una fecha válida." }),
    lines: z.array(z.object({ selected: z.boolean(), quantity: z.string() })),
  }).superRefine(({ lines }, context) => {
    if (!lines.some(({ selected }) => selected)) {
      context.addIssue({ code: "custom", path: ["root"], message: "Selecciona al menos una partida." })
    }
    lines.forEach(({ selected, quantity }, index) => {
      if (!selected) return
      const { maximum } = preview.lines[index]
      const amount = Number(quantity)
      if (!/^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(quantity) || amount < 0.001 || amount > maximum) {
        context.addIssue({
          code: "custom",
          path: ["lines", index, "quantity"],
          message: `Captura una cantidad entre 0.001 y ${quantityFormat.format(maximum)}.`,
        })
      }
    })
  })
}

function InvoiceFromOrderDraft({ preview, saving, onSubmit, onClose }: {
  preview: InvoiceFromOrderPreview
  saving: boolean
  onSubmit: (input: DraftInput) => void
  onClose: () => void
}) {
  const dateId = useId()
  const { control, formState: { errors }, handleSubmit, register, setValue } = useForm({
    resolver: zodResolver(draftSchema(preview)),
    defaultValues: {
      issuedAt: preview.defaults.issuedAt.slice(0, 10),
      lines: preview.lines.map(({ maximum, suggested }) => ({
        selected: maximum > 0 && suggested > 0,
        quantity: suggested > 0 ? String(suggested) : "",
      })),
    },
  })
  const lines = useWatch({ control, name: "lines" })
  const selectedCount = lines.filter(({ selected }) => selected).length
  const selectableCount = preview.lines.filter(({ maximum }) => maximum > 0).length
  const allSelected = selectedCount === selectableCount

  return (
    <form className="grid gap-2" noValidate onSubmit={handleSubmit((values) => onSubmit({
      orderNumber: preview.number,
      revision: preview.revision,
      issuedAt: values.issuedAt,
      lines: preview.lines.flatMap(({ orderLineId }, index) => values.lines[index].selected
        ? [{ orderLineId, quantity: Number(values.lines[index].quantity) }]
        : []),
    }))}>
      <fieldset className="grid min-w-0 gap-2" disabled={saving}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1">
            <Label htmlFor={dateId}>Fecha</Label>
            <Input aria-invalid={Boolean(errors.issuedAt)} className={fieldClass} id={dateId} type="date" {...register("issuedAt")} />
            {errors.issuedAt && <span className="text-destructive" role="alert">{errors.issuedAt.message}</span>}
          </div>
          <ErpDataMetric label="Almacén" value={preview.warehouse} />
        </div>
        <ErpDataTableViewport axes="xy" className="max-h-[46vh]">
          <Table className="min-w-[40rem] text-[10px]">
            <TableHeader>
              <TableRow>
                <TableHead className="h-6 w-8 px-1.5">
                  <Checkbox aria-label="Seleccionar todas las partidas disponibles" checked={allSelected}
                    indeterminate={!allSelected && selectedCount > 0}
                    onCheckedChange={(checked) => {
                      preview.lines.forEach(({ maximum }, index) => setValue(`lines.${index}.selected`, maximum > 0 && checked === true))
                    }} />
                </TableHead>
                {columns.map((label, index) => (
                  <TableHead className={index < 3 ? "h-6 px-1.5" : "h-6 px-1.5 text-right"} key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.lines.map((line, index) => {
                const label = `${line.productCode} · Partida ${line.orderLineId}`
                const message = errors.lines?.[index]?.quantity?.message
                return (
                  <TableRow key={line.orderLineId}>
                    <TableCell className="px-1.5 py-0.5">
                      <Checkbox aria-label={`Incluir ${label}`} checked={lines[index].selected} disabled={line.maximum <= 0}
                        onCheckedChange={(checked) => setValue(`lines.${index}.selected`, checked === true)} />
                    </TableCell>
                    <TableCell className="px-1.5 py-0.5">{line.productCode}</TableCell>
                    <TableCell className="max-w-56 truncate px-1.5 py-0.5" title={line.description}>{line.description}</TableCell>
                    <TableCell className="px-1.5 py-0.5">{line.unit}</TableCell>
                    <TableCell className="px-1.5 py-0.5 text-right tabular-nums">{quantityFormat.format(line.ordered)}</TableCell>
                    <TableCell className="px-1.5 py-0.5 text-right tabular-nums">{quantityFormat.format(line.fulfilled)}</TableCell>
                    <TableCell className="px-1.5 py-0.5 text-right tabular-nums">{quantityFormat.format(line.assigned)}</TableCell>
                    <TableCell className="w-28 px-1.5 py-0.5">
                      <Input aria-invalid={Boolean(message)} aria-label={`Cantidad a remitir de ${label}`}
                        className={fieldClass + " text-right tabular-nums"} inputMode="decimal" min={0.001} max={line.maximum}
                        readOnly={!lines[index].selected} step={0.001} type="number" {...register(`lines.${index}.quantity`)} />
                      {message && <span className="text-destructive" role="alert">{message}</span>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ErpDataTableViewport>
        {errors.root?.message && <p className="text-destructive" role="alert">{errors.root.message}</p>}
      </fieldset>
      <div className="flex justify-end gap-1">
        <Button disabled={saving} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
        <Button disabled={saving || selectedCount === 0} size="sm" type="submit">{saving && <Spinner />}OK</Button>
      </div>
    </form>
  )
}

export function InvoiceFromOrderDialog({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (result: CreateInvoiceFromOrderResult) => void
}) {
  const folioId = useId()
  const queryClient = useQueryClient()
  const [folio, setFolio] = useState("")
  const [submittedFolio, setSubmittedFolio] = useState("")
  const inFlight = useRef(false)
  const requestKeys = useRef(new Map<string, string>())
  const normalizedFolio = normalizeFolio(folio)
  const lookup = useQuery(invoiceFromOrderQueryOptions(submittedFolio))
  const matchesLookup = submittedFolio !== "" && normalizedFolio === submittedFolio
  const preview = matchesLookup && !lookup.isFetching && !lookup.isError ? lookup.data : undefined
  const ready = preview?.canWrite && preview.lines.some(({ maximum }) => maximum > 0)
  const save = useMutation({
    mutationFn: createInvoiceFromOrder,
    networkMode: "always",
    onSuccess: (result) => {
      queryClient.setQueryData(invoiceKeys.detail(result.invoice.id), result.invoice)
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: invoiceKeys.all }),
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: movementKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["inventories", "reports"] }),
        queryClient.invalidateQueries({ queryKey: clientKeys.all }),
      ])
      onCreated(result)
    },
    onSettled: () => { inFlight.current = false },
  })

  function dismiss() {
    if (!inFlight.current) onClose()
  }

  function search() {
    if (!normalizedFolio || inFlight.current) return
    save.reset()
    if (matchesLookup) void lookup.refetch()
    else setSubmittedFolio(normalizedFolio)
  }

  function submit(input: DraftInput) {
    if (inFlight.current || !ready) return
    const signature = JSON.stringify(input)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...input, requestKey })
  }

  return (
    <ErpDataDialog description="Salida de mercancía de un pedido asignado" onOpenChange={dismiss} title="Remisión México" tone="sales">
      <ErpDataDialogBody className="grid gap-2 text-[10px]">
        <form aria-label="Buscar pedido" className="flex flex-wrap items-end gap-1.5" onSubmit={(event) => { event.preventDefault(); search() }}>
          <div className="grid gap-1">
            <Label htmlFor={folioId}>Folio de pedido</Label>
            <Input autoFocus className={fieldClass + " w-36 uppercase"} disabled={save.isPending}
              id={folioId} maxLength={15} onChange={(event) => {
                if (!inFlight.current) {
                  setFolio(event.target.value)
                  save.reset()
                }
              }} value={folio} />
          </div>
          <Button disabled={!normalizedFolio || (matchesLookup && lookup.isFetching) || save.isPending} size="xs" type="submit" variant="outline">
            {matchesLookup && lookup.isFetching && <Spinner />}Buscar
          </Button>
        </form>
        {matchesLookup && lookup.isError && <p className="text-destructive" role="alert">{getApiErrorMessage(lookup.error)}</p>}
        {preview && <p>Cliente {preview.customer.code} · {preview.customer.name}</p>}
        {preview && !ready && <p className="text-destructive" role="status">{preview.reason || "El pedido no tiene partidas disponibles para remitir."}</p>}
        {save.isError && <p className="text-destructive" role="alert">{getApiErrorMessage(save.error)}</p>}
        {preview && ready ? (
          <InvoiceFromOrderDraft key={`${preview.orderId}:${preview.revision}`} onClose={dismiss}
            onSubmit={submit} preview={preview} saving={save.isPending} />
        ) : (
          <div className="flex justify-end">
            <Button onClick={dismiss} size="sm" type="button" variant="outline">Cancelar</Button>
          </div>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
