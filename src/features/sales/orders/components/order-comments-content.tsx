import type { Order, OrderPanel } from "@/features/sales/orders/model"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/utils/cn"

type CommentsContentProps = { order: Order; panel: OrderPanel }
type DeliveryBranch = {
  code?: unknown
  name?: unknown
  address1?: unknown
  address2?: unknown
  city?: unknown
  state?: unknown
  contact?: unknown
}

const text = (value: unknown) => value === null || value === undefined ? "" : String(value)
const decimal = (value: unknown, digits = 2) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed.toFixed(digits) : ""
}
const date = (value: unknown, includeTime = false) => {
  const raw = text(value)
  if (!raw || raw.startsWith("1900-12-31")) return ""
  const [datePart, timePart] = raw.replace("T", " ").split(" ")
  const [year, month, day] = datePart.split("-")
  if (!year || !month || !day) return raw
  return `${day}/${month}/${year}${includeTime && timePart ? ` ${timePart}` : ""}`
}

function CommentField({ label, value, className, numeric = false }: {
  label: string
  value: unknown
  className?: string
  numeric?: boolean
}) {
  return (
    <label className={cn("grid min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-1", className)}>
      <span className="whitespace-nowrap text-right">{label}</span>
      <Input className={cn("h-5 min-w-0 px-1 text-[9px]", numeric && "text-right tabular-nums")} readOnly value={text(value)} />
    </label>
  )
}

export function OrderCommentsContent({ order, panel }: CommentsContentProps) {
  const comment = panel.items[0] ?? {}
  const summary = panel.summary ?? {}
  const branches = Array.isArray(summary.deliveryBranches) ? summary.deliveryBranches as DeliveryBranch[] : []
  const deliveryOption = Number(comment.deliveryOption)

  return (
    <div className="grid min-w-[56rem] gap-1 text-[9px]">
      <section className="grid grid-cols-12 gap-x-2 gap-y-1 border border-input bg-background/35 p-1.5">
        <CommentField className="col-span-3" label="Pedido cliente" value={summary.customerOrderNumber} />
        <CommentField className="col-span-3" label="Fecha" value={date(summary.orderedAt)} />
        <label className="col-span-2 flex items-center gap-1"><Checkbox checked={Boolean(summary.initial)} disabled /><span>Inicial</span></label>
        <div className="col-span-4" />

        <CommentField className="col-span-3" label="Desde" value={date(summary.fromDate)} />
        <CommentField className="col-span-3" label="Hasta" value={date(summary.dueAt)} />
        <CommentField className="col-span-3" label="Importe asignado" numeric value={decimal(summary.assignedAmount)} />
        <CommentField className="col-span-3" label="Saldo del cliente" numeric value={decimal(summary.customerBalance)} />

        <CommentField className="col-span-2" label="Descto 1" numeric value={decimal(summary.discount1)} />
        <CommentField className="col-span-2" label="Descto 2" numeric value={decimal(summary.discount2)} />
        <CommentField className="col-span-2" label="Descto 3" numeric value={decimal(summary.discount3)} />
        <CommentField className="col-span-3" label="Depto" value={summary.department} />
        <CommentField className="col-span-3" label="T.C." numeric value={decimal(summary.exchangeRate, 8)} />

        <CommentField className="col-span-2" label="Volumen" numeric value={decimal(summary.volume)} />
        <CommentField className="col-span-2" label="Peso" numeric value={decimal(summary.weight)} />
        <CommentField className="col-span-2" label="Sucursal" numeric value={summary.branch} />
        <CommentField className="col-span-2" label="Cajas" numeric value={comment.boxes ?? 0} />
        <div className="col-span-4" />

        <CommentField className="col-span-2" label="Plazo" value={summary.termsDays} />
        <CommentField className="col-span-2" label="Comisión" numeric value={decimal(summary.commission)} />
        <label className="col-span-4 flex items-center justify-center gap-1 whitespace-nowrap"><Checkbox checked={Boolean(summary.noPartialDeliveries)} disabled /><span>No acepta entregas parciales</span></label>
        <CommentField className="col-span-4" label="Moneda de cobro" value={summary.collectionCurrencyId} />

        <CommentField className="col-span-2" label="Transporte" value={summary.transportationCode} />
        <CommentField className="col-span-6" label="" value={summary.transportation} />
        <CommentField className="col-span-4" label="Almacén" value={summary.warehouse} />

        <div className="col-span-12 grid grid-cols-[6rem_1fr] gap-x-1 gap-y-0.5">
          <span className="pt-1 text-right">Comentarios:</span>
          <Input className="h-5 px-1 text-[9px]" readOnly value={text(comment.comments)} />
          <span className="pt-1 text-right">Pedido Cliente</span>
          <Input className="h-5 px-1 text-[9px]" readOnly value={text(comment.customerDocumentNumber)} />
          <span className="pt-1 text-right">Entregar en</span>
          <div className="grid gap-0.5">
            <Input className="h-5 px-1 text-[9px]" readOnly value={text(comment.deliveryAddress1)} />
            <Input className="h-5 px-1 text-[9px]" readOnly value={text(comment.deliveryAddress2)} />
            <Input className="h-5 px-1 text-[9px]" readOnly value={text(comment.deliveryAddress3)} />
          </div>
          <span className="pt-1 text-right">Contacto</span>
          <Input className="h-5 px-1 text-[9px]" readOnly value={text(comment.deliveryContact)} />
        </div>

        <div className="col-span-12 grid grid-cols-[1fr_auto_4rem_auto_4rem] items-center gap-1">
          <select className="h-5 border border-input bg-background px-1" disabled value={deliveryOption > 0 ? String(deliveryOption) : ""}>
            <option value="">Sin sucursal</option>
            {branches.map((branch, index) => <option key={`${text(branch.code)}-${index}`} value={String(index + 1)}>{[branch.code, branch.name].map(text).filter(Boolean).join(" - ")}</option>)}
          </select>
          <span>Alta</span><Input className="h-5 px-1 text-[9px]" readOnly value={text(comment.createdBy ?? summary.createdBy)} />
          <span>Autorizo</span><Input className="h-5 px-1 text-[9px]" readOnly value={text(comment.authorizedBy ?? summary.authorizedBy)} />
        </div>

        <textarea className="col-span-12 h-28 resize-none overflow-auto border border-input bg-background p-1 font-mono text-[9px] leading-3 shadow-inner outline-none" readOnly value={text(comment.auditTrail)} />
        <Input className="col-span-8 h-5 px-1 text-[9px]" readOnly value={text(comment.amountInWords)} />
        <div className="col-span-4" />

        <div className="col-span-12 grid grid-cols-12 gap-1">
          <CommentField className="col-span-2" label="" value={order.number} />
          <CommentField className="col-span-3" label="Captura" value={date(summary.capturedAt, true)} />
          <CommentField className="col-span-2" label="% min surt" value={summary.minimumFulfillmentPercentage} />
          <div className="col-span-5" />
          <CommentField className="col-span-2" label="Flete" numeric value={decimal(summary.freight)} />
          <CommentField className="col-span-2" label="Seguros" numeric value={decimal(summary.insurance)} />
          <CommentField className="col-span-2" label={text(summary.otherText)} numeric value={decimal(summary.other)} />
          <CommentField className="col-span-3" label="Asign" value={date(summary.assignedAt, true)} />
          <CommentField className="col-span-1" label="Cambios" value={comment.changesCount ?? summary.changesCount} />
          <CommentField className="col-span-2" label="Empaque" value={date(summary.packedAt)} />
        </div>
      </section>
    </div>
  )
}
