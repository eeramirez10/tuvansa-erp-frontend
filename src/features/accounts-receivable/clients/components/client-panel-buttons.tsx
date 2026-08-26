import type { ClientPanelDefinition } from "@/features/accounts-receivable/clients/model"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

type ClientPanelButtonsProps = {
  title: string
  panels: readonly ClientPanelDefinition[]
  onSelect: (panel: ClientPanelDefinition) => void
}

export function ClientPanelButtons({ title, panels, onSelect }: ClientPanelButtonsProps) {
  return (
    <Card size="sm">
      <CardHeader className="border-b"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-0.5">
        {panels.map((panel) => (
          <Button
            className="w-full justify-between"
            key={panel.key}
            onClick={() => onSelect(panel)}
            size="xs"
            variant="outline"
          >
            <span className="truncate">{panel.label}</span>
            {panel.key.startsWith("ct-") && <Badge className="h-3 px-0.5 text-[7px]" variant="outline">CT</Badge>}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
