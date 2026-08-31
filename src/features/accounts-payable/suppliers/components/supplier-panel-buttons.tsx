import type { SupplierPanelDefinition } from "@/features/accounts-payable/suppliers/model"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

type Props = {
  title: string
  panels: readonly SupplierPanelDefinition[]
  onSelect: (panel: SupplierPanelDefinition) => void
}

export function SupplierPanelButtons({ title, panels, onSelect }: Props) {
  return (
    <Card size="sm">
      <CardHeader className="border-b bg-module-payable/10"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-0.5">
        {panels.map((panel) => (
          <Button className="w-full justify-between" key={panel.key} onClick={() => onSelect(panel)} size="xs" variant="outline">
            <span className="truncate">{panel.label}</span>
            {panel.ct && <Badge className="h-3 px-0.5 text-[7px]" variant="outline">CT</Badge>}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
