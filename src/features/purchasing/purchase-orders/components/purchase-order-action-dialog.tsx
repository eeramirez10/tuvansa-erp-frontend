import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { PurchaseOrderClassificationsDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-classifications-dialog"
import { PurchaseOrderCommentsDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-comments-dialog"
import { PurchaseOrderConfirmationDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-confirmation-dialog"
import { PurchaseOrderAuthorizationDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-authorization-dialog"
import { PurchaseOrderSupplierActionDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-supplier-change-dialog"
import { displayPurchaseOrderDate, purchaseOrderPanelQueryOptions } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderAction, PurchaseOrderColorSizeGroup, PurchaseOrderConfirmationMode, PurchaseOrderPanel } from "@/features/purchasing/purchase-orders/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const text = (value: unknown) => value === null || value === undefined ? "" : String(value)
const date = (value: unknown) => displayPurchaseOrderDate(text(value))
const quantity = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })

function Field({ label, value, className = "" }: { label: string; value: unknown; className?: string }) {
  return <label className={`grid min-w-0 gap-0.5 ${className}`}><span className="truncate text-[8px]">{label}</span><Input className="h-5 px-1 text-[9px]" readOnly value={text(value)} /></label>
}

function Receipts({ panel }: { panel: PurchaseOrderPanel }) {
  return (
    <ErpDataTableViewport axes="xy" className="h-[18rem]">
      <Table className="min-w-[28rem] text-[9px]">
        <TableHeader><TableRow><TableHead className="h-5 px-1 text-[9px]">Docto</TableHead><TableHead className="h-5 px-1 text-[9px]">Fecha</TableHead></TableRow></TableHeader>
        <TableBody>
          {panel.items.map((row, index) => <TableRow key={index}><TableCell className="px-1 py-0.5">{text(row.document)}</TableCell><TableCell className="px-1 py-0.5">{date(row.date)}</TableCell></TableRow>)}
          {!panel.items.length && <TableRow><TableCell className="px-1 py-1 text-muted-foreground" colSpan={2}>Sin recepciones</TableCell></TableRow>}
        </TableBody>
      </Table>
    </ErpDataTableViewport>
  )
}

const pieceColumns = [
  ["productCode", "Producto"], ["serial", "Serie"], ["pieces", "Pzas."], ["quantity", "Cant."],
  ["warehouse", "Alm."], ["document", "Docto."], ["receipt", "Recepción"],
] as const

function Pieces({ panel }: { panel: PurchaseOrderPanel }) {
  return (
    <>
      <ErpDataTableViewport axes="xy" className="h-[17rem]">
        <Table className="min-w-[36rem] text-[9px]">
          <TableHeader><TableRow>{pieceColumns.map(([key, label]) => <TableHead className="h-5 px-1" key={key}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {panel.items.map((row) => (
              <TableRow key={text(row.id)}>
                {pieceColumns.map(([key]) => <TableCell className="px-1 py-0.5" key={key}>{key === "quantity" ? quantity.format(Number(row[key])) : text(row[key])}</TableCell>)}
              </TableRow>
            ))}
            {!panel.items.length && <TableRow><TableCell className="px-1 py-1 text-muted-foreground" colSpan={pieceColumns.length}>Sin piezas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </ErpDataTableViewport>
      <div className="flex items-end justify-between gap-2">
        <div className="flex gap-1"><Button disabled size="sm" variant="outline">Confirmar</Button><Button disabled size="sm" variant="outline">Imprimir</Button></div>
        <Field label="Total" value={quantity.format(Number(panel.summary?.totalQuantity ?? 0))} />
      </div>
    </>
  )
}

const matrixModes = [["ordered", "Pedido"], ["fulfilled", "Surtido"], ["remaining", "Resta"]] as const

function ColorSize({ panel }: { panel: PurchaseOrderPanel }) {
  const groups = panel.items as PurchaseOrderColorSizeGroup[]
  const [selection, setSelection] = useState<string | undefined>()
  const [mode, setMode] = useState<typeof matrixModes[number][0]>("ordered")
  const current = groups.find((group) => group.root === selection) ?? groups[0]
  return (
    <>
      <ErpDataTableViewport axes="xy" className="h-[10rem]">
        <Table className="min-w-[28rem] text-[9px]">
          <TableHeader><TableRow>
            {["Producto", "Descripción", ...matrixModes.map(([, label]) => label)].map((label) => <TableHead className="h-5 px-1" key={label}>{label}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {groups.map((group) => <TableRow data-state={current === group ? "selected" : undefined} key={group.root} onClick={() => setSelection(group.root)}>
              <TableCell className="px-1 py-0.5"><Button className="px-1 font-mono" onClick={() => setSelection(group.root)} size="xs" variant="ghost">{group.root}</Button></TableCell>
              <TableCell className="px-1 py-0.5">{group.description}</TableCell>
              {matrixModes.map(([key]) => <TableCell className="px-1 py-0.5 text-right" key={key}>{quantity.format(group[key])}</TableCell>)}
            </TableRow>)}
            {groups.length === 0 && <TableRow><TableCell className="px-1 py-1 text-muted-foreground" colSpan={5}>Sin partidas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </ErpDataTableViewport>
      <div className="flex gap-1">
        {matrixModes.map(([key, label]) => <Button aria-pressed={mode === key} key={key} onClick={() => setMode(key)} size="sm" variant={mode === key ? "default" : "outline"}>{label}</Button>)}
        <Button disabled size="sm" variant="outline">Cambio</Button>
      </div>
      {current && current.sizes.length > 0 && (
        <ErpDataTableViewport axes="xy" className="h-[9rem]">
          <Table className="text-[9px]">
            <TableHeader><TableRow>
              <TableHead className="h-5 px-1">Color</TableHead>
              {current.sizes.map((size, index) => <TableHead className="h-5 px-1 text-right" key={index}>{size}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>{current.colors.map((row) => <TableRow key={row.color}><TableCell className="px-1 py-0.5">{row.color}</TableCell>
              {row[mode].map((value, index) => <TableCell className="px-1 py-0.5 text-right" key={index}>{value ? quantity.format(value) : ""}</TableCell>)}
            </TableRow>)}</TableBody>
          </Table>
        </ErpDataTableViewport>
      )}
      {current && current.sizes.length === 0 && <p className="text-[9px] text-muted-foreground">Producto sin tallas configuradas.</p>}
    </>
  )
}

function ReadPanel({ purchaseOrder, action, onClose, panelKey }: {
  purchaseOrder: PurchaseOrder; action: PurchaseOrderAction; onClose: () => void; panelKey: NonNullable<PurchaseOrderAction["panelKey"]>
}) {
  const query = useQuery(purchaseOrderPanelQueryOptions(purchaseOrder.id, panelKey))
  const panel = query.data
  return (
    <ErpDataDialog defaultWidth={panelKey === "receipts" ? 520 : 680} description={purchaseOrder.number} onOpenChange={(open) => !open && onClose()} title={panelKey === "receipts" ? "Recepciones de O.C." : action.label}>
      <ErpDataDialogBody className="grid gap-1.5">
        {query.isPending && <div className="grid min-h-48 place-items-center"><Spinner /></div>}
        {query.isError && <Alert variant="destructive"><AlertTitle>No fue posible cargar</AlertTitle><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {panel && panelKey === "receipts" && <Receipts panel={panel} />}
        {panel && panelKey === "ct" && <ColorSize panel={panel} />}
        {panel && panelKey === "pieces" && <Pieces panel={panel} />}
        <footer className="flex justify-end gap-1"><Button onClick={onClose} size="sm">Cerrar</Button></footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseOrderActionDialog({ purchaseOrder, action, onClose, confirmation }: {
  purchaseOrder: PurchaseOrder
  action: PurchaseOrderAction
  onClose: () => void
  confirmation?: PurchaseOrderConfirmationMode
}) {
  if (action.key === "confirm-all") return <PurchaseOrderConfirmationDialog purchaseOrder={purchaseOrder} initialMode={confirmation ?? "confirm"} onClose={onClose} />
  if (action.key === "authorize") return <PurchaseOrderAuthorizationDialog purchaseOrder={purchaseOrder} onClose={onClose} />
  if (action.key === "change-supplier") return <PurchaseOrderSupplierActionDialog purchaseOrder={purchaseOrder} onClose={onClose} />
  if (action.panelKey === "classifications") return <PurchaseOrderClassificationsDialog onClose={onClose} purchaseOrder={purchaseOrder} />
  if (action.panelKey === "comments") return <PurchaseOrderCommentsDialog onClose={onClose} purchaseOrder={purchaseOrder} />
  if (action.panelKey) return <ReadPanel action={action} onClose={onClose} panelKey={action.panelKey} purchaseOrder={purchaseOrder} />
  return (
    <ErpDataDialog className="sm:max-w-[34rem]" description={`${action.label} de ${purchaseOrder.number}`} onOpenChange={(open) => !open && onClose()} title={action.label}>
      <ErpDataDialogBody className="grid gap-2">
        <Alert><AlertTitle>Acción conservada en el diseño</AlertTitle><AlertDescription>OMNIS puede modificar datos al ejecutar esta acción. Permanecerá sin operación hasta habilitar la fase de escritura de la nueva base.</AlertDescription></Alert>
        <div className="flex justify-end"><Button onClick={onClose} size="sm">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
