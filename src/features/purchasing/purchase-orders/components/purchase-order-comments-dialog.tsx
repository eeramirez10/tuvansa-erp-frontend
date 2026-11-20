import { useQuery } from "@tanstack/react-query"
import { useEffect, useId, useRef } from "react"
import { displayPurchaseOrderDate, purchaseOrderPanelQueryOptions } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderPanel } from "@/features/purchasing/purchase-orders/model"
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

function displayDateTime(value: unknown) {
  const input = text(value)
  const date = displayPurchaseOrderDate(input)
  const time = input.slice(11, 19)
  return time && time !== "00:00:00" ? `${date} ${time}` : date
}

function InlineField({ label, value }: { label: string; value: unknown }) {
  return (
    <label className="flex min-w-0 items-center gap-1">
      <span className="shrink-0 whitespace-nowrap">{label}</span>
      <Input className="h-5 min-w-0 flex-1 px-1 text-[9px]" readOnly value={text(value)} />
    </label>
  )
}

function CommentsContent({ purchaseOrder, panel, onClose }: DialogProps & { panel: PurchaseOrderPanel }) {
  const longCommentId = useId()
  const acceptButton = useRef<HTMLButtonElement>(null)
  const comment = panel.items[0] ?? {}
  const details = panel.summary ?? {}
  const labels = Array.isArray(details.labels) ? details.labels : []
  const [discount1, discount2, discount3] = purchaseOrder.discountPercentages

  useEffect(() => {
    acceptButton.current?.focus({ preventScroll: true })
  }, [])

  return (
    <form
      className="grid min-w-[39rem] gap-1 text-[9px]"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          onClose()
        }
      }}
      onSubmit={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="grid max-w-[40rem] gap-0.5">
        <div className="grid grid-cols-[1.1fr_1.1fr_.75fr_1.45fr_1fr] gap-x-1.5">
          <InlineField label="Desde" value={displayPurchaseOrderDate(purchaseOrder.dates.from)} />
          <InlineField label="Hasta" value={displayPurchaseOrderDate(purchaseOrder.dates.dueAt)} />
          <InlineField label="Plazo" value={details.terms} />
          <InlineField label="Número ellos" value={purchaseOrder.supplierOrderNumber} />
          <InlineField label="Depto" value={purchaseOrder.department} />
        </div>
        <div className="grid grid-cols-[7rem_7rem_7rem_minmax(0,1fr)_6rem] gap-x-1.5 pl-8">
          <InlineField label="Descto 1" value={money.format(discount1)} />
          <InlineField label="Descto 2" value={money.format(discount2)} />
          <InlineField label="Descto 3" value={money.format(discount3)} />
          <div className="col-start-5"><InlineField label="T.C." value={details.exchangeRate} /></div>
        </div>
        <div className="grid grid-cols-[9rem_4.25rem_8.5rem_minmax(0,1fr)_8.25rem] gap-x-1.5 pl-6">
          <InlineField label="Pedido cliente" value={purchaseOrder.supplierOrderNumber} />
          <div className="col-start-3"><InlineField label="Alm" value={purchaseOrder.warehouse} /></div>
          <div className="col-start-5"><InlineField label="Moneda de pago" value={details.currencyId} /></div>
        </div>
      </div>

      <div className="grid max-w-[39rem] gap-0.5">
        {[comment.comments, comment.line2, comment.line3, comment.line4].map((line, index) => {
          const label = text(labels[index])
          return (
            <label className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-1" key={index}>
              <span className="text-right">{label}</span>
              <Input aria-label={label || `Comentario ${index + 1}`} className="h-5 px-1 text-[9px]" readOnly value={text(line)} />
            </label>
          )
        })}
      </div>

      <div className="grid max-w-[39rem] grid-cols-[minmax(0,1fr)_6.75rem_6.75rem_6.75rem] items-center gap-x-1.5">
        <label className="min-w-0 truncate" htmlFor={longCommentId}>{text(labels[4])}</label>
        <InlineField label="Alta" value={details.createdBy} />
        <InlineField label="Autorizó" value={details.authorizedBy} />
        <InlineField label="Cambios" value={details.changesCount} />
      </div>

      <Textarea
        aria-label={text(labels[4]) || "Comentarios"}
        className="h-36 min-h-24 resize-y bg-background p-1 font-mono text-[9px]"
        id={longCommentId}
        readOnly
        value={text(comment.line5)}
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
            <Input className="h-5 px-1 text-right text-[9px]" readOnly value={money.format(purchaseOrder.totals.freight)} />
          </label>
          <label className="grid gap-0.5">
            <span>Seguros</span>
            <Input className="h-5 px-1 text-right text-[9px]" readOnly value={money.format(purchaseOrder.totals.insurance)} />
          </label>
          <div className="grid gap-0.5">
            <Input aria-label="Concepto de otros cargos" className="h-4 px-1 text-[9px]" readOnly value={purchaseOrder.otherLabel} />
            <Input aria-label="Otros cargos" className="h-5 px-1 text-right text-[9px]" readOnly value={money.format(purchaseOrder.totals.other)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Button ref={acceptButton} size="sm" type="submit">OK</Button>
          <Button onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
        </div>
        <div className="grid gap-0.5">
          <InlineField label="Captura" value={displayDateTime(details.createdAt)} />
          <InlineField label="Confirmada" value={displayDateTime(details.modifiedAt)} />
        </div>
      </footer>
    </form>
  )
}

export function PurchaseOrderCommentsDialog({ purchaseOrder, onClose }: DialogProps) {
  const query = useQuery(purchaseOrderPanelQueryOptions(purchaseOrder.id, "comments"))

  return (
    <ErpDataDialog description={purchaseOrder.number} onOpenChange={(open) => !open && onClose()} title="Comentarios">
      <ErpDataDialogBody>
        {query.isPending && <div className="grid min-h-48 place-items-center"><Spinner /></div>}
        {query.isError && (
          <Alert variant="destructive">
            <AlertTitle>No fue posible cargar los comentarios</AlertTitle>
            <AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription>
          </Alert>
        )}
        {query.data && <CommentsContent onClose={onClose} panel={query.data} purchaseOrder={purchaseOrder} />}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
