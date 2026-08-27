import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"

import {
  actionDialogTitles,
  actionDialogWidths,
  secondaryActionDialogTitles,
  secondaryActionDialogWidths,
} from "@/features/sales/orders/components/order-action-dialog-metadata"
import { OrderActionDesignContent } from "@/features/sales/orders/components/order-action-design-content"
import { OrderCommentsContent } from "@/features/sales/orders/components/order-comments-content"
import { OrderSecondaryActionDesignContent } from "@/features/sales/orders/components/order-secondary-action-design-content"
import { orderPanelQueryOptions } from "@/features/sales/orders/logic"
import type { Order, OrderPanelDefinition } from "@/features/sales/orders/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
} from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

type PanelDialogProps = {
  order: Order
  panel: OrderPanelDefinition
  onOpenChange: (open: boolean) => void
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

function SecondaryActionDesignDialog({ order, panel, onOpenChange }: PanelDialogProps) {
  return (
    <ErpDataDialog
      className={secondaryActionDialogWidths[panel.key] ?? "sm:max-w-[48rem]"}
      description={`Diseño de ${panel.label} para el pedido ${order.number}`}
      onOpenChange={onOpenChange}
      title={secondaryActionDialogTitles[panel.key] ?? panel.label}
    >
      <ErpDataDialogBody>
        <OrderSecondaryActionDesignContent
          onClose={() => onOpenChange(false)}
          order={order}
          panel={panel}
        />
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function OrderPanelDialog(props: PanelDialogProps) {
  if (props.panel.key === "comments") return <CommentsPanelDialog {...props} />
  if (props.panel.section === "actions") return <ActionDesignDialog {...props} />
  return <SecondaryActionDesignDialog {...props} />
}
