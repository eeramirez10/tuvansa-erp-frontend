import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { BankPanelTable } from "@/features/treasury/banking/components/bank-panel-table"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import type { BankPanel } from "@/features/treasury/banking/model"
import { saveBankReview } from "@/features/treasury/banking/services/bank-panel-settings-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"

export function BankReviewPanel({ accountId, data }: { accountId: number; data: BankPanel }) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(new Set<number>())
  const [showReviewed, setShowReviewed] = useState(false)
  const rows = data.items.filter((row) => showReviewed ? row.reviewed === true : row.reviewed !== true)
  const eligible = rows.filter((row) => row.canReview === true)
  const selectedIds = eligible.flatMap((row) =>
    typeof row.movementId === "number" && selected.has(row.movementId) ? [row.movementId] : [],
  )
  const save = useMutation({
    mutationFn: () => saveBankReview(accountId, Number(data.summary?.revision ?? 0), selectedIds),
    onSuccess: async () => {
      setSelected(new Set())
      toast.success("Revisión registrada.")
      await queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    },
  })
  return <div className="grid gap-1">
    <BankPanelTable columns={[
      ...(eligible.length ? [{
        label: "Sel.", key: "selected", render: (row: Record<string, unknown>) => {
          const id = row.movementId
          if (typeof id !== "number" || row.canReview !== true) return null
          return <Checkbox aria-label={`Seleccionar revisión ${row.policyNumber || id}`} checked={selected.has(id)} disabled={save.isPending}
            onCheckedChange={(checked) => setSelected((current) => {
              const next = new Set(current)
              if (checked === true) next.add(id)
              else next.delete(id)
              return next
            })} />
        },
      }] : []),
      { label: "Beneficiario", key: "beneficiary" }, { label: "EST", key: "policyStatus" },
      { label: "TM", key: "movementType" }, { label: "Cheque", key: "checkNumber" },
      { label: "Póliza", key: "policyNumber" }, { label: "Fecha", key: "policyDate" },
      { label: "Cargos", key: "charge", numeric: true }, { label: "Abonos", key: "credit", numeric: true },
      { label: "A", key: "authorized" }, { label: "T", key: "inTransit" },
    ]} rows={rows} />
    {showReviewed && rows.length === 0 && <p className="text-muted-foreground">Sin movimientos web revisados.</p>}
    {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
    <div className="flex gap-1">
      <Button disabled={selectedIds.length === 0 || save.isPending} onClick={() => save.mutate()} size="xs">Registrar</Button>
      <Button aria-pressed={showReviewed} disabled={save.isPending} onClick={() => { setShowReviewed(!showReviewed) }}
        size="xs" variant="outline">Filtra *</Button>
    </div>
  </div>
}
