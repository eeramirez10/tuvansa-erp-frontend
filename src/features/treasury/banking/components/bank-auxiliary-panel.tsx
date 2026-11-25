import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"

import { paths } from "@/app/router/paths"
import { parsePostingReversal, type PostingReversal } from "@/features/accounts-payable/posting-reversal-model"
import { supplierReversiblePayment } from "@/features/accounts-payable/suppliers/logic"
import { ManualPolicyTransitionDialog } from "@/features/accounting/policies/components/manual-policy-transition-dialog"
import { accountingPolicyKeys, accountingPolicyQueryOptions } from "@/features/accounting/policies/logic"
import type { AccountingPolicy } from "@/features/accounting/policies/model"
import { BankPanelTable, type BankPanelColumn } from "@/features/treasury/banking/components/bank-panel-table"
import { printBankPolicy } from "@/features/treasury/banking/components/bank-policy-print"
import { bankAccountKeys, bankMoney } from "@/features/treasury/banking/logic"
import type { BankPanel, BankReversalTarget } from "@/features/treasury/banking/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { DesktopWindowIdentity, useDesktopWindowId } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

type Variant = "auxiliary" | "payments" | "deposits" | "unapplied-auxiliary"
type Row = BankPanel["items"][number]

const movements: BankPanelColumn[] = [
  { label: "Cargos", key: "charge", numeric: true },
  { label: "Abonos", key: "credit", numeric: true },
]

const policyColumns: BankPanelColumn[] = [
  { label: "Póliza", key: "policyNumber" },
  { label: "Fecha", key: "policyDate" },
]

const unappliedColumns: BankPanelColumn[] = [
  { label: "Cheque", key: "checkNumber" },
  ...policyColumns,
  { label: "Fecha Pr", key: "postdatedAt" },
  ...movements,
  { label: "Acumulado", key: "accumulated", numeric: true },
  { label: "Benef", key: "beneficiary" },
  { label: "Concepto", key: "description" },
]

function auxiliaryColumns(variant: Variant, hasStatementDate: boolean): BankPanelColumn[] {
  return [
    { label: "Concepto", key: "description" },
    { label: "OK", key: "reconciled" },
    { label: "TM", key: "movementType" },
    { label: variant === "deposits" ? "Depósito" : "Cheque", key: "checkNumber" },
    ...policyColumns,
    ...(hasStatementDate ? [{ label: "Fecha conc.", key: "statementDate" }] : []),
    ...movements,
    { label: "Saldo", key: "runningBalance", numeric: true },
    { label: "C.C.", key: "costCenter" },
    { label: "Benef", key: "beneficiary" },
    { label: "Usr.", key: "user" },
    { label: "Ref.", key: "bankNumber" },
    { label: "Fecha Pr.", key: "postdatedAt" },
  ]
}

function policyId(row: Row | undefined) {
  const id = row?.policyId
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null
}

function selectionKey(row: Row) {
  return String(row.movementId ?? row.policyId ?? "")
}

function positiveId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
}

function reversiblePosting(row: Row | undefined, variant: Variant): { target: BankReversalTarget; reversal: PostingReversal | null } | null {
  if (!row) return null
  if (variant === "payments") {
    const payment = supplierReversiblePayment(row)
    return payment && positiveId(row.supplierId)
      ? { target: { kind: "payment", supplierId: row.supplierId, paymentId: payment.id }, reversal: payment.reversal }
      : null
  }
  if (variant !== "deposits" || row.isCollectionReversal === true || !positiveId(row.clientId) || !positiveId(row.collectionId)) return null
  const reversal = parsePostingReversal(row.reversal)
  return row.canReverseCollection === true || reversal
    ? { target: { kind: "collection", clientId: row.clientId, collectionId: row.collectionId }, reversal }
    : null
}

function BankPolicyComments({ id, row, onClose }: { id: number; row: Row; onClose: () => void }) {
  const query = useQuery(accountingPolicyQueryOptions(id))
  const policy = query.data
  return (
    <ErpDataDialog
      className="sm:max-w-[34rem]"
      description={`Póliza ${String(row.policyNumber ?? id)}`}
      onOpenChange={(open) => { if (!open) onClose() }}
      title="Comentarios"
      tone="banking"
    >
      <ErpDataDialogBody className="grid gap-3">
        {query.isPending && <div className="flex items-center gap-2" role="status"><Spinner /> Cargando póliza</div>}
        {query.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {getApiErrorMessage(query.error)}
              <Button className="ml-2" onClick={() => void query.refetch()} size="xs" variant="outline">Reintentar</Button>
            </AlertDescription>
          </Alert>
        )}
        {policy && <>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs [&_dt]:font-medium">
            <dt>Fecha</dt><dd>{policy.date || "—"}</dd>
            <dt>Estado</dt><dd>{policy.applied ? "Aplicada" : "Sin aplicar"}</dd>
            <dt>Origen</dt><dd>{policy.origin || "—"}</dd>
            <dt>Beneficiario</dt><dd className="break-words">{policy.beneficiary || "—"}</dd>
            <dt>Concepto</dt><dd className="whitespace-pre-wrap break-words">{policy.concept || "—"}</dd>
            {Boolean(row.bankNumber) && <><dt>Referencia bancaria</dt><dd>{String(row.bankNumber)}</dd></>}
          </dl>
          <Link className="w-fit text-xs text-primary underline" to={paths.accountingPolicy(policy.id)}>Ver póliza</Link>
        </>}
        <footer className="flex justify-end">
          <Button onClick={onClose} size="sm">OK</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function BankAuxiliaryPanel({ data, variant, onReversal }: {
  data: BankPanel
  variant: Variant
  onReversal?: (target: BankReversalTarget) => void
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [comment, setComment] = useState<{ id: number; row: Row } | null>(null)
  const [policyToApply, setPolicyToApply] = useState<Pick<AccountingPolicy, "id" | "number" | "date"> | null>(null)
  const queryClient = useQueryClient()
  const windowId = useDesktopWindowId(`banking:${variant}`)
  const print = useMutation({
    mutationFn: async (id: number) => printBankPolicy(await queryClient.fetchQuery(accountingPolicyQueryOptions(id))),
  })
  const selectedRow = data.items.find((row) => selectionKey(row) === selectedKey)
  const selectedPolicyId = policyId(selectedRow)
  const selectedPosting = reversiblePosting(selectedRow, variant)
  const showReversal = (variant === "payments" || variant === "deposits") && data.items.some(row => reversiblePosting(row, variant) !== null)
  const postingType = variant === "payments" ? "PP" : "PA"
  const unapplied = variant === "unapplied-auxiliary"
  const showStatementDate = data.items.some(({ statementDate }) => typeof statementDate === "string" && statementDate !== "")
  const columns: BankPanelColumn[] = [
    {
      label: "Sel.",
      key: "selected",
      render: (row) => policyId(row) !== null && (
        <Checkbox
          aria-label={`Seleccionar póliza ${String(row.policyNumber ?? row.policyId)}, movimiento ${selectionKey(row)}`}
          checked={selectionKey(row) === selectedKey}
          disabled={print.isPending}
          onCheckedChange={(checked) => {
            print.reset()
            setSelectedKey(checked ? selectionKey(row) : null)
          }}
        />
      ),
    },
    ...(unapplied ? unappliedColumns : auxiliaryColumns(variant, showStatementDate)),
  ]

  return (
    <div className="grid gap-1">
      <BankPanelTable columns={columns} rows={data.items} runningBalance={!unapplied} />
      <div className="flex flex-wrap items-end justify-between gap-1">
        <div className="flex flex-wrap gap-1">
          <Button disabled={selectedPolicyId === null}
            onClick={() => {
              if (selectedRow && selectedPolicyId !== null) setComment({ id: selectedPolicyId, row: selectedRow })
            }} size="xs" variant="outline">Comentarios</Button>
          {unapplied && <Button disabled={selectedRow?.canApplyPolicy !== true || selectedPolicyId === null || Boolean(policyToApply)}
            onClick={() => {
              if (!selectedRow || selectedPolicyId === null) return
              setPolicyToApply({ id: selectedPolicyId, date: String(selectedRow.policyDate ?? ""), number: String(selectedRow.policyNumber ?? "") })
            }}
            size="xs" variant="outline">Aplicar</Button>}
          <Button disabled={selectedPolicyId === null || print.isPending}
            onClick={() => { if (selectedPolicyId !== null) print.mutate(selectedPolicyId) }}
            size="xs" variant="outline">
            {print.isPending && <Spinner />}
            Imprimir Póliza
          </Button>
          {(variant === "auxiliary" || variant === "payments") && <Button disabled size="xs" variant="outline">Imprimir Cheque</Button>}
          {showReversal && (
            <Button disabled={!selectedPosting || !onReversal}
              onClick={() => { if (selectedPosting) onReversal?.(selectedPosting.target) }}
              size="xs" type="button" variant="outline">
              {selectedPosting?.reversal ? "Ver reversión" : `Revertir ${postingType}`}
            </Button>
          )}
          {selectedPosting?.reversal && (
            <span className="flex items-center gap-1" role="status">
              {postingType} revertido
              <Link className="underline underline-offset-2" to={paths.accountingPolicy(selectedPosting.reversal.id)}>
                Póliza {selectedPosting.reversal.policyNumber}
              </Link>
            </span>
          )}
        </div>
        {!unapplied && (
          <div className="flex gap-1">
            <ErpDataMetric label="Cargos" value={bankMoney(data.summary?.charges)} />
            <ErpDataMetric label="Abonos" value={bankMoney(data.summary?.credits)} />
            <ErpDataMetric label="Saldo" value={bankMoney(data.summary?.balance)} />
          </div>
        )}
      </div>
      {print.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(print.error)}</AlertDescription></Alert>}
      {comment && <DesktopWindowIdentity id={`${windowId}:comments`}>
        <BankPolicyComments id={comment.id} onClose={() => setComment(null)} row={comment.row} />
      </DesktopWindowIdentity>}
      {policyToApply && <DesktopWindowIdentity id={`${windowId}:apply:${policyToApply.id}`}>
        <ManualPolicyTransitionDialog operation="apply" policy={policyToApply} tone="banking" onClose={() => setPolicyToApply(null)}
          onSaved={(policy) => {
            setPolicyToApply(null)
            setSelectedKey(null)
            toast.success(`Póliza ${policy.number} aplicada.`)
            void Promise.all([
              queryClient.invalidateQueries({ queryKey: bankAccountKeys.all }),
              queryClient.invalidateQueries({ queryKey: accountingPolicyKeys.all }),
            ])
          }} />
      </DesktopWindowIdentity>}
    </div>
  )
}
