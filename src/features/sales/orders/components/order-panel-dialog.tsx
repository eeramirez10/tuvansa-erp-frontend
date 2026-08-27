import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { OrderCommentsContent } from "@/features/sales/orders/components/order-comments-content"
import { orderPanelQueryOptions } from "@/features/sales/orders/logic"
import type { Order, OrderPanelDefinition } from "@/features/sales/orders/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const columnLabels: Record<string, string> = {
  documentNumber: "Docto", date: "Fecha", productCode: "Código", description: "Descripción",
  quantity: "Cantidad", pieces: "Pzas", serialNumber: "Número", warehouse: "Alm",
  reference: "Refer", createdAt: "Alta", receipt: "Recepción", invoice: "Factura",
  ordered: "Pedido", fulfilled: "Surtido", remaining: "Resta", assigned: "Asignado",
  assignable: "Por asignar", lineId: "Partida", branch: "Suc", price: "Precio",
  supplierCode: "Proveedor", supplierName: "Razón social", branchCode: "Sucursal",
  branchName: "Nombre", address1: "Dirección", state: "Estado", city: "Ciudad",
  ctReference: "CT", status: "Status", exportedAt: "Exportación", packedAt: "Empaque",
}
const format = (value: unknown) => value === null || value === undefined || value === "" ? "" : typeof value === "boolean" ? (value ? "Sí" : "No") : String(value)

function DataTable({ items }: { items: Array<Record<string, unknown>> }) {
  const columns = items[0] ? Object.keys(items[0]).filter((column) => column !== "kind") : []
  return (
    <ErpDataTableViewport className="h-[22rem]" axes="xy">
      <Table className="min-w-[920px] text-[9px]"><TableHeader><TableRow>
        {columns.map((column) => <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{columnLabels[column] ?? column}</TableHead>)}
      </TableRow></TableHeader><TableBody>
        {items.map((item, rowIndex) => <TableRow key={rowIndex}>{columns.map((column) => <TableCell className="whitespace-nowrap px-1 py-0.5" key={column}>{format(item[column])}</TableCell>)}</TableRow>)}
      </TableBody></Table>
    </ErpDataTableViewport>
  )
}

function Classifications({ items }: { items: Array<Record<string, unknown>> }) {
  const current = items.find((item) => item.kind === "current") ?? {}
  const fields = [
    ["agent", "AGENTE"], ["sector", "GIRO O SECTOR"], ["branchOffice", "SUCURSAL"],
    ["statusClassifier", "STATUS"], ["driver", "CONDUCTO"], ["reason", "MOTIVO"], ["freight", "FLETE"],
  ] as const
  return <div className="mx-auto grid max-w-[28rem] gap-1 py-2">{fields.map(([key, label]) => (
    <label className="grid grid-cols-[6.5rem_1fr] items-center gap-1" key={key}><span className="text-right">{label}</span><Input className="h-5 text-[9px]" readOnly value={format(current[key])} /></label>
  ))}<p className="pt-2 text-[8px]">Los clasificadores 8 y 9 no son modificables.</p></div>
}

function Boxes() {
  const actions = ["Imprimir Instrucciones para Empaque","Imprimir Lista de Empaque","Imprimir Remisión por Transporte","Imprimir Hojas de Empaque Simplificadas","Imprimir Hojas de Empaque Detalladas","Imprimir Etiquetas Simplificadas","Imprimir Etiquetas Detalladas","Verificar"]
  return <div className="grid gap-2"><div className="grid grid-cols-[1fr_auto] gap-1"><Input className="h-16 text-[9px]" readOnly value="" /><Button size="sm" variant="outline">Generar</Button></div><div className="grid grid-cols-2 gap-1">{actions.map((action) => <Button className="justify-start" key={action} size="xs" variant="outline">{action}</Button>)}</div><DataTable items={[]} /></div>
}

function PrintOptions({ number }: { number: string }) {
  return <div className="mx-auto grid max-w-[28rem] gap-2 py-4"><div className="grid grid-cols-2 gap-2"><label>De la:<Input className="h-5 text-[9px]" readOnly value={number} /></label><label>A la:<Input className="h-5 text-[9px]" readOnly value={number} /></label></div><label>Número de copias:<Input className="h-5 text-[9px]" readOnly value="1" /></label><div className="grid grid-cols-3 gap-1">{["Pedido","Lista de empaque","Resumen","Pedido-surtido","Asignado"].map((item) => <label key={item}><input className="mr-1" name="print-type" type="radio" />{item}</label>)}</div><div className="flex gap-4"><label><input className="mr-1" name="destination" type="radio" />Pantalla</label><label><input className="mr-1" defaultChecked name="destination" type="radio" />Impresora</label></div></div>
}

export function OrderPanelDialog({ order, panel, onOpenChange }: { order: Order; panel: OrderPanelDefinition; onOpenChange: (open: boolean) => void }) {
  const query = useQuery(orderPanelQueryOptions(order.id, panel.key))
  const data = query.data?.data
  const title = panel.key === "invoices" ? "Facturas de pedido" : panel.key === "boxes" ? "Empaque" : panel.key === "classifications" ? "Clasificadores" : panel.key === "comments" ? "Comentarios del pedido" : panel.key === "pieces" ? "Piezas" : panel.label
  return (
    <ErpDataDialog className={panel.key === "comments" ? "sm:max-w-[62rem]" : "sm:max-w-[58rem]"} description={`Acción ${panel.label} del pedido ${order.number}`} onOpenChange={onOpenChange} title={title}>
      <ErpDataDialogBody className="grid gap-1.5">
        {query.isPending ? <div className="grid min-h-64 place-items-center"><Spinner /></div> : query.isError ? <Alert variant="destructive"><HugeiconsIcon icon={InformationCircleIcon} /><AlertTitle>No fue posible cargar la acción</AlertTitle><AlertDescription>Revise la conexión con la API.</AlertDescription></Alert> : !data?.available ? <Alert><HugeiconsIcon icon={InformationCircleIcon} /><AlertTitle>Acción no disponible</AlertTitle><AlertDescription>{data?.reason}</AlertDescription></Alert> : panel.key === "comments" ? <OrderCommentsContent order={order} panel={data} /> : panel.key === "classifications" ? <Classifications items={data.items} /> : panel.key === "boxes" ? <Boxes /> : panel.key === "print" ? <PrintOptions number={order.number} /> : <DataTable items={data.items} />}
        {panel.key !== "comments" && data?.summary && <div className="flex flex-wrap gap-1">{Object.entries(data.summary).map(([key, metric]) => <ErpDataMetric key={key} label={columnLabels[key] ?? key} value={format(metric)} />)}</div>}
        <footer className="flex justify-end gap-1">{panel.key === "classifications" && <Button size="sm" variant="outline">Guardar</Button>}{panel.key === "pieces" && <Button size="sm" variant="outline">Piezas</Button>}{panel.key === "comments" && <Button onClick={() => onOpenChange(false)} size="sm">Ok</Button>}<Button onClick={() => onOpenChange(false)} size="sm" variant="outline">{panel.key === "comments" ? "Cancelar" : "Cerrar"}</Button></footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
