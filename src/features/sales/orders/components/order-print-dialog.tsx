import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

import { buildOrderPrintDocument, type OrderPrintEntry } from "@/features/sales/orders/components/order-print-document"
import { orderPrintFilter, printFormats, printQuantities, type OrderPrintOptions } from "@/features/sales/orders/components/order-print-settings"
import type { Order } from "@/features/sales/orders/model"
import { getOrderPanel, getOrdersForPrint } from "@/features/sales/orders/services/order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Spinner } from "@/shared/ui/spinner"
import { printHtmlDocument } from "@/shared/utils/print-html-document"

const inputClass = "h-6 min-w-0 px-1 text-xs"
const fieldText = (value: unknown) => typeof value === "string" ? value.trim() : ""

async function printEntry(order: Order, format: OrderPrintOptions["format"]): Promise<OrderPrintEntry> {
  if (format !== "packing-list") return { order }
  if (order.captureDetails) {
    const { deliveryAddress, contact, boxes } = order.captureDetails
    return { order, delivery: { address: deliveryAddress.filter(Boolean), contact, boxes } }
  }
  if (order.storage?.legacyId === null) return { order }
  const { data } = await getOrderPanel(order.id, "comments")
  const comment = data.items[0]
  return {
    order,
    delivery: {
      address: [comment?.deliveryAddress1, comment?.deliveryAddress2, comment?.deliveryAddress3].map(fieldText).filter(Boolean),
      contact: fieldText(comment?.deliveryContact) || fieldText(data.summary?.contact),
      boxes: Number(comment?.boxes ?? 0),
    },
  }
}

function PrintRadioOptions({ label, options, value, onChange, className }: {
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return <RadioGroup aria-label={label} value={value}
    onValueChange={value => { if (typeof value === "string") onChange(value) }}
    className={className ?? "grid-cols-3 gap-1"}>
    {options.map(option => (
      <label key={option.value} className="flex items-center gap-1 whitespace-nowrap">
        <RadioGroupItem value={option.value} />{option.label}
      </label>
    ))}
  </RadioGroup>
}

export function OrderPrintDialog({ id, number, onClose }: { id: number; number: string; onClose: () => void }) {
  const [from, setFrom] = useState(number)
  const [to, setTo] = useState(number)
  const [copies, setCopies] = useState("1")
  const [format, setFormat] = useState<OrderPrintOptions["format"]>("order")
  const [quantities, setQuantities] = useState<OrderPrintOptions["quantities"]>("ordered")
  const [destination, setDestination] = useState("printer")
  const [filter, setFilter] = useState("1")
  const [preview, setPreview] = useState<{ html: string; printable: string } | null>(null)
  const print = useMutation({ mutationFn: (html: string) => printHtmlDocument(html, number), retry: false })
  const prepare = useMutation({
    mutationFn: async () => {
      orderPrintFilter(filter)
      const count = Number(copies)
      if (!Number.isSafeInteger(count) || count < 1) throw new Error("Indica un número entero de copias mayor a cero.")
      const orders = await getOrdersForPrint({ id, number }, from, to)
      const entries = await Promise.all(orders.map(order => printEntry(order, format)))
      const options = { format, quantities, filter }
      const printable = buildOrderPrintDocument(entries, options, count)
      if (destination === "printer") {
        await printHtmlDocument(printable, number)
        return null
      }
      return { html: count === 1 ? printable : buildOrderPrintDocument(entries, options), printable }
    },
    onSuccess: setPreview,
    retry: false,
  })
  const pending = prepare.isPending || print.isPending
  const error = print.error ?? prepare.error
  const invalidatePreview = () => {
    setPreview(null)
    print.reset()
    prepare.reset()
  }

  return (
    <ErpDataDialog defaultWidth={470} defaultHeight={300} description={number} title="Imprimir"
      tone="sales" onOpenChange={open => { if (!open && !pending) onClose() }}>
      <ErpDataDialogBody className="grid gap-2 text-xs">
        <form className="grid gap-2 px-1" onChange={invalidatePreview}
          onSubmit={event => { event.preventDefault(); setPreview(null); print.reset(); prepare.mutate() }}>
          <fieldset disabled={pending} className="grid min-w-0 gap-2">
            <div className="grid grid-cols-2 gap-6">
              <label className="grid grid-cols-[auto_1fr] items-center gap-1"><span>De la:</span>
                <Input required maxLength={15} value={from} onChange={event => setFrom(event.target.value)} className={inputClass} />
              </label>
              <label className="grid grid-cols-[auto_1fr] items-center gap-1"><span>A la:</span>
                <Input required maxLength={15} value={to} onChange={event => setTo(event.target.value)} className={inputClass} />
              </label>
            </div>
            <label className="flex items-center gap-2"><span>Número de copias:</span>
              <Input required type="number" min={1} step={1} value={copies} onChange={event => setCopies(event.target.value)} className={`${inputClass} w-20`} />
            </label>
            <PrintRadioOptions label="Formato del reporte" options={printFormats} value={format} onChange={value => {
              const selected = printFormats.find(option => option.value === value)
              if (selected) { setFormat(selected.value); invalidatePreview() }
            }} />
            <PrintRadioOptions label="Cantidades" options={printQuantities} value={quantities} onChange={value => {
              const selected = printQuantities.find(option => option.value === value)
              if (selected) { setQuantities(selected.value); invalidatePreview() }
            }} />
            <div className="flex items-center gap-2">
              <span className="shrink-0">Imprimir en:</span>
              <PrintRadioOptions label="Imprimir en" value={destination} className="grid-cols-2 gap-3"
                options={[{ value: "screen", label: "Pantalla" }, { value: "printer", label: "Impresora" }]}
                onChange={value => { setDestination(value); invalidatePreview() }} />
            </div>
            <Input aria-label="Filtro del reporte" title="Filtro del reporte. 1 incluye todas las partidas."
              value={filter} onChange={event => setFilter(event.target.value)} className={inputClass} />
          </fieldset>
          {error && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(error)}</AlertDescription></Alert>}
          <footer className="flex justify-end gap-2">
            <Button size="sm" type="submit" disabled={pending}>{pending && <Spinner />}OK</Button>
            <Button size="sm" type="button" variant="outline" disabled={pending} onClick={onClose}>Cancelar</Button>
          </footer>
        </form>
        {preview && <div className="grid gap-2 border-t pt-2">
          <iframe title="Vista previa del folio" sandbox="" srcDoc={preview.html}
            className="h-[min(52vh,28rem)] w-full rounded-sm border bg-white" />
          <div className="flex justify-end">
            <Button size="sm" disabled={pending} onClick={() => print.mutate(preview.printable)}>Imprimir</Button>
          </div>
        </div>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
