import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"

import {
  actionDialogTitles,
  actionDialogWidths,
} from "@/features/sales/orders/components/order-action-dialog-metadata"
import { OrderActionDesignContent } from "@/features/sales/orders/components/order-action-design-content"
import { OrderCommentsContent } from "@/features/sales/orders/components/order-comments-content"
import { orderPanelQueryOptions } from "@/features/sales/orders/logic"
import type { Order, OrderPanelDefinition } from "@/features/sales/orders/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataMetric,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type PanelDialogProps = {
  order: Order
  panel: OrderPanelDefinition
  onOpenChange: (open: boolean) => void
}

const columnLabels: Record<string, string> = {
  documentNumber: "Docto",
  date: "Fecha",
  productCode: "Código",
  description: "Descripción",
  quantity: "Cantidad",
  pieces: "Pzas",
  serialNumber: "Número",
  warehouse: "Alm",
  reference: "Refer",
  createdAt: "Alta",
  receipt: "Recepción",
  invoice: "Factura",
  ordered: "Pedido",
  fulfilled: "Surtido",
  remaining: "Resta",
  assigned: "Asignado",
  assignable: "Por asignar",
  lineId: "Partida",
  branch: "Suc",
  price: "Precio",
  supplierCode: "Proveedor",
  supplierName: "Razón social",
  branchCode: "Sucursal",
  branchName: "Nombre",
  address1: "Dirección",
  state: "Estado",
  city: "Ciudad",
  ctReference: "CT",
  status: "Status",
  exportedAt: "Exportación",
  packedAt: "Empaque",
}

const format = (value: unknown) => {
  if (value === null || value === undefined || value === "") return ""
  if (typeof value === "boolean") return value ? "Sí" : "No"
  return String(value)
}

function DataTable({ items }: { items: Array<Record<string, unknown>> }) {
  const columns = items[0]
    ? Object.keys(items[0]).filter((column) => column !== "kind")
    : []

  return (
    <ErpDataTableViewport axes="xy" className="h-[22rem]">
      <Table className="min-w-[920px] text-[9px]">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>
                {columnLabels[column] ?? column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell className="whitespace-nowrap px-1 py-0.5" key={column}>
                  {format(item[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ErpDataTableViewport>
  )
}

function QueryState({
  isPending,
  isError,
  available,
  reason,
}: {
  isPending: boolean
  isError: boolean
  available?: boolean
  reason?: string
}) {
  if (isPending) {
    return <div className="grid min-h-64 place-items-center"><Spinner /></div>
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>No fue posible cargar la acción</AlertTitle>
        <AlertDescription>Revise la conexión con la API.</AlertDescription>
      </Alert>
    )
  }

  if (available === false) {
    return (
      <Alert>
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>Acción no disponible</AlertTitle>
        <AlertDescription>{reason}</AlertDescription>
      </Alert>
    )
  }

  return null
}

function CommentsPanelDialog({ order, panel, onOpenChange }: PanelDialogProps) {
  const query = useQuery(orderPanelQueryOptions(order.id, panel.key))
  const data = query.data?.data
  const hasStatus = query.isPending || query.isError || data?.available === false

  return (
    <ErpDataDialog
      className="sm:max-w-[62rem]"
      description={`Comentarios del pedido ${order.number}`}
      onOpenChange={onOpenChange}
      title="Comentarios del pedido"
    >
      <ErpDataDialogBody className="grid gap-1.5">
        <QueryState
          available={data?.available}
          isError={query.isError}
          isPending={query.isPending}
          reason={data?.reason}
        />
        {!hasStatus && data && <OrderCommentsContent order={order} panel={data} />}
        <footer className="flex justify-end gap-1">
          <Button onClick={() => onOpenChange(false)} size="sm">Ok</Button>
          <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">Cancelar</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

function ActionDesignDialog({ order, panel, onOpenChange }: PanelDialogProps) {
  return (
    <ErpDataDialog
      className={actionDialogWidths[panel.key] ?? "sm:max-w-[48rem]"}
      description={`Diseño de ${panel.label} para el pedido ${order.number}`}
      onOpenChange={onOpenChange}
      title={actionDialogTitles[panel.key] ?? panel.label}
    >
      <ErpDataDialogBody>
        <OrderActionDesignContent
          onClose={() => onOpenChange(false)}
          order={order}
          panel={panel}
        />
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

function ConnectedSecondaryPanelDialog({ order, panel, onOpenChange }: PanelDialogProps) {
  const query = useQuery(orderPanelQueryOptions(order.id, panel.key))
  const data = query.data?.data
  const hasStatus = query.isPending || query.isError || data?.available === false

  return (
    <ErpDataDialog
      className="sm:max-w-[58rem]"
      description={`Acción ${panel.label} del pedido ${order.number}`}
      onOpenChange={onOpenChange}
      title={panel.label}
    >
      <ErpDataDialogBody className="grid gap-1.5">
        <QueryState
          available={data?.available}
          isError={query.isError}
          isPending={query.isPending}
          reason={data?.reason}
        />
        {!hasStatus && data && <DataTable items={data.items} />}
        {!hasStatus && data?.summary && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.summary).map(([key, metric]) => (
              <ErpDataMetric
                key={key}
                label={columnLabels[key] ?? key}
                value={format(metric)}
              />
            ))}
          </div>
        )}
        <footer className="flex justify-end gap-1">
          <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">Cerrar</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function OrderPanelDialog(props: PanelDialogProps) {
  if (props.panel.key === "comments") return <CommentsPanelDialog {...props} />
  if (props.panel.section === "actions") return <ActionDesignDialog {...props} />
  return <ConnectedSecondaryPanelDialog {...props} />
}
