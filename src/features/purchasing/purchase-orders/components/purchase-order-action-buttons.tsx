import type { PurchaseOrderAction } from "@/features/purchasing/purchase-orders/model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export function PurchaseOrderActionButtons({ actions, onSelect }: {
  actions: readonly PurchaseOrderAction[]
  onSelect: (action: PurchaseOrderAction, shift: boolean) => void
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b bg-teal-700 py-1 text-white"><CardTitle>Acciones</CardTitle></CardHeader>
      <CardContent className="grid gap-0.5 py-1">
        {actions.map((action) => (
          <Button className="w-full justify-start" key={action.key} onClick={(event) => onSelect(action, event.shiftKey)} size="xs" variant="outline"
            title={action.key === "confirm-all" ? "Shift + clic para desconfirmar todo" : undefined}>
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
