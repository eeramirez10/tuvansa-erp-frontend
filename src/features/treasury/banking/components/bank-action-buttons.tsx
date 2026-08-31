import { availableBankPanels, bankActionLabels } from "@/features/treasury/banking/constants"
import type { BankPanelDefinition } from "@/features/treasury/banking/model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export function BankActionButtons({ onSelect }: { onSelect: (panel: BankPanelDefinition) => void }) {
  return <Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Acciones</CardTitle></CardHeader><CardContent className="grid gap-0.5 py-1">
    {bankActionLabels.map((label) => {
      const panel = availableBankPanels.find((item) => item.label === label)
      return <Button className="h-auto min-h-5 w-full justify-start whitespace-normal text-left" disabled={!panel} key={label} onClick={() => panel && onSelect(panel)} size="xs" variant="outline">{label}</Button>
    })}
  </CardContent></Card>
}
