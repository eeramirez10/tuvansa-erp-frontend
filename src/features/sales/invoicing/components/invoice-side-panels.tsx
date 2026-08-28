import type { InvoicePanelDefinition } from "@/features/sales/invoicing/model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export function InvoicePanelButtons({
  title,
  panels,
  onSelect,
}: {
  title: string
  panels: readonly InvoicePanelDefinition[]
  onSelect: (panel: InvoicePanelDefinition) => void
}) {
  return (
    <Card size="sm">
      <CardHeader className="border-b bg-module-sales/15 py-1">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-0.5 py-1">
        {panels.map((panel) => (
          <Button
            className="w-full justify-start"
            key={panel.key}
            onClick={() => onSelect(panel)}
            size="xs"
            variant="outline"
          >
            {panel.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
