import type { PurchaseReceptionAction } from "@/features/purchasing/purchase-receptions/model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export function PurchaseReceptionActionButtons({ actions, onSelect }: {
  actions: readonly PurchaseReceptionAction[]
  onSelect: (action: PurchaseReceptionAction) => void
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b bg-teal-700 py-1 text-white"><CardTitle>Acciones</CardTitle></CardHeader>
      <CardContent className="grid gap-0.5 py-1">
        {actions.map((action, index) => (
          <Button
            className={`${index === 12 || index === 14 ? "mt-2" : ""} w-full justify-start`}
            key={action.key}
            onClick={() => onSelect(action)}
            size="xs"
            variant="outline"
          >
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
