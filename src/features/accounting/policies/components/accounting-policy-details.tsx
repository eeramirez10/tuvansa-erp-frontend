import type { AccountingPolicy } from "@/features/accounting/policies/model"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const text = (input: unknown) => input === null || input === undefined ? "" : String(input)

function Field({ label, fieldValue, className = "", numeric = false }: { label: string; fieldValue: unknown; className?: string; numeric?: boolean }) {
  const id = `accounting-policy-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  return (
    <div className={`grid min-w-0 gap-0.5 ${className}`}>
      <Label className="truncate text-[9px]/none" htmlFor={id}>{label}</Label>
      <Input className={`h-4 min-w-0 px-1 text-[9px] ${numeric ? "text-right tabular-nums" : ""}`} id={id} readOnly value={text(fieldValue)} />
    </div>
  )
}

export function AccountingPolicyDetails({ policy }: { policy: AccountingPolicy }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 [font-family:Tahoma,'Segoe_UI',sans-serif]">
      <Card size="sm">
        <CardHeader className="border-b bg-module-accounting/15 py-1"><CardTitle>Póliza</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-12 gap-x-2 gap-y-1 py-1">
          <Field className="col-span-2" label="Documento" fieldValue={policy.number} />
          <Field className="col-span-2" label="Fecha" fieldValue={policy.date} />
          <Field className="col-span-2" label="Cheque" fieldValue={policy.cheque} />
          <Field className="col-span-1" label="MCia" fieldValue={policy.company} />
          <Field className="col-span-2" label="Origen" fieldValue={policy.origin} />
          <div className="col-span-1 grid min-w-0 gap-0.5">
            <Label className="text-[9px]/none" htmlFor="accounting-policy-applied">Aplicada</Label>
            <div className="flex h-4 items-center px-1"><Checkbox checked={policy.applied} disabled id="accounting-policy-applied" /></div>
          </div>
          <div className="col-span-2" />
          <Field className="col-span-5" label="Beneficiario" fieldValue={policy.beneficiary} />
          <Field className="col-span-3" label="Familia" fieldValue={policy.family} />
          <div className="col-span-4" />
          <Field className="col-span-7" label="Concepto" fieldValue={policy.concept} />
        </CardContent>
      </Card>

      <Card className="min-w-0" size="sm">
        <CardContent className="p-0">
          <div className="h-[19rem] w-full overflow-hidden border-y">
            <Table className="min-w-[900px] text-[9px]" containerClassName="h-full overflow-scroll [scrollbar-width:auto]">
              <TableHeader className="sticky top-0 z-[1] bg-muted"><TableRow>
                {["Código", "Cuenta", "Cargos", "Abonos", "C.C.", "Refer.", "T.C.", "Conciliado", "Tipo"].map((column) => (
                  <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>
                ))}
              </TableRow></TableHeader>
              <TableBody>{policy.movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="px-1 py-0.5 font-mono">{movement.accountCode}</TableCell>
                  <TableCell className="max-w-[340px] truncate px-1 py-0.5">{movement.accountName}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{movement.debit === 0 ? "" : money.format(movement.debit)}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{movement.credit === 0 ? "" : money.format(movement.credit)}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{movement.costCenter}</TableCell>
                  <TableCell className="px-1 py-0.5">{movement.reference}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{money.format(movement.exchangeRate)}</TableCell>
                  <TableCell className="px-1 py-0.5 text-center">{movement.reconciled ? "X" : ""}</TableCell>
                  <TableCell className="px-1 py-0.5 text-right">{movement.accountType}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Card className="w-[18rem]" size="sm">
          <CardHeader className="border-b bg-module-accounting/15 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-1 py-1">
            <Field label="Cargos" fieldValue={money.format(policy.totals.debit)} numeric />
            <Field label="Abonos" fieldValue={money.format(policy.totals.credit)} numeric />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
