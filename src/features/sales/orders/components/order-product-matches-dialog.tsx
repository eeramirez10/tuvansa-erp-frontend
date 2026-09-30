import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { captureProductMatchesQuery } from "@/features/sales/orders/capture-logic"
import type { CaptureProductMatch, CaptureProductSearchCriteria } from "@/features/sales/orders/capture-model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type Props = {
  initialCode: string
  warehouse: string
  onOpenChange: (open: boolean) => void
  onSelect: (product: CaptureProductMatch) => void
}
type SearchFields = { code: string; description: string; supplierCode: string }

const toCriteria = (fields: SearchFields): CaptureProductSearchCriteria => ({
  ...(fields.code.trim() ? { code: fields.code.trim() } : {}),
  ...(fields.description.trim() ? { description: fields.description.trim() } : {}),
  ...(fields.supplierCode.trim() ? { supplierCode: fields.supplierCode.trim() } : {}),
})

export function OrderProductMatchesDialog({ initialCode, warehouse, onOpenChange, onSelect }: Props) {
  const initialFields = { code: initialCode, description: "", supplierCode: "" }
  const [fields, setFields] = useState<SearchFields>(initialFields)
  const [criteria, setCriteria] = useState<CaptureProductSearchCriteria>(() => toCriteria(initialFields))
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const result = useQuery({ ...captureProductMatchesQuery(criteria, warehouse), enabled: Boolean(criteria.code || criteria.description || criteria.supplierCode), retry:false })
  const matches = result.data ?? []
  const selected = matches.find(match => match.id === selectedId) ?? matches[0] ?? null
  const hasFilter = Boolean(fields.code.trim() || fields.description.trim() || fields.supplierCode.trim())
  const search = () => { if (hasFilter) { setSelectedId(null); setCriteria(toCriteria(fields)) } }
  const accept = (match = selected) => { if (match && !result.isFetching) onSelect(match) }

  return <ErpDataDialog defaultHeight={490} defaultWidth={985} description="Buscar y seleccionar un producto del almacén activo" fillHeight onOpenChange={onOpenChange} title="Encuentra producto" tone="sales">
    <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-1">
      <form className="grid grid-cols-[6.5rem_minmax(16rem,1fr)_7rem_auto] items-end gap-1" onSubmit={event => { event.preventDefault(); search() }}>
        <label className="grid gap-0.5"><span>Código / IEAN</span><Input autoFocus className="h-5 rounded-none px-1 text-[9px]" maxLength={30} onChange={event => setFields(current => ({...current,code:event.target.value}))} value={fields.code} /></label>
        <label className="grid gap-0.5"><span>Descripción</span><Input className="h-5 rounded-none px-1 text-[9px]" maxLength={100} onChange={event => setFields(current => ({...current,description:event.target.value}))} value={fields.description} /></label>
        <label className="grid gap-0.5"><span>Cod Prv</span><Input className="h-5 rounded-none px-1 text-[9px]" maxLength={30} onChange={event => setFields(current => ({...current,supplierCode:event.target.value}))} value={fields.supplierCode} /></label>
        <Button disabled={!hasFilter || result.isFetching} size="sm" type="submit" variant="outline">{result.isFetching && <Spinner />}Buscar</Button>
      </form>
      {result.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(result.error)}</AlertDescription></Alert>}
      <ErpDataTableViewport axes="xy" className="min-h-0 flex-1">
        <table className="w-full min-w-[930px] table-fixed border-collapse text-[9px]/none">
          <colgroup><col className="w-[6.5rem]" /><col className="w-[20rem]" /><col className="w-[4.5rem]" /><col className="w-[5rem]" /><col className="w-[4rem]" /><col className="w-[4rem]" /><col className="w-[4rem]" /><col className="w-[7rem]" /><col className="w-[7rem]" /></colgroup>
          <thead className="sticky top-0 z-[1] bg-muted"><tr className="h-6 border-b border-input">{["Código","Descripción","Disp","Precio","Alms","Fam","Fam","Prox rec.","Cod Prv"].map((column,index) => <th className="border-r border-input px-1 text-left font-normal last:border-r-0" key={`${column}:${index}`}>{column}</th>)}</tr></thead>
          <tbody>{matches.map(match => <tr className={cn("h-5 cursor-default border-b border-dotted border-input/60",selected?.id === match.id && "bg-module-sales text-module-sales-foreground")} key={match.id} onClick={() => setSelectedId(match.id)} onDoubleClick={() => accept(match)}>
            <td className="truncate px-1 font-mono">{match.code}</td><td className="truncate px-1">{match.description}</td><td className="px-1 text-right">{match.available.toFixed(3)}</td><td className="px-1 text-right">{match.price.toFixed(2)}</td><td className="px-1 text-center">{match.warehouse}</td><td className="truncate px-1">{match.family}</td><td className="truncate px-1">{match.secondaryFamily}</td><td className="truncate px-1">{match.nextReceipt ?? ""}</td><td className="truncate px-1">{match.supplierCode}</td>
          </tr>)}{!result.isFetching && matches.length === 0 && <tr><td className="h-40 text-center text-muted-foreground" colSpan={9}>Sin coincidencias</td></tr>}</tbody>
        </table>
      </ErpDataTableViewport>
      <footer className="flex items-center justify-between gap-2">
        <div className="flex gap-1"><Button disabled size="sm" title="Pendiente de captura" variant="outline">Alternos</Button><Button disabled size="sm" title="Pendiente de captura" variant="outline">Foto</Button></div>
        <span className="text-muted-foreground">Almacén {warehouse} · {matches.length} coincidencia{matches.length === 1 ? "" : "s"}</span>
        <div className="flex gap-1"><Button disabled={!selected || result.isFetching} onClick={() => accept()} size="sm">✓ OK</Button><Button onClick={() => onOpenChange(false)} size="sm" variant="outline">× Cancelar</Button><Button disabled size="sm" title="Pendiente de captura" variant="outline">Matriz de fotos</Button><Button disabled size="sm" title="Pendiente de captura" variant="outline">Familias</Button></div>
      </footer>
    </ErpDataDialogBody>
  </ErpDataDialog>
}
