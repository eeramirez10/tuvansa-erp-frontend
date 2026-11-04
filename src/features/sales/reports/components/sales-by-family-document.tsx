import { Fragment } from "react"
import type { SalesByFamily, SalesMeasure } from "@/features/sales/reports/model"
import { salesDate, salesMatrix, salesMoney, salesPercentage, salesQuantity } from "@/features/sales/reports/logic"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
export function SalesByFamilyDocument({ report, measure, detail = false, page, branches }: { report: SalesByFamily; measure: SalesMeasure; detail?: boolean; page?: number; branches?: string[] }) {
  const matrix = salesMatrix(report, measure), format = measure === "amount" ? salesMoney : salesQuantity
  const rows = report.groups.flatMap(group => group.products), products = page === undefined ? rows : rows.slice((page - 1) * 100, page * 100)
  const columns = report.columns.filter(column => !branches || branches.includes(column.code))
  return <article className="sales-family-document bg-white p-3 text-black">
    <header className="mb-3 space-y-1 text-center">
      <h2 className="text-sm font-semibold">{report.company}</h2><h3 className="text-sm font-semibold">Ventas brutas por familia</h3>
      <p className="text-xs">Del {salesDate(report.criteria.from)} al {salesDate(report.criteria.to)} · {report.criteria.branch === "all" ? "Todas las sucursales" : report.columns[0]?.name}</p>
      <p className="text-[10px]">Familia IFAMB · Tipo de producto 1 · {measure === "amount" ? "Ventas antes de descuentos y devoluciones, sin IVA" : "Cantidades vendidas antes de devoluciones, en metros estimados"}</p>
      {branches && <p className="text-[9px]">Columnas: {columns.map(c => c.name).join(", ")} · Total general de todas las sucursales seleccionadas</p>}
    </header>
    <p className="mb-2 text-[10px]">Ventas brutas: {salesMoney(report.amount)} · {report.movements} movimientos de venta · Sin restar devoluciones ni notas de crédito.</p>
    {report.missingPrices > 0 && <p role="note" className="mb-2 border border-amber-600 p-2 text-xs">Importe incompleto: {report.missingPrices} movimientos sin precio bruto registrado.</p>}
    {detail ? <Table className="min-w-[1300px]" aria-label="Detalle de ventas por producto">
      <TableHeader><TableRow>{["Familia", "Código", "Descripción", "Suc.", "UM", "Cantidad vendida", "Metros estimados", "Ventas brutas $", "Mov.", "Tipos", "Primera fecha", "Última fecha"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{products.map(row => <TableRow key={row.productId + ":" + row.branch}>
        <TableCell>{row.family || "Sin familia"}</TableCell><TableCell>{row.code}</TableCell><TableCell className="max-w-80 whitespace-normal">{row.description}</TableCell><TableCell>{row.branch}</TableCell><TableCell>{row.unit}</TableCell>
        <TableCell className="text-right">{salesQuantity(row.units)}</TableCell><TableCell className="text-right">{row.meters === null ? "Sin equivalencia" : salesQuantity(row.meters)}</TableCell>
        <TableCell className="text-right font-semibold">{salesMoney(row.amount)}</TableCell>
        <TableCell>{row.movements}</TableCell><TableCell>{row.movementTypes}</TableCell><TableCell>{salesDate(row.firstDate)}</TableCell><TableCell>{salesDate(row.lastDate)}</TableCell>
      </TableRow>)}</TableBody>
    </Table> : <Table className="sales-family-matrix min-w-[650px]" aria-label="Resumen de ventas por familia">
      <TableHeader><TableRow><TableHead>N.º</TableHead><TableHead>PRODUCTO / FAMILIA</TableHead>
        {columns.map(column => <Fragment key={column.code}><TableHead>{column.name.replace(/^SUC[.]?\s*/i, "")}</TableHead><TableHead>%</TableHead></Fragment>)}<TableHead>{measure === "amount" ? "TOTAL VENTAS BRUTAS" : "TOTAL METROS"}</TableHead><TableHead>%</TableHead>
      </TableRow></TableHeader>
      <TableBody>{matrix.rows.map((group, index) => <TableRow key={group.code}><TableCell>{index + 1}</TableCell><TableCell title={group.code}>{group.name}</TableCell>
        {group.cells.filter(cell => !branches || branches.includes(cell.branch)).map(cell => <Fragment key={cell.branch}><TableCell className="text-right tabular-nums">{format(cell.amount)}</TableCell><TableCell className="text-right">{salesPercentage(cell.percentage)}</TableCell></Fragment>)}
        <TableCell className="text-right tabular-nums">{format(group.amount)}</TableCell><TableCell className="text-right">{salesPercentage(group.percentage)}</TableCell>
      </TableRow>)}
      <TableRow className="font-semibold"><TableCell /><TableCell>TOTAL VENTAS BRUTAS POR FAMILIA</TableCell>{matrix.totals.filter(cell => !branches || branches.includes(cell.branch)).map(cell => <Fragment key={cell.branch}><TableCell className="text-right">{format(cell.amount)}</TableCell><TableCell className="text-right">{salesPercentage(cell.percentage)}</TableCell></Fragment>)}<TableCell className="text-right">{format(matrix.total)}</TableCell><TableCell className="text-right">{matrix.total === 0 ? "—" : "100.00%"}</TableCell></TableRow>
      </TableBody>
    </Table>}
    <footer className="mt-3 space-y-1 text-[9px] leading-relaxed">{report.unconvertedProducts > 0 && <p>{report.unconvertedProducts} productos/sucursales con UM sin equivalencia a metros. Su importe sí está incluido.</p>}{report.notes.map(note => <p key={note}>{note}</p>)}<p>Emitido: {new Date(report.generatedAt).toLocaleString("es-MX")}</p></footer>
  </article>
}
export function SalesByFamilyPrintDocument({ report, measure, detail }: { report: SalesByFamily; measure: SalesMeasure; detail: boolean }) {
  if (detail || report.columns.length <= 3) return <SalesByFamilyDocument report={report} measure={measure} detail={detail} />
  const blocks: string[][] = []
  for (let index = 0; index < report.columns.length; index += 3) blocks.push(report.columns.slice(index, index + 3).map(column => column.code))
  return <>{blocks.map((branches, index) => <SalesByFamilyDocument key={index} report={report} measure={measure} branches={branches} />)}</>
}
