import { useQuery } from "@tanstack/react-query"

import { BankPanelTable, type BankPanelColumn } from "@/features/treasury/banking/components/bank-panel-table"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import { getBankReconciliationDetail } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

const columns: BankPanelColumn[] = [
  { label: "Fecha", key: "date" }, { label: "Documento", key: "document" },
  { label: "T.M.", key: "movementType" }, { label: "Referencia", key: "reference" },
  { label: "Importe", key: "amount", numeric: true }, { label: "Dif. cambiaria", key: "exchangeDifference", numeric: true },
]

export function BankReconciliationDetail({ accountId, movementId, onClose }: {
  accountId: number
  movementId: number
  onClose: () => void
}) {
  const detail = useQuery({
    queryKey: [...bankAccountKeys.panel(accountId, "reconciliation"), "detail", movementId],
    queryFn: ({ signal }) => getBankReconciliationDetail(accountId, movementId, signal),
    refetchOnMount: "always",
  })
  return (
    <ErpDataDialog defaultWidth={620} description="Documentos de la partida enfocada en Conciliar"
      title="Auxiliar del documento" tone="banking" onOpenChange={onClose}>
      <ErpDataDialogBody className="grid gap-2">
        {detail.isFetching && <div className="grid min-h-24 place-items-center"><Spinner /></div>}
        {detail.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(detail.error)}</AlertDescription></Alert>}
        {!detail.isFetching && !detail.isError && detail.data && (detail.data.available
          ? <BankPanelTable columns={columns} rows={detail.data.items} minWidth="min-w-[34rem]" height="h-[18rem]" />
          : <p role="status">{detail.data.reason}</p>)}
        <div className="flex justify-end gap-1">
          {detail.isError && <Button size="sm" type="button" onClick={() => void detail.refetch()}>Reintentar</Button>}
          <Button size="sm" type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
