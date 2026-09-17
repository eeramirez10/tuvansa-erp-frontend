import { useState } from "react"

import type { CaptureCustomerMatch } from "@/features/sales/orders/capture-model"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { cn } from "@/shared/utils/cn"

type OrderCustomerMatchesDialogProps = {
  matches: CaptureCustomerMatch[]
  onOpenChange: (open: boolean) => void
  onSelect: (customer: CaptureCustomerMatch) => void
}

const columns = [
  "Código",
  "Nombre",
  "Sucursal",
  "RFC",
  "EAN",
  "Tel.",
  "Cel.",
  "E-mail",
]

const matchKey = (match: CaptureCustomerMatch) => `${match.id}:${match.branch}`

export function OrderCustomerMatchesDialog({
  matches,
  onOpenChange,
  onSelect,
}: OrderCustomerMatchesDialogProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(
    matches[0] ? matchKey(matches[0]) : null,
  )
  const selected =
    matches.find((match) => matchKey(match) === selectedKey) ?? matches[0] ?? null

  const accept = (match = selected) => {
    if (match) onSelect(match)
  }

  return (
    <ErpDataDialog
      defaultHeight={430}
      defaultWidth={1000}
      description="Coincidencias del cliente capturado en el pedido"
      fillHeight
      onOpenChange={onOpenChange}
      title="Encuentra cliente por código o nombre"
      tone="sales"
    >
      <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-1">
        <ErpDataTableViewport axes="xy" className="min-h-0 flex-1">
          <table className="min-w-[960px] w-full border-collapse text-[9px]/none">
            <colgroup>
              <col className="w-[6rem]" />
              <col className="w-[19rem]" />
              <col className="w-[8rem]" />
              <col className="w-[9rem]" />
              <col className="w-[8rem]" />
              <col className="w-[8rem]" />
              <col className="w-[8rem]" />
              <col className="w-[16rem]" />
            </colgroup>
            <thead className="sticky top-0 z-[1] bg-muted">
              <tr className="h-5 border-b border-input">
                {columns.map((column) => (
                  <th className="whitespace-nowrap px-1 text-left font-normal" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr
                  className={cn(
                    "h-5 cursor-default border-b border-dotted border-input/60",
                    selected && matchKey(selected) === matchKey(match) &&
                      "bg-module-sales text-module-sales-foreground",
                  )}
                  key={matchKey(match)}
                  onClick={() => setSelectedKey(matchKey(match))}
                  onDoubleClick={() => accept(match)}
                >
                  <td className="truncate px-1 font-mono">{match.code}</td>
                  <td className="truncate px-1">{match.name}</td>
                  <td className="truncate px-1">{match.branch}</td>
                  <td className="truncate px-1">{match.taxId}</td>
                  <td className="truncate px-1">{match.ean}</td>
                  <td className="truncate px-1">{match.phone}</td>
                  <td className="truncate px-1">{match.mobile}</td>
                  <td className="truncate px-1">{match.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ErpDataTableViewport>

        <footer className="flex items-center justify-between gap-1">
          <span>{matches.length} coincidencia{matches.length === 1 ? "" : "s"}</span>
          <div className="flex gap-1">
            <Button disabled={!selected} onClick={() => accept()} size="sm">
              ✓ OK
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              size="sm"
              variant="outline"
            >
              × Cancelar
            </Button>
          </div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
