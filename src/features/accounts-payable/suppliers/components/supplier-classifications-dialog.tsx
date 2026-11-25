import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { supplierClassificationsQueryOptions, supplierKeys } from "@/features/accounts-payable/suppliers/logic"
import type { Supplier, SupplierClassificationsResponse, SupplierClassificationUpdate } from "@/features/accounts-payable/suppliers/model"
import { saveSupplierClassifications } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { cn } from "@/shared/utils/cn"

type Panel = SupplierClassificationsResponse["data"]
type Draft = { revision: number; rows: Panel["classifications"]; before: string[] }

export function SupplierClassificationsDialog({ supplier, title, onOpenChange }: {
  supplier: Supplier
  title: string
  onOpenChange: (open: boolean) => void
}) {
  const [position, setPosition] = useState(1)
  const [focused, setFocused] = useState<string>()
  const [draft, setDraft] = useState<Draft>()
  const request = useRef<SupplierClassificationUpdate>(null)
  const pending = useRef(false)
  const client = useQueryClient()
  const query = useQuery(supplierClassificationsQueryOptions(supplier.id, position))
  const data = query.data?.data
  const rows = draft?.rows ?? data?.classifications ?? []
  const selectedGroup = rows.find((item) => item.position === position)
  const options = data?.selectedPosition === position ? data.options : []
  const save = useMutation({
    mutationFn: (input: SupplierClassificationUpdate) => saveSupplierClassifications(supplier.id, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: supplierKeys.all })
      setDraft(undefined)
      request.current = null
    },
    onSettled: () => { pending.current = false },
  })
  const canModify = Boolean(data?.canWrite) && !save.isPending
  const changed = draft?.rows.some((row, index) => row.code !== draft.before[index])

  function transfer(option: Panel["options"][number]) {
    if (!data || !canModify || pending.current || option.type !== String(position)) return
    const base = draft ?? { revision: data.revision, rows: data.classifications, before: data.classifications.map((row) => row.code) }
    setDraft({ ...base, rows: base.rows.map(row => row.position === position
      ? { ...row, code: option.code, number: option.number, description: option.description }
      : row) })
  }

  function submit() {
    if (!draft || !changed || !canModify || pending.current) return
    const current = draft.rows.map((row) => row.code)
    if (!request.current || request.current.current.some((code, index) => code !== current[index])) {
      request.current = { current, revision: draft.revision, requestKey: crypto.randomUUID() }
    }
    pending.current = true
    save.mutate(request.current)
  }

  function selectGroup(next: number) {
    setPosition(next)
    setFocused(undefined)
  }

  return (
    <ErpDataDialog defaultWidth={960} description={supplier.code} title={title} tone="payable"
      onOpenChange={open => { if (open || !pending.current) onOpenChange(open) }}>
      <ErpDataDialogBody>
        {(query.error || save.error) && <Alert variant="destructive"><AlertDescription>
          {getApiErrorMessage(query.error ?? save.error)}
        </AlertDescription></Alert>}
        <div className="grid min-h-[29rem] grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.3fr)] gap-2 py-1 text-[10px]">
          <div className="flex flex-col gap-1 pt-6">
            {rows.map((item) => <Button aria-pressed={item.position === position}
              className={cn("justify-start", item.position === position && "bg-module-payable text-module-payable-foreground")}
              disabled={!item.label || save.isPending} key={item.position} onClick={() => selectGroup(item.position)}
              size="xs" variant="outline">{item.label || " "}</Button>)}
            <Button className="mt-3" disabled={!canModify || !changed} onClick={submit} size="xs" variant="outline">
              {save.isPending && <Spinner />}Guardar todos
            </Button>
          </div>
          <section aria-label="Opciones de clasificación" className="flex min-w-0 flex-col">
            <div className="grid h-5 place-items-center border border-b-0 font-semibold">{selectedGroup?.label}</div>
            <ErpDataTableViewport axes="y" className="h-[26rem]">
              <Table className="table-fixed text-[10px]">
                <TableHeader><TableRow><TableHead className="w-16">Fam</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
                <TableBody>
                  {options.map(option => (
                    <TableRow data-state={focused === option.code ? "selected" : undefined} key={option.id}
                      onDoubleClick={() => {
                        if (option.code && option.code.length <= (position === 1 ? 5 : 4)) transfer(option)
                      }}>
                      <TableCell>{option.number}</TableCell>
                      <TableCell className="truncate p-0">
                        <Button className="h-5 w-full justify-start truncate px-1 text-[10px]" variant="ghost" size="xs"
                          disabled={!canModify || !option.code || option.code.length > (position === 1 ? 5 : 4)}
                          onClick={event => { setFocused(option.code); if (event.detail === 0) transfer(option) }}>
                          {option.description}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {query.isFetching && <div className="grid justify-center py-2"><Spinner /></div>}
              {!query.isFetching && options.length === 0 && <p className="py-3 text-center text-muted-foreground">Sin opciones configuradas</p>}
            </ErpDataTableViewport>
          </section>
          <section aria-label="Seleccionados" className="flex min-w-0 flex-col">
            <div className="grid h-5 place-items-center border border-b-0 font-semibold">SELECCIONADOS</div>
            <ErpDataTableViewport axes="y" className="h-[26rem]">
              <Table className="table-fixed text-[10px]">
                <TableHeader><TableRow><TableHead className="w-28">Fam</TableHead><TableHead className="w-16">Cod.</TableHead><TableHead>Descripción</TableHead></TableRow></TableHeader>
                <TableBody>{rows.map(row => (
                  <TableRow data-state={row.position === position ? "selected" : undefined} key={row.position}>
                    <TableCell>{row.label}</TableCell><TableCell>{row.number}</TableCell><TableCell className="truncate">{row.description}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </ErpDataTableViewport>
          </section>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
