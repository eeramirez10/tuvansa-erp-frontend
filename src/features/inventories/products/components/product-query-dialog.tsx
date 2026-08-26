import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import PrinterIcon from "@hugeicons/core-free-icons/PrinterIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { productPanelQueryOptions } from "@/features/inventories/products/logic"
import type {
  Product,
  ProductPanelDefinition,
  ProductPanelKey,
} from "@/features/inventories/products/model"
import {
  ProductQueryTable,
} from "@/features/inventories/products/components/product-query-table"
import {
  formatDate,
  formatMoney,
  formatNumber,
  numberValue,
  type QueryColumn,
  type QueryRow,
  textValue,
} from "@/features/inventories/products/query-formatters"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataMetric,
} from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type ProductQueryDialogProps = {
  panel: ProductPanelDefinition
  product: Product
  onOpenChange: (open: boolean) => void
}

type DialogPresentation = {
  title: string
  className?: string
  body: ReactNode
}

const numberColumn = (
  key: string,
  label: string,
  width = "4.5rem",
  decimals = 3,
): QueryColumn => ({
  key,
  label,
  width,
  align: "right",
  render: (row) => formatNumber(row[key], decimals),
})

const moneyColumn = (key: string, label: string, width = "5.2rem"): QueryColumn => ({
  key,
  label,
  width,
  align: "right",
  render: (row) => formatMoney(row[key]),
})

const dateColumn = (key: string, label: string, width = "5rem"): QueryColumn => ({
  key,
  label,
  width,
  render: (row) => formatDate(row[key]),
})

const compactButtonClass = "h-6 min-w-16 px-2 text-[9px]"

function sum(rows: QueryRow[], key: string) {
  return rows.reduce((total, row) => total + numberValue(row[key]), 0)
}

function QueryButtons({ labels, className }: { labels: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {labels.map((label) => (
        <Button className={compactButtonClass} key={label} type="button" variant="outline">
          {label}
        </Button>
      ))}
    </div>
  )
}

function BlankFilterPane({ count = 14, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("min-w-[31rem] bg-muted", className)}>
      <div className="flex h-6 gap-1 border-b border-input p-1">
        {Array.from({ length: count }, (_, index) => (
          <span
            aria-hidden
            className="h-4 w-11 shrink-0 border border-input bg-background shadow-inner"
            key={index}
          />
        ))}
      </div>
      <div className="h-44 bg-muted/80" />
    </div>
  )
}

const filterButtons = [
  "AGENTE",
  "GIRO O SECTOR",
  "SUCURSAL",
  "",
  "",
  "",
  "FLETE",
  "ORIGEN",
  "PROYECTO",
  "",
] as const

function ClassificationFilters() {
  return (
    <div className="mt-1 grid grid-cols-5 gap-0.5">
      {filterButtons.map((label, index) =>
        label ? (
          <Button
            className="h-6 px-1 text-[9px]"
            key={`${label}-${index}`}
            type="button"
            variant="outline"
          >
            {label}
          </Button>
        ) : (
          <span
            aria-hidden
            className="h-6 border border-input bg-background/50 shadow-inner"
            key={index}
          />
        ),
      )}
    </div>
  )
}

function OrderMetrics({ product, rows }: { product: Product; rows: QueryRow[] }) {
  const assigned = sum(rows, "assigned")
  const total = rows.reduce(
    (value, row) => value + numberValue(row.quantity) - numberValue(row.fulfilled),
    0,
  )
  const stock = product.accumulated.currentStock
  const available = stock - assigned

  return (
    <div className="grid grid-cols-5 gap-1">
      <ErpDataMetric label="Asignado" value={formatNumber(assigned)} />
      <ErpDataMetric label="Disponible" value={formatNumber(available)} />
      <ErpDataMetric label="Stock" value={formatNumber(stock)} />
      <ErpDataMetric label="Total" value={formatNumber(total)} />
      <ErpDataMetric label="Faltante" value={formatNumber(Math.max(total - available, 0))} />
    </div>
  )
}

const customerOrderColumns: QueryColumn[] = [
  { key: "customerCode", label: "Código", width: "5rem" },
  { key: "customerName", label: "Descripción", width: "12rem" },
  dateColumn("quotedAt", "Fecha E."),
  { key: "quoteNumber", label: "Núm.", width: "5rem" },
  numberColumn("quantity", "Pedido"),
  numberColumn("fulfilled", "Surtido"),
  {
    key: "remaining",
    label: "Resta",
    width: "4rem",
    align: "right",
    render: (row) => formatNumber(numberValue(row.quantity) - numberValue(row.fulfilled)),
  },
  numberColumn("assigned", "Asignado"),
  { key: "externalNumber", label: "Núm ellos", width: "7rem" },
]

function CustomerQuotes({ product, rows }: { product: Product; rows: QueryRow[] }) {
  return (
    <>
      <div className="mb-1 flex justify-center">
        <output className="flex h-4 min-w-20 items-center justify-end border border-input bg-background px-1 shadow-inner">
          0.000
        </output>
      </div>
      <ProductQueryTable
        className="h-[min(42vh,16rem)]"
        columns={customerOrderColumns}
        rows={rows}
        tableClassName="w-[52rem]"
      />
      <footer className="mt-1">
        <OrderMetrics product={product} rows={rows} />
        <div className="mt-1 flex items-center gap-5">
          <QueryButtons labels={["Filtrar pedidos surtidos", "Asignar", "Traspasar"]} />
          <Button aria-label="Documento" size="icon-sm" title="Documento" type="button" variant="outline">
            <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} />
          </Button>
        </div>
      </footer>
    </>
  )
}

const orderCtColumns: QueryColumn[] = [
  { key: "productCode", label: "Código", width: "5rem" },
  { key: "customerName", label: "Descripción", width: "11rem" },
  { key: "orderNumber", label: "Núm.", width: "5rem" },
  numberColumn("quantity", "Pedido"),
  numberColumn("fulfilled", "Surtido"),
  {
    key: "remaining",
    label: "Resta",
    width: "4rem",
    align: "right",
    render: (row) => formatNumber(numberValue(row.quantity) - numberValue(row.fulfilled)),
  },
  dateColumn("orderedAt", "Fecha E."),
  dateColumn("dueAt", "Vence"),
  moneyColumn("price", "Precio"),
  { key: "externalNumber", label: "Num ellos", width: "7rem" },
]

function SplitCtView({
  rows,
  columns,
  buttons,
  totalKeys = ["quantity", "fulfilled"],
}: {
  rows: QueryRow[]
  columns: QueryColumn[]
  buttons: string[]
  totalKeys?: string[]
}) {
  return (
    <>
      <div className="flex min-w-0 border border-input bg-background">
        <ProductQueryTable
          className="h-[min(45vh,18rem)] w-[31rem] shrink-0 border-0"
          columns={columns}
          rows={rows}
          tableClassName="w-[54rem]"
        />
        <div className="h-[min(45vh,18rem)] min-w-0 flex-1 overflow-scroll border-l border-input">
          <BlankFilterPane className="h-full" />
        </div>
      </div>
      <footer className="mt-1 flex items-end gap-2">
        <span className="ml-8 mb-1">Total</span>
        {totalKeys.map((key) => (
          <ErpDataMetric className="min-w-16" key={key} label="" value={formatNumber(sum(rows, key))} />
        ))}
        <QueryButtons className="ml-3" labels={buttons} />
      </footer>
    </>
  )
}

const salesColumns: QueryColumn[] = [
  { key: "customerCode", label: "Código", width: "5rem" },
  { key: "customerName", label: "Cliente", width: "12rem" },
  numberColumn("quantity", "Cantidad", "5rem"),
  moneyColumn("amount", "Importe", "6rem"),
]

function TotalsFooter({
  rows,
  quantityKey = "quantity",
  amountKey = "amount",
  children,
}: {
  rows: QueryRow[]
  quantityKey?: string
  amountKey?: string
  children?: ReactNode
}) {
  return (
    <footer className="mt-1 flex min-h-7 items-end gap-2">
      <span className="ml-auto mb-1">Total</span>
      <ErpDataMetric className="min-w-20" label="" value={formatNumber(sum(rows, quantityKey))} />
      <ErpDataMetric className="min-w-24" label="" value={formatMoney(sum(rows, amountKey))} />
      {children}
    </footer>
  )
}

function CustomerSalesStar({ rows }: { rows: QueryRow[] }) {
  return (
    <>
      <ProductQueryTable
        axes="y"
        className="h-44"
        columns={[
          { key: "customerCode", label: "Código", width: "5rem" },
          { key: "customerName", label: "Nombre", width: "12rem" },
          numberColumn("quantity", "Cantidad"),
          moneyColumn("amount", "Importe"),
        ]}
        rows={rows}
        tableClassName="w-[29rem]"
      />
      <TotalsFooter rows={rows} />
      <ClassificationFilters />
    </>
  )
}

const detailSalesColumns: QueryColumn[] = [
  { key: "customerCode", label: "Código", width: "5rem" },
  { key: "customerName", label: "Nombre", width: "13rem" },
  numberColumn("quantity", "Cantidad"),
  moneyColumn("price", "Precio"),
  { key: "document", label: "Doc.", width: "6rem" },
  dateColumn("date", "Fecha"),
  moneyColumn("otherAmount", "Precio US"),
  numberColumn("exchangeRate", "TC Dolar", "5rem", 4),
  numberColumn("discount", "% Desc", "4rem", 2),
  { key: "externalReference", label: "O.C.", width: "8rem" },
  numberColumn("branch", "", "3rem", 0),
]

const monthColumns = [
  ["january", "Ene"],
  ["february", "Feb"],
  ["march", "Mar"],
  ["april", "Abr"],
  ["may", "May"],
  ["june", "Jun"],
  ["july", "Jul"],
  ["august", "Ago"],
  ["september", "Sep"],
  ["october", "Oct"],
  ["november", "Nov"],
  ["december", "Dic"],
] as const

function AnnualTable({ rows, entity }: { rows: QueryRow[]; entity: "customer" | "supplier" }) {
  const codeKey = entity === "customer" ? "customerCode" : "supplierCode"
  const nameKey = entity === "customer" ? "customerName" : "supplierName"
  const totals: QueryRow = {
    id: "totals",
    [codeKey]: "Totales:",
    [nameKey]: "",
    year: "",
    ...Object.fromEntries(monthColumns.map(([key]) => [key, sum(rows, key)])),
    total: sum(rows, "total"),
  }
  const columns: QueryColumn[] = [
    { key: codeKey, label: "Código", width: "5rem" },
    { key: nameKey, label: "Nombre", width: "11rem" },
    numberColumn("year", "Año", "3rem", 0),
    ...monthColumns.map(([key, label]) => numberColumn(key, label, "3rem")),
    numberColumn("total", "Total", "4rem"),
  ]

  return (
    <>
      <ProductQueryTable
        className="h-[min(46vh,19rem)]"
        columns={columns}
        rows={[totals, ...rows]}
        tableClassName="w-[58rem]"
      />
      <footer className="mt-1 flex h-7 items-center gap-8 px-2">
        <span>Desde : 31/12/1900</span>
        <Button aria-label="Documento" size="icon-sm" title="Documento" type="button" variant="outline">
          <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} />
        </Button>
      </footer>
    </>
  )
}

function AnnualSummary({ rows }: { rows: QueryRow[] }) {
  const max = Math.max(...rows.map((row) => numberValue(row.total)), 1)
  const columns: QueryColumn[] = [
    numberColumn("year", "Año", "3.5rem", 0),
    ...monthColumns.map(([key, label]) => numberColumn(key, label, "3rem")),
    numberColumn("total", "Total", "4rem"),
  ]

  return (
    <>
      <div className="flex items-start gap-2">
        <ProductQueryTable
          axes="y"
          className="h-56 flex-1"
          columns={columns}
          rows={rows}
          tableClassName="w-[44rem]"
        />
        <span className="w-24 pt-2">Desde: 31/12/1900</span>
      </div>
      <div className="mt-1 flex h-36 items-end gap-3 overflow-x-auto border border-fuchsia-700 bg-black px-5 pt-3 pb-5 text-[8px] text-yellow-300">
        {rows.map((row) => (
          <div className="flex h-full min-w-12 flex-col items-center justify-end gap-1" key={textValue(row.id)}>
            <span
              className="w-8 border border-cyan-400 bg-blue-700"
              style={{ height: `${Math.max((numberValue(row.total) / max) * 100, 2)}%` }}
              title={formatNumber(row.total)}
            />
            <span>{textValue(row.year)}</span>
          </div>
        ))}
      </div>
    </>
  )
}

const supplierOrderColumns: QueryColumn[] = [
  { key: "supplierCode", label: "Código", width: "5rem" },
  { key: "supplierName", label: "Descripción", width: "12rem" },
  { key: "orderNumber", label: "O.C.", width: "5rem" },
  { key: "branch", label: "Sucursal", width: "4rem" },
  { key: "unit", label: "U.M", width: "3rem" },
  numberColumn("quantity", "Pedido"),
  numberColumn("fulfilled", "Surtido"),
  {
    key: "remaining",
    label: "Resta",
    width: "4rem",
    align: "right",
    render: (row) => formatNumber(numberValue(row.quantity) - numberValue(row.fulfilled)),
  },
  moneyColumn("price", "Precio"),
  { key: "externalNumber", label: "D.C. Prv.", width: "6rem" },
  dateColumn("orderedAt", "Fecha E."),
  dateColumn("date", "Fecha"),
  { key: "warehouse", label: "Alm", width: "3rem" },
  { key: "observations", label: "Obs....", width: "10rem" },
]

function SupplierOrders({ product, rows }: { product: Product; rows: QueryRow[] }) {
  const arriving = rows.reduce(
    (value, row) => value + numberValue(row.quantity) - numberValue(row.fulfilled),
    0,
  )
  const stock = product.accumulated.currentStock
  return (
    <>
      <ProductQueryTable
        className="h-[min(54vh,22rem)]"
        columns={supplierOrderColumns}
        rows={rows}
        tableClassName="w-[70rem]"
      />
      <footer className="mt-1 flex items-end gap-8">
        <QueryButtons labels={["Filtrar pedidos surtidos", "Coment"]} />
        <div className="ml-auto grid grid-cols-3 gap-1">
          <ErpDataMetric label="Stock" value={formatNumber(stock)} />
          <ErpDataMetric label="Por llegar" value={formatNumber(arriving)} />
          <ErpDataMetric label="Total" value={formatNumber(stock + arriving)} />
        </div>
      </footer>
    </>
  )
}

function SupplierQuotes({ product, rows }: { product: Product; rows: QueryRow[] }) {
  const arriving = rows.reduce(
    (value, row) => value + numberValue(row.quantity) - numberValue(row.fulfilled),
    0,
  )
  const stock = product.accumulated.currentStock
  return (
    <>
      <ProductQueryTable
        className="h-[min(42vh,15rem)]"
        columns={[
          { key: "supplierCode", label: "Código", width: "5rem" },
          { key: "supplierName", label: "Descripción", width: "12rem" },
          { key: "quoteNumber", label: "O.C.", width: "5rem" },
          { key: "unit", label: "U.M.", width: "3rem" },
          numberColumn("quantity", "Pedido"),
          numberColumn("fulfilled", "Surtido"),
          {
            key: "remaining",
            label: "Resta",
            width: "4rem",
            align: "right",
            render: (row) => formatNumber(numberValue(row.quantity) - numberValue(row.fulfilled)),
          },
          dateColumn("date", "Fecha"),
          dateColumn("secondDate", "Fecha E."),
        ]}
        rows={rows}
        tableClassName="w-[43rem]"
      />
      <footer className="mt-1 flex items-end gap-8">
        <QueryButtons labels={["Filtrar pedidos surtidos"]} />
        <div className="ml-auto grid grid-cols-3 gap-1">
          <ErpDataMetric label="Stock" value={formatNumber(stock)} />
          <ErpDataMetric label="Por llegar" value={formatNumber(arriving)} />
          <ErpDataMetric label="Total" value={formatNumber(stock + arriving)} />
        </div>
      </footer>
    </>
  )
}

function CostHistory({ rows }: { rows: QueryRow[] }) {
  return (
    <div className="grid gap-1">
      <ProductQueryTable
        className="h-32"
        columns={[
          { key: "orderNumber", label: "Núm.", width: "5rem" },
          numberColumn("quantity", "Pedido"),
          numberColumn("fulfilled", "Surtido"),
          {
            key: "remaining",
            label: "Resta",
            width: "4rem",
            align: "right",
            render: (row) => formatNumber(numberValue(row.quantity) - numberValue(row.fulfilled)),
          },
          dateColumn("date", "Fecha"),
          { key: "lot", label: "LOTE", width: "5rem" },
          moneyColumn("material", "M.P."),
          moneyColumn("labor", "M.O."),
          moneyColumn("total", "Total"),
        ]}
        rows={rows}
        tableClassName="w-[43rem]"
      />
      <ProductQueryTable
        className="h-24"
        columns={[
          { key: "productCode", label: "Código", width: "6rem" },
          { key: "description", label: "Descripción", width: "13rem" },
          moneyColumn("theoretical", "Teórico"),
          moneyColumn("real", "Real"),
          moneyColumn("difference", "Dif."),
          moneyColumn("unitCost", "Costo U."),
        ]}
        rows={[]}
      />
      <ProductQueryTable
        className="h-24"
        columns={[
          { key: "productCode", label: "Código", width: "6rem" },
          { key: "description", label: "Descripción", width: "13rem" },
          numberColumn("quantity", "Cant"),
          moneyColumn("theoreticalCost", "Costo T."),
          moneyColumn("realCost", "Costo R."),
        ]}
        rows={[]}
      />
    </div>
  )
}

function SummaryMetrics({ values }: { values: unknown[] }) {
  return (
    <div className="mt-1 flex justify-end gap-2">
      {values.map((value, index) => (
        <ErpDataMetric className="min-w-20" key={index} label="" value={formatNumber(value)} />
      ))}
    </div>
  )
}

function EdiTables({ rows }: { rows: QueryRow[] }) {
  const buildRows = (type: "requested" | "fulfilled") => {
    const grouped = new Map<string, QueryRow>()
    for (const row of rows) {
      const date = textValue(row.deliveryDate)
      const year = date.slice(0, 4)
      const month = Number(date.slice(5, 7))
      const key = `${textValue(row.customerCode)}-${textValue(row.branch)}-${year}`
      const current = grouped.get(key) ?? {
        id: key,
        customerCode: row.customerCode,
        branch: row.branch,
        inventory: year,
        average: 0,
      }
      const monthKey = monthColumns[month - 1]?.[0]
      if (monthKey) current[monthKey] = numberValue(current[monthKey]) + numberValue(row[type])
      grouped.set(key, current)
    }
    return [...grouped.values()]
  }
  const columns: QueryColumn[] = [
    { key: "customerCode", label: "Cliente", width: "5rem" },
    { key: "branch", label: "Sucursal", width: "4rem" },
    { key: "inventory", label: "Inv.", width: "3rem" },
    numberColumn("average", "I.Prom", "4rem"),
    ...monthColumns.map(([key, label]) => numberColumn(key, label.toUpperCase(), "3rem")),
  ]
  return (
    <div className="grid gap-1">
      <ProductQueryTable className="h-36" columns={columns} rows={buildRows("requested")} tableClassName="w-[50rem]" />
      <ProductQueryTable className="h-44" columns={columns} rows={buildRows("fulfilled")} tableClassName="w-[50rem]" />
    </div>
  )
}

function DocumentsView({ rows }: { rows: QueryRow[] }) {
  const selected = rows[0] ?? {}
  const field = (label: string, value: unknown, wide = false) => (
    <label className={cn("flex items-center gap-1", wide && "col-span-2")}>
      <span className="w-16 text-right">{label}</span>
      <output className="flex h-4 flex-1 items-center border border-input bg-background px-1 shadow-inner">
        {textValue(value)}
      </output>
    </label>
  )
  return (
    <>
      <div className="mb-1 grid grid-cols-4 gap-1">
        {field("Documento", selected.document)}
        {field("Referencia", selected.reference)}
        {field("", selected.documentType)}
        {field("Cliente", selected.customerCode)}
        {field("", selected.customerName, true)}
        {field("", selected.warehouse)}
        {field("Fecha", formatDate(selected.date))}
      </div>
      <ProductQueryTable
        className="h-[min(48vh,20rem)]"
        columns={[
          { key: "productCode", label: "Producto", width: "6rem" },
          { key: "productDescription", label: "Descripción", width: "14rem" },
          numberColumn("incoming", "Entradas"),
          numberColumn("outgoing", "Salidas"),
          { key: "unit", label: "U.M.", width: "3rem" },
          moneyColumn("cost", "Costo"),
          numberColumn("pieces", "Pzas."),
          { key: "warehouse", label: "Alm.", width: "3rem" },
          { key: "document", label: "Documento", width: "6rem" },
        ]}
        rows={rows}
        tableClassName="w-[55rem]"
      />
      <SummaryMetrics values={[sum(rows, "cost")]} />
    </>
  )
}

function availablePresentation(
  key: ProductPanelKey,
  product: Product,
  rows: QueryRow[],
): DialogPresentation {
  switch (key) {
    case "customer-orders-ct":
      return {
        title: "Pedidos por cliente",
        className: "sm:max-w-[64rem]",
        body: <SplitCtView buttons={["Pedido", "Surtido", "Resta", "Filtrar Tipo"]} columns={orderCtColumns} rows={rows} />,
      }
    case "customer-quotes":
      return { title: "Pedidos por cliente", className: "sm:max-w-[54rem]", body: <CustomerQuotes product={product} rows={rows} /> }
    case "customer-sales":
      return {
        title: "Ventas por cliente",
        className: "sm:max-w-[31rem]",
        body: <><ProductQueryTable axes="y" className="h-[min(52vh,20rem)]" columns={salesColumns} rows={rows} tableClassName="w-[28rem]" /><TotalsFooter rows={rows} /></>,
      }
    case "customer-sales-star":
      return { title: "Ventas por *", className: "sm:max-w-[32rem]", body: <CustomerSalesStar rows={rows} /> }
    case "customer-sales-ct":
      return {
        title: "Ventas por cliente",
        className: "sm:max-w-[68rem]",
        body: <SplitCtView buttons={[]} columns={[
          { key: "productCode", label: "Código", width: "6rem" },
          { key: "productDescription", label: "Descripción", width: "13rem" },
          numberColumn("quantity", "Cantidad"),
          moneyColumn("amount", "Importe"),
        ]} rows={rows} totalKeys={["quantity", "amount"]} />,
      }
    case "customer-sales-detail":
      return {
        title: "Compras por cliente",
        className: "sm:max-w-[63rem]",
        body: <><ProductQueryTable className="h-[min(50vh,19rem)]" columns={detailSalesColumns} rows={rows} tableClassName="w-[65rem]" /><footer className="mt-1 flex items-center gap-4"><QueryButtons labels={["Último"]} /><ErpDataMetric className="ml-auto min-w-56" label="" value={formatMoney(sum(rows, "otherAmount"))} /></footer></>,
      }
    case "sales-by-branch":
      return {
        title: "Producto vendidos por sucursal",
        className: "sm:max-w-[41rem]",
        body: <><ProductQueryTable axes="y" className="h-[min(44vh,17rem)]" columns={[
          { key: "branch", label: "Suc.", width: "3rem" },
          { key: "customerCode", label: "Código", width: "5rem" },
          { key: "customerName", label: "Cliente", width: "13rem" },
          numberColumn("quantity", "Cantidad"),
          moneyColumn("amount", "Importe", "7rem"),
        ]} rows={rows} tableClassName="w-[38rem]" /><TotalsFooter rows={rows} /></>,
      }
    case "annual-sales":
      return { title: "Ventas Anuales", className: "sm:max-w-[64rem]", body: <AnnualTable entity="customer" rows={rows} /> }
    case "annual-sales-summary":
      return { title: "Ventas Anuales resumen anual", className: "sm:max-w-[66rem]", body: <AnnualSummary rows={rows} /> }
    case "supplier-orders":
      return { title: "Ordenado a proveedores", className: "sm:max-w-[72rem]", body: <SupplierOrders product={product} rows={rows} /> }
    case "supplier-orders-ct":
      return {
        title: "Ordenado a proveedores",
        className: "sm:max-w-[66rem]",
        body: <SplitCtView buttons={["Pedido", "Surtido", "Resta"]} columns={[
          { key: "productCode", label: "Código", width: "6rem" },
          { key: "supplierName", label: "Descripción", width: "12rem" },
          { key: "orderNumber", label: "Núm.", width: "5rem" },
          numberColumn("quantity", "Pedido"), numberColumn("fulfilled", "Surtido"),
          { key: "remaining", label: "Resta", width: "4rem", align: "right", render: (row) => formatNumber(numberValue(row.quantity) - numberValue(row.fulfilled)) },
          dateColumn("date", "Fecha"), dateColumn("dueAt", "Fec."),
        ]} rows={rows} />,
      }
    case "supplier-quotes":
      return { title: "Cotizado a proveedores", className: "sm:max-w-[51rem]", body: <SupplierQuotes product={product} rows={rows} /> }
    case "supplier-purchases":
      return {
        title: "Compras por proveedor",
        className: "sm:max-w-[32rem]",
        body: <><ProductQueryTable axes="y" className="h-[min(48vh,18rem)]" columns={[
          { key: "supplierCode", label: "Código", width: "5rem" },
          { key: "supplierName", label: "Proveedor", width: "13rem" },
          numberColumn("quantity", "Cantidad"), moneyColumn("amount", "Importe"),
        ]} rows={rows} tableClassName="w-[29rem]" /><TotalsFooter rows={rows} /></>,
      }
    case "supplier-purchases-dt":
      return { title: "Historial de costos", className: "sm:max-w-[45rem]", body: <CostHistory rows={rows} /> }
    case "supplier-purchases-detail":
      return {
        title: "Compras por proveedor",
        className: "sm:max-w-[63rem]",
        body: <><ProductQueryTable className="h-[min(50vh,19rem)]" columns={[
          { key: "supplierCode", label: "Código", width: "5rem" },
          { key: "supplierName", label: "Proveedor", width: "14rem" },
          numberColumn("quantity", "Cantidad"), moneyColumn("price", "Precio"),
          { key: "document", label: "Doc.", width: "6rem" }, dateColumn("date", "Fecha"),
          numberColumn("pieces", "Pzas"), numberColumn("currency", "T.C.", "4rem", 0),
          moneyColumn("amount", "Importe dlls", "7rem"),
        ]} rows={rows} tableClassName="w-[58rem]" /><footer className="mt-1"><QueryButtons labels={["Último"]} /></footer></>,
      }
    case "annual-purchases":
      return { title: "Compras Anuales", className: "sm:max-w-[64rem]", body: <AnnualTable entity="supplier" rows={rows} /> }
    case "annual-purchases-summary":
      return { title: "Ventas Anuales resumen anual", className: "sm:max-w-[66rem]", body: <AnnualSummary rows={rows} /> }
    case "fulfilled-pieces":
      return {
        title: "Piezas (Surtidas)", className: "sm:max-w-[52rem]",
        body: <><ProductQueryTable className="h-[min(44vh,17rem)]" columns={[
          { key: "serialNumber", label: "Numero", width: "7rem" }, numberColumn("pieces", "Pzas"),
          numberColumn("quantity", "Cantidad"), { key: "warehouse", label: "Alm", width: "3rem" },
          { key: "inventoryDocument", label: "I.F.", width: "5rem" }, { key: "orderNumber", label: "Pedido", width: "5rem" },
          { key: "reference", label: "Refer.", width: "7rem" }, dateColumn("date", "Alta"),
          dateColumn("receivedAt", "Recepcion"), { key: "invoiceNumber", label: "Factura", width: "6rem" },
        ]} rows={rows} tableClassName="w-[55rem]" /><footer className="mt-1 flex items-end gap-2"><SummaryMetrics values={[sum(rows, "pieces"), sum(rows, "quantity")]} /><QueryButtons className="ml-auto" labels={["Etiqueta", "Devolucion", "Baja", "Filtrar almacen"]} /></footer></>,
      }
    case "work-in-progress":
      return {
        title: "W.I.P.", className: "sm:max-w-[49rem]",
        body: <><ProductQueryTable className="h-[min(44vh,17rem)]" columns={[
          { key: "productionOrder", label: "O.P.", width: "6rem" }, { key: "operation", label: "Operación", width: "7rem" },
          numberColumn("sortOrder", "Ord", "3rem", 0), numberColumn("requested", "Solicitado"), numberColumn("fulfilled", "Recibido"),
          numberColumn("remaining", "Resta"), numberColumn("time", "Tiempo"), dateColumn("startedAt", "Inicio"),
          { key: "machine", label: "Maquina", width: "6rem" },
        ]} rows={rows} tableClassName="w-[49rem]" /><footer className="mt-1 flex items-end"><QueryButtons labels={["Filtrar surtidos"]} /><SummaryMetrics values={[sum(rows, "requested"), sum(rows, "fulfilled")]} /></footer></>,
      }
    case "work-in-progress-ct":
      return {
        title: "Ordenado a Proveedores", className: "sm:max-w-[67rem]",
        body: <SplitCtView buttons={[]} columns={[
          { key: "machine", label: "Maq.", width: "4rem" }, { key: "productCode", label: "Descripción", width: "12rem" },
          { key: "productionOrder", label: "Orden", width: "5rem" }, { key: "componentCode", label: "Operación", width: "5rem" },
          numberColumn("requested", "Pedido"), numberColumn("fulfilled", "Surtido"), numberColumn("remaining", "Resta"),
          dateColumn("date", "Fecha"), dateColumn("startedAt", "Inicio"), dateColumn("endsAt", "Fin"),
          numberColumn("time", "Dias"), { key: "parameter0", label: "E", width: "2rem" }, { key: "parameter1", label: "R", width: "2rem" },
          { key: "observations", label: "Obs", width: "5rem" },
        ]} rows={rows} totalKeys={["requested", "fulfilled", "remaining"]} />,
      }
    case "edi":
      return { title: "Ventas anuales", className: "sm:max-w-[56rem]", body: <EdiTables rows={rows} /> }
    case "pending-enablements":
      return {
        title: "Habilitaciones pendientes", className: "sm:max-w-[28rem]",
        body: <><ProductQueryTable axes="y" className="h-44" columns={[
          { key: "document", label: "Docto", width: "8rem" }, numberColumn("needed", "Nec"),
          numberColumn("fulfilled", "Surt"), numberColumn("remaining", "Resta"),
        ]} rows={rows} tableClassName="w-[25rem]" /><SummaryMetrics values={[sum(rows, "needed"), sum(rows, "fulfilled"), sum(rows, "remaining")]} /></>,
      }
    case "documents":
      return { title: "Consulta de movimientos de inventario", className: "sm:max-w-[60rem]", body: <DocumentsView rows={rows} /> }
    default:
      return { title: "Consulta", body: null }
  }
}

export function ProductQueryDialog({ panel, product, onOpenChange }: ProductQueryDialogProps) {
  const panelQuery = useQuery(productPanelQueryOptions(product.id, panel.key))
  const rows = panelQuery.data?.data.items ?? []
  const unavailableReason = panelQuery.data?.data.reason
  const presentation = availablePresentation(panel.key, product, rows)
  const title = panel.key === "pieces" ? "Piezas" : presentation.title

  return (
    <ErpDataDialog
      className={presentation.className}
      description={`${panel.label} del producto ${product.code}.`}
      onOpenChange={onOpenChange}
      title={title}
    >
      <ErpDataDialogBody>
        {panelQuery.isPending ? (
          <div className="flex min-h-48 items-center justify-center gap-1.5 border border-input bg-background text-muted-foreground">
            <Spinner />
            Cargando {panel.label.toLowerCase()}…
          </div>
        ) : panelQuery.isError ? (
          <Alert className="min-h-48" variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar la consulta</AlertTitle>
            <AlertDescription>{getApiErrorMessage(panelQuery.error)}</AlertDescription>
          </Alert>
        ) : !panelQuery.data.data.available ? (
          <div className="flex min-h-28 items-center gap-3 border border-input bg-background px-5 py-4">
            <HugeiconsIcon className="size-7 text-amber-500" icon={InformationCircleIcon} strokeWidth={2} />
            <p className="flex-1 text-[10px]">
              {unavailableReason ?? "Esta consulta no está disponible."}
            </p>
            <Button className="min-w-16" onClick={() => onOpenChange(false)} size="sm" type="button" variant="outline">
              OK
            </Button>
          </div>
        ) : (
          presentation.body
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
