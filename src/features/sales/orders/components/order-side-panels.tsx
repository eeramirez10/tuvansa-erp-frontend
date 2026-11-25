import type { OrderPanelDefinition } from "@/features/sales/orders/model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export function OrderPanelButtons({
  title, panels, onSelect, authorization,
}: {
  title: string
  panels: readonly OrderPanelDefinition[]
  onSelect: (panel: OrderPanelDefinition) => void
  authorization?: { pressed: boolean; pending: boolean }
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b bg-module-sales/15 py-1"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-0.5 py-1">
        {panels.map((panel) => {
          const toggle = panel.key === "authorize" ? authorization : undefined
          return (
            <Button
              aria-keyshortcuts={toggle && "Control+A"}
              aria-pressed={toggle?.pressed}
              className="w-full justify-start"
              disabled={toggle?.pending}
              key={panel.key}
              onClick={() => onSelect(panel)}
              size="xs"
              variant="outline"
            >
              {panel.label}
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
