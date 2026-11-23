import { useMutation, useQuery } from "@tanstack/react-query"
import { useRef } from "react"

import { bankAccountFormQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount } from "@/features/treasury/banking/model"
import { deactivateBankAccount } from "@/features/treasury/banking/services/bank-account-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

export function BankAccountRemovalDialog({ account, onClose, onDeleted }: {
  account: BankAccount
  onClose: () => void
  onDeleted: () => void
}) {
  const query = useQuery(bankAccountFormQueryOptions(account.id))
  const inFlight = useRef(false)
  const removal = useMutation({
    mutationFn: (revision: string) => deactivateBankAccount(account.id, revision),
    networkMode: "always",
    onSuccess: onDeleted,
    onSettled: () => { inFlight.current = false },
  })
  const preview = query.data
  const canDelete = preview?.canDelete === true && Boolean(preview.revision) && !query.isFetching && !query.isError

  function close() {
    if (!inFlight.current) onClose()
  }

  function confirm() {
    if (!canDelete || !preview?.revision || inFlight.current) return
    inFlight.current = true
    removal.mutate(preview.revision)
  }

  return (
    <ErpDataDialog className="sm:max-w-[30rem]" description={`Baja de la cuenta ${account.code}`}
      onOpenChange={(open) => { if (!open) close() }} title="Baja" tone="banking">
      <ErpDataDialogBody className="grid gap-3">
        <p className="font-medium">{account.code} · {account.name}</p>
        {query.isFetching && <div className="flex items-center gap-2" role="status"><Spinner /> Verificando la cuenta</div>}
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {preview && !canDelete && !query.isFetching && !query.isError && (
          <Alert><AlertDescription>{preview.deleteReason ?? "La baja no está disponible para esta cuenta."}</AlertDescription></Alert>
        )}
        {canDelete && <p>¿Quieres dar de baja esta cuenta bancaria? Dejará de aparecer en el catálogo.</p>}
        {removal.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(removal.error)}</AlertDescription></Alert>}
        <footer className="flex justify-end gap-1">
          <Button autoFocus disabled={removal.isPending} onClick={close} size="sm" variant="outline">Cancelar</Button>
          {(query.isError || removal.isError) && (
            <Button disabled={query.isFetching} onClick={() => {
              removal.reset()
              void query.refetch()
            }} size="sm" variant="outline">Recargar ficha</Button>
          )}
          <Button disabled={!canDelete || removal.isPending || removal.isError} onClick={confirm} size="sm" variant="destructive">
            {removal.isPending && <Spinner />}
            Dar de baja
          </Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
