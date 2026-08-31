import { useQuery } from "@tanstack/react-query"
import { purchaseOrderPanelQueryOptions } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderAction, PurchaseOrderPanel } from "@/features/purchasing/purchase-orders/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const text = (value: unknown) => value === null || value === undefined ? "" : String(value)

function Field({ label, value, className = "" }: { label: string; value: unknown; className?: string }) {
  return <label className={`grid min-w-0 gap-0.5 ${className}`}><span className="truncate text-[8px]">{label}</span><Input className="h-5 px-1 text-[9px]" readOnly value={text(value)} /></label>
}

function Receipts({ panel }: { panel: PurchaseOrderPanel }) {
  return (
    <ErpDataTableViewport axes="xy" className="h-[18rem]">
      <Table className="min-w-[28rem] text-[9px]">
        <TableHeader><TableRow><TableHead className="h-5 px-1 text-[9px]">Docto</TableHead><TableHead className="h-5 px-1 text-[9px]">Fecha</TableHead></TableRow></TableHeader>
        <TableBody>{panel.items.map((row, index) => <TableRow key={index}><TableCell className="px-1 py-0.5">{text(row.document)}</TableCell><TableCell className="px-1 py-0.5">{text(row.date)}</TableCell></TableRow>)}</TableBody>
      </Table>
    </ErpDataTableViewport>
  )
}

const classifierLabels = ["AGENTE", "TIPO CLIENTE", "SUCURSAL", "", "", "TIPO", "FLETE", "TIPO DE PROVEE", "PROYECTO"]

function Classifications({ purchaseOrder, panel }: { purchaseOrder: PurchaseOrder; panel: PurchaseOrderPanel }) {
  const optionsByClassifier = new Map<string, Array<Record<string, unknown>>>()
  panel.items.forEach((item) => {
    const key = text(item.classifier)
    optionsByClassifier.set(key, [...(optionsByClassifier.get(key) ?? []), item])
  })
  return (
    <div className="grid gap-1 py-1">
      {classifierLabels.map((label, index) => (
        <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-1" key={index}>
          <Label className="text-right text-[9px]">{label}</Label>
          <select className="h-6 min-w-0 rounded border bg-background px-1 text-[9px] disabled:opacity-100" disabled value={purchaseOrder.classifications[index] ?? ""}>
            <option value="" />
            {(optionsByClassifier.get(String(index + 1)) ?? []).map((option, optionIndex) => (
              <option key={optionIndex} value={text(option.compositeCode || option.code)}>{text(option.code)} {text(option.description)}</option>
            ))}
          </select>
        </div>
      ))}
      <div className="flex justify-end"><Button disabled size="sm">Guardar</Button></div>
    </div>
  )
}

function Comments({ purchaseOrder, panel }: { purchaseOrder: PurchaseOrder; panel: PurchaseOrderPanel }) {
  const comment = panel.items[0] ?? {}
  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-12 gap-1">
        <Field className="col-span-2" label="Desde" value={purchaseOrder.dates.from} />
        <Field className="col-span-2" label="Hasta" value={purchaseOrder.dates.dueAt} />
        <Field className="col-span-1" label="Plazo" value="" />
        <Field className="col-span-3" label="Número ello" value={purchaseOrder.supplierOrderNumber} />
        <Field className="col-span-2" label="Depto" value={purchaseOrder.department} />
        <Field className="col-span-2" label="Alm" value={purchaseOrder.warehouse} />
      </div>
      <Field label="DESCTO" value={comment.description} />
      <Field label="L.A.B." value={comment.line2} />
      <Field label="LONGITUD" value={comment.line3} />
      <Field label="ORIGEN" value={comment.line4} />
      <div className="grid grid-cols-3 gap-1">
        <Field label="Alta" value={comment.createdBy} />
        <Field label="Autorizo" value={comment.authorizedBy} />
        <Field label="Cambios" value={comment.changesCount} />
      </div>
      <textarea className="min-h-40 resize-none rounded-md border bg-background p-2 text-[9px]" readOnly value={text(comment.comments || comment.auditTrail)} />
      <div className="grid grid-cols-4 gap-1">
        <Field label="Flete" value={purchaseOrder.totals.freight} />
        <Field label="Seguros" value={purchaseOrder.totals.insurance} />
        <Field label="Otros" value={purchaseOrder.totals.other} />
        <Field label="Documento proveedor" value={comment.supplierDocumentNumber} />
      </div>
    </div>
  )
}

function ReadPanel({ purchaseOrder, action, onClose }: { purchaseOrder: PurchaseOrder; action: PurchaseOrderAction; onClose: () => void }) {
  const query = useQuery(purchaseOrderPanelQueryOptions(purchaseOrder.id, action.panelKey!))
  const panel = query.data
  return (
    <ErpDataDialog className={action.key === "comments" ? "sm:max-w-[62rem]" : "sm:max-w-[34rem]"} description={`${action.label} de ${purchaseOrder.number}`} onOpenChange={(open) => !open && onClose()} title={action.key === "receipts" ? "Recepciones de O.C." : action.label}>
      <ErpDataDialogBody className="grid gap-1.5">
        {query.isPending && <div className="grid min-h-48 place-items-center"><Spinner /></div>}
        {query.isError && <Alert variant="destructive"><AlertTitle>No fue posible cargar</AlertTitle><AlertDescription>Revise la conexión con la API.</AlertDescription></Alert>}
        {panel && action.key === "receipts" && <Receipts panel={panel} />}
        {panel && action.key === "classifications" && <Classifications panel={panel} purchaseOrder={purchaseOrder} />}
        {panel && action.key === "comments" && <Comments panel={panel} purchaseOrder={purchaseOrder} />}
        <footer className="flex justify-end gap-1"><Button onClick={onClose} size="sm">OK</Button>{action.key !== "receipts" && <Button onClick={onClose} size="sm" variant="outline">Cancelar</Button>}</footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseOrderActionDialog({ purchaseOrder, action, onClose }: {
  purchaseOrder: PurchaseOrder
  action: PurchaseOrderAction
  onClose: () => void
}) {
  if (action.panelKey) return <ReadPanel action={action} onClose={onClose} purchaseOrder={purchaseOrder} />
  return (
    <ErpDataDialog className="sm:max-w-[34rem]" description={`${action.label} de ${purchaseOrder.number}`} onOpenChange={(open) => !open && onClose()} title={action.label}>
      <ErpDataDialogBody className="grid gap-2">
        <Alert><AlertTitle>Acción conservada en el diseño</AlertTitle><AlertDescription>OMNIS puede modificar datos al ejecutar esta acción. Permanecerá sin operación hasta habilitar la fase de escritura de la nueva base.</AlertDescription></Alert>
        <div className="flex justify-end"><Button onClick={onClose} size="sm">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
