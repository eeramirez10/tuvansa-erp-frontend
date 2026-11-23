import { useId } from "react"

import type { BankAccount } from "@/features/treasury/banking/model"
import { bankMoney } from "@/features/treasury/banking/logic"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

function BalanceField({ label, value }: { label: string; value?: number | string | null }) {
  const id = useId()
  const numeric = typeof value === "number"
  return <div className="grid min-w-0 gap-0.5">
    <Label className="truncate text-[9px]" htmlFor={id}>{label}</Label>
    <Input className={"h-6 min-w-0 px-1 text-[10px]" + (numeric ? " text-right tabular-nums" : "")}
      id={id} readOnly value={numeric ? bankMoney(value) : value ?? ""} />
  </div>
}

export function BankAccountBalances({ balances, currencyBalances, createdAt, currencyName }: {
  balances?: BankAccount["balances"]
  currencyBalances?: BankAccount["currencyBalances"]
  createdAt?: string | null
  currencyName: string
}) {
  return <div className="grid content-start gap-2">
    <Card size="sm">
      <CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Saldos</CardTitle></CardHeader>
      <CardContent className="grid gap-1 py-1">
        <BalanceField label="Saldo actual" value={balances?.current} />
        <BalanceField label="Saldo banco" value={balances?.bank} />
        <BalanceField label="Saldo anterior" value={balances?.previous} />
        <BalanceField label="Saldo tránsito" value={balances?.inTransit} />
      </CardContent>
    </Card>
    <Card size="sm">
      <CardHeader className="border-b bg-module-banking/15 py-1"><CardTitle>Moneda {currencyName}</CardTitle></CardHeader>
      <CardContent className="grid gap-1 py-1">
        <BalanceField label="Saldo actual" value={currencyBalances?.current} />
        <BalanceField label="Saldo Mes 12" value={currencyBalances?.month12} />
        <BalanceField label="Saldo anterior" value={currencyBalances?.previous} />
        <BalanceField label="Alta" value={createdAt} />
      </CardContent>
    </Card>
  </div>
}
