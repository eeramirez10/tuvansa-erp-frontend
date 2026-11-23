import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"

import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import { apiClient } from "@/shared/api/api-client"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type SplitPreparation = {
  id: number
  number: string
  revision: number
  legacyVersion: string
  canWrite: boolean
  reason: string
  lines: {
    id: number
    productCode: string
    description: string
    ordered: number
    fulfilled: number
    assigned: number
    canSplit: boolean
    reason: string
  }[]
}

type SplitDialogProps = {
  purchaseOrder: PurchaseOrder
  onClose: () => void
  onSplit: (order: PurchaseOrder) => void
}

const splitPath = (id: number) => `/purchasing/purchase-orders/${id}/actions/split`
const quantity = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })

function SplitDraft({ preparation, onClose, onSplit }: Omit<SplitDialogProps, "purchaseOrder"> & { preparation: SplitPreparation }) {
  const queryClient = useQueryClient()
  const [source] = useState(preparation)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const inFlight = useRef(false)
  const submittedKeys = useRef(new Map<string, string>())
  const eligibleIds = source.lines.filter((line) => line.canSplit).map((line) => line.id)
  const lineIds = eligibleIds.filter((id) => selected.has(id))
  const allSelected = eligibleIds.length > 0 && lineIds.length === eligibleIds.length

  const save = useMutation({
    mutationFn: async ({ requestKey, lineIds }: { requestKey: string; lineIds: number[] }) => {
      const response = await apiClient.post<{ data: PurchaseOrder }>(splitPath(source.id), {
        requestKey,
        lineIds,
        revision: source.revision,
        legacyVersion: source.legacyVersion,
      })
      return response.data.data
    },
    onSuccess: (child) => {
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(source.id) })
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
      onSplit(child)
    },
    onSettled: () => { inFlight.current = false },
  })

  function dismiss() {
    if (!inFlight.current) onClose()
  }

  function submit() {
    if (inFlight.current || !source.canWrite || lineIds.length === 0) return
    const signature = lineIds.join(",")
    const requestKey = submittedKeys.current.get(signature) ?? crypto.randomUUID()
    submittedKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ requestKey, lineIds })
  }

  return (
    <ErpDataDialog description={source.number} title="Split" defaultWidth={650} onOpenChange={(open) => { if (!open) dismiss() }}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); submit() }} onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            dismiss()
          }
        }}>
          {!source.canWrite && <Alert><AlertDescription>{source.reason}</AlertDescription></Alert>}
          {source.lines.length > 0 ? (
            <ErpDataTableViewport axes="xy" className="max-h-64">
              <Table aria-label="Partidas para Split" className="min-w-[35rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col" className="w-9">
                      <Checkbox aria-label="Seleccionar todas las partidas elegibles" checked={allSelected}
                        indeterminate={!allSelected && lineIds.length > 0}
                        disabled={!source.canWrite || save.isPending || eligibleIds.length === 0}
                        onCheckedChange={(checked) => setSelected(new Set(checked ? eligibleIds : []))} />
                    </TableHead>
                    <TableHead scope="col">Producto</TableHead>
                    <TableHead scope="col">Descripción</TableHead>
                    <TableHead scope="col" className="text-right">Pedido</TableHead>
                    <TableHead scope="col" className="text-right">Surtido</TableHead>
                    <TableHead scope="col" className="text-right">Asignado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {source.lines.map((line) => (
                    <TableRow key={line.id} data-state={selected.has(line.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox aria-label={`Seleccionar partida ${line.productCode} (${line.id})`} checked={selected.has(line.id)}
                          disabled={!source.canWrite || !line.canSplit || save.isPending}
                          onCheckedChange={(checked) => setSelected((current) => {
                            const next = new Set(current)
                            if (checked) next.add(line.id)
                            else next.delete(line.id)
                            return next
                          })} />
                      </TableCell>
                      <TableCell className="font-mono">{line.productCode}</TableCell>
                      <TableCell className="whitespace-normal">
                        {line.description}
                        {!line.canSplit && line.reason && <span className="block text-muted-foreground">{line.reason}</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{quantity.format(line.ordered)}</TableCell>
                      <TableCell className="text-right tabular-nums">{quantity.format(line.fulfilled)}</TableCell>
                      <TableCell className="text-right tabular-nums">{quantity.format(line.assigned)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ErpDataTableViewport>
          ) : source.canWrite && <p className="text-muted-foreground">Sin partidas para dividir.</p>}
          {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
          <footer className="flex items-center justify-end gap-1">
            {source.canWrite && <p role="status" className="mr-auto text-muted-foreground">Partidas seleccionadas: {lineIds.length}</p>}
            <Button autoFocus type="button" size="sm" variant="outline" disabled={save.isPending} onClick={dismiss}>Cancelar</Button>
            {source.canWrite && <Button type="submit" size="sm" disabled={save.isPending || lineIds.length === 0}>
              {save.isPending && <Spinner />}OK
            </Button>}
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseOrderSplitDialog({ purchaseOrder, onClose, onSplit }: SplitDialogProps) {
  const { id, number } = purchaseOrder
  const preparation = useQuery({
    queryKey: [...purchaseOrderKeys.detail(id), "split"],
    queryFn: async ({ signal }) => (await apiClient.get<{ data: SplitPreparation }>(splitPath(id), { signal })).data.data,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  if (preparation.data && (preparation.isFetchedAfterMount || !preparation.isFetching)) {
    return <SplitDraft preparation={preparation.data} onClose={onClose} onSplit={onSplit} />
  }
  return (
    <ErpDataDialog description={number} title="Split" defaultWidth={650} onOpenChange={(open) => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {preparation.isError
          ? <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(preparation.error)}</AlertDescription></Alert>
          : <div aria-label="Cargando partidas" role="status" className="flex min-h-12 items-center justify-center"><Spinner /></div>}
        <footer className="flex justify-end"><Button type="button" size="sm" variant="outline" onClick={onClose}>Cancelar</Button></footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
