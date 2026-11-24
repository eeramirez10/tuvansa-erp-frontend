import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { BankPanelTable } from "@/features/treasury/banking/components/bank-panel-table"
import { BankReviewTransferDialog } from "@/features/treasury/banking/components/bank-review-transfer-dialog"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import type { BankPanel } from "@/features/treasury/banking/model"
import { saveBankReview } from "@/features/treasury/banking/services/bank-panel-settings-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"

const pageSize = 100

export function BankReviewPanel({ accountId, data }: { accountId: number; data: BankPanel }) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(new Set<number>())
  const [showReviewed, setShowReviewed] = useState(false)
  const [page, setPage] = useState(1)
  const [transfer, setTransfer] = useState<{ revision: number; movementIds: number[]; net: number } | null>(null)
  const rows = data.items.filter((row) => showReviewed ? row.reviewed === true : row.reviewed !== true)
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const eligible = rows.filter((row) => row.canReview === true)
  const selectedIds = eligible.flatMap((row) =>
    typeof row.movementId === "number" && selected.has(row.movementId) ? [row.movementId] : [],
  )
  const queued = data.items.filter((row) => row.canSetReviewMark === true && row.authorized === "+" && typeof row.movementId === "number")
  const revision = Number(data.summary?.revision ?? 0)
  const save = useMutation({
    mutationFn: ({ ids, mark }: { ids: number[]; mark: "" | "+" | "*" }) => saveBankReview(accountId, revision, ids, mark),
    onSuccess: async (_, { mark }) => {
      if (mark === "*") {
        setSelected(new Set())
        setPage(1)
        toast.success("Revisión registrada.")
      }
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
      { label: "A", key: "authorized", render: (row) => {
        const id = row.movementId
        const isQueued = row.authorized === "+"
        if (typeof id !== "number" || row.canReview !== true) return String(row.authorized ?? "")
        return <Button aria-label={`${isQueued ? "Quitar" : "Marcar"} + ${String(row.policyNumber || id)}`}
          aria-pressed={isQueued} className="h-5 min-w-5 px-1" disabled={save.isPending || Boolean(transfer)}
          onClick={() => save.mutate({ ids: [id], mark: isQueued ? "" : "+" })} size="xs" variant="outline">
          {isQueued ? "+" : "·"}
        </Button>
      } }, { label: "T", key: "inTransit" },
    ]} rows={visibleRows} />
    {rows.length === 0 && <p className="text-muted-foreground">{showReviewed ? "Sin movimientos revisados." : "Sin movimientos pendientes de revisar."}</p>}
    {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
    <div className="flex flex-wrap items-center gap-1">
      <Button disabled={selectedIds.length === 0 || save.isPending || Boolean(transfer)}
        onClick={() => save.mutate({ ids: selectedIds, mark: "*" })} size="xs">Registrar</Button>
      <Button aria-pressed={showReviewed} disabled={save.isPending} onClick={() => { setShowReviewed(!showReviewed); setPage(1) }}
        size="xs" variant="outline">Filtra *</Button>
      <Button disabled={!queued.length || save.isPending || Boolean(transfer)} size="xs" variant="outline" onClick={() => {
        setTransfer({ revision, movementIds: queued.map((row) => Number(row.movementId)),
          net: queued.reduce((sum, row) => sum + Number(row.charge) - Number(row.credit), 0) })
      }}>Traspasa +</Button>
      {pageCount > 1 && <div className="ml-auto flex items-center gap-1">
        <Button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} size="xs" variant="outline">Anterior</Button>
        <span className="text-xs" aria-live="polite">Página {currentPage} de {pageCount}</span>
        <Button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} size="xs" variant="outline">Siguiente</Button>
      </div>}
    </div>
    {transfer && <DesktopWindowIdentity id={`banking:${accountId}:review-transfer`}>
      <BankReviewTransferDialog accountId={accountId} {...transfer} onClose={() => setTransfer(null)} />
    </DesktopWindowIdentity>}
  </div>
}
