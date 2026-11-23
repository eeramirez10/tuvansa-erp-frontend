import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useId, useRef, type ComponentProps } from "react"
import { useForm, useWatch, type FieldPath } from "react-hook-form"
import { z } from "zod"
import { displayPurchaseOrderDate, purchaseOrderKeys, purchaseOrderPanelQueryOptions, refreshPurchaseOrder } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import {
  getPurchaseOrderCommentsEditor,
  updatePurchaseOrderComments,
  type PurchaseOrderCommentsFields,
  type PurchaseOrderCommentsUpdate,
} from "@/features/purchasing/purchase-orders/services/purchase-order-comments-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Textarea } from "@/shared/ui/textarea"

type DialogProps = { purchaseOrder: PurchaseOrder; onClose: () => void }

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const text = (value: unknown) => value == null ? "" : String(value)

const dateInput = z.string().regex(/^(?:\d{4}-\d{2}-\d{2})?$/)
const decimalInput = (precision: number) => z.number().refine(
  (value) => Number(value.toFixed(precision)) === value,
)
const commentLengths = [100, 100, 100, 140, 3000] as const
const shortCommentFields = ["lines.0", "lines.1", "lines.2", "lines.3"] as const
const fieldsSchema = z.object({
  from: dateInput,
  dueAt: dateInput,
  terms: z.number().int().min(0).max(999),
  supplierOrderNumber: z.string().max(36),
  department: z.string().max(11),
  discountPercentages: z.tuple([decimalInput(2), decimalInput(2), decimalInput(2)]),
  exchangeRate: decimalInput(8),
  warehouse: z.string().max(6),
  currencyId: z.number().int().min(0).max(9),
  lines: z.tuple([
    z.string().max(commentLengths[0]),
    z.string().max(commentLengths[1]),
    z.string().max(commentLengths[2]),
    z.string().max(commentLengths[3]),
    z.string().max(commentLengths[4]),
  ]),
  otherLabel: z.string().max(10),
  freight: decimalInput(2),
  insurance: decimalInput(2),
  other: decimalInput(2),
  confirmedAt: dateInput,
})

const formSchema = z.object({
  fields: fieldsSchema,
  revision: z.number().int(),
  legacyVersion: z.string().min(1),
})

type CommentsForm = z.infer<typeof formSchema>
const dateValue = (value: string | null) => value?.slice(0, 10) ?? ""
const dateFields = (fields: PurchaseOrderCommentsFields): CommentsForm["fields"] => ({
  ...fields, from: dateValue(fields.from), dueAt: dateValue(fields.dueAt), confirmedAt: dateValue(fields.confirmedAt),
})

function displayDateTime(value: unknown) {
  const input = text(value)
  const date = displayPurchaseOrderDate(input)
  const time = input.slice(11, 19)
  return time && time !== "00:00:00" ? `${date} ${time}` : date
}

function InlineField({ label, input }: { label: string; input: ComponentProps<typeof Input> }) {
  return (
    <label className="flex min-w-0 items-center gap-1">
      <span className="shrink-0 whitespace-nowrap">{label}</span>
      <Input className="h-5 min-w-0 flex-1 px-1 text-[9px]" {...input} />
    </label>
  )
}

const readOnly = (value: unknown): ComponentProps<typeof Input> => ({ readOnly: true, value: text(value) })

export function PurchaseOrderCommentsDialog({ purchaseOrder, onClose }: DialogProps) {
  const { id, number } = purchaseOrder
  const queryClient = useQueryClient()
  const longCommentId = useId()
  const acceptButton = useRef<HTMLButtonElement>(null)
  const initialized = useRef(false)
  const panel = useQuery(purchaseOrderPanelQueryOptions(id, "comments"))
  const hasPanel = Boolean(panel.data)
  const { data: editor, isPending: loadingEditor, isFetchedAfterMount, isFetching, isError: editorFailed, error: editorError } = useQuery({
    queryKey: [...purchaseOrderKeys.panel(id, "comments"), "editor"],
    queryFn: ({ signal }) => getPurchaseOrderCommentsEditor(id, signal),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
  })
  const { control, handleSubmit, register, reset, setValue, formState: { errors } } = useForm<CommentsForm>({
    resolver: zodResolver(formSchema),
  })
  const loadedVersion = useWatch({ control, name: "legacyVersion" })
  const supplierOrderNumber = useWatch({ control, name: "fields.supplierOrderNumber" })
  const canWrite = Boolean(loadedVersion && editor?.canWrite && !editorFailed)
  const save = useMutation({
    networkMode: "always",
    mutationFn: (update: PurchaseOrderCommentsUpdate) => updatePurchaseOrderComments(id, update),
    onSuccess: (order) => {
      onClose()
      void refreshPurchaseOrder(queryClient, order)
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
    },
  })
  const cancel = () => { if (!save.isPending) onClose() }

  useEffect(() => {
    if (initialized.current || !editor || !isFetchedAfterMount || isFetching || editorFailed) return
    const { revision, legacyVersion, fields } = editor
    initialized.current = true
    reset({ revision, legacyVersion, fields: dateFields(fields) })
  }, [editor, editorFailed, isFetchedAfterMount, isFetching, reset])

  useEffect(() => {
    if (canWrite && hasPanel) acceptButton.current?.focus({ preventScroll: true })
  }, [canWrite, hasPanel])

  const submit = handleSubmit(({ fields, ...revision }) => {
    if (!canWrite || save.isPending) return
    const { from, dueAt, confirmedAt, ...otherFields } = fields
    save.mutate({
      ...revision,
      fields: { ...otherFields, from: from || null, dueAt: dueAt || null, confirmedAt: confirmedAt || null },
    })
  })
  const field = (
    name: FieldPath<CommentsForm["fields"]>,
    fallback: unknown,
    attrs: ComponentProps<typeof Input> = {},
  ): ComponentProps<typeof Input> => canWrite
    ? { ...register(`fields.${name}`, { valueAsNumber: attrs.type === "number" }), ...attrs, readOnly: save.isPending }
    : readOnly(fallback)

  const comment = panel.data?.items[0] ?? {}
  const details = panel.data?.summary ?? {}
  const labels = Array.isArray(details.labels) ? details.labels : []
  const [discount1, discount2, discount3] = purchaseOrder.discountPercentages
  const history = typeof details.authorizationHistory === "string" ? details.authorizationHistory.trim() : ""
  const shortComments = [comment.comments, comment.line2, comment.line3, history && editor ? editor.fields.lines[3] : comment.line4]
  const numberInput = { type: "number", step: "any", required: true } as const
  const calendarInput = { type: "date" } as const

  const form = (
    <form
      className="grid min-w-[39rem] gap-1 text-[9px]"
      key={canWrite ? "editor" : "read-only"}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          cancel()
        }
      }}
      onSubmit={(event) => void submit(event)}
    >
      <div className="grid max-w-[40rem] gap-0.5">
        <div className="grid grid-cols-[1.1fr_1.1fr_.75fr_1.45fr_1fr] gap-x-1.5">
          <InlineField label="Desde" input={field("from", displayPurchaseOrderDate(purchaseOrder.dates.from), calendarInput)} />
          <InlineField label="Hasta" input={field("dueAt", displayPurchaseOrderDate(purchaseOrder.dates.dueAt), calendarInput)} />
          <InlineField label="Plazo" input={field("terms", details.terms, { ...numberInput, min: 0, max: 999, step: 1 })} />
          <InlineField label="Número ellos" input={field("supplierOrderNumber", purchaseOrder.supplierOrderNumber, { maxLength: 36 })} />
          <InlineField label="Depto" input={field("department", purchaseOrder.department, { maxLength: 11 })} />
        </div>
        <div className="grid grid-cols-[7rem_7rem_7rem_minmax(0,1fr)_6rem] gap-x-1.5 pl-8">
          <InlineField label="Descto 1" input={field("discountPercentages.0", money.format(discount1), numberInput)} />
          <InlineField label="Descto 2" input={field("discountPercentages.1", money.format(discount2), numberInput)} />
          <InlineField label="Descto 3" input={field("discountPercentages.2", money.format(discount3), numberInput)} />
          <div className="col-start-5"><InlineField label="T.C." input={field("exchangeRate", details.exchangeRate, numberInput)} /></div>
        </div>
        <div className="grid grid-cols-[9rem_4.25rem_8.5rem_minmax(0,1fr)_8.25rem] gap-x-1.5 pl-6">
          <InlineField label="Pedido cliente" input={canWrite ? {
            value: supplierOrderNumber ?? "", maxLength: 36, readOnly: save.isPending,
            onChange: (event) => setValue("fields.supplierOrderNumber", event.target.value, { shouldDirty: true }),
          } : readOnly(purchaseOrder.supplierOrderNumber)} />
          <div className="col-start-3"><InlineField label="Alm" input={field("warehouse", purchaseOrder.warehouse, { maxLength: 6 })} /></div>
          <div className="col-start-5"><InlineField label="Moneda de pago" input={field("currencyId", details.currencyId,
            { ...numberInput, min: 0, max: 9, step: 1 })} /></div>
        </div>
      </div>

      <div className="grid max-w-[39rem] gap-0.5">
        {shortCommentFields.map((name, index) => {
          const label = text(labels[index])
          return (
            <label className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-1" key={name}>
              <span className="text-right">{label}</span>
              <Input aria-label={label || `Comentario ${index + 1}`} className="h-5 px-1 text-[9px]"
                {...field(name, shortComments[index], { maxLength: commentLengths[index] })} />
            </label>
          )
        })}
        {editor && history && <p className="ml-24 whitespace-pre-wrap text-muted-foreground">Historial de autorización {history}</p>}
      </div>

      <div className="grid max-w-[39rem] grid-cols-[minmax(0,1fr)_6.75rem_6.75rem_6.75rem] items-center gap-x-1.5">
        <label className="min-w-0 truncate" htmlFor={longCommentId}>{text(labels[4])}</label>
        <InlineField label="Alta" input={readOnly(details.createdBy)} />
        <InlineField label="Autorizó" input={readOnly(details.authorizedBy)} />
        <InlineField label="Cambios" input={readOnly(details.changesCount)} />
      </div>

      <Textarea
        aria-label={text(labels[4]) || "Comentarios"}
        className="h-36 min-h-24 resize-y bg-background p-1 font-mono text-[9px]"
        id={longCommentId}
        {...(canWrite ? { ...register("fields.lines.4"), readOnly: save.isPending, maxLength: commentLengths[4] }
          : { readOnly: true, value: text(comment.line5) })}
      />
      <Input
        aria-label="Importe con letra"
        className="h-5 w-full max-w-[32rem] px-1 text-[9px]"
        readOnly
        value={text(comment.amountInWords)}
      />

      <footer className="grid max-w-[39rem] grid-cols-[13.5rem_9.25rem_minmax(0,1fr)] items-end gap-2">
        <div className="grid grid-cols-3 gap-1 text-center">
          <label className="grid gap-0.5">
            <span>Flete</span>
            <Input className="h-5 px-1 text-right text-[9px]" {...field("freight", money.format(purchaseOrder.totals.freight), numberInput)} />
          </label>
          <label className="grid gap-0.5">
            <span>Seguros</span>
            <Input className="h-5 px-1 text-right text-[9px]" {...field("insurance", money.format(purchaseOrder.totals.insurance), numberInput)} />
          </label>
          <div className="grid gap-0.5">
            <Input aria-label="Concepto de otros cargos" className="h-4 px-1 text-[9px]" {...field("otherLabel", purchaseOrder.otherLabel, { maxLength: 10 })} />
            <Input aria-label="Otros cargos" className="h-5 px-1 text-right text-[9px]" {...field("other", money.format(purchaseOrder.totals.other), numberInput)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Button disabled={!canWrite || save.isPending} ref={acceptButton} size="sm" type="submit">
            {save.isPending && <Spinner />}OK
          </Button>
          <Button disabled={save.isPending} onClick={cancel} size="sm" type="button" variant="outline">Cancelar</Button>
        </div>
        <div className="grid gap-0.5">
          <InlineField label="Captura" input={readOnly(displayDateTime(details.createdAt))} />
          <InlineField label="Confirmada" input={field("confirmedAt", displayDateTime(details.modifiedAt), calendarInput)} />
        </div>
      </footer>
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive"><AlertDescription>Revisa los campos y la precisión de los importes.</AlertDescription></Alert>
      )}
      {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
    </form>
  )

  return (
    <ErpDataDialog description={number} onOpenChange={(open) => !open && cancel()} title="Comentarios">
      <ErpDataDialogBody>
        {(panel.isPending || loadingEditor) && <div className="grid min-h-48 place-items-center"><Spinner /></div>}
        {panel.isError && (
          <Alert variant="destructive">
            <AlertTitle>No fue posible cargar los comentarios</AlertTitle>
            <AlertDescription>{getApiErrorMessage(panel.error)}</AlertDescription>
          </Alert>
        )}
        {panel.data && !loadingEditor && form}
        {editorFailed && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(editorError)}</AlertDescription></Alert>}
        {editor && !editor.canWrite && <Alert><AlertDescription>{editor.reason}</AlertDescription></Alert>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
