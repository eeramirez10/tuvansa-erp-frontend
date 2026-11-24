import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

import { productLedgerQueryOptions, productLotsQueryOptions, productPanelQueryOptions } from "@/features/inventories/products/logic"
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

type ProductPurchasesProductionDialogProps = {
  panel: ProductPanelDefinition
  product: Product
  onOpenChange: (open: boolean) => void
}

const compactButtonClass = "h-5 min-w-16 px-2 text-[9px]"

function PanelButton({ children, className, disabled }: { children: ReactNode; className?: string; disabled?: boolean }) {
  return (
    <Button className={cn(compactButtonClass, className)} disabled={disabled} type="button" variant="outline">
      {children}
    </Button>
  )
}

function Field({
  label,
  value,
  className,
}: {
  label: string
  value: unknown
  className?: string
}) {
  return (
    <label className={cn("flex min-w-0 items-center gap-1", className)}>
      <span className="shrink-0">{label}</span>
      <input
        className="h-4 min-w-0 flex-1 border border-input bg-background px-1 text-[9px] shadow-inner outline-none"
        readOnly
        value={textValue(value)}
      />
    </label>
  )
}

function ProductHeader({ product, bordered = false }: { product: Product; bordered?: boolean }) {
  return (
    <div
      className={cn(
        "mb-1 grid grid-cols-[5rem_1fr] gap-1",
        bordered && "rounded-md border border-foreground/55 p-1",
      )}
    >
      <Field label="Código" value={product.code} />
      <input
        className="h-4 min-w-0 border border-input bg-background px-1 text-[9px] shadow-inner"
        readOnly
        value={product.description}
      />
    </div>
  )
}

const numberColumn = (key: string, label: string, width = "4.5rem"): QueryColumn => ({
  key,
  label,
  width,
  align: "right",
  render: (row) => formatNumber(row[key]),
})

const moneyColumn = (key: string, label: string, width = "5rem"): QueryColumn => ({
  key,
  label,
  width,
  align: "right",
  render: (row) => formatMoney(row[key]),
})

const dateColumn = (key: string, label: string, width = "5.3rem"): QueryColumn => ({
  key,
  label,
  width,
  render: (row) => formatDate(row[key]),
})

function NavigationButtons({ selection = false }: { selection?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      <PanelButton>Siguiente</PanelButton>
      <PanelButton>Anterior</PanelButton>
      <PanelButton>{selection ? "Encontrar" : "Encuentra"}</PanelButton>
      {selection && <PanelButton className="min-w-28">Encontrar selección</PanelButton>}
    </div>
  )
}

function AlternatesView({ product, rows }: { product: Product; rows: QueryRow[] }) {
  const displayedRows = rows.length
    ? rows
    : [
        {
          id: "current",
          alternateCode: product.code,
          alternateDescription: product.description,
          stock: product.accumulated.currentStock,
          price1: product.prices.sale[0].amount,
        },
      ]

  return (
    <>
      <ProductHeader product={product} />
      <div className="mb-0.5 flex w-[32rem] gap-1">
        <input aria-label="Código alterno" className="h-4 w-20 border border-input bg-background px-1 shadow-inner" />
        <input aria-label="Descripción alterna" className="h-4 flex-1 border border-input bg-background px-1 shadow-inner" />
      </div>
      <ProductQueryTable
        axes="y"
        className="h-[min(45vh,16rem)]"
        columns={[
          { key: "alternateCode", label: "Código", width: "6rem" },
          { key: "alternateDescription", label: "Descripción", width: "15rem" },
          numberColumn("stock", "Stock", "5rem"),
          moneyColumn("price1", "Precio 1", "6rem"),
        ]}
        rows={displayedRows}
      />
      <footer className="mt-1 flex flex-wrap gap-1">
        <NavigationButtons />
        <PanelButton>Cambio</PanelButton>
        <PanelButton>Terminar</PanelButton>
      </footer>
      <div className="mt-1 flex gap-1">
        <PanelButton>✓ Foto</PanelButton>
        <PanelButton>Alternos</PanelButton>
      </div>
    </>
  )
}

function ComponentsView({ product, rows }: { product: Product; rows: QueryRow[] }) {
  const totalQuantity = rows.reduce((total, row) => total + numberValue(row.quantity), 0)
  const totalAmount = rows.reduce((total, row) => total + numberValue(row.amount), 0)

  return (
    <>
      <div className="mb-1 grid grid-cols-[5rem_1fr_6rem_4rem] gap-1">
        <Field label="Código" value={product.code} />
        <input className="h-4 border border-input bg-background px-1 shadow-inner" readOnly value={product.description} />
        <Field label="Lote" value="1.000000" />
        <input className="h-4 border border-input bg-background px-1 shadow-inner" readOnly value={product.classification.unit.code} />
      </div>
      <div className="mb-0.5 grid min-w-[43rem] grid-cols-[6rem_13rem_3rem_3rem_4rem_4rem_5rem_6rem] gap-0.5">
        {["Código", "Descripción", "Gen", "H2", "Orden", "Uso", "Cantidad", "Importe"].map((label) => (
          <label className="grid gap-0.5" key={label}>
            <span>{label}</span>
            <input className="h-4 min-w-0 border border-input bg-background px-0.5 shadow-inner" />
          </label>
        ))}
      </div>
      <ProductQueryTable
        className="h-[min(46vh,17rem)]"
        columns={[
          { key: "componentCode", label: "Código", width: "6rem" },
          { key: "componentDescription", label: "Descripción", width: "13rem" },
          { key: "inheritance", label: "Gen", width: "3rem", align: "center" },
          { key: "inheritance2", label: "H2", width: "3rem", align: "center" },
          numberColumn("sortOrder", "Orden", "4rem"),
          { key: "usageValue", label: "Uso", width: "4rem" },
          numberColumn("quantity", "Cantidad", "5rem"),
          moneyColumn("amount", "Importe", "6rem"),
        ]}
        rows={rows}
        tableClassName="w-[45rem]"
      />
      <footer className="mt-1 grid grid-cols-[1fr_auto] gap-2">
        <div className="grid gap-1">
          <div className="flex flex-wrap gap-1">
            <NavigationButtons />
            <PanelButton>Cambio</PanelButton>
            <PanelButton>Borrar</PanelButton>
          </div>
          <div className="flex flex-wrap gap-1">
            <PanelButton className="min-w-28">Encuentra selección</PanelButton>
            <PanelButton>Previo</PanelButton>
            <PanelButton>Integrar</PanelButton>
            <PanelButton>Terminar</PanelButton>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <output className="h-4 min-w-16 border border-input bg-background px-1 text-right shadow-inner">{formatNumber(totalQuantity)}</output>
          <output className="h-4 min-w-20 border border-input bg-background px-1 text-right shadow-inner">{formatMoney(totalAmount)}</output>
          <span className="text-right">MAF</span>
          <output className="h-4 border border-input bg-background px-1 text-right shadow-inner">0.00</output>
        </div>
      </footer>
      <div className="mt-1 flex gap-1"><PanelButton>✓ Foto</PanelButton><PanelButton>▤</PanelButton><PanelButton>Componentes</PanelButton></div>
    </>
  )
}

function QualitySpecificationsView({ rows }: { rows: QueryRow[] }) {
  const specificationRows = Array.from(
    new Map(
      rows.map((row) => [
        textValue(row.specificationId),
        {
          id: row.specificationId,
          providerCode: row.providerCode,
          specificationKey: row.specificationKey,
        },
      ]),
    ).values(),
  )
  const tests = rows.slice()
  while (tests.length < 15) tests.push({ id: `blank-${tests.length}` })

  return (
    <ErpDataTableViewport className="h-[min(70vh,31rem)] min-w-[61rem] p-0.5">
      <div className="grid min-w-[61rem] grid-cols-[14rem_1fr] gap-1">
        <div>
          <ProductQueryTable
            axes="y"
            className="h-[26rem]"
            columns={[
              { key: "providerCode", label: "", width: "4rem" },
              { key: "specificationKey", label: "", width: "9rem" },
            ]}
            rows={specificationRows}
          />
          <div className="mt-1 flex gap-1"><PanelButton>▤ Alta</PanelButton><PanelButton>▤ Baja</PanelButton><PanelButton>🖉 Cambio</PanelButton></div>
        </div>
        <ProductQueryTable
          axes="y"
          className="h-[26rem]"
          columns={[
            { key: "testName", label: "Prueba", width: "14rem" },
            numberColumn("minimum", "Mínimo", "5rem"),
            numberColumn("maximum", "Máximo", "5rem"),
            { key: "unit", label: "Unidad", width: "4rem" },
            { key: "observations", label: "Obs", width: "14rem" },
          ]}
          rows={tests}
        />
      </div>
    </ErpDataTableViewport>
  )
}

function ImplosionView({ product, rows }: { product: Product; rows: QueryRow[] }) {
  return (
    <>
      <ProductHeader bordered product={product} />
      <ProductQueryTable
        axes="y"
        className="h-[min(46vh,17rem)]"
        columns={[
          { key: "parentProductCode", label: "Código", width: "6rem" },
          { key: "parentDescription", label: "Descripción", width: "17rem" },
          numberColumn("quantity", "Cantidad", "6rem"),
          numberColumn("costPercentage", "% costo", "5rem"),
        ]}
        rows={rows}
      />
      <footer className="mt-1 flex gap-1"><NavigationButtons selection /><PanelButton>Terminar</PanelButton></footer>
    </>
  )
}

function LotsView({ product }: { product: Product }) {
  const [lotId, setLotId] = useState<number | null>(null)
  const lots = useInfiniteQuery(productLotsQueryOptions(product.id))
  const ledger = useInfiniteQuery({
    ...productLedgerQueryOptions(product.id, lotId === null ? {} : { lotId }),
    enabled: lotId !== null,
  })
  const rows = lots.data?.pages.flatMap(({ data }) => data.items) ?? []
  const movementPages = lotId === null ? [] : ledger.data?.pages ?? []
  const movements = movementPages.flatMap(({ data }) => data.items).map(
    (row) => ({
      ...row,
      entries: numberValue(row.quantity) > 0 ? row.quantity : 0,
      exits: numberValue(row.quantity) < 0 ? Math.abs(numberValue(row.quantity)) : 0,
    }),
  )
  const available = rows.reduce((total, row) => total + numberValue(row.availableQuantity), 0)
  const movementTotal = movementPages.at(-1)?.data.lotTotals?.net

  if (lots.isPending) return <div className="flex min-h-36 items-center justify-center gap-1.5" role="status">
    <Spinner /> Cargando lotes…
  </div>
  if (lots.isError && !lots.data) return <Alert variant="destructive">
    <AlertTitle>No fue posible cargar los lotes</AlertTitle>
    <AlertDescription>{getApiErrorMessage(lots.error)}</AlertDescription>
    <Button onClick={() => void lots.refetch()} size="xs" type="button" variant="outline">Reintentar</Button>
  </Alert>

  return (
    <>
      <div className="grid grid-cols-[3fr_2fr] gap-1">
        <ProductQueryTable
          className="h-[min(48vh,18rem)]"
          columns={[
            dateColumn("date", "Fecha"),
            dateColumn("expiresAt", "Caducidad"),
            { key: "customsEntry", label: "Pedimento", width: "7rem" },
            { key: "customsOffice", label: "Aduana", width: "5rem" },
            { key: "lot", label: "Lote", width: "5rem" },
            numberColumn("availableQuantity", "Disponible", "5rem"),
            { key: "warehouse", label: "Alm", width: "3rem" },
          ]}
          rows={rows}
          selection={{
            id: lotId, column: "date", label: row => {
              const lot = textValue(row.lot)
              const name = (lot === "0" ? "" : lot) || textValue(row.number)
              return `Seleccionar lote ${name ? `${name} (${row.id})` : row.id} en almacén ${textValue(row.warehouse)}`
            },
            onSelect: setLotId,
          }}
          tableClassName="w-[35rem]"
        />
        <ProductQueryTable
          className="h-[min(48vh,18rem)]"
          columns={[
            dateColumn("date", "Fecha"),
            { key: "document", label: "Doc.", width: "6rem" },
            numberColumn("entries", "Entradas", "5rem"),
            numberColumn("exits", "Salidas", "5rem"),
            { key: "warehouse", label: "Alm", width: "3rem" },
          ]}
          emptyMessage={lotId === null ? "Selecciona un lote" : ledger.isPending ? "Cargando movimientos…" : ledger.isError ? "" : "Sin movimientos para este lote"}
          rows={movements}
          tableClassName="w-[25rem]"
        />
      </div>
      <footer className="mt-1 grid grid-cols-[3fr_2fr] gap-1">
        <div className="flex flex-wrap items-center gap-1">
          <PanelButton disabled>Cambiar</PanelButton>
          <PanelButton className="min-w-28" disabled>Rellena pedimentos</PanelButton>
          {lots.hasNextPage && <Button className={compactButtonClass} disabled={lots.isFetching}
            onClick={() => void lots.fetchNextPage()} size="xs" type="button" variant="outline">
            {lots.isFetchingNextPage ? "Cargando…" : lots.isFetchNextPageError ? "Reintentar lotes" : "Cargar más lotes"}
          </Button>}
          <output aria-label="Disponible en los lotes cargados"
            className="ml-auto h-4 min-w-20 border border-input bg-background px-1 text-right shadow-inner">
            {formatNumber(available)}
          </output>
        </div>
        <div className="flex items-center gap-1">
          {lotId !== null && ledger.isError && !ledger.isFetchNextPageError && <div className="grid gap-1" role="alert">
            <span className="text-destructive">{getApiErrorMessage(ledger.error)}</span>
            <Button className={compactButtonClass} onClick={() => void ledger.refetch()} size="xs" type="button" variant="outline">Reintentar movimientos</Button>
          </div>}
          {lotId !== null && ledger.hasNextPage && <Button className={compactButtonClass} disabled={ledger.isFetching}
            onClick={() => void ledger.fetchNextPage()} size="xs" type="button" variant="outline">
            {ledger.isFetchingNextPage ? "Cargando…" : ledger.isFetchNextPageError ? "Reintentar movimientos" : "Cargar más movimientos"}
          </Button>}
          <output aria-label="Total neto de movimientos del lote"
            className="ml-auto h-4 min-w-20 border border-input bg-background px-1 text-right shadow-inner">
            {movementTotal === undefined ? "" : formatNumber(movementTotal)}
          </output>
        </div>
      </footer>
    </>
  )
}

function InventoryLayersView({ rows }: { rows: QueryRow[] }) {
  const total = rows.reduce((value, row) => value + numberValue(row.quantity), 0)
  return (
    <>
      <ProductQueryTable
        className="h-[min(52vh,20rem)]"
        columns={[
          numberColumn("initialQuantity", "Inicial", "5rem"),
          numberColumn("quantity", "Cantidad", "5rem"),
          moneyColumn("cost", "Costo", "5rem"),
          moneyColumn("adValoremCost", "Adv.", "5rem"),
          dateColumn("date", "Fecha"),
          { key: "document", label: "Doc.", width: "6rem" },
          { key: "lot", label: "Lote", width: "5rem" },
          dateColumn("expiresAt", "Caducidad"),
          { key: "layerKey", label: "Llave", width: "10rem" },
        ]}
        rows={rows}
        tableClassName="w-[52rem]"
      />
      <footer className="mt-1 flex justify-end gap-1">
        <output className="h-4 min-w-20 border border-input bg-background px-1 text-right shadow-inner">{formatNumber(total)}</output>
        <output className="h-4 min-w-20 border border-input bg-background px-1 text-right shadow-inner">1e100</output>
        <PanelButton>Calidad</PanelButton><PanelButton>Transferencia</PanelButton><PanelButton>Cambiar</PanelButton>
        <output className="h-4 min-w-20 border border-input bg-background px-1 text-right shadow-inner">0.0000</output>
        <PanelButton>PFEIF</PanelButton>
      </footer>
    </>
  )
}

function panelTitle(key: ProductPanelKey) {
  const titles: Partial<Record<ProductPanelKey, string>> = {
    alternates: "Alternos",
    components: "Componentes",
    "quality-specifications": "Especificaciones de calidad",
    implosion: "Implosión",
    lots: "Auxiliar de lotes",
    "inventory-layers": "UEPS/PEPS",
  }
  return titles[key] ?? "Compras/Prod"
}

function panelWidth(key: ProductPanelKey) {
  const widths: Partial<Record<ProductPanelKey, string>> = {
    alternates: "sm:max-w-[43rem]",
    components: "sm:max-w-[52rem]",
    "quality-specifications": "sm:max-w-[64rem]",
    implosion: "sm:max-w-[36rem]",
    lots: "sm:max-w-[58rem]",
    "inventory-layers": "sm:max-w-[55rem]",
  }
  return widths[key]
}

function PanelContent({ panel, product, rows }: { panel: ProductPanelDefinition; product: Product; rows: QueryRow[] }) {
  switch (panel.key) {
    case "alternates": return <AlternatesView product={product} rows={rows} />
    case "components": return <ComponentsView product={product} rows={rows} />
    case "quality-specifications": return <QualitySpecificationsView rows={rows} />
    case "implosion": return <ImplosionView product={product} rows={rows} />
    case "inventory-layers": return <InventoryLayersView rows={rows} />
    default: return null
  }
}

export function ProductPurchasesProductionDialog({
  panel,
  product,
  onOpenChange,
}: ProductPurchasesProductionDialogProps) {
  const panelQuery = useQuery({ ...productPanelQueryOptions(product.id, panel.key), enabled: panel.key !== "lots" })

  return (
    <ErpDataDialog
      className={panelWidth(panel.key)}
      description={`${panel.label} del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title={panelTitle(panel.key)}
    >
      <ErpDataDialogBody>
        {panel.key === "lots" ? <LotsView key={product.id} product={product} /> : panelQuery.isPending ? (
          <div className="flex min-h-36 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner /> Cargando {panel.label.toLowerCase()}…
          </div>
        ) : panelQuery.isError ? (
          <Alert className="min-h-36" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar la consulta</AlertTitle>
            <AlertDescription>{getApiErrorMessage(panelQuery.error)}</AlertDescription>
          </Alert>
        ) : (
          <PanelContent panel={panel} product={product} rows={panelQuery.data.data.items} />
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
