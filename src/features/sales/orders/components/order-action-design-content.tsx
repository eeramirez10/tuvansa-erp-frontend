import type { ReactNode } from "react"
import type { Order, OrderPanelDefinition } from "@/features/sales/orders/model"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"

type ActionDesignProps = {
  order: Order
  panel: OrderPanelDefinition
  onClose: () => void
}

function Footer({ children }: { children: ReactNode }) {
  return <footer className="flex justify-end gap-1 pt-1">{children}</footer>
}

function Confirmation({ question, onClose }: { question: string; onClose: () => void }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] items-center gap-x-2 gap-y-3 p-2">
      <div className="grid h-8 w-8 place-items-center rounded-full border border-module-sales/60 bg-module-sales/10 text-xl font-bold text-module-sales">?</div>
      <p className="text-[10px]">{question}</p>
      <div className="col-span-2">
        <Footer>
          <Button onClick={onClose} size="sm" variant="outline">No</Button>
          <Button size="sm">Sí</Button>
        </Footer>
      </div>
    </div>
  )
}

function Authorization() {
  return (
    <div className="grid grid-cols-7 gap-2 p-2">
      {["A", "B", "C", "D", "E", "F", "G"].map((letter) => (
        <Button key={letter} size="sm" variant="outline">O.K. {letter}</Button>
      ))}
    </div>
  )
}

function Invoices() {
  return (
    <ErpDataTableViewport className="h-[15rem]" axes="y">
      <Table className="text-[9px]">
        <TableHeader><TableRow><TableHead className="h-5 px-1">Docto</TableHead><TableHead className="h-5 px-1">Fecha</TableHead></TableRow></TableHeader>
        <TableBody />
      </Table>
    </ErpDataTableViewport>
  )
}

const packingActions = [
  "Imprimir Instrucciones para Empaque",
  "Imprimir Lista de Empaque",
  "Imprimir Remisión por Transporte",
  "Imprimir Hojas de Empaque Simplificadas",
  "Imprimir Hojas de Empaque Detalladas",
  "Imprimir Etiquetas Simplificadas",
  "Imprimir Etiquetas Detalladas",
  "Verificar",
]

function EmptyGrid({ columns, height = "h-40", minWidth }: { columns: string[]; height?: string; minWidth?: string }) {
  return (
    <ErpDataTableViewport className={height} axes="xy">
      <Table className={`${minWidth ?? "min-w-full"} text-[9px]`}>
        <TableHeader><TableRow>{columns.map((column, index) => <TableHead className="h-5 whitespace-nowrap px-1" key={`${column}-${index}`}>{column}</TableHead>)}</TableRow></TableHeader>
        <TableBody />
      </Table>
    </ErpDataTableViewport>
  )
}

function Boxes({ order }: { order: Order }) {
  return (
    <div className="grid gap-1.5">
      <div className="grid grid-cols-[15rem_1fr] gap-3">
        <div className="grid content-start gap-1">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1"><span>Documento:</span><Input className="h-5 px-1 text-[9px]" readOnly value={order.number} /><Button size="xs" variant="outline">Generar</Button></div>
          <span>Información</span>
          <textarea className="h-[4.8rem] resize-none border border-input bg-background p-1 shadow-inner outline-none" readOnly />
          <span>Resumen por Tipo de Empaque</span>
          <EmptyGrid columns={["Tipo", "Factor", "Emps", "Piezas", ""]} height="h-[4.7rem]" />
        </div>
        <div className="grid content-start gap-1">
          <span>Acción</span>
          <div className="h-[12rem] overflow-y-auto border border-input bg-background p-0.5 shadow-inner">
            {packingActions.map((action) => <button className="block h-4 w-full px-0.5 text-left text-[9px] hover:bg-accent" key={action} type="button">{action}</button>)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1.35fr_1fr] gap-3">
        <div className="grid gap-1"><span>Lista de Empaques</span><EmptyGrid columns={["", "Tipo", "Suc.", "Empaque", "Prods.", "Pzas.", "Número", "Sello 1", "Sello 2", "Ver.", "Tra."]} height="h-[18rem]" minWidth="min-w-[680px]" /></div>
        <div className="grid gap-1"><span>Detalle del Empaque</span><EmptyGrid columns={["Documento", "Código", "SKU", "Cant."]} height="h-[18rem]" minWidth="min-w-[420px]" /></div>
      </div>
    </div>
  )
}

function Classifications({ order }: { order: Order }) {
  const values = [order.attention, ...order.classifications.slice(1, 7)]
  const labels = ["AGENTE", "GIRO O SECTOR", "SUCURSAL", "STATUS", "CONDUCTO", "MOTIVO", "FLETE"]
  return (
    <div className="grid gap-1 p-1">
      {labels.map((label, index) => (
        <label className="grid grid-cols-[6rem_1fr] items-center gap-1" key={label}>
          <span className="text-right">{label}</span>
          <select className="h-5 border border-input bg-background px-1 text-[9px]" defaultValue={values[index] ?? ""}><option>{values[index] ?? ""}</option></select>
        </label>
      ))}
      <Footer><Button size="sm">Guardar</Button></Footer>
      <p className="border-t border-input pt-1 text-[8px]">Los clasificadores 8 y 9 están no son modificables</p>
    </div>
  )
}

function Duplicate({ order, onClose }: { order: Order; onClose: () => void }) {
  const cells = [order.customer.code, "", "100.00", new Date().toLocaleDateString("es-MX"), String(order.branch), ""]
  const headers = ["Cliente", "Número", "Porcentaje", "Fecha", "Sucursal", "Agente"]
  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-[3.6rem_4.1rem_3.7rem_4.3rem_3.7rem_3.5rem] gap-px">
        {headers.map((header) => <span className="truncate" key={header}>{header}</span>)}
        {cells.map((cell, index) => <Input className="h-5 min-w-0 px-1 text-[9px]" key={`${headers[index]}-input`} readOnly value={cell} />)}
      </div>
      <EmptyGrid columns={headers} height="h-[10rem]" minWidth="min-w-[360px]" />
      <Footer><Button size="sm">✓ OK</Button><Button onClick={onClose} size="sm" variant="outline">× Cancelar</Button></Footer>
    </div>
  )
}

function LinesGrid({ order, mode }: { order: Order; mode: "labels" | "monarch" | "pieces" }) {
  const columns = mode === "pieces"
    ? ["Producto", "Descripción", "Cantidad", "Pzas.", "Número", "Alm.", "Referencia", "Fecha", "Recepción", "Factura"]
    : mode === "monarch"
      ? ["Producto", "Partida", "Suc.", "Etiqueta", "Prof.", "Color", "Talla", "Asignado", "Pedido", "Surtido"]
      : ["Partida", "Producto", "Descripción", "Pedido", "Surtido", "Etiqueta", "Color", "Talla"]
  return (
    <ErpDataTableViewport className="h-[20rem]" axes="xy">
      <Table className="min-w-[800px] text-[9px]">
        <TableHeader><TableRow>{columns.map((column) => <TableHead className="h-5 whitespace-nowrap px-1" key={column}>{column}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{order.lines.map((line) => (
          <TableRow key={line.id}>
            {(mode === "pieces"
              ? [line.productCode, line.description, line.ordered, "", "", order.warehouse, "", order.dates.orderedAt, "", ""]
              : mode === "monarch"
                ? [line.productCode, line.id, line.branch, "", "", line.color, line.size, line.assigned, line.ordered, line.fulfilled]
                : [line.id, line.productCode, line.description, line.ordered, line.fulfilled, "", line.color, line.size]
            ).map((value, index) => <TableCell className="whitespace-nowrap px-1 py-0.5" key={index}>{value}</TableCell>)}
          </TableRow>
        ))}</TableBody>
      </Table>
    </ErpDataTableViewport>
  )
}

function Print({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="mx-auto grid max-w-[24rem] gap-2 p-4">
      <div className="grid grid-cols-2 gap-8">
        <label className="grid grid-cols-[auto_1fr] items-center gap-1"><span>De la:</span><Input className="h-5 px-1 text-[9px]" readOnly value={order.number} /></label>
        <label className="grid grid-cols-[auto_1fr] items-center gap-1"><span>A la:</span><Input className="h-5 px-1 text-[9px]" readOnly value={order.number} /></label>
      </div>
      <label className="grid grid-cols-[7rem_6rem] items-center gap-1"><span>Número de copias:</span><Input className="h-5 px-1 text-[9px]" defaultValue="1.00" /></label>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2">
        {["Pedido", "Lista de empaque", "Resumen", "Pedido", "Pedido-surtido", "Asignado"].map((option, index) => <label className="flex items-center gap-1" key={`${option}-${index}`}><input defaultChecked={index === 0 || index === 3} name={index < 3 ? "print-main" : "print-detail"} type="radio" />{option}</label>)}
      </div>
      <div className="flex gap-5"><span>Imprimir en:</span><label><input className="mr-1" name="destination" type="radio" />Pantalla</label><label><input className="mr-1" defaultChecked name="destination" type="radio" />Impresora</label></div>
      <Input className="h-5 px-1 text-[9px]" defaultValue="1" />
      <Footer><Button size="sm">✓ OK</Button><Button onClick={onClose} size="sm" variant="outline">× Cancelar</Button></Footer>
    </div>
  )
}

export function OrderActionDesignContent({ order, panel, onClose }: ActionDesignProps) {
  switch (panel.key) {
    case "assign-all": return <Confirmation onClose={onClose} question="¿Desea asignar todo el pedido?" />
    case "authorize": return <Authorization />
    case "invoices": return <Invoices />
    case "boxes": return <Boxes order={order} />
    case "classifications": return <Classifications order={order} />
    case "quote-conversion": return <Confirmation onClose={onClose} question="¿Desea convertir el pedido/cotización?" />
    case "duplicate": return <Duplicate onClose={onClose} order={order} />
    case "labels": return <LinesGrid mode="labels" order={order} />
    case "print": return <Print onClose={onClose} order={order} />
    case "monarch": return <LinesGrid mode="monarch" order={order} />
    case "pieces": return order.lines.length === 0
      ? <div className="grid grid-cols-[2rem_1fr] items-center gap-2 p-3"><span className="text-xl text-amber-500">⚠</span><span>No hay partidas asignadas.</span><div className="col-span-2"><Footer><Button onClick={onClose} size="sm">OK</Button></Footer></div></div>
      : <LinesGrid mode="pieces" order={order} />
    case "transfer": return <Confirmation onClose={onClose} question="¿Desea traspasar los productos a otro almacén?" />
    default: return <div className="p-4 text-center text-muted-foreground">Diseño pendiente.</div>
  }
}
