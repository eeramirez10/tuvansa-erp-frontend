import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { captureProductFamiliesQuery } from "@/features/sales/orders/capture-logic"
import type { CaptureProductFamily } from "@/features/sales/orders/capture-model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

type FamilyChoice = { position: number; code: string }

function familyPattern(groups: CaptureProductFamily[], selected: FamilyChoice[]) {
  let pattern = "*".repeat(16)
  for (const { position, code } of selected) {
    const group = groups.find((candidate) => candidate.position === position)
    if (!group) continue
    pattern = pattern.slice(0, group.start) + code + pattern.slice(group.start + group.width)
  }
  return pattern.slice(0, 13)
}

export function OrderProductFamiliesDialog({ onClose, onApply }: {
  onClose: () => void
  onApply: (pattern: string) => void
}) {
  const families = useQuery(captureProductFamiliesQuery())
  const [selected, setSelected] = useState<FamilyChoice[]>([])
  const groups = families.data ?? []
  return (
    <ErpDataDialog defaultWidth={510} description="Filtrar los productos por familia en el almacén activo"
      onOpenChange={onClose} title="Familias" tone="sales">
      <ErpDataDialogBody className="grid gap-2">
        {families.isPending && <div className="grid min-h-24 place-items-center"><Spinner /></div>}
        {families.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(families.error)}</AlertDescription></Alert>}
        <form className="grid gap-2" onSubmit={(event) => {
          event.preventDefault()
          if (groups.length) onApply(familyPattern(groups, selected))
        }}>
          {groups.map(({ position, label, options }) => (
            <label className="grid grid-cols-[8rem_1fr] items-center gap-1" key={position}>{label}
              <select className="h-6 min-w-0 rounded-sm border bg-background px-1" value={selected.find((choice) => choice.position === position)?.code ?? ""}
                onChange={(event) => {
                  const code = event.target.value
                  setSelected((current) => {
                    const others = current.filter((choice) => choice.position !== position)
                    return code ? [...others, { position, code }] : others
                  })
                }}>
                <option value="">Todos</option>
                {options.filter(({ code }) => code && !/^\*+$/.test(code)).map(({ code, description }) => (
                  <option key={code} value={code}>{code} — {description}</option>
                ))}
              </select>
            </label>
          ))}
          <footer className="flex justify-end gap-1">
            <Button onClick={onClose} type="button" size="sm" variant="outline">Cancelar</Button>
            <Button disabled={groups.length === 0 || families.isFetching} type="submit" size="sm">OK</Button>
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
