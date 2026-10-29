import { Fragment } from "react"
import type { InventoryByFamily, InventoryTotals } from "@/features/inventories/reports/model"
import { inventoryDate, inventoryQuantity } from "@/features/inventories/reports/logic"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function Quantities({ row }: { row: InventoryTotals }) {
  return <>
    <TableCell>{row.unit}</TableCell>
    <TableCell className="text-right tabular-nums">{inventoryQuantity(row.incoming)}</TableCell>
    <TableCell className="text-right tabular-nums">{inventoryQuantity(row.outgoing)}</TableCell>
    <TableCell className="text-right font-semibold tabular-nums">{inventoryQuantity(row.quantity)}</TableCell>
    <TableCell className="text-right tabular-nums">{row.undatedMovements ? inventoryQuantity(row.undatedQuantity) : "—"}</TableCell>
  </>
}
const percent = (value: number | null) => value === null ? "—" : value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%"
const warehouseLabel = (name: string) => name.replace(/^SUC[.]?\s*/i, "")
export function InventoryByFamilyDocument({ report, detail = false, page, pageSize = 100, warehouses }: {
  report: InventoryByFamily; detail?: boolean; page?: number; pageSize?: number; warehouses?: string[]
}) {
  const rows = report.groups.flatMap(group => group.products)
  const products = page === undefined ? rows : rows.slice((page - 1) * pageSize, page * pageSize)
  const columns = report.meterColumns.filter(column => warehouses === undefined || warehouses.includes(column.warehouse))
  return <article className="inventory-family-document bg-white p-3 text-black">
    <header className="mb-3 space-y-1 text-center">
      <h2 className="text-sm font-semibold">{report.company}</h2>
      <h3 className="text-sm font-semibold">Inventario por familia al {inventoryDate(report.criteria.asOf)}</h3>
      <p className="text-xs">{report.criteria.warehouse === "all" ? "" : report.criteria.warehouse + " · "}{report.warehouseName}</p>
      <p className="text-[10px]">Clasificación IFAMB · Metros estimados · {detail ? "Detalle por producto con UM original" : "Resumen por familia"}</p>
      {warehouses && <p className="text-[9px]">Columnas: {columns.map(column => column.warehouse || "Sin almacén").join(", ")} · Total general de todos los almacenes seleccionados</p>}
    </header>
    {report.provisional && <p role="note" className="mb-3 border border-amber-600 bg-amber-50 p-2 text-xs font-semibold text-amber-950">{report.notes[0]}</p>}
    {detail ? <Table className="min-w-[1200px]" aria-label="Detalle de inventario">
      <TableHeader><TableRow>{["Familia", "Código", "Descripción", "Alm.", "UM", "Entradas UM", "Salidas UM", "Existencia UM", "Sin fecha UM (±)", "m/UM", "Metros estimados", "Primer mov.", "Último mov."].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{products.map(row => <TableRow key={row.productId + ":" + row.warehouse}>
        <TableCell>{row.family || "Sin familia"}</TableCell><TableCell>{row.code}</TableCell>
        <TableCell className="max-w-80 whitespace-normal">{row.description}</TableCell><TableCell>{row.warehouse || "—"}</TableCell>
        <Quantities row={row} /><TableCell className="text-right">{row.metersPerUnit === null ? "Sin equivalencia" : row.metersPerUnit}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums">{row.meters === null ? "—" : inventoryQuantity(row.meters.quantity)}</TableCell>
        <TableCell>{inventoryDate(row.firstDate)}</TableCell><TableCell>{inventoryDate(row.lastDate)}</TableCell>
      </TableRow>)}</TableBody>
    </Table> : <Table className="inventory-family-matrix min-w-[650px]" aria-label="Inventario por familia en metros estimados">
      <TableHeader><TableRow><TableHead>N.º</TableHead><TableHead>PRODUCTO / FAMILIA</TableHead>
        {columns.map(column => <Fragment key={column.warehouse}><TableHead className="text-center">{warehouseLabel(column.name)} {report.criteria.asOf.slice(0, 4)}</TableHead><TableHead>%</TableHead></Fragment>)}
        <TableHead className="text-center">TOTAL INVENTARIO {report.criteria.asOf.slice(0, 4)}</TableHead><TableHead>%</TableHead>
      </TableRow></TableHeader>
      <TableBody>{report.groups.map((group, index) => <TableRow key={group.code}>
        <TableCell>{index + 1}</TableCell><TableCell title={group.code}>{group.name}</TableCell>
        {group.byWarehouse.filter(cell => warehouses === undefined || warehouses.includes(cell.warehouse)).map(cell => <MeterCells key={cell.warehouse} quantity={cell.quantity} percentage={cell.percentage} />)}
        <MeterCells quantity={group.meters.quantity} percentage={group.percentage} />
      </TableRow>)}
      <TableRow className="border-t-2 font-semibold"><TableCell /><TableCell>TOTAL INVENTARIO POR FAMILIA</TableCell>
        {report.meterTotals.filter(cell => warehouses === undefined || warehouses.includes(cell.warehouse)).map(cell => <MeterCells key={cell.warehouse} quantity={cell.quantity} percentage={cell.percentage} />)}
        <MeterCells quantity={report.meters.quantity} percentage={report.meters.quantity === 0 ? null : 100} />
      </TableRow>
      </TableBody>
    </Table>}
    {report.unconverted.some(total => total.quantity !== 0 || total.undatedQuantity !== 0) && <div className="mt-3 border p-2 text-[10px]">
      <p className="font-semibold">Saldos sin equivalencia a metros — no incluidos en el consolidado:</p>
      <p>{report.unconverted.filter(total => total.quantity !== 0 || total.undatedQuantity !== 0).map(total => inventoryQuantity(total.quantity) + " " + total.unit).join(" · ")}</p>
    </div>}
    <footer className="mt-3 space-y-1 text-[9px] leading-relaxed">
      {report.provisional && <p>Cantidad sin fecha convertible: {inventoryQuantity(report.meters.undatedQuantity)} m estimados (no incluida en el corte).</p>}
      {report.notes.filter(note => !note.startsWith("PROVISIONAL:")).map(note => <p key={note}>{note}</p>)}
      <p>Se incluyen los productos con movimientos, aunque su existencia neta sea cero. Emitido: {new Date(report.generatedAt).toLocaleString("es-MX")}</p>
    </footer>
  </article>
}

export function InventoryByFamilyPrintDocument({ report, detail }: { report: InventoryByFamily; detail: boolean }) {
  if (detail || report.meterColumns.length <= 3) return <InventoryByFamilyDocument report={report} detail={detail} />
  const blocks: string[][] = []
  for (let index = 0; index < report.meterColumns.length; index += 3) blocks.push(report.meterColumns.slice(index, index + 3).map(column => column.warehouse))
  return <>{blocks.map((warehouses, index) => <InventoryByFamilyDocument key={index} report={report} warehouses={warehouses} />)}</>
}

function MeterCells({ quantity, percentage }: { quantity: number; percentage: number | null }) {
  return <><TableCell className="text-right tabular-nums">{inventoryQuantity(quantity)}</TableCell><TableCell className="text-right tabular-nums">{percent(percentage)}</TableCell></>
}
