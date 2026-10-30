import { Fragment } from "react"
import type { InventoryByFamily, InventoryMeasure, InventoryTotals } from "@/features/inventories/reports/model"
import { inventoryDate, inventoryMatrix, inventoryMoney, inventoryQuantity } from "@/features/inventories/reports/logic"
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
export function InventoryByFamilyDocument({ report, detail = false, page, pageSize = 100, warehouses, measure = "value", pendingOnly = false }: {
  report: InventoryByFamily; detail?: boolean; page?: number; pageSize?: number; warehouses?: string[]; measure?: InventoryMeasure; pendingOnly?: boolean
}) {
  const rows = report.groups.flatMap(group => group.products).filter(row => !pendingOnly || row.undatedMovements > 0)
  const products = page === undefined ? rows : rows.slice((page - 1) * pageSize, page * pageSize)
  const columns = report.meterColumns.filter(column => warehouses === undefined || warehouses.includes(column.warehouse))
  const matrix = inventoryMatrix(report, measure)
  const format = measure === "value" ? inventoryMoney : inventoryQuantity
  return <article className="inventory-family-document bg-white p-3 text-black">
    <header className="mb-3 space-y-1 text-center">
      <h2 className="text-sm font-semibold">{report.company}</h2>
      <h3 className="text-sm font-semibold">Inventario por familia al {inventoryDate(report.criteria.asOf)}</h3>
      <p className="text-xs">{report.criteria.warehouse === "all" ? "" : report.criteria.warehouse + " · "}{report.warehouseName}</p>
      <p className="text-[10px]">Clasificación IFAMB · {measure === "value" ? "Valuación con costo promedio ACTUAL (ILISTA4), moneda base" : "Metros estimados"} · {detail ? pendingOnly ? "Productos con movimientos pendientes de fecha" : "Detalle por producto con UM original" : "Resumen por familia"}</p>
      <p className="text-[9px]">Almacenes incluidos: {report.includedWarehouses.map(w => w.code).join(", ")}{report.criteria.scope === "branch" ? " · Sucursal y resguardos" : ""}</p>
      {warehouses && <p className="text-[9px]">Columnas: {columns.map(column => column.warehouse || "Sin almacén").join(", ")} · Total general de todos los almacenes seleccionados</p>}
    </header>
    {report.provisional && <p role="note" className="mb-3 border border-amber-600 bg-amber-50 p-2 text-xs font-semibold text-amber-950">{report.notes[0]}</p>}
    {measure === "value" && report.valuation.unpricedProducts > 0 && <p role="note" className="mb-2 border p-2 text-xs font-semibold">Valor incompleto: {report.valuation.unpricedProducts} productos/almacenes sin costo promedio válido. No se les asigna un importe inventado.</p>}
    {detail && measure === "value" ? <Table className="min-w-[1150px]" aria-label="Detalle de inventario">
      <TableHeader><TableRow>{["Familia", "Código", "Descripción", "Alm.", "UM", "Saldo fechado", "Sin fecha (±)", "Saldo reportado", "Costo prom. actual", "Valor reportado", "Primer mov.", "Último mov."].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{products.map(row => <TableRow key={row.productId + ":" + row.warehouse}>
        <TableCell>{row.family || "Sin familia"}</TableCell><TableCell>{row.code}</TableCell><TableCell className="max-w-80 whitespace-normal">{row.description}</TableCell><TableCell>{row.warehouse || "—"}</TableCell><TableCell>{row.unit}</TableCell>
        <TableCell className="text-right">{inventoryQuantity(row.datedQuantity)}</TableCell><TableCell className="text-right">{inventoryQuantity(row.undatedQuantity)}</TableCell><TableCell className="text-right">{inventoryQuantity(row.quantity)}</TableCell>
        <TableCell className="text-right">{row.averageCost && row.averageCost > 0 ? row.averageCost.toLocaleString("es-MX", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "Sin costo"}</TableCell>
        <TableCell className="text-right font-semibold">{row.valuation.unpricedProducts ? "Sin costo" : inventoryMoney(row.valuation.reported)}</TableCell>
        <TableCell>{inventoryDate(row.firstDate)}</TableCell><TableCell>{inventoryDate(row.lastDate)}</TableCell>
      </TableRow>)}</TableBody>
    </Table> : detail ? <Table className="min-w-[1200px]" aria-label="Detalle de inventario">
      <TableHeader><TableRow>{["Familia", "Código", "Descripción", "Alm.", "UM", "Entradas UM", "Salidas UM", "Existencia UM", "Sin fecha UM (±)", "m/UM", "Metros estimados", "Primer mov.", "Último mov."].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{products.map(row => <TableRow key={row.productId + ":" + row.warehouse}>
        <TableCell>{row.family || "Sin familia"}</TableCell><TableCell>{row.code}</TableCell>
        <TableCell className="max-w-80 whitespace-normal">{row.description}</TableCell><TableCell>{row.warehouse || "—"}</TableCell>
        <Quantities row={row} /><TableCell className="text-right">{row.metersPerUnit === null ? "Sin equivalencia" : row.metersPerUnit}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums">{row.meters === null ? "—" : inventoryQuantity(row.meters.quantity)}</TableCell>
        <TableCell>{inventoryDate(row.firstDate)}</TableCell><TableCell>{inventoryDate(row.lastDate)}</TableCell>
      </TableRow>)}</TableBody>
    </Table> : <Table className="inventory-family-matrix min-w-[650px]" aria-label={measure === "value" ? "Inventario por familia a costo promedio actual" : "Inventario por familia en metros estimados"}>
      <TableHeader><TableRow><TableHead>N.º</TableHead><TableHead>PRODUCTO / FAMILIA</TableHead>
        {columns.map(column => <Fragment key={column.warehouse}><TableHead className="text-center">{warehouseLabel(column.name)} {report.criteria.asOf.slice(0, 4)}</TableHead><TableHead>%</TableHead></Fragment>)}
        <TableHead className="text-center">{measure === "value" ? "TOTAL VALOR" : "TOTAL METROS"} {report.criteria.asOf.slice(0, 4)}</TableHead><TableHead>%</TableHead>
      </TableRow></TableHeader>
      <TableBody>{matrix.rows.map((group, index) => <TableRow key={group.code}>
        <TableCell>{index + 1}</TableCell><TableCell title={group.code}>{group.name}</TableCell>
        {group.cells.filter(cell => warehouses === undefined || warehouses.includes(cell.warehouse)).map(cell => <MeterCells key={cell.warehouse} quantity={cell.amount} percentage={cell.percentage} format={format} />)}
        <MeterCells quantity={group.amount} percentage={group.percentage} format={format} />
      </TableRow>)}
      <TableRow className="border-t-2 font-semibold"><TableCell /><TableCell>TOTAL INVENTARIO POR FAMILIA</TableCell>
        {matrix.totals.filter(cell => warehouses === undefined || warehouses.includes(cell.warehouse)).map(cell => <MeterCells key={cell.warehouse} quantity={cell.amount} percentage={cell.percentage} format={format} />)}
        <MeterCells quantity={matrix.total} percentage={matrix.total === 0 ? null : 100} format={format} />
      </TableRow>
      </TableBody>
    </Table>}
    {measure === "meters" && report.unconverted.some(total => total.quantity !== 0 || total.undatedQuantity !== 0) && <div className="mt-3 border p-2 text-[10px]">
      <p className="font-semibold">Saldos sin equivalencia a metros — no incluidos en el consolidado:</p>
      <p>{report.unconverted.filter(total => total.quantity !== 0 || total.undatedQuantity !== 0).map(total => inventoryQuantity(total.quantity) + " " + total.unit).join(" · ")}</p>
    </div>}
    <footer className="mt-3 space-y-1 text-[9px] leading-relaxed">
      {report.provisional && <p>Pendiente de fecha: {inventoryQuantity(report.meters.undatedQuantity)} m estimados; efecto a costo promedio actual: {inventoryMoney(report.valuation.unlinked)}. {report.criteria.includeUndated ? "Incluidos únicamente como escenario estimado." : "Separados del corte."}</p>}
      {report.notes.filter(note => !note.startsWith("PROVISIONAL")).map(note => <p key={note}>{note}</p>)}
      <p>Se incluyen los productos con movimientos, aunque su existencia neta sea cero. Emitido: {new Date(report.generatedAt).toLocaleString("es-MX")}</p>
    </footer>
  </article>
}

export function InventoryByFamilyPrintDocument({ report, detail, measure, pendingOnly }: { report: InventoryByFamily; detail: boolean; measure: InventoryMeasure; pendingOnly: boolean }) {
  if (detail || report.meterColumns.length <= 3) return <InventoryByFamilyDocument report={report} detail={detail} measure={measure} pendingOnly={pendingOnly} />
  const blocks: string[][] = []
  for (let index = 0; index < report.meterColumns.length; index += 3) blocks.push(report.meterColumns.slice(index, index + 3).map(column => column.warehouse))
  return <>{blocks.map((warehouses, index) => <InventoryByFamilyDocument key={index} report={report} warehouses={warehouses} measure={measure} />)}</>
}

function MeterCells({ quantity, percentage, format }: { quantity: number; percentage: number | null; format: (value: number) => string }) {
  return <><TableCell className="text-right tabular-nums">{format(quantity)}</TableCell><TableCell className="text-right tabular-nums">{percent(percentage)}</TableCell></>
}
