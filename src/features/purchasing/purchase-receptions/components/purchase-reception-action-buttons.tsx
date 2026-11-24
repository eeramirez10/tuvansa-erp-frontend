import type { PurchaseReceptionAction } from "@/features/purchasing/purchase-receptions/model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export function PurchaseReceptionActionButtons({ actions, onSelect, canSelectLine, hasSelectedLine }: {
  actions: readonly PurchaseReceptionAction[]
  onSelect: (action: PurchaseReceptionAction) => void
  canSelectLine: boolean
  hasSelectedLine: boolean
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b bg-teal-700 py-1 text-white"><CardTitle>Acciones</CardTitle></CardHeader>
      <CardContent className="grid gap-0.5 py-1">
        {actions.map((action, index) => {
          const needsLine = action.key === "add-pieces" || action.key === "edit-pieces"
          const reason = action.key === "add-loose-pieces" ? "El complemento de piezas sueltas está desactivado."
            : needsLine && !canSelectLine ? "Disponible en recepciones vigentes con partidas."
            : needsLine && !hasSelectedLine ? "Selecciona una partida de la recepción."
            : undefined
          return (
            <Button
              aria-description={reason}
              className={`${index === 12 || index === 14 ? "mt-2" : ""} w-full justify-start`}
              disabled={Boolean(reason)}
              key={action.key}
              onClick={() => onSelect(action)}
              size="xs"
              title={reason}
              variant="outline"
            >
              {action.label}
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
