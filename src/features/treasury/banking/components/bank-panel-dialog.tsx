import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { bankPanelQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount, BankPanel, BankPanelDefinition, BankPanelKey } from "@/features/treasury/banking/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const moneyFormat = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const text = (value: unknown) => value === null || value === undefined ? "" : String(value)
const money = (value: unknown) => moneyFormat.format(Number(value ?? 0))
const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

type Column = { label: string; key: string; numeric?: boolean }

function withRunningBalances(rows: Array<Record<string, unknown>>) {
  const result: Array<Record<string, unknown>> = []
  let balance = 0
  for (const row of rows) {
    balance += Number(row.charge ?? 0) - Number(row.credit ?? 0)
    result.push({ ...row, runningBalance: balance })
  }
  return result
}

function DataTable({ columns, rows, minWidth = "min-w-[1080px]", height = "h-[24rem]", runningBalance = false }: {
  columns: Column[]
  rows: Array<Record<string, unknown>>
  minWidth?: string
  height?: string
  runningBalance?: boolean
}) {
  const displayRows = runningBalance ? withRunningBalances(rows) : rows
  return <ErpDataTableViewport className={height} axes="xy"><Table className={`${minWidth} text-[9px]`} containerClassName="overflow-visible"><TableHeader className="sticky top-0 z-[1] bg-muted"><TableRow>{columns.map((column) => <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column.key}>{column.label}</TableHead>)}</TableRow></TableHeader><TableBody>{displayRows.map((row, index) => <TableRow key={text(row.movementId ?? row.code ?? index)}>{columns.map((column) => <TableCell className={`whitespace-nowrap px-1 py-0.5 ${column.numeric ? "text-right tabular-nums" : ""}`} key={column.key}>{column.numeric ? money(row[column.key]) : text(row[column.key])}</TableCell>)}</TableRow>)}</TableBody></Table></ErpDataTableViewport>
}

function DisabledButtons({ labels }: { labels: string[] }) {
  return <div className="flex flex-wrap gap-1">{labels.map((label) => <Button disabled key={label} size="xs" variant="outline">{label}</Button>)}</div>
}

function Auxiliary({ data }: { data: BankPanel }) {
  return <div className="grid gap-1"><DataTable columns={[
    { label: "Concepto", key: "description" }, { label: "OK", key: "reconciled" }, { label: "TM", key: "movementType" },
    { label: "Cheque", key: "checkNumber" }, { label: "Póliza", key: "policyNumber" }, { label: "Fecha", key: "policyDate" },
    { label: "Cargos", key: "charge", numeric: true }, { label: "Abonos", key: "credit", numeric: true }, { label: "Saldo", key: "runningBalance", numeric: true },
    { label: "C.C.", key: "costCenter" }, { label: "Benef", key: "beneficiary" }, { label: "Usr.", key: "user" }, { label: "Ref.", key: "bankNumber" }, { label: "Fecha Pr.", key: "postdatedAt" },
  ]} rows={data.items} runningBalance /><div className="flex flex-wrap items-end justify-between gap-1"><DisabledButtons labels={["Comentarios", "Imprimir Póliza", "Imprimir Cheque"]} /><div className="flex gap-1"><ErpDataMetric label="Cargos" value={money(data.summary?.charges)} /><ErpDataMetric label="Abonos" value={money(data.summary?.credits)} /><ErpDataMetric label="Saldo" value={money(data.summary?.balance)} /></div></div></div>
}

function Reconciliation({ data }: { data: BankPanel }) {
  return <div className="grid gap-1"><div className="flex flex-wrap justify-end gap-1"><ErpDataMetric label="Saldo BANCO" value={money(data.summary?.bankBalance)} /><ErpDataMetric label="Saldo tránsito" value={money(data.summary?.inTransitBalance)} /><ErpDataMetric label="Suma sel." value={money(0)} /></div><DataTable columns={[
    { label: "Beneficiario", key: "beneficiary" }, { label: "OK", key: "reconciled" }, { label: "TM", key: "movementType" }, { label: "Cheque", key: "checkNumber" },
    { label: "Póliza", key: "policyNumber" }, { label: "Fecha", key: "policyDate" }, { label: "Cargos", key: "charge", numeric: true }, { label: "Abonos", key: "credit", numeric: true },
    { label: "C.C.", key: "costCenter" }, { label: "T", key: "inTransit" }, { label: "Fecha P.", key: "postdatedAt" }, { label: "T.C.", key: "accountingType" },
  ]} rows={data.items} /><DisabledButtons labels={["Imprimir Póliza", "Imprimir Cheque", "Conciliar", "Registrar", "Tránsito", "Filtra tránsito", "Detalle", "FP"]} /></div>
}

function Ledger({ data, costCenter = false }: { data: BankPanel; costCenter?: boolean }) {
  const first = data.items.slice(0, 12)
  const second = data.items.slice(12, 24)
  const rows = [...first, ...second].map((row, index) => ({ ...row, period: index < 12 ? 1 : 2, monthName: months[index % 12] }))
  const centers = Array.isArray(data.summary?.centers) ? data.summary.centers as Array<Record<string, unknown>> : []
  return <div className={`grid gap-1 ${costCenter ? "lg:grid-cols-[13rem_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_12rem]"}`}>
    {costCenter && <DataTable columns={[{ label: "C.C.", key: "code" }, { label: "Descripción", key: "description" }]} height="h-[27rem]" minWidth="min-w-[260px]" rows={centers} />}
    <div className="grid min-w-0 gap-1 lg:grid-cols-[minmax(0,1fr)_12rem]"><DataTable columns={[{ label: "Periodo", key: "period" }, { label: "Mes", key: "monthName" }, { label: "Saldo inicial", key: "balance", numeric: true }, { label: "Cargos", key: "charges", numeric: true }, { label: "Abono", key: "credits", numeric: true }, ...(costCenter ? [{ label: "Gastos prorrateo", key: "prorationExpenses", numeric: true } satisfies Column] : [])]} minWidth="min-w-[620px]" rows={rows} /><div className="grid content-start gap-1">{[first, second].map((period, index) => <Card key={index} size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Presupuesto {index + 1}</CardTitle></CardHeader><CardContent className="grid gap-0.5 py-1">{period.map((row, month) => <ErpDataMetric key={month} label={months[month] ?? ""} value={money(row.budget)} />)}<DisabledButtons labels={["Cambiar"]} /></CardContent></Card>)}</div></div>
  </div>
}

function AuthorizationReview({ data }: { data: BankPanel }) {
  return <div className="grid gap-1"><DataTable columns={[
    { label: "Beneficiario", key: "beneficiary" }, { label: "EST", key: "policyStatus" }, { label: "TM", key: "movementType" },
    { label: "Cheque", key: "checkNumber" }, { label: "Póliza", key: "policyNumber" }, { label: "Fecha", key: "policyDate" },
    { label: "Cargos", key: "charge", numeric: true }, { label: "Abonos", key: "credit", numeric: true }, { label: "A", key: "authorized" }, { label: "T", key: "inTransit" },
  ]} rows={data.items} /><DisabledButtons labels={["Registrar", "Filtra *", "Traspasa +"]} /></div>
}

function Classifiers({ data }: { data: BankPanel }) {
  const labels = ["AGENTE", "GIRO U SECTOR", "SUCURSAL", "", "", "", "FLETE", "ORIGEN", "PROYECTO"]
  return <div className="mx-auto grid w-full max-w-[30rem] gap-1 py-1">{data.items.map((group, index) => {
    const options = Array.isArray(group.items) ? group.items as Array<Record<string, unknown>> : []
    return <label className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-1" key={text(group.type ?? index)}><span className="text-right text-[9px]">{labels[index]}</span><select className="h-5 min-w-0 border border-input bg-background px-1 text-[9px] shadow-inner" defaultValue="" disabled><option value="" />{options.map((option) => <option key={text(option.code)} value={text(option.code)}>{text(option.code)} {text(option.description)}</option>)}</select></label>
  })}<div className="flex justify-end"><Button disabled size="xs">Guardar Todos</Button></div></div>
}

function AutomaticReconciliation({ data }: { data: BankPanel }) {
  const columns: Column[] = [{ label: "Lin", key: "linked" }, { label: "OK", key: "reconciled" }, { label: "Fecha", key: "policyDate" }, { label: "Ch./Dep.", key: "checkNumber" }, { label: "Beneficiario", key: "beneficiary" }, { label: "Ingresos", key: "charge", numeric: true }, { label: "Egresos", key: "credit", numeric: true }, { label: "Referencia", key: "policyNumber" }]
  return <div className="grid gap-1"><div className="grid min-w-0 gap-1 lg:grid-cols-2"><DataTable columns={columns} height="h-[22rem]" minWidth="min-w-[680px]" rows={[]} /><DataTable columns={columns} height="h-[22rem]" minWidth="min-w-[680px]" rows={data.items} /></div><div className="grid gap-1 lg:grid-cols-2"><div className="flex flex-wrap gap-1"><ErpDataMetric label="ENCONTRÉ" value="0" /><ErpDataMetric label="NO ENCONTRÉ" value="0" /><ErpDataMetric label="$ PENDIENTES" value={money(0)} /></div><div className="flex flex-wrap gap-1"><ErpDataMetric label="ENCONTRÉ" value="0" /><ErpDataMetric label="NO ENCONTRÉ" value={String(data.items.length)} /><ErpDataMetric label="$ PENDIENTE" value={money(data.summary?.pending)} /><ErpDataMetric label="SALDO BANCO" value={money(data.summary?.bankBalance)} /></div></div><DisabledButtons labels={["Filtrar 0's", "Guardar archivo final", "Busca", "Registra", "Liga", "Busca prev", "Saldo ant"]} /></div>
}

function UnappliedAuxiliary({ data }: { data: BankPanel }) {
  return <div className="grid gap-1"><DataTable columns={[
    { label: "Cheque", key: "checkNumber" }, { label: "Póliza", key: "policyNumber" }, { label: "Fecha", key: "policyDate" }, { label: "Fecha Pr", key: "postdatedAt" },
    { label: "Cargos", key: "charge", numeric: true }, { label: "Abonos", key: "credit", numeric: true }, { label: "Acumulado", key: "accumulated", numeric: true },
    { label: "Benef", key: "beneficiary" }, { label: "Concepto", key: "description" },
  ]} rows={data.items} /><DisabledButtons labels={["Comentarios", "Aplicar", "Imprimir Póliza"]} /></div>
}

function Transfer({ account }: { account: BankAccount }) {
  const fields = [["Tipo", "3"], ["Número", ""], ["Fecha", ""], ["Beneficiario", ""], ["Concepto", ""], ["Cuenta destino", account.code], ["Importe", "0.00"]]
  return <div className="mx-auto grid w-full max-w-[38rem] gap-2 py-1"><div className="flex gap-4"><label className="flex items-center gap-1"><input checked readOnly type="radio" />Cheque</label><label className="flex items-center gap-1"><input readOnly type="radio" />Traspaso</label></div>{fields.map(([label, value]) => <label className="grid gap-0.5" key={label}><span>{label}</span><Input className="h-5 text-[9px]" readOnly value={value} /></label>)}<Input className="h-5 text-[9px]" readOnly value={account.name} /></div>
}

function SupplierExpenses({ account }: { account: BankAccount }) {
  return <div className="grid gap-1"><Card size="sm"><CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Pago a proveedores (cheque)</CardTitle></CardHeader><CardContent className="grid grid-cols-12 gap-1 py-1"><label className="col-span-2">Proveedor<Input className="h-5 text-[9px]" readOnly /></label><label className="col-span-5">Beneficiario<Input className="h-5 text-[9px]" readOnly /></label><label className="col-span-2">Fecha post<Input className="h-5 text-[9px]" readOnly /></label><label className="col-span-3">Saldo<Input className="h-5 text-right text-[9px]" readOnly value={money(account.balances.current)} /></label></CardContent></Card><DataTable columns={[{ label: "Proveedor", key: "provider" }, { label: "Doc.", key: "document" }, { label: "Importe", key: "amount", numeric: true }, { label: "T.M.Ref.", key: "currency" }]} rows={[]} /><div className="flex justify-end gap-1"><ErpDataMetric label="Subtotal" value={money(0)} /><ErpDataMetric label="Total" value={money(0)} /></div><DisabledButtons labels={["OK"]} /></div>
}

function Unavailable({ data }: { data: BankPanel }) {
  return <Alert><HugeiconsIcon icon={InformationCircleIcon} /><AlertTitle>{data.button}</AlertTitle><AlertDescription>{data.reason ?? "La acción no está disponible en modo lectura."}</AlertDescription></Alert>
}

const titles: Record<BankPanelKey, string> = {
  movements: "Movimientos", deposits: "Depósitos", payments: "Pagos", auxiliary: "Auxiliar", reconciliation: "Conciliar",
  "automatic-reconciliation": "Auxiliar", "supplier-expenses": "Pago a proveedores (cheque)", "general-ledger": "Mayor y presupuesto",
  "cost-center-ledger": "Mayor y presupuesto", "authorization-review": "Autorizar", classifiers: "Clasificadores",
  transfer: "Traspaso a cuentas propias", "unapplied-auxiliary": "Auxiliar movimientos no aplicados",
}

function PanelContent({ account, data, panelKey }: { account: BankAccount; data: BankPanel; panelKey: BankPanelKey }) {
  if (!data.available) return <Unavailable data={data} />
  switch (panelKey) {
    case "auxiliary": return <Auxiliary data={data} />
    case "reconciliation": return <Reconciliation data={data} />
    case "automatic-reconciliation": return <AutomaticReconciliation data={data} />
    case "general-ledger": return <Ledger data={data} />
    case "cost-center-ledger": return <Ledger costCenter data={data} />
    case "authorization-review": return <AuthorizationReview data={data} />
    case "classifiers": return <Classifiers data={data} />
    case "transfer": return <Transfer account={account} />
    case "unapplied-auxiliary": return <UnappliedAuxiliary data={data} />
    case "supplier-expenses": return <SupplierExpenses account={account} />
    case "movements": case "deposits": case "payments": return <Unavailable data={data} />
  }
}

export function BankPanelDialog({ account, panel, onOpenChange }: { account: BankAccount; panel: BankPanelDefinition; onOpenChange: (open: boolean) => void }) {
  const query = useQuery(bankPanelQueryOptions(account.id, panel.key))
  return <ErpDataDialog className="sm:max-w-[72rem]" description={`${panel.label} de la cuenta ${account.code}`} onOpenChange={onOpenChange} title={titles[panel.key]} tone="banking"><ErpDataDialogBody className="grid gap-1.5">
    {query.isPending && <div className="grid min-h-64 place-items-center"><Spinner /></div>}
    {query.isError && <Alert variant="destructive"><HugeiconsIcon icon={InformationCircleIcon} /><AlertTitle>No fue posible cargar la ventana</AlertTitle><AlertDescription>Revise la conexión con la API.</AlertDescription></Alert>}
    {query.data && <PanelContent account={account} data={query.data} panelKey={panel.key} />}
    <footer className="flex justify-end gap-1"><Button onClick={() => onOpenChange(false)} size="sm">OK</Button><Button onClick={() => onOpenChange(false)} size="sm" variant="outline">Cancelar</Button></footer>
  </ErpDataDialogBody></ErpDataDialog>
}
