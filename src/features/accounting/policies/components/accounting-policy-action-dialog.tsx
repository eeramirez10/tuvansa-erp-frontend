import { AccountingPolicyClassificationDialog } from "@/features/accounting/policies/components/accounting-policy-classification-dialog"
import { AccountingPolicyCommentsDialog } from "@/features/accounting/policies/components/accounting-policy-comments-dialog"
import type { AccountingPolicy, AccountingPolicyAction } from "@/features/accounting/policies/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"

export function AccountingPolicyActionDialog({ policy, action, onClose }: {
  policy: AccountingPolicy
  action: AccountingPolicyAction
  onClose: () => void
}) {
  if (action.key === "comments") return <AccountingPolicyCommentsDialog onClose={onClose} policy={policy} />
  if (action.panel === "classifications") return <AccountingPolicyClassificationDialog onClose={onClose} policy={policy} />
  return (
    <ErpDataDialog className="sm:max-w-[34rem]" description={`${action.label} de ${policy.number}`} onOpenChange={(open) => !open && onClose()} title={action.label}>
      <ErpDataDialogBody className="grid gap-2">
        <Alert><AlertTitle>Acción conservada en el diseño</AlertTitle><AlertDescription>Esta acción puede modificar datos en OMNIS o generar un reporte. Permanecerá sin operación durante la etapa de API de solo lectura.</AlertDescription></Alert>
        <div className="flex justify-end"><Button onClick={onClose} size="sm">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
