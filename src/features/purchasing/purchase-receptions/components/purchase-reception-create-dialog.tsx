import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { supplierKeys } from "@/features/accounts-payable/suppliers/logic"
import { accountingPolicyKeys } from "@/features/accounting/policies/logic"
import { movementKeys } from "@/features/inventories/movements/logic"
import { productKeys } from "@/features/inventories/products/logic"
import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import { purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception } from "@/features/purchasing/purchase-receptions/model"
import {
  createPurchaseReception,
  getPurchaseReceptionCreatePreview,
  type PurchaseReceptionCreateInput,
  type PurchaseReceptionCreatePreview,
} from "@/features/purchasing/purchase-receptions/services/purchase-reception-create-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type CreateDialogProps = {
  initialOrderNumber?: string
  onClose: () => void
  onCreated: (reception: PurchaseReception) => void
}

type CreateDraftInput = Omit<PurchaseReceptionCreateInput, "requestKey">

const fieldClass = "h-6 min-w-0 rounded-sm px-1 text-[10px]"
const quantityFormat = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 })
const normalizeFolio = (value: string) => value.trim().toUpperCase()

function draftSchema(preview: PurchaseReceptionCreatePreview) {
  return z.object({
    receivedAt: z.iso.date({ error: "Captura una fecha válida." }),
    warehouse: z.string().refine(
      (code) => preview.warehouses.some((warehouse) => warehouse.code === code),
      { error: "Selecciona un almacén." },
    ),
    supplierReference: z.string().trim().max(30, "La referencia admite hasta 30 caracteres."),
    lines: z.array(z.object({ selected: z.boolean(), quantity: z.string() })),
  }).superRefine(({ lines }, context) => {
    if (!lines.some(({ selected }) => selected)) {
      context.addIssue({ code: "custom", path: ["root"], message: "Selecciona al menos una partida." })
    }
    preview.lines.forEach(({ maximum }, index) => {
      const line = lines[index]
      if (!line?.selected) return
      const quantity = Number(line.quantity)
      if (!/^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(line.quantity) || quantity < 0.001 || quantity > maximum) {
        context.addIssue({
          code: "custom",
          path: ["lines", index, "quantity"],
          message: "Captura una cantidad entre 0.001 y " + quantityFormat.format(maximum) + ".",
        })
      }
    })
  })
}

function PurchaseReceptionCreateDraft({ preview, saving, onSubmit, onClose }: {
  preview: PurchaseReceptionCreatePreview
  saving: boolean
  onSubmit: (input: CreateDraftInput) => void
  onClose: () => void
}) {
  const { control, formState: { errors }, handleSubmit, register, setValue } = useForm({
    resolver: zodResolver(draftSchema(preview)),
    defaultValues: {
      receivedAt: preview.defaults.receivedAt.slice(0, 10),
      warehouse: preview.defaults.warehouse,
      supplierReference: "",
      lines: preview.lines.map(({ suggested }) => ({
        selected: suggested > 0,
        quantity: suggested > 0 ? String(suggested) : "",
      })),
    },
  })
  const lines = useWatch({ control, name: "lines" })
  const selectedCount = lines.filter(({ selected }) => selected).length
  const allSelected = selectedCount === lines.length

  return (
    <form noValidate className="grid gap-2" onSubmit={handleSubmit((values) => onSubmit({
      orderNumber: preview.number,
      revision: preview.revision,
      legacyVersion: preview.legacyVersion,
      receivedAt: values.receivedAt,
      warehouse: values.warehouse,
      supplierReference: values.supplierReference,
      lines: preview.lines.flatMap(({ orderLineId }, index) => values.lines[index].selected
        ? [{ orderLineId, quantity: Number(values.lines[index].quantity) }]
        : []),
    }))}>
      <fieldset className="grid min-w-0 gap-2" disabled={saving}>
        <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)]">
          <label className="grid min-w-0 gap-0.5">
            <span>Almacén</span>
            <select className={fieldClass + " w-full border border-input bg-background"} {...register("warehouse")}>
              <option value="">Selecciona un almacén</option>
              {preview.warehouses.map(({ code, name }) => <option key={code} value={code}>{code} · {name}</option>)}
            </select>
            {errors.warehouse && <span className="text-destructive" role="alert">{errors.warehouse.message}</span>}
          </label>
          <label className="grid min-w-0 gap-0.5">
            <span>Fecha</span>
            <Input className={fieldClass} type="date" {...register("receivedAt")} />
            {errors.receivedAt && <span className="text-destructive" role="alert">{errors.receivedAt.message}</span>}
          </label>
          <label className="grid min-w-0 gap-0.5">
            <span>Referencia proveedor</span>
            <Input className={fieldClass} maxLength={30} {...register("supplierReference")} />
            {errors.supplierReference && <span className="text-destructive" role="alert">{errors.supplierReference.message}</span>}
          </label>
        </div>

        <ErpDataTableViewport axes="xy" className="max-h-[50vh]">
          <Table className="min-w-[33rem] text-[10px]">
            <TableHeader>
              <TableRow>
                <TableHead className="h-6 w-8 px-1.5">
                  <Checkbox
                    aria-label="Seleccionar todas las partidas"
                    checked={allSelected}
                    indeterminate={!allSelected && selectedCount > 0}
                    onCheckedChange={(checked) => {
                      lines.forEach((_, index) => setValue(`lines.${index}.selected`, checked === true))
                    }}
                  />
                </TableHead>
                <TableHead className="h-6 px-1.5">Producto</TableHead>
                <TableHead className="h-6 px-1.5">Descripción</TableHead>
                <TableHead className="h-6 px-1.5">Unidad</TableHead>
                <TableHead className="h-6 px-1.5 text-right">Pendiente</TableHead>
                <TableHead className="h-6 w-32 px-1.5 text-right">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.lines.map((line, index) => {
                const label = `${line.productCode} · Partida ${line.orderLineId}`
                const message = errors.lines?.[index]?.quantity?.message
                return (
                  <TableRow key={line.orderLineId}>
                    <TableCell className="px-1.5 py-0.5">
                      <Checkbox
                        aria-label={`Incluir ${label}`}
                        checked={lines[index].selected}
                        onCheckedChange={(checked) => setValue(`lines.${index}.selected`, checked === true)}
                      />
                    </TableCell>
                    <TableCell className="px-1.5 py-0.5">{line.productCode}</TableCell>
                    <TableCell className="max-w-72 truncate px-1.5 py-0.5" title={line.description}>{line.description}</TableCell>
                    <TableCell className="px-1.5 py-0.5">{line.unit}</TableCell>
                    <TableCell className="px-1.5 py-0.5 text-right tabular-nums">
                      {quantityFormat.format(Math.max(0, (line.ordered - line.fulfilled) / line.factor))}
                    </TableCell>
                    <TableCell className="px-1.5 py-0.5">
                      <Input
                        aria-invalid={Boolean(message)}
                        aria-label={`Cantidad de ${label}`}
                        className={fieldClass + " text-right tabular-nums"}
                        max={line.maximum}
                        min={0.001}
                        readOnly={!lines[index].selected}
                        step={0.001}
                        type="number"
                        {...register(`lines.${index}.quantity`)}
                      />
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
      <footer className="flex justify-end gap-1.5">
        <Button disabled={saving || selectedCount === 0} size="sm" type="submit">
          {saving && <Spinner />}
          OK
        </Button>
        <Button disabled={saving} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
      </footer>
    </form>
  )
}

export function PurchaseReceptionCreateDialog({ initialOrderNumber = "", onClose, onCreated }: CreateDialogProps) {
  const folioId = useId()
  const queryClient = useQueryClient()
  const [folio, setFolio] = useState(() => normalizeFolio(initialOrderNumber))
  const [submittedFolio, setSubmittedFolio] = useState(() => normalizeFolio(initialOrderNumber))
  const inFlight = useRef(false)
  const requestKeys = useRef(new Map<string, string>())
  const normalizedFolio = normalizeFolio(folio)
  const lookup = useQuery({
    queryKey: [...purchaseReceptionKeys.all, "create", submittedFolio],
    queryFn: ({ signal }) => getPurchaseReceptionCreatePreview(submittedFolio, signal),
    enabled: submittedFolio !== "",
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  })
  const matchesLookup = submittedFolio !== "" && normalizedFolio === submittedFolio
  const preview = matchesLookup && !lookup.isFetching && !lookup.isError ? lookup.data : undefined
  const save = useMutation({
    mutationFn: createPurchaseReception,
    onSuccess: ({ reception }) => {
      queryClient.setQueryData(purchaseReceptionKeys.detail(reception.id), reception)
      void queryClient.invalidateQueries({ queryKey: [...purchaseReceptionKeys.all, "search"] })
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      void queryClient.invalidateQueries({ queryKey: movementKeys.all })
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      void queryClient.invalidateQueries({ queryKey: accountingPolicyKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "reports"] })
      onCreated(reception)
    },
    onSettled: () => { inFlight.current = false },
  })

  function dismiss() {
    if (!inFlight.current) onClose()
  }

  function searchOrder() {
    if (!normalizedFolio || inFlight.current) return
    save.reset()
    if (matchesLookup) void lookup.refetch()
    else setSubmittedFolio(normalizedFolio)
  }

  function submit(input: CreateDraftInput) {
    if (inFlight.current || !preview?.canWrite) return
    const signature = JSON.stringify(input)
    const requestKey = requestKeys.current.get(signature) ?? crypto.randomUUID()
    requestKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...input, requestKey })
  }

  return (
    <ErpDataDialog description="Recepción de orden de compra" onOpenChange={dismiss} title="Nueva recepción">
      <ErpDataDialogBody
        className="grid gap-2 text-[10px]"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !event.defaultPrevented) {
            event.preventDefault()
            event.stopPropagation()
            dismiss()
          }
        }}
      >
        <form className="flex flex-wrap items-end gap-1.5" onSubmit={(event) => { event.preventDefault(); searchOrder() }}>
          <label className="grid gap-0.5" htmlFor={folioId}>
            <span>Folio O.C.</span>
            <Input
              autoFocus={!initialOrderNumber}
              className={fieldClass + " w-32 uppercase"}
              disabled={save.isPending}
              id={folioId}
              maxLength={15}
              onChange={(event) => { setFolio(event.target.value); save.reset() }}
              value={folio}
            />
          </label>
          <Button
            disabled={!normalizedFolio || (matchesLookup && lookup.isFetching) || save.isPending}
            size="xs"
            type="submit"
            variant="outline"
          >
            {matchesLookup && lookup.isFetching && <Spinner />}
            Buscar
          </Button>
        </form>
        {matchesLookup && lookup.isError && <p className="text-destructive" role="alert">{getApiErrorMessage(lookup.error)}</p>}
        {preview && <p>Proveedor: {preview.supplier.code} · {preview.supplier.name}</p>}
        {preview && !preview.canWrite && <p className="text-destructive" role="status">{preview.reason ?? "La orden no está disponible para recibir."}</p>}
        {save.isError && <p className="text-destructive" role="alert">{getApiErrorMessage(save.error)}</p>}
        {preview?.canWrite ? (
          <PurchaseReceptionCreateDraft
            key={`${preview.id}:${preview.revision}:${preview.legacyVersion}`}
            onClose={dismiss}
            onSubmit={submit}
            preview={preview}
            saving={save.isPending}
          />
        ) : (
          <footer className="flex justify-end">
            <Button onClick={dismiss} size="sm" type="button" variant="outline">Cancelar</Button>
          </footer>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
