import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { productKeys, productPanelQueryOptions } from "@/features/inventories/products/logic"
import type {
  Product,
  ProductPanelDefinition,
  ProductPanelKey,
} from "@/features/inventories/products/model"
import { ProductQueryTable } from "@/features/inventories/products/components/product-query-table"
import {
  formatDate,
  formatMoney,
  formatNumber,
  numberValue,
  textValue,
  type QueryColumn,
  type QueryRow,
} from "@/features/inventories/products/query-formatters"
import { setProductBlocked } from "@/features/inventories/products/services/product-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type ProductActionDialogProps = {
  panel: ProductPanelDefinition
  product: Product
  onOpenChange: (open: boolean) => void
}

const actionButtonClass = "h-5 min-w-16 px-2 text-[9px]"

const numericColumn = (key: string, label: string, width = "4.5rem"): QueryColumn => ({
  key,
  label,
  width,
  align: "right",
  render: (row) => formatNumber(row[key]),
})

const dateColumn = (key: string, label: string, width = "5.2rem"): QueryColumn => ({
  key,
  label,
  width,
  render: (row) => formatDate(row[key]),
})

function ActionButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Button className={cn(actionButtonClass, className)} type="button" variant="outline">
      {children}
    </Button>
  )
}

function ReadonlyField({
  label,
  value,
  className,
}: {
  label: string
  value: unknown
  className?: string
}) {
  const shown = typeof value === "boolean" ? (value ? "Sí" : "No") : textValue(value)
  return (
    <label className={cn("flex min-w-0 items-center gap-1", className)}>
      <span className="w-24 shrink-0 text-right">{label}</span>
      <input
        className="h-4 min-w-0 flex-1 border border-input bg-background px-1 text-[9px] shadow-inner outline-none"
        readOnly
        value={shown}
      />
    </label>
  )
}

function WarehousesView({ rows }: { rows: QueryRow[] }) {
  const totals: QueryRow = {
    id: "TOTAL",
    warehouseCode: "TOTAL",
    quantity: rows.reduce((sum, row) => sum + numberValue(row.quantity), 0),
    assigned: rows.reduce((sum, row) => sum + numberValue(row.assigned), 0),
    minimum: rows.reduce((sum, row) => sum + numberValue(row.minimum), 0),
    maximum: rows.reduce((sum, row) => sum + numberValue(row.maximum), 0),
    sales: rows.reduce((sum, row) => sum + numberValue(row.sales), 0),
    physicalInventory: rows.reduce((sum, row) => sum + numberValue(row.physicalInventory), 0),
    count: rows.reduce((sum, row) => sum + numberValue(row.count), 0),
    inTransit: rows.reduce((sum, row) => sum + numberValue(row.inTransit), 0),
  }
  const columns: QueryColumn[] = [
    { key: "warehouseCode", label: "Alm.", width: "3rem" },
    { key: "warehouseDescription", label: "Descripción", width: "10rem" },
    numericColumn("quantity", "Cant."),
    numericColumn("assigned", "Asign."),
    numericColumn("minimum", "Mín."),
    numericColumn("maximum", "Máx."),
    numericColumn("sales", "Vta 6 s."),
    numericColumn("physicalInventory", "Físico I."),
    numericColumn("count", "Conteo"),
    numericColumn("inTransit", "Tránsito"),
    dateColumn("createdAt", "Alta"),
    dateColumn("lastSaleAt", "Últ. vta"),
    { key: "location", label: "Localización", width: "7rem" },
    numericColumn("storeMinimum", "Mín. tda"),
    numericColumn("price", "Precio"),
  ]

  return (
    <>
      <ProductQueryTable
        className="h-[min(54vh,22rem)]"
        columns={columns}
        rows={[totals, ...rows]}
        tableClassName="w-[70rem]"
      />
      <footer className="mt-1 flex items-end gap-1">
        <output className="h-4 min-w-20 border border-input bg-background px-1 text-right shadow-inner">
          {formatNumber(totals.quantity)}
        </output>
        <ActionButton>Filtrar tst</ActionButton>
        <ActionButton>Localización</ActionButton>
        <ActionButton>Mín. Tda.</ActionButton>
      </footer>
    </>
  )
}

function ExtendedDescriptionView({ product, row }: { product: Product; row?: QueryRow }) {
  const values = [row?.description1 ?? product.description, row?.description2, row?.description3, row?.description4]
  return (
    <>
      <div className="mb-1 text-center">COMPLETA</div>
      <div className="grid gap-1">
        {values.map((value, index) => (
          <textarea
            className="h-20 resize-none overflow-y-scroll border border-input bg-background p-1 text-[9px] shadow-inner outline-none"
            key={index}
            readOnly
            value={textValue(value)}
          />
        ))}
      </div>
      <ActionButton className="mt-1">Cambiar</ActionButton>
    </>
  )
}

function DiscountsView({ rows, supplier }: { rows: QueryRow[]; supplier?: boolean }) {
  const key = supplier ? "supplierKey" : "customerKey"
  return (
    <>
      <div className="mb-0.5 flex h-5 w-[54rem] gap-0.5 overflow-hidden">
        {[6, 4, 4, 5, 5, 5, 4, 4, 5, 12].map((width, index) => (
          <input
            aria-label={`Filtro ${index + 1}`}
            className="h-4 shrink-0 border border-input bg-background px-0.5 shadow-inner"
            key={index}
            style={{ width: `${width}rem` }}
          />
        ))}
      </div>
      <ProductQueryTable
        className="h-[min(50vh,19rem)]"
        columns={[
          { key, label: "Llave", width: "6rem" },
          numericColumn("discount1", "Desc 1", "4rem"),
          numericColumn("discount2", "Desc 2", "4rem"),
          { key: "price", label: "Precio", width: "5rem", align: "right", render: (row) => formatMoney(row.price) },
          dateColumn("validFrom", "Fecha"),
          dateColumn("validTo", "Vence"),
          numericColumn("minimumQuantity", "Cant I.", "4rem"),
          numericColumn("maximumQuantity", "Cant F.", "4rem"),
          { key: "department", label: "Depto.", width: "5rem" },
          { key: "observations", label: "Observaciones", width: "13rem" },
          { key: "status", label: "E", width: "2rem" },
          { key: "unit", label: "Unidad", width: "4rem" },
        ]}
        rows={rows}
        tableClassName="w-[60rem]"
      />
      <footer className="mt-1 flex items-center justify-between">
        <ActionButton>Cambiar</ActionButton>
        {supplier && <ActionButton className="min-w-6 px-1">I.</ActionButton>}
      </footer>
    </>
  )
}

function SpecificationsView({ rows }: { rows: QueryRow[] }) {
  const descriptions = rows.flatMap((row, rowIndex) =>
    ["description1", "description2", "description3", "description4"].map((key, index) => ({
      id: `${rowIndex}-${index}`,
      description: textValue(row[key]),
    })),
  )
  while (descriptions.length < 11) descriptions.push({ id: `blank-${descriptions.length}`, description: "" })
  return (
    <>
      <ProductQueryTable
        axes="y"
        className="mx-auto h-52 max-w-[23rem]"
        columns={[{ key: "description", label: "", width: "21rem" }]}
        rows={descriptions}
      />
      <ActionButton className="mt-1">Cambiar</ActionButton>
    </>
  )
}

function PhotoView({ reason }: { reason?: string }) {
  return (
    <>
      <ErpDataTableViewport className="h-[min(55vh,24rem)] min-w-[42rem]">
        <div className="h-[23rem] min-w-[54rem] bg-background p-3 text-muted-foreground">
          {reason}
        </div>
      </ErpDataTableViewport>
      <div className="mt-1 flex gap-1">
        {["Normal", "Boceto", "Boceto 2", "Color", "Completo"].map((label) => <ActionButton key={label}>{label}</ActionButton>)}
      </div>
      <div className="mt-1 h-16 border border-input bg-background shadow-inner" />
    </>
  )
}

function CtInventoryView({ rows }: { rows: QueryRow[] }) {
  const total = rows.reduce((sum, row) => sum + numberValue(row.stock), 0)
  const columns: QueryColumn[] = [
    { key: "label", label: "", width: "4rem" },
    ...rows.map((row, index) => ({ key: `w${index}`, label: textValue(row.warehouseCode), width: "3rem", align: "right" as const })),
  ]
  const totalRow: QueryRow = { id: "total", label: "TOTAL" }
  rows.forEach((row, index) => { totalRow[`w${index}`] = row.stock })
  return (
    <>
      <ProductQueryTable className="h-[min(50vh,20rem)]" columns={columns} rows={[totalRow]} />
      <footer className="mt-1 flex items-end justify-between gap-2">
        <div className="flex flex-wrap gap-0.5">
          {["Stock", "Pedido", "Ordenado", "Surtible", "Faltante", "Sobrante", "Inv.-Pedido", "Asignado", "Disponible", "Asignable", "Transito", "Minimos"].map((label) => <ActionButton className="min-w-12 px-1" key={label}>{label}</ActionButton>)}
        </div>
        <div className="flex shrink-0 items-end gap-0.5">
          <ReadonlyField className="w-24" label="Alm" value="01-99" />
          {["0", "1", "2", "3", "Tot"].map((label) => <ActionButton className="min-w-6 px-1" key={label}>{label}</ActionButton>)}
          <output className="h-4 min-w-16 border border-input bg-background px-1 text-right shadow-inner">{formatNumber(total)}</output>
        </div>
      </footer>
    </>
  )
}

function PricesView({ row = {} }: { row?: QueryRow }) {
  const lists = [1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13]
  const rows = lists.map((list) => ({
    id: list,
    label: `Lista ${list}`,
    amount: row[`list${list}`],
    percent: "?",
    currency: row[`currency${list}`],
    plan: row[`posPlan${list}`],
  }))
  return (
    <>
      <div className="mb-1 grid w-56 grid-cols-2 gap-1">
        <ReadonlyField label="Costo" value={row.cost} />
        <ReadonlyField label="Decimales" value="0" />
      </div>
      <ProductQueryTable
        axes="y"
        className="h-[16rem]"
        columns={[
          { key: "label", label: "", width: "5rem" },
          { key: "amount", label: "Precio", width: "6rem", align: "right", render: (item) => formatMoney(item.amount) },
          { key: "percent", label: "% / vta", width: "4rem", align: "center" },
          { key: "currency", label: "Moneda", width: "4rem", align: "center" },
          { key: "plan", label: "Plan POS", width: "6rem" },
        ]}
        rows={rows}
      />
      <ActionButton className="mt-1">Cambio</ActionButton>
    </>
  )
}

function SkusView({ rows, onClose }: { rows: QueryRow[]; onClose: () => void }) {
  return (
    <>
      <ProductQueryTable
        axes="y"
        className="h-36"
        columns={[
          { key: "id", label: "L", width: "3rem" },
          { key: "sku", label: "SKU", width: "14rem" },
        ]}
        rows={rows.length ? rows : [{ id: "", sku: "" }]}
      />
      <footer className="mt-1 flex justify-end gap-1">
        <Button className={actionButtonClass} onClick={onClose} type="button" variant="outline">Cancelar</Button>
        <ActionButton>Aceptar</ActionButton>
      </footer>
    </>
  )
}

function PrepacksView({ product, row, onClose }: { product: Product; row?: QueryRow; onClose: () => void }) {
  const values = textValue(row?.prepack).split(/[,;|\s]+/).filter(Boolean).slice(0, 16)
  while (values.length < 16) values.push("0.00")
  const columns: QueryColumn[] = values.map((_, index) => ({ key: `v${index}`, label: "", width: "3.3rem", align: "right" }))
  const valueRow: QueryRow = { id: "prepack" }
  values.forEach((value, index) => { valueRow[`v${index}`] = value })
  return (
    <>
      <ProductQueryTable className="h-[min(48vh,18rem)]" columns={columns} rows={[valueRow]} tableClassName="w-[54rem]" />
      <div className="mt-1 grid grid-cols-[1fr_1fr_1fr_auto] gap-1">
        <input className="h-4 border border-input bg-background px-1 shadow-inner" readOnly value={product.code} />
        <input className="h-4 border border-input bg-background px-1 shadow-inner" readOnly value="" />
        <input className="h-4 border border-input bg-background px-1 shadow-inner" readOnly value="" />
        <div className="flex gap-1">
          <ActionButton>OK</ActionButton>
          <Button className={actionButtonClass} onClick={onClose} type="button" variant="outline">Cancelar</Button>
          <ActionButton>Reparte</ActionButton>
        </div>
      </div>
    </>
  )
}

function BlockView({
  blocked,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  blocked: boolean
  pending: boolean
  error: unknown
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="min-h-32 border border-input bg-background p-4">
      <p className="mb-1 text-[10px]">Esta rutina bloquea/desbloquea el producto actual</p>
      <p className="mb-5 text-[10px]">¿Continuo?</p>
      {error ? <p className="mb-2 text-destructive">{getApiErrorMessage(error)}</p> : null}
      <div className="flex justify-center gap-2">
        <Button className={actionButtonClass} disabled={pending} onClick={onClose} type="button" variant="outline">No</Button>
        <Button className={actionButtonClass} disabled={pending} onClick={onConfirm} type="button">
          {pending ? "Procesando…" : "Yes"}
        </Button>
      </div>
      <p className="mt-3 text-center text-muted-foreground">Estado actual: {blocked ? "bloqueado" : "desbloqueado"}</p>
    </div>
  )
}

function actionTitle(key: ProductPanelKey) {
  const titles: Partial<Record<ProductPanelKey, string>> = {
    warehouses: "Almacenes",
    "color-size-registration": "Aviso",
    "block-status": "Confirmación",
    "extended-description": "Descripción extendida",
    "customer-discounts": "Descuentos especiales",
    "supplier-discounts": "Descuentos especiales",
    specifications: "Especificaciones",
    photo: "Foto",
    "ct-inventory": "Stock",
    prices: "Precios",
    skus: "SKUs",
    prepacks: "Prepacks",
  }
  return titles[key] ?? "Acción"
}

function actionClassName(key: ProductPanelKey) {
  const widths: Partial<Record<ProductPanelKey, string>> = {
    warehouses: "sm:max-w-[72rem]",
    "extended-description": "sm:max-w-[35rem]",
    "customer-discounts": "sm:max-w-[62rem]",
    "supplier-discounts": "sm:max-w-[62rem]",
    specifications: "sm:max-w-[28rem]",
    photo: "sm:max-w-[48rem]",
    "ct-inventory": "sm:max-w-[68rem]",
    prices: "sm:max-w-[31rem]",
    skus: "sm:max-w-[23rem]",
    prepacks: "sm:max-w-[58rem]",
    "block-status": "sm:max-w-[25rem]",
    "color-size-registration": "sm:max-w-[28rem]",
  }
  return widths[key]
}

function ActionContent({ panel, product, rows, reason, onClose }: {
  panel: ProductPanelDefinition
  product: Product
  rows: QueryRow[]
  reason?: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const status = rows[0]
  const isBlocked = numberValue(status?.blocked) > 0 || status?.blocked === true
  const blockMutation = useMutation({
    mutationFn: () => setProductBlocked(product.id, !isBlocked),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.detail(product.id) }),
        queryClient.invalidateQueries({ queryKey: productKeys.panel(product.id, "block-status") }),
      ])
      onClose()
    },
  })

  switch (panel.key) {
    case "warehouses": return <WarehousesView rows={rows} />
    case "color-size-registration": return (
      <div className="flex min-h-28 items-center gap-3 border border-input bg-background px-5 py-4">
        <HugeiconsIcon className="size-7 text-amber-500" icon={InformationCircleIcon} strokeWidth={2} />
        <p className="flex-1 text-[10px]">{reason ?? "Esta versión no contiene el módulo de COLOR Y TALLA"}</p>
        <Button className={actionButtonClass} onClick={onClose} type="button" variant="outline">OK</Button>
      </div>
    )
    case "block-status": return <BlockView blocked={isBlocked} error={blockMutation.error} onClose={onClose} onConfirm={() => blockMutation.mutate()} pending={blockMutation.isPending} />
    case "extended-description": return <ExtendedDescriptionView product={product} row={rows[0]} />
    case "customer-discounts": return <DiscountsView rows={rows} />
    case "supplier-discounts": return <DiscountsView rows={rows} supplier />
    case "specifications": return <SpecificationsView rows={rows} />
    case "photo": return <PhotoView reason={reason} />
    case "ct-inventory": return <CtInventoryView rows={rows} />
    case "prices": return <PricesView row={rows[0]} />
    case "skus": return <SkusView onClose={onClose} rows={rows} />
    case "prepacks": return <PrepacksView onClose={onClose} product={product} row={rows[0]} />
    default: return null
  }
}

export function ProductActionDialog({ panel, product, onOpenChange }: ProductActionDialogProps) {
  const panelQuery = useQuery(productPanelQueryOptions(product.id, panel.key))
  const close = () => onOpenChange(false)

  return (
    <ErpDataDialog
      className={actionClassName(panel.key)}
      description={`${panel.label} del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title={actionTitle(panel.key)}
    >
      <ErpDataDialogBody>
        {panelQuery.isPending ? (
          <div className="flex min-h-36 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner /> Cargando {panel.label.toLowerCase()}…
          </div>
        ) : panelQuery.isError ? (
          <Alert className="min-h-36" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar la acción</AlertTitle>
            <AlertDescription>{getApiErrorMessage(panelQuery.error)}</AlertDescription>
          </Alert>
        ) : (
          <ActionContent
            onClose={close}
            panel={panel}
            product={product}
            reason={panelQuery.data.data.reason}
            rows={panelQuery.data.data.items}
          />
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
