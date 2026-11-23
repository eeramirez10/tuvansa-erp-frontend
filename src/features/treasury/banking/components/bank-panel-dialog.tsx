import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { BankAutomaticReconciliationDialog } from "@/features/treasury/banking/components/bank-automatic-reconciliation-dialog"
import { BankAuxiliaryPanel } from "@/features/treasury/banking/components/bank-auxiliary-panel"
import { BankClassifiersPanel } from "@/features/treasury/banking/components/bank-classifiers-panel"
import { BankLedgerPanel } from "@/features/treasury/banking/components/bank-ledger-panel"
import { BankReconciliationDialog } from "@/features/treasury/banking/components/bank-reconciliation-dialog"
import { BankReviewPanel } from "@/features/treasury/banking/components/bank-review-panel"
import { BankSupplierExpensesDialog } from "@/features/treasury/banking/components/bank-supplier-expenses-dialog"
import { BankTransferDialog } from "@/features/treasury/banking/components/bank-transfer-dialog"
import { bankPanelQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount, BankPanel, BankPanelDefinition, BankPanelKey } from "@/features/treasury/banking/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

type PanelKey = Exclude<BankPanelKey, "reconciliation" | "transfer" | "automatic-reconciliation" | "supplier-expenses">
const titles: Record<PanelKey, string> = {
  movements: "Movimientos", deposits: "Depósitos", payments: "Pagos", auxiliary: "Auxiliar",
  "general-ledger": "Mayor y presupuesto",
  "cost-center-ledger": "Mayor y presupuesto", "authorization-review": "Autorizar", classifiers: "Clasificadores",
  "unapplied-auxiliary": "Auxiliar movimientos no aplicados",
}

function PanelContent({ account, data, panelKey, costCenter, onCostCenterChange }: {
  account: BankAccount
  data: BankPanel
  panelKey: PanelKey
  costCenter: string
  onCostCenterChange: (center: string) => void
}) {
  if (!data.available || panelKey === "movements") {
    return <Alert>
      <HugeiconsIcon icon={InformationCircleIcon} />
      <AlertTitle>{data.button}</AlertTitle>
      <AlertDescription>{data.reason ?? "Consulta las pólizas y movimientos de la cuenta."}</AlertDescription>
    </Alert>
  }
  switch (panelKey) {
    case "auxiliary": case "payments": case "deposits": case "unapplied-auxiliary":
      return <BankAuxiliaryPanel data={data} variant={panelKey} />
    case "general-ledger": return <BankLedgerPanel accountId={account.id} data={data} />
    case "cost-center-ledger": return <BankLedgerPanel accountId={account.id} center={costCenter} data={data}
      key={costCenter} onCenterChange={onCostCenterChange} />
    case "authorization-review": return <BankReviewPanel accountId={account.id} data={data} />
    case "classifiers": return <BankClassifiersPanel accountId={account.id} data={data} key={Number(data.summary?.revision ?? 0)} />
  }
}

type Props = { account: BankAccount; panel: BankPanelDefinition; onOpenChange: (open: boolean) => void }

function BankReadPanelDialog({ account, panelKey, onOpenChange }: Omit<Props, "panel"> & { panelKey: PanelKey }) {
  const [costCenter, setCostCenter] = useState("1")
  const query = useQuery(bankPanelQueryOptions(account.id, panelKey, panelKey === "cost-center-ledger" ? costCenter : undefined))
  const title = titles[panelKey]

  return <ErpDataDialog className="sm:max-w-[72rem]" description={`${title} de la cuenta ${account.code}`}
    onOpenChange={onOpenChange} title={title} tone="banking">
    <ErpDataDialogBody className="grid gap-1.5">
      {query.isPending && <div className="grid min-h-64 place-items-center"><Spinner /></div>}
      {query.isError && <Alert variant="destructive">
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>No fue posible cargar la ventana</AlertTitle>
        <AlertDescription>Revise la conexión con la API.</AlertDescription>
      </Alert>}
      {query.data && <PanelContent account={account} costCenter={costCenter} data={query.data} panelKey={panelKey}
        onCostCenterChange={setCostCenter} />}
      <footer className="flex justify-end gap-1">
        <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">Cerrar</Button>
      </footer>
    </ErpDataDialogBody>
  </ErpDataDialog>
}

export function BankPanelDialog({ account, panel, onOpenChange }: Props) {
  if (panel.key === "reconciliation") return <BankReconciliationDialog account={account} onOpenChange={onOpenChange} />
  if (panel.key === "automatic-reconciliation") return <BankAutomaticReconciliationDialog account={account} onOpenChange={onOpenChange} />
  if (panel.key === "transfer") return <BankTransferDialog account={account} onOpenChange={onOpenChange} />
  if (panel.key === "supplier-expenses") return <BankSupplierExpensesDialog account={account} onOpenChange={onOpenChange} />
  return <BankReadPanelDialog account={account} panelKey={panel.key} onOpenChange={onOpenChange} />
}
