import type { ReactNode } from "react"

import type { Order, OrderPanelDefinition } from "@/features/sales/orders/model"
import { Button } from "@/shared/ui/button"
import { ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type SecondaryActionDesignProps = {
  order: Order
  panel: OrderPanelDefinition
  onClose: () => void
}

const matrixColumns = Array.from({ length: 17 }, (_, index) => index)
const matrixRows = Array.from({ length: 9 }, (_, index) => index)

function Footer({ children }: { children: ReactNode }) {
  return <footer className="flex justify-end gap-1 pt-1">{children}</footer>
}

function LegacyInput({ value = "", className = "" }: { value?: string | number; className?: string }) {
  return <Input className={`h-5 min-w-0 px-1 text-[9px] ${className}`} readOnly value={value} />
}

function Matrix({ totals = false, height = "h-[10rem]" }: { totals?: boolean; height?: string }) {
  return (
    <ErpDataTableViewport axes="xy" className={height}>
      <div className="min-w-[35rem] bg-muted p-1">
        <div className="grid gap-px" style={{ gridTemplateColumns: "3rem repeat(17, 1.8rem) 2rem" }}>
          <span />
          {matrixColumns.map((column) => <LegacyInput key={`head-${column}`} />)}
          <span>{totals ? "Tots" : ""}</span>
          <span />
          {matrixColumns.map((column) => <LegacyInput key={`total-${column}`} value="0.00" />)}
          <LegacyInput value={totals ? "0" : ""} />
          {matrixRows.flatMap((row) => [
            <span key={`row-label-${row}`} />,
            ...matrixColumns.map((column) => (
              <span className="h-4 border border-input bg-background" key={`cell-${row}-${column}`} />
            )),
            <span key={`row-total-${row}`} />,
          ])}
        </div>
      </div>
    </ErpDataTableViewport>
  )
}

function ColorSizeCapture({ order }: { order: Order }) {
  return (
    <div className="grid gap-1 p-1">
      <ErpDataTableViewport axes="x" className="p-1">
        <div className="grid min-w-[35rem] gap-px" style={{ gridTemplateColumns: "3rem repeat(17, 1.8rem)" }}>
          <span className="self-center text-center">Tallas</span>
          {matrixColumns.map((column) => <LegacyInput key={`size-${column}`} />)}
          <span className="self-center text-center">Colores</span>
          {matrixColumns.map((column) => <LegacyInput key={`color-${column}`} />)}
        </div>
      </ErpDataTableViewport>
      <Matrix />
      <div className="grid grid-cols-[auto_4rem_auto_4rem_auto_4rem_auto_5rem] items-center gap-1">
        <span>precio</span><LegacyInput value={order.lines[0]?.price ?? ""} />
        <span>desc</span><LegacyInput value={order.lines[0]?.discount ?? ""} />
        <span>Pzas</span><LegacyInput value={order.lines[0]?.ordered ?? ""} />
        <span>Sucursal</span>
        <select className="h-5 border border-input bg-background px-1 text-[9px]" defaultValue={String(order.branch)}>
          <option value={String(order.branch)}>{order.branch}</option>
        </select>
      </div>
    </div>
  )
}

function Consolidate({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] items-center gap-x-2 gap-y-3 p-2">
      <div className="grid h-8 w-8 place-items-center rounded-full border border-module-sales/60 bg-module-sales/10 text-xl font-bold text-module-sales">?</div>
      <p className="grid gap-1 text-[10px]">
        <span>Se debe imprimir el pedido antes de efectuar esta operación porque no es reversible.</span>
        <span>¿Está seguro que desea consolidar este pedido?</span>
      </p>
      <div className="col-span-2">
        <Footer>
          <Button onClick={onClose} size="sm" variant="outline">No</Button>
          <Button size="sm">Yes</Button>
        </Footer>
      </div>
    </div>
  )
}

function OrderCt({ order }: { order: Order }) {
  return (
    <div className="grid gap-1 p-1">
      <div className="grid grid-cols-[1fr_7rem] gap-4">
        <ErpDataTableViewport axes="xy" className="h-[17rem]">
          <Table className="min-w-[31rem] text-[9px]">
            <TableHeader><TableRow>{["Código", "Producto", "Pedido", "Surtido", "Resta"].map((column) => <TableHead className="h-5 px-1" key={column}>{column}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{order.lines.map((line) => <TableRow key={line.id}><TableCell className="px-1 py-0.5">{line.productCode}</TableCell><TableCell className="px-1 py-0.5">{line.description}</TableCell><TableCell className="px-1 py-0.5 text-right">{line.ordered}</TableCell><TableCell className="px-1 py-0.5 text-right">{line.fulfilled}</TableCell><TableCell className="px-1 py-0.5 text-right">{line.remaining}</TableCell></TableRow>)}</TableBody>
          </Table>
        </ErpDataTableViewport>
        <div className="grid content-start justify-items-center gap-1 pt-3">
          {['Pedido', 'Surtido', 'Resta'].map((label) => <Button key={label} size="xs" variant="outline">{label}</Button>)}
          <div className="mt-auto grid grid-cols-[auto_4rem] items-center gap-1">
            <span>Total</span><LegacyInput className="text-right" value={order.totals.quantity} />
            <span className="italic">Cambio</span><LegacyInput className="text-right" value="0" />
          </div>
        </div>
      </div>
      <Matrix height="h-[9rem]" />
    </div>
  )
}

function LinesWindow({ order, mode }: { order: Order; mode: "split-ct" | "split" }) {
  const columns = mode === "split-ct"
    ? ["Partida", "Producto", "CT", "Pedido", "Pendiente"]
    : ["Partida", "Producto", "Descripción", "Pedido", "Surtido", "Resta"]

  return (
    <div className="grid gap-1">
      <ErpDataTableViewport axes="xy" className="h-[20rem]">
        <Table className="min-w-[42rem] text-[9px]">
          <TableHeader><TableRow>{columns.map((column) => <TableHead className="h-5 whitespace-nowrap px-1" key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{order.lines.map((line) => {
            const values = mode === "split-ct"
              ? [line.id, line.productCode, line.piecesAssignment, line.ordered, line.remaining]
              : [line.id, line.productCode, line.description, line.ordered, line.fulfilled, line.remaining]
            return <TableRow key={line.id}>{values.map((value, index) => <TableCell className="whitespace-nowrap px-1 py-0.5" key={index}>{value}</TableCell>)}</TableRow>
          })}</TableBody>
        </Table>
      </ErpDataTableViewport>
      <Footer><Button size="sm">{mode === "split-ct" ? "Dividir CT" : "Split"}</Button></Footer>
    </div>
  )
}

function ExportColorSize({ order }: { order: Order }) {
  const firstLine = order.lines[0]
  return (
    <div className="grid gap-2 p-1">
      <Matrix height="h-[18rem]" totals />
      <div className="grid grid-cols-[6rem_1fr] gap-4"><LegacyInput value={firstLine?.productCode ?? ""} /><LegacyInput value={firstLine?.description ?? ""} /></div>
      <div className="grid grid-cols-[auto_4rem_auto_4rem_auto_6rem_auto_5rem_1fr] items-center gap-1">
        <span>Precio</span><LegacyInput value={firstLine?.price ?? ""} />
        <span>Desc</span><LegacyInput value={firstLine?.discount ?? ""} />
        <span>Pzas</span><LegacyInput value={firstLine?.ordered ?? ""} />
        <span>Sucursal</span><LegacyInput value={order.branch} />
        <div className="grid grid-cols-[auto_4rem] items-center gap-1"><span>UM</span><LegacyInput value={firstLine?.unit ?? ""} /></div>
      </div>
      <div className="ml-auto grid grid-cols-[auto_5rem] items-center gap-1"><span>Bultos</span><LegacyInput value={order.number} /></div>
    </div>
  )
}

function PurchaseOrder({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="mx-auto grid max-w-[15rem] gap-1 p-3">
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Proveedor :</span><LegacyInput /></label>
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Número :</span><LegacyInput value="0000007" /></label>
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Porcentaje :</span><LegacyInput value="100.00" /></label>
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Fecha :</span><LegacyInput value={order.dates.orderedAt ?? ""} /></label>
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Desde :</span><LegacyInput value={order.dates.from ?? ""} /></label>
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Numero ellos</span><LegacyInput value={order.customerOrderNumber} /></label>
      <Footer><Button size="sm">OK</Button><Button onClick={onClose} size="sm" variant="outline">Cancelar</Button></Footer>
    </div>
  )
}

function Branch({ onClose }: { onClose: () => void }) {
  return (
    <div className="mx-auto grid max-w-[13rem] gap-2 p-4">
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Número :</span><LegacyInput /></label>
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Porcentaje :</span><LegacyInput value="100.00" /></label>
      <label className="grid grid-cols-[5rem_1fr] items-center gap-1"><span className="text-right">Sucursal:</span><LegacyInput /></label>
      <Footer><Button size="sm">✓ OK</Button><Button onClick={onClose} size="sm" variant="outline">× Cancelar</Button></Footer>
    </div>
  )
}

function Wip({ order }: { order: Order }) {
  return (
    <div className="grid gap-1 p-1">
      <LegacyInput className="w-16 text-right" value="0.00" />
      <ErpDataTableViewport axes="xy" className="h-[14rem]">
        <Table className="min-w-[39rem] text-[9px]">
          <TableHeader><TableRow>{["O.P.", "Producto", "Operación", "Maq.", "Solicitado", "Recibido", "Resta", "Inicio"].map((column) => <TableHead className="h-5 whitespace-nowrap px-1" key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{order.lines.map((line) => <TableRow key={line.id}><TableCell className="px-1 py-0.5" /><TableCell className="px-1 py-0.5">{line.productCode}</TableCell><TableCell className="px-1 py-0.5" /><TableCell className="px-1 py-0.5" /><TableCell className="px-1 py-0.5 text-right">{line.ordered}</TableCell><TableCell className="px-1 py-0.5 text-right">{line.fulfilled}</TableCell><TableCell className="px-1 py-0.5 text-right">{line.remaining}</TableCell><TableCell className="px-1 py-0.5" /></TableRow>)}</TableBody>
        </Table>
      </ErpDataTableViewport>
      <div className="flex justify-center gap-12"><LegacyInput className="w-16 text-right" value="0" /><LegacyInput className="w-16 text-right" value="0.00" /><LegacyInput className="w-16 text-right" value="0.00" /></div>
    </div>
  )
}

export function OrderSecondaryActionDesignContent({ order, panel, onClose }: SecondaryActionDesignProps) {
  switch (panel.key) {
    case "assign-ct": return <ColorSizeCapture order={order} />
    case "consolidate": return <Consolidate onClose={onClose} />
    case "ct": return <OrderCt order={order} />
    case "split-ct": return <LinesWindow mode="split-ct" order={order} />
    case "export": return <ExportColorSize order={order} />
    case "purchase-order": return <PurchaseOrder onClose={onClose} order={order} />
    case "split": return <LinesWindow mode="split" order={order} />
    case "branch": return <Branch onClose={onClose} />
    case "wip": return <Wip order={order} />
    default: return <div className="p-4 text-center text-muted-foreground">Diseño pendiente.</div>
  }
}
