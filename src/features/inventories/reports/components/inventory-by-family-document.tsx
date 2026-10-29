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
export function InventoryByFamilyDocument({ report, detail = false, page, pageSize = 100 }: {
  report: InventoryByFamily; detail?: boolean; page?: number; pageSize?: number
}) {
  const rows = report.groups.flatMap(group => group.products)
  const products = page === undefined ? rows : rows.slice((page - 1) * pageSize, page * pageSize)
  return <article className="inventory-family-document bg-white p-3 text-black">
    <header className="mb-3 space-y-1 text-center">
      <h2 className="text-sm font-semibold">{report.company}</h2>
      <h3 className="text-sm font-semibold">Inventario por familia al {inventoryDate(report.criteria.asOf)}</h3>
      <p className="text-xs">{report.criteria.warehouse === "all" ? "" : report.criteria.warehouse + " · "}{report.warehouseName}</p>
      <p className="text-[10px]">Clasificación IFAMB · Cantidades en unidad del producto · {detail ? "Detalle por producto" : "Resumen por familia"}</p>
    </header>
    {report.provisional && <p role="note" className="mb-3 border border-amber-600 bg-amber-50 p-2 text-xs font-semibold text-amber-950">{report.notes[0]}</p>}
    {detail ? <Table className="min-w-[980px]" aria-label="Detalle de inventario">
      <TableHeader><TableRow>{["Familia", "Código", "Descripción", "Alm.", "UM", "Entradas", "Salidas", "Existencia fechada", "Sin fecha (±)", "Primer mov.", "Último mov."].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{products.map(row => <TableRow key={row.productId + ":" + row.warehouse}>
        <TableCell>{row.family || "Sin familia"}</TableCell><TableCell>{row.code}</TableCell>
        <TableCell className="max-w-80 whitespace-normal">{row.description}</TableCell><TableCell>{row.warehouse || "—"}</TableCell>
        <Quantities row={row} /><TableCell>{inventoryDate(row.firstDate)}</TableCell><TableCell>{inventoryDate(row.lastDate)}</TableCell>
      </TableRow>)}</TableBody>
    </Table> : <Table className="min-w-[650px]" aria-label="Inventario por familia y unidad">
      <TableHeader><TableRow>{["Familia", "Descripción", "UM", "Entradas", "Salidas", "Existencia fechada", "Sin fecha (±)"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{report.groups.map(group => <Fragment key={group.code}>{group.totals.map(row => <TableRow key={row.unitId}>
        <TableCell>{group.code || "—"}</TableCell><TableCell>{group.name}</TableCell><Quantities row={row} />
      </TableRow>)}</Fragment>)}
      {report.totals.map(row => <TableRow key={"total:" + row.unitId} className="border-t-2 font-semibold"><TableCell colSpan={2}>Total por unidad</TableCell><Quantities row={row} /></TableRow>)}
      </TableBody>
    </Table>}
    <footer className="mt-3 space-y-1 text-[9px] leading-relaxed">
      {report.notes.filter(note => !note.startsWith("PROVISIONAL:")).map(note => <p key={note}>{note}</p>)}
      <p>Se incluyen los productos con movimientos, aunque su existencia neta sea cero. Emitido: {new Date(report.generatedAt).toLocaleString("es-MX")}</p>
    </footer>
  </article>
}
