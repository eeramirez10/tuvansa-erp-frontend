import { useQuery } from "@tanstack/react-query"
import { accountingPolicyClassificationsQueryOptions } from "@/features/accounting/policies/logic"
import type { AccountingPolicy, AccountingPolicyAction } from "@/features/accounting/policies/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableRow } from "@/shared/ui/table"

const text = (value: unknown) => value === null || value === undefined ? "" : String(value)

function Classifications({ policy, onClose }: { policy: AccountingPolicy; onClose: () => void }) {
  const query = useQuery(accountingPolicyClassificationsQueryOptions(policy.id))
  return (
    <ErpDataDialog className="sm:max-w-[32rem]" description={`Clasificadores de ${policy.number}`} onOpenChange={(open) => !open && onClose()} title="Clasificadores">
      <ErpDataDialogBody className="grid gap-1.5">
        {query.isPending && <div className="grid min-h-40 place-items-center"><Spinner /></div>}
        {query.isError && <Alert variant="destructive"><AlertTitle>No fue posible cargar</AlertTitle><AlertDescription>Revise la conexión con la API.</AlertDescription></Alert>}
        {query.data && (
          <ErpDataTableViewport axes="xy" className="h-[14rem]">
            <Table className="min-w-[26rem] text-[9px]"><TableBody>
              {query.data.items.map((item, index) => <TableRow key={index}><TableCell className="w-24 px-1 py-0.5">{text(item.code)}</TableCell><TableCell className="px-1 py-0.5">{text(item.description)}</TableCell></TableRow>)}
            </TableBody></Table>
          </ErpDataTableViewport>
        )}
        <footer className="flex justify-end gap-1"><Button disabled size="sm">Guardar</Button><Button onClick={onClose} size="sm" variant="outline">Cerrar</Button></footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function AccountingPolicyActionDialog({ policy, action, onClose }: {
  policy: AccountingPolicy
  action: AccountingPolicyAction
  onClose: () => void
}) {
  if (action.panel === "classifications") return <Classifications onClose={onClose} policy={policy} />
  return (
    <ErpDataDialog className="sm:max-w-[34rem]" description={`${action.label} de ${policy.number}`} onOpenChange={(open) => !open && onClose()} title={action.label}>
      <ErpDataDialogBody className="grid gap-2">
        <Alert><AlertTitle>Acción conservada en el diseño</AlertTitle><AlertDescription>Esta acción puede modificar datos en OMNIS o generar un reporte. Permanecerá sin operación durante la etapa de API de solo lectura.</AlertDescription></Alert>
        <div className="flex justify-end"><Button onClick={onClose} size="sm">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
