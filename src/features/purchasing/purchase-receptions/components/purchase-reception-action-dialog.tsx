import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { paths } from "@/app/router/paths"
import { purchaseReceptionPanelQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception, PurchaseReceptionAction, PurchaseReceptionPanel } from "@/features/purchasing/purchase-receptions/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const text = (value: unknown) => value === null || value === undefined ? "" : String(value)
const money = (value: unknown) => Number(value ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Auxiliary({ panel }: { panel: PurchaseReceptionPanel }) {
  const showPolicy = panel.items.some((item) => typeof item.policyId === "number")
  return (
    <div className="grid gap-1">
      <ErpDataTableViewport axes="xy" className="h-[16rem]">
        <Table className="min-w-[34rem] text-[9px]">
          <TableHeader><TableRow>
            {["Fecha", "T.M.", "Referencia", ...(showPolicy ? ["Póliza"] : []), "Cargos", "Abonos"].map((column) => <TableHead className="h-5 px-1 text-[9px]" key={column}>{column}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>{panel.items.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="px-1 py-0.5">{text(row.date)}</TableCell>
              <TableCell className="px-1 py-0.5">{text(row.transactionType)}</TableCell>
              <TableCell className="px-1 py-0.5">{text(row.reference)}</TableCell>
              {showPolicy && <TableCell className="px-1 py-0.5">{typeof row.policyId === "number" && (
                <Link className="text-primary underline" to={paths.accountingPolicy(row.policyId)}>{text(row.policyNumber)}</Link>
              )}</TableCell>}
              <TableCell className="px-1 py-0.5 text-right">{Number(row.charges ?? 0) === 0 ? "" : money(row.charges)}</TableCell>
              <TableCell className="px-1 py-0.5 text-right">{Number(row.payments ?? 0) === 0 ? "" : money(row.payments)}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </ErpDataTableViewport>
      <div className="ml-auto grid w-52 grid-cols-[auto_1fr] items-center gap-1">
        <Label className="text-right text-[9px]">Total</Label>
        <Input className="h-5 text-right text-[9px]" readOnly value={money(panel.summary?.total)} />
      </div>
    </div>
  )
}

const classifierLabels = ["AGENTE", "TIPO CLIENTE", "SUCURSAL", "", "", "TIPO", "FLETE", "TIPO DE PROVEE", "PROYECTO"]

function Classifications({ reception, panel }: { reception: PurchaseReception; panel: PurchaseReceptionPanel }) {
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
          <select className="h-6 min-w-0 rounded border bg-background px-1 text-[9px] disabled:opacity-100" disabled value={reception.classifications[index] ?? ""}>
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

function Pedimento({ panel }: { panel: PurchaseReceptionPanel }) {
  const { summary, items } = panel
  const data: [string, string][] = summary ? [
    ["No. Pedimento", text(summary.number)],
    ["Fecha", text(summary.date)],
    ["Aduana", text(summary.customsOffice)],
    ["Incrementables", money(summary.incrementables)],
  ] : []
  return (
    <div className="grid gap-2">
      {summary ? (
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
          {data.map(([label, value]) => <div className="contents" key={label}>
            <dt className="font-medium">{label}</dt><dd>{value || "—"}</dd>
          </div>)}
        </dl>
      ) : <p className="text-muted-foreground">Sin pedimento registrado.</p>}
      {items.length > 0 && (
        <section aria-label="Cargos de importación" className="grid gap-1">
          <p className="font-medium">Cargos de importación</p>
          <ErpDataTableViewport axes="xy" className="max-h-48">
            <Table className="min-w-[32rem] text-[9px]">
              <TableHeader><TableRow>
                {["Documento", "Proveedor", "Moneda", "Cargo", "Abonos", "Saldo", "Póliza"].map((column) => (
                  <TableHead className="h-5 px-1 text-[9px]" key={column}>{column}</TableHead>
                ))}
              </TableRow></TableHeader>
              <TableBody>{items.map((row) => (
                <TableRow key={text(row.id)}>
                  <TableCell className="px-1 py-0.5">
                    {typeof row.id === "number" ? <Link className="text-primary underline" to={paths.purchaseReception(row.id)}>
                      {text(row.number)}
                    </Link> : text(row.number)}
                  </TableCell>
                  <TableCell className="px-1 py-0.5">{text(row.supplierCode)} {text(row.supplierName)}</TableCell>
                  <TableCell className="px-1 py-0.5">{row.currencyId === 1 ? "MXN" : row.currencyId === 2 ? "USD" : text(row.currencyId)}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{money(row.charge)}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{row.paid === undefined ? "—" : money(row.paid)}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{money(row.balance)}</TableCell>
                  <TableCell className="px-1 py-0.5">{text(row.policyNumber) || "—"}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </ErpDataTableViewport>
        </section>
      )}
    </div>
  )
}

function ReadPanel({ reception, action, onClose }: { reception: PurchaseReception; action: PurchaseReceptionAction; onClose: () => void }) {
  const query = useQuery(purchaseReceptionPanelQueryOptions(reception.id, action.panelKey!))
  const panel = query.data
  const title = action.key === "auxiliary" ? "Auxiliar del documento" : action.key === "classifications" ? "Clasificadores" : action.label
  return (
    <ErpDataDialog className="sm:max-w-[38rem]" description={`${action.label} de ${reception.number}`} onOpenChange={(open) => !open && onClose()} title={title}>
      <ErpDataDialogBody className="grid gap-1.5">
        {query.isPending && <div className="grid min-h-48 place-items-center"><Spinner /></div>}
        {query.isError && <Alert variant="destructive"><AlertTitle>No fue posible cargar</AlertTitle><AlertDescription>Revise la conexión con la API.</AlertDescription></Alert>}
        {panel && action.key === "auxiliary" && <Auxiliary panel={panel} />}
        {panel && action.key === "classifications" && <Classifications panel={panel} reception={reception} />}
        {panel && action.key === "customs-entry" && <Pedimento panel={panel} />}
        <footer className="flex justify-end"><Button onClick={onClose} size="sm">Cerrar</Button></footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseReceptionActionDialog({ reception, action, onClose }: {
  reception: PurchaseReception
  action: PurchaseReceptionAction
  onClose: () => void
}) {
  if (action.panelKey) return <ReadPanel action={action} onClose={onClose} reception={reception} />
  return (
    <ErpDataDialog className="sm:max-w-[34rem]" description={`${action.label} de ${reception.number}`} onOpenChange={(open) => !open && onClose()} title={action.label}>
      <ErpDataDialogBody className="grid gap-2">
        <Alert><AlertTitle>Acción conservada en el diseño</AlertTitle><AlertDescription>Esta acción puede modificar datos en OMNIS. Permanecerá sin operación durante la etapa de API de solo lectura.</AlertDescription></Alert>
        <div className="flex justify-end"><Button onClick={onClose} size="sm">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
