import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { bankAccountSearchQueryOptions } from "@/features/treasury/banking/logic"
import type { BankAccount } from "@/features/treasury/banking/model"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

export function BankAccountSearchDialog({ onOpenChange, onSelect }: { onOpenChange: (open: boolean) => void; onSelect: (account: BankAccount) => void }) {
  const [code, setCode] = useState("")
  const [accountText, setAccountText] = useState("")
  const [submitted, setSubmitted] = useState<{ code?: string; q?: string } | null>(null)
  const [selected, setSelected] = useState<BankAccount | null>(null)
  const result = useQuery({ ...bankAccountSearchQueryOptions({ ...(submitted ?? {}), page: 1, pageSize: 100 }), enabled: submitted !== null })
  return <ErpDataDialog className="sm:max-w-[46rem]" description="Encuentra una cuenta bancaria" onOpenChange={onOpenChange} title="Encuentra cuenta" tone="banking"><ErpDataDialogBody className="grid gap-1.5">
    <form className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-end gap-1" onSubmit={(event) => { event.preventDefault(); setSelected(null); setSubmitted({ ...(code.trim() ? { code: code.trim() } : {}), ...(accountText.trim() ? { q: accountText.trim() } : {}) }) }}>
      <label className="grid gap-0.5"><span>Código</span><Input autoFocus className="h-5 px-1 text-[9px]" onChange={(event) => setCode(event.target.value)} value={code} /></label>
      <label className="grid gap-0.5"><span>Cuenta</span><Input className="h-5 px-1 text-[9px]" onChange={(event) => setAccountText(event.target.value)} value={accountText} /></label>
      <Button size="xs" type="submit" variant="outline">{result.isFetching && <Spinner />}Buscar</Button>
    </form>
    <ErpDataTableViewport className="h-64" axes="xy"><Table className="min-w-[620px] text-[9px]" containerClassName="overflow-visible"><TableHeader className="sticky top-0 z-[1] bg-muted"><TableRow><TableHead className="h-5 px-1">Código</TableHead><TableHead className="h-5 px-1">Cuenta</TableHead><TableHead className="h-5 px-1">Nombre</TableHead><TableHead className="h-5 px-1">Moneda</TableHead></TableRow></TableHeader><TableBody>{result.data?.data.map((account) => <TableRow className={selected?.id === account.id ? "bg-module-banking/20" : "cursor-default"} key={account.id} onClick={() => setSelected(account)} onDoubleClick={() => onSelect(account)}><TableCell className="px-1 py-0.5 font-mono">{account.code}</TableCell><TableCell className="px-1 py-0.5">{account.accountNumber}</TableCell><TableCell className="px-1 py-0.5">{account.name}</TableCell><TableCell className="px-1 py-0.5">{account.currency.name}</TableCell></TableRow>)}</TableBody></Table></ErpDataTableViewport>
    <footer className="flex justify-end gap-1"><Button disabled={!selected} onClick={() => selected && onSelect(selected)} size="sm">✓ OK</Button><Button onClick={() => onOpenChange(false)} size="sm" variant="outline">× Cancelar</Button></footer>
  </ErpDataDialogBody></ErpDataDialog>
}
