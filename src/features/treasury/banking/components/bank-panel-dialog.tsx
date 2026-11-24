import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SupplierPaymentReversalDialog } from "@/features/accounts-payable/suppliers/components/supplier-payment-reversal-dialog"
import { ClientCollectionReversalDialog } from "@/features/accounts-receivable/clients/components/client-collection-reversal-dialog"
import { BankAutomaticReconciliationDialog } from "@/features/treasury/banking/components/bank-automatic-reconciliation-dialog"
import { BankAuxiliaryPanel } from "@/features/treasury/banking/components/bank-auxiliary-panel"
import { BankClassifiersPanel } from "@/features/treasury/banking/components/bank-classifiers-panel"
import { BankLedgerPanel } from "@/features/treasury/banking/components/bank-ledger-panel"
import { BankPanelTable } from "@/features/treasury/banking/components/bank-panel-table"
import { BankReconciliationDialog } from "@/features/treasury/banking/components/bank-reconciliation-dialog"
import { BankReviewPanel } from "@/features/treasury/banking/components/bank-review-panel"
import { BankSupplierExpensesDialog } from "@/features/treasury/banking/components/bank-supplier-expenses-dialog"
import { BankTransferDialog } from "@/features/treasury/banking/components/bank-transfer-dialog"
import { bankMoney, bankPanelQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount, BankPanel, BankPanelDefinition, BankPanelKey, BankReversalTarget } from "@/features/treasury/banking/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

type PanelKey = Exclude<BankPanelKey, "reconciliation" | "transfer" | "automatic-reconciliation">
const titles: Record<PanelKey, string> = {
  movements: "Movimientos", deposits: "Depósitos", payments: "Pagos", auxiliary: "Auxiliar",
  "general-ledger": "Mayor y presupuesto",
  "cost-center-ledger": "Mayor y presupuesto", "authorization-review": "Autorizar", classifiers: "Clasificadores",
  "unapplied-auxiliary": "Auxiliar movimientos no aplicados",
  "supplier-expenses": "Compras por proveedor",
}

function SupplierExpensesReport({ data }: { data: BankPanel }) {
  return <>
    <BankPanelTable columns={[
      { label: "Código", key: "supplierCode" }, { label: "Proveedor", key: "supplierName" },
      { label: "Cargo", key: "charge", numeric: true }, { label: "Abono", key: "credit", numeric: true },
    ]} height="h-72" minWidth="min-w-[420px]" rows={data.items} />
    {data.reason && <p className="text-muted-foreground" role="status">{data.reason}</p>}
    <div className="flex flex-wrap justify-end gap-1">
      <ErpDataMetric label="Total cargos" value={bankMoney(data.summary?.charges)} />
      <ErpDataMetric label="Total abonos" value={bankMoney(data.summary?.credits)} />
    </div>
  </>
}

function PanelContent({ account, data, panelKey, costCenter, onCostCenterChange, onReversal }: {
  account: BankAccount
  data: BankPanel
  panelKey: PanelKey
  costCenter: string
  onCostCenterChange: (center: string) => void
  onReversal?: (target: BankReversalTarget) => void
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
      return <BankAuxiliaryPanel data={data} onReversal={onReversal} variant={panelKey} />
    case "general-ledger": return <BankLedgerPanel accountId={account.id} data={data} />
    case "cost-center-ledger": return <BankLedgerPanel accountId={account.id} center={costCenter} data={data}
      key={costCenter} onCenterChange={onCostCenterChange} />
    case "authorization-review": return <BankReviewPanel accountId={account.id} data={data} />
    case "classifiers": return <BankClassifiersPanel accountId={account.id} data={data} key={Number(data.summary?.revision ?? 0)} />
    case "supplier-expenses": return <SupplierExpensesReport data={data} />
  }
}

type Props = { account: BankAccount; panel: BankPanelDefinition; onOpenChange: (open: boolean) => void }

function BankReadPanelDialog({ account, panelKey, onOpenChange }: Omit<Props, "panel"> & { panelKey: PanelKey }) {
  const [costCenter, setCostCenter] = useState("1")
  const [payingReceipt, setPayingReceipt] = useState(false)
  const [reversal, setReversal] = useState<BankReversalTarget | null>(null)
  const query = useQuery(bankPanelQueryOptions(account.id, panelKey, panelKey === "cost-center-ledger" ? costCenter : undefined))
  const title = titles[panelKey]
  const supplierReport = panelKey === "supplier-expenses"
  const canOpenPayment = supplierReport && account.systemType === "bank" && account.currency.id === 1 && account.control.payments

  if (payingReceipt) {
    return <BankSupplierExpensesDialog account={account} onOpenChange={(open) => { if (!open) setPayingReceipt(false) }} />
  }

  return <>
    <ErpDataDialog className={supplierReport ? "sm:max-w-[38rem]" : "sm:max-w-[72rem]"} description={`${title} de la cuenta ${account.code}`}
      onOpenChange={open => { if (open || !reversal) onOpenChange(open) }} title={title} tone="banking">
      <ErpDataDialogBody className="grid gap-1.5">
        {query.isPending && <div className="grid min-h-64 place-items-center"><Spinner /></div>}
        {query.isError && <Alert variant="destructive">
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertTitle>No fue posible cargar la ventana</AlertTitle>
          <AlertDescription>Revise la conexión con la API.</AlertDescription>
        </Alert>}
        {query.data && <PanelContent account={account} costCenter={costCenter} data={query.data} panelKey={panelKey}
          onCostCenterChange={setCostCenter}
          onReversal={reversal ? undefined : setReversal} />}
        <footer className="flex justify-end gap-1">
          {canOpenPayment && <Button onClick={() => setPayingReceipt(true)} size="sm" variant="outline">Pagar recepción</Button>}
          <Button disabled={Boolean(reversal)} onClick={() => onOpenChange(false)} size="sm" variant="outline">Cerrar</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
    {reversal?.kind === "payment" && (
      <DesktopWindowIdentity id={`banking:${account.id}:payment-reversal:${reversal.paymentId}`}>
        <SupplierPaymentReversalDialog onClose={() => setReversal(null)} paymentId={reversal.paymentId}
          supplierId={reversal.supplierId} tone="banking" />
      </DesktopWindowIdentity>
    )}
    {reversal?.kind === "collection" && (
      <DesktopWindowIdentity id={`banking:${account.id}:collection-reversal:${reversal.collectionId}`}>
        <ClientCollectionReversalDialog clientId={reversal.clientId} collectionId={reversal.collectionId}
          onClose={() => setReversal(null)} tone="banking" />
      </DesktopWindowIdentity>
    )}
  </>
}

export function BankPanelDialog({ account, panel, onOpenChange }: Props) {
  if (panel.key === "reconciliation") return <BankReconciliationDialog account={account} onOpenChange={onOpenChange} />
  if (panel.key === "automatic-reconciliation") return <BankAutomaticReconciliationDialog account={account} onOpenChange={onOpenChange} />
  if (panel.key === "transfer") return <BankTransferDialog account={account} onOpenChange={onOpenChange} />
  return <BankReadPanelDialog account={account} panelKey={panel.key} onOpenChange={onOpenChange} />
}
