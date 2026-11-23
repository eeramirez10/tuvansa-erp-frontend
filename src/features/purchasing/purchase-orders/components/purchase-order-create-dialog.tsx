import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState, type ReactNode } from "react"
import { PurchaseOrderLineEditor, type PurchaseOrderDraftLine } from "@/features/purchasing/purchase-orders/components/purchase-order-line-editor"
import { PurchaseOrderWarehouseDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-warehouse-dialog"
import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderCreateDefaults, PurchaseOrderCreateInput, PurchaseOrderCreateSupplier, PurchaseOrderEditLine } from "@/features/purchasing/purchase-orders/model"
import {
  createPurchaseOrder, getPurchaseOrderCreateDefaults, searchPurchaseOrderCreateProducts, searchPurchaseOrderCreateSuppliers,
} from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableRow } from "@/shared/ui/table"

type Header = Omit<PurchaseOrderCreateInput, "requestKey" | "supplierCode" | "lines">

const title = "Nueva orden de compra"
const fieldClass = "h-5 min-w-0 rounded-sm px-1 text-[9px]"
const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pieces = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 })
const supplierKey = (query: string) => [...purchaseOrderKeys.all, "create", "suppliers", query]

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-0.5"><span className="truncate">{label}</span>{children}</label>
}

function SupplierPicker({ initial, onSelect, onClose }: {
  initial: string
  onSelect: (supplier: PurchaseOrderCreateSupplier) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState(initial)
  const [submitted, setSubmitted] = useState(initial)
  const suppliers = useQuery({
    queryKey: supplierKey(submitted),
    queryFn: ({ signal }) => searchPurchaseOrderCreateSuppliers(submitted, signal),
    enabled: submitted !== "",
  })
  return (
    <ErpDataDialog title="Buscar proveedor" description={title} defaultWidth={550} onOpenChange={(open) => !open && onClose()}>
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="flex gap-1" onSubmit={(event) => { event.preventDefault(); setSubmitted(query.trim()) }}>
          <Input aria-label="Código o nombre" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} maxLength={60} />
          <Button disabled={!query.trim() || suppliers.isFetching} type="submit" size="sm">Buscar</Button>
        </form>
        {suppliers.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(suppliers.error)}</AlertDescription></Alert>}
        <ErpDataTableViewport className="h-48">
          <Table className="min-w-96">
            <TableBody>
              {suppliers.data?.map((supplier) => <TableRow key={supplier.id}><TableCell className="p-0">
                <Button className="flex w-full justify-start text-left" onClick={() => onSelect(supplier)} variant="ghost" size="xs">
                  <span className="w-20 shrink-0 font-mono">{supplier.code}</span>{supplier.name}
                </Button>
              </TableCell></TableRow>)}
              {suppliers.data?.length === 0 && <TableRow><TableCell>Sin proveedores activos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </ErpDataTableViewport>
        <div className="flex justify-end"><Button onClick={onClose} variant="outline" size="sm">Cancelar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

function Totals({ header, lines, supplier }: {
  header: Header
  lines: PurchaseOrderDraftLine[]
  supplier: PurchaseOrderCreateSupplier | null
}) {
  const discountFactor = header.discountPercentages.reduce((factor, rate) => factor * (1 - rate / 100), 1)
  const captured = lines.filter((line) => line.productCode.trim() && line.quantity > 0 && Number.isFinite(line.price))
  const net = (line: PurchaseOrderDraftLine) => line.quantity * line.price * (1 - line.discount / 100)
  const subtotal = captured.reduce((total, line) => total + net(line), 0)
  const excise = supplier?.taxType === 2 ? 0 : captured.reduce((total, line) => total + net(line) * (line.exciseTaxPercentage ?? 0) / 100, 0) * discountFactor
  const charges = header.freight + header.insurance + header.other + excise
  const taxable = captured.reduce((total, line) => total + (line.taxable ? net(line) : 0), 0) * discountFactor
  const tax = (taxable + charges) * header.taxPercentage / 100
  const values = [
    ["Tot. Pzas.", pieces.format(captured.reduce((sum, line) => sum + line.quantity, 0))],
    ["Subtotal", money.format(subtotal)], ["Descuento", money.format(subtotal * (1 - discountFactor))],
    ["IEPS", money.format(excise)], ["I.V.A.", money.format(tax)], ["Gran total", money.format(subtotal * discountFactor + charges + tax)],
  ]
  return <dl className="grid grid-cols-6 gap-1 text-[9px]">
    {values.map(([label, value]) => <div className="rounded-sm border bg-muted/30 px-1" key={label}>
      <dt>{label}</dt><dd className="text-right font-mono">{value}</dd>
    </div>)}
  </dl>
}

function CreateDraft({ defaults, warehouse, usedDefaultWarehouse, onClose, onCreated }: {
  defaults: PurchaseOrderCreateDefaults
  warehouse: string
  usedDefaultWarehouse: boolean
  onClose: () => void
  onCreated: (order: PurchaseOrder) => void
}) {
  const queryClient = useQueryClient()
  const [requestKey] = useState(() => crypto.randomUUID())
  const [supplierCode, setSupplierCode] = useState("")
  const [supplier, setSupplier] = useState<PurchaseOrderCreateSupplier | null>(null)
  const [supplierError, setSupplierError] = useState("")
  const supplierLookup = useRef(0)
  const { windows, openWindow, closeWindow } = useDesktopWindowCollection<string>()
  const [header, setHeader] = useState<Header>({
    supplierOrderNumber: "", orderedAt: defaults.today, from: defaults.from, dueAt: defaults.dueAt,
    warehouse, agent: "", discountPercentages: [0, 0, 0], taxPercentage: defaults.taxPercentage,
    freight: 0, insurance: 0, other: 0, otherLabel: "", onAccount: 0,
  })
  const set = <K extends keyof Header>(key: K, value: Header[K]) => setHeader((previous) => ({ ...previous, [key]: value }))
  const save = useMutation({
    mutationFn: (lines: PurchaseOrderEditLine[]) => createPurchaseOrder({ ...header, requestKey, supplierCode, lines }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
      onCreated(order)
    },
  })

  function selectSupplier(selected: PurchaseOrderCreateSupplier) {
    supplierLookup.current++
    setSupplier(selected)
    setSupplierCode(selected.code)
    setSupplierError("")
    setHeader((previous) => ({
      ...previous, agent: selected.agent, discountPercentages: selected.discountPercentages, taxPercentage: selected.taxPercentage,
    }))
  }

  async function verifySupplier() {
    const code = supplierCode.trim().toUpperCase()
    if (!code || code === supplier?.code) return
    const lookup = ++supplierLookup.current
    try {
      const matches = await queryClient.fetchQuery({
        queryKey: supplierKey(code), queryFn: ({ signal }) => searchPurchaseOrderCreateSuppliers(code, signal),
      })
      if (lookup !== supplierLookup.current) return
      const match = matches.find((result) => result.code === code)
      if (match) selectSupplier(match)
      else setSupplierError("El código no corresponde a un proveedor activo. Puedes buscarlo por nombre.")
    } catch (error) {
      if (lookup === supplierLookup.current) setSupplierError(getApiErrorMessage(error))
    }
  }

  const canCapture = !!supplier && supplier.code === supplierCode.trim().toUpperCase()
  const dateField = (label: string, name: "orderedAt" | "from" | "dueAt", min?: string) =>
    <Field label={label}><Input className={fieldClass} min={min} required type="date" value={header[name]} onChange={(event) => set(name, event.target.value)} /></Field>
  const chargeField = (label: string, name: "freight" | "insurance" | "other" | "onAccount" | "taxPercentage", max?: number) =>
    <Field label={label}><Input className={fieldClass} min={0} max={max} step="0.01" type="number" value={header[name]} onChange={(event) => set(name, Number(event.target.value))} /></Field>

  return <>
    <PurchaseOrderLineEditor key={supplier?.code ?? "empty"} windowId="purchase-orders:create" title={title}
      description={defaults.movement} initialLines={[]} priceLocked={supplier?.priceLocked ?? false} supplierUnits={supplier?.supplierUnits ?? false}
      lookup={{
        key: [...purchaseOrderKeys.all, "create", "products", supplier?.code],
        search: (query, signal) => searchPurchaseOrderCreateProducts(supplier?.code ?? "", query, signal),
      }}
      onClose={onClose} onSubmit={(lines) => save.mutate(lines)} saving={save.isPending}
      error={save.isError ? getApiErrorMessage(save.error) : supplierError}
      creation={{
        canCapture, maxLines: defaults.maxLines,
        header: (hasLines) => <fieldset className="grid grid-cols-7 gap-1.5 rounded-sm border p-1.5" disabled={save.isPending}>
          <Field label="Tipo"><Input className={`${fieldClass} bg-muted`} readOnly value="O" /></Field>
          <Field label="Número"><Input className={`${fieldClass} bg-muted`} readOnly value="Al guardar" /></Field>
          {dateField("Fecha", "orderedAt")}{dateField("Desde", "from", header.orderedAt)}{dateField("Vence", "dueAt", header.from)}
          <Field label="Pedido del proveedor"><Input className={`${fieldClass} uppercase`} maxLength={30} value={header.supplierOrderNumber} onChange={(event) => set("supplierOrderNumber", event.target.value)} /></Field>
          <Field label="Almacén"><Input className={`${fieldClass} bg-muted`} readOnly value={header.warehouse}
            title={defaults.warehouses.find((option) => option.code === warehouse)?.description} /></Field>
          <Field label="Proveedor">
            <div className="flex gap-0.5">
              <Input aria-label="Proveedor" autoFocus={!supplier} className={`${fieldClass} uppercase`} maxLength={20} value={supplierCode}
                readOnly={hasLines} title={hasLines ? "Borra los productos capturados para cambiar el proveedor" : undefined}
                onBlur={() => { void verifySupplier() }}
                onChange={(event) => { supplierLookup.current++; setSupplierCode(event.target.value); setSupplierError("") }}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void verifySupplier() } }} />
              <Button aria-label="Buscar proveedor" className="h-5 px-1" disabled={hasLines}
                size="xs" type="button" variant="outline" onClick={() => openWindow("purchase-orders:create:supplier", supplierCode.trim())}>…</Button>
            </div>
          </Field>
          <div className="col-span-3"><Field label="Nombre"><Input className={`${fieldClass} bg-muted`} readOnly value={canCapture ? supplier.name : ""} /></Field></div>
          <Field label="Clasificador"><Input className={`${fieldClass} uppercase`} maxLength={9} value={header.agent} onChange={(event) => set("agent", event.target.value)} /></Field>
          <Field label="Moneda"><Input className={`${fieldClass} bg-muted`} readOnly value={supplier?.currencyName ?? ""} /></Field>
          <Field label="Plazo"><Input className={`${fieldClass} bg-muted`} readOnly value={supplier?.terms ?? ""} /></Field>
          {usedDefaultWarehouse && <p className="col-span-full text-muted-foreground" role="status">
            El movimiento se aplicará al almacén {warehouse}.
          </p>}
        </fieldset>,
        footer: (lines) => <fieldset className="grid gap-1.5 rounded-sm border p-1.5" disabled={save.isPending}>
          <div className="grid grid-cols-9 gap-1">
            {header.discountPercentages.map((rate, index) =>
              <Field key={index} label={`Dto. ${index + 1} %`}><Input className={fieldClass} min={0} max={100} readOnly={defaults.discountLocked}
                step="0.01" type="number" value={rate} onChange={(event) => {
                  const discounts: Header["discountPercentages"] = [...header.discountPercentages]
                  discounts[index] = Number(event.target.value); set("discountPercentages", discounts)
                }} /></Field>)}
            {chargeField("Flete", "freight")}{chargeField("Seguro", "insurance")}{chargeField("Otros", "other")}
            <Field label="Concepto de otros"><Input className={fieldClass} maxLength={40} value={header.otherLabel} onChange={(event) => set("otherLabel", event.target.value)} /></Field>
            {chargeField("% I.V.A.", "taxPercentage", 100)}{chargeField("A cuenta", "onAccount")}
          </div>
          <Totals header={header} lines={lines} supplier={supplier} />
        </fieldset>,
      }}
    />
    {windows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}>
      <SupplierPicker initial={window.payload} onClose={() => closeWindow(window.id)} onSelect={(selected) => {
        selectSupplier(selected); closeWindow(window.id)
      }} />
    </DesktopWindowIdentity>)}
  </>
}

function CreateWithWarehouse({ defaults, onClose, onCreated }: {
  defaults: PurchaseOrderCreateDefaults
  onClose: () => void
  onCreated: (order: PurchaseOrder) => void
}) {
  const [selection, setSelection] = useState<{ code: string; usedDefault: boolean } | null>(null)
  if (!selection && defaults.selectWarehouse) {
    return <PurchaseOrderWarehouseDialog
      initial={defaults.warehouse} warehouses={defaults.warehouses}
      onSelect={(code) => setSelection({ code, usedDefault: false })}
      onCancel={() => setSelection({ code: defaults.warehouse, usedDefault: true })}
    />
  }
  return <CreateDraft defaults={defaults} warehouse={selection?.code ?? defaults.warehouse}
    usedDefaultWarehouse={selection?.usedDefault ?? false} onClose={onClose} onCreated={onCreated} />
}

export function PurchaseOrderCreateDialog({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (order: PurchaseOrder) => void
}) {
  const defaults = useQuery({
    queryKey: [...purchaseOrderKeys.all, "create", "defaults"],
    queryFn: ({ signal }) => getPurchaseOrderCreateDefaults(signal),
    refetchOnMount: "always",
  })
  if (defaults.data?.canWrite && defaults.data.warehouse && (defaults.isFetchedAfterMount || !defaults.isFetching)) {
    return <CreateWithWarehouse defaults={defaults.data} onClose={onClose} onCreated={onCreated} />
  }
  return (
    <ErpDataDialog defaultWidth={550} description="Orden de compra" title={title} onOpenChange={(open) => !open && onClose()}>
      <ErpDataDialogBody className="grid gap-1">
        {defaults.isFetching ? <div className="grid min-h-32 place-items-center"><Spinner /></div>
          : <Alert variant={defaults.isError ? "destructive" : "default"}>
            <AlertDescription>{defaults.isError ? getApiErrorMessage(defaults.error)
              : defaults.data?.canWrite ? "No hay almacenes habilitados para el alta." : "El alta de órdenes requiere PostgreSQL."}</AlertDescription>
          </Alert>}
        <div className="flex justify-end"><Button onClick={onClose} size="sm" variant="outline">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
