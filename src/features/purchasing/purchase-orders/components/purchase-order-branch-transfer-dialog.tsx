import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"

import { purchaseOrderKeys, refreshPurchaseOrder } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderLine } from "@/features/purchasing/purchase-orders/model"
import { apiClient } from "@/shared/api/api-client"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type TransferMode = "divide" | "percentage"

type BranchPreparation = {
  id: number
  number: string
  revision: number
  legacyVersion: string
  canWrite: boolean
  reason: string
  lines: PurchaseOrderLine[]
}

type BranchTransferInput = {
  revision: number
  legacyVersion: string
  mode: TransferMode
  sourceLineId: number
  destinationNumber: string
  destinationRevision: number
  destinationLegacyVersion: string
  quantity: number
  destinationBranch: number
}

type BranchTransferDialogProps = {
  purchaseOrder: PurchaseOrder
  mode: TransferMode
  onClose: () => void
}

const titles = { divide: "Div. Sucursal", percentage: "Sucursal" }
const orderPath = "/purchasing/purchase-orders"
const branchesPath = (id: number) => `${orderPath}/${id}/actions/branches`
const quantityFormat = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const fieldClass = "h-6 min-w-0 rounded-sm px-1 text-[10px]"

async function prepareBranchTransfer(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: BranchPreparation }>(branchesPath(id), { signal })
  return response.data.data
}

async function findDestination(number: string, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: PurchaseOrder }>(`${orderPath}/by-number/${encodeURIComponent(number)}`, { signal })
  const order = response.data.data
  return { order, context: await prepareBranchTransfer(order.id, signal) }
}

function BranchTransferDraft({ preparation, mode, onClose }: Omit<BranchTransferDialogProps, "purchaseOrder"> & {
  preparation: BranchPreparation
}) {
  const queryClient = useQueryClient()
  const folioId = useId()
  const [source] = useState(preparation)
  const [selectedId, setSelectedId] = useState("")
  const [folio, setFolio] = useState("")
  const [submittedFolio, setSubmittedFolio] = useState("")
  const [quantity, setQuantity] = useState("")
  const [branch, setBranch] = useState("")
  const inFlight = useRef(false)
  const submittedKeys = useRef(new Map<string, string>())

  const destinationNumber = folio.trim().toUpperCase()
  const lookup = useQuery({
    queryKey: [...purchaseOrderKeys.all, "branches", "destination", submittedFolio],
    queryFn: ({ signal }) => findDestination(submittedFolio, signal),
    enabled: submittedFolio !== "",
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
  const matchesLookup = submittedFolio !== "" && destinationNumber === submittedFolio
  const destination = matchesLookup && !lookup.isFetching && !lookup.isError ? lookup.data : undefined
  const line = source.lines.find(({ id }) => String(id) === selectedId)
  const amount = Number(quantity)
  const destinationBranch = branch === "" ? NaN : Number(branch)
  const validQuantity = Number.isFinite(amount) && amount >= 0.001
  const validBranch = Number.isSafeInteger(destinationBranch) && destinationBranch >= 0 && destinationBranch <= 255

  const save = useMutation({
    mutationFn: async (payload: BranchTransferInput & { requestKey: string }) => {
      const response = await apiClient.post<{ data: { source: PurchaseOrder; destination: PurchaseOrder } }>(branchesPath(source.id), payload)
      return response.data.data
    },
    onSuccess: (orders) => {
      void refreshPurchaseOrder(queryClient, orders.source)
      if (orders.destination.id !== orders.source.id) void refreshPurchaseOrder(queryClient, orders.destination)
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
      onClose()
    },
    onSettled: () => { inFlight.current = false },
  })

  function dismiss() {
    if (!inFlight.current) onClose()
  }

  function searchDestination() {
    if (!destinationNumber || inFlight.current) return
    if (matchesLookup) void lookup.refetch()
    else setSubmittedFolio(destinationNumber)
  }

  function submit() {
    if (inFlight.current || !source.canWrite || !line || !destination || !validQuantity || !validBranch) return
    const payload: BranchTransferInput = {
      revision: source.revision,
      legacyVersion: source.legacyVersion,
      mode,
      sourceLineId: line.id,
      destinationNumber: destination.order.number,
      destinationRevision: destination.context.revision,
      destinationLegacyVersion: destination.context.legacyVersion,
      quantity: amount,
      destinationBranch,
    }
    const signature = JSON.stringify(payload)
    const requestKey = submittedKeys.current.get(signature) ?? crypto.randomUUID()
    submittedKeys.current.set(signature, requestKey)
    inFlight.current = true
    save.mutate({ ...payload, requestKey })
  }

  return (
    <ErpDataDialog description={source.number} title={titles[mode]} defaultWidth={650} onOpenChange={(open) => { if (!open) dismiss() }}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); submit() }} onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            dismiss()
          }
        }}>
          {source.canWrite ? (
            <>
              <RadioGroup aria-label="Partida origen" value={selectedId} onValueChange={setSelectedId} disabled={save.isPending}>
                <ErpDataTableViewport axes="xy" className="max-h-56">
                  <Table aria-label="Partidas de la orden origen" className="min-w-[32rem]">
                    <TableHeader><TableRow>
                      <TableHead scope="col" className="w-9"><span className="sr-only">Seleccionar</span></TableHead>
                      <TableHead scope="col">Producto</TableHead>
                      <TableHead scope="col">Descripción</TableHead>
                      <TableHead scope="col">Sucursal</TableHead>
                      <TableHead scope="col" className="text-right">Pedido</TableHead>
                      <TableHead scope="col" className="text-right">Surtido</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {source.lines.map((entry) => (
                        <TableRow key={entry.id} data-state={line?.id === entry.id ? "selected" : undefined}>
                          <TableCell>
                            <RadioGroupItem value={String(entry.id)} aria-label={`Seleccionar partida ${entry.productCode} (${entry.id})`} />
                          </TableCell>
                          <TableCell className="font-mono">{entry.productCode}</TableCell>
                          <TableCell className="whitespace-normal">{entry.description}</TableCell>
                          <TableCell>{entry.branch}</TableCell>
                          <TableCell className="text-right tabular-nums">{quantityFormat.format(entry.ordered)}</TableCell>
                          <TableCell className="text-right tabular-nums">{quantityFormat.format(entry.fulfilled)}</TableCell>
                        </TableRow>
                      ))}
                      {source.lines.length === 0 && <TableRow><TableCell colSpan={6}>Sin partidas.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ErpDataTableViewport>
              </RadioGroup>
              {mode === "percentage" && line && <p className="text-muted-foreground">Se copiarán las partidas de la sucursal {line.branch}.</p>}
              <fieldset disabled={save.isPending} className="grid grid-cols-2 items-end gap-2">
                <div className="col-span-full grid gap-1">
                  <label htmlFor={folioId}>Folio destino</label>
                  <div className="flex flex-wrap items-center gap-1">
                    <Input id={folioId} required maxLength={15} className={`${fieldClass} w-36 uppercase`} value={folio}
                      onChange={(event) => setFolio(event.target.value)} onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          searchDestination()
                        }
                      }} />
                    <Button type="button" size="sm" variant="outline" onClick={searchDestination}
                      disabled={!destinationNumber || (matchesLookup && lookup.isFetching)}>Buscar</Button>
                    {matchesLookup && lookup.isFetching && <span role="status">Buscando orden…</span>}
                    {destination && <span className="min-w-0 truncate">{destination.order.number} · {destination.order.supplier.name}</span>}
                  </div>
                </div>
                <label className="grid gap-1">
                  <span>{mode === "divide" ? "Cantidad" : "Porcentaje"}</span>
                  <Input className={fieldClass} type="number" step="0.001" min="0.001" required value={quantity}
                    onChange={(event) => setQuantity(event.target.value)} />
                </label>
                <label className="grid gap-1">
                  <span>Sucursal destino</span>
                  <Input className={fieldClass} type="number" step="1" min="0" max="255" required value={branch}
                    onChange={(event) => setBranch(event.target.value)} />
                </label>
              </fieldset>
              {matchesLookup && lookup.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(lookup.error)}</AlertDescription></Alert>}
            </>
          ) : <Alert><AlertDescription>{source.reason}</AlertDescription></Alert>}
          {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
          <footer className="flex justify-end gap-1">
            <Button type="button" size="sm" variant="outline" disabled={save.isPending} onClick={dismiss}>Cancelar</Button>
            {source.canWrite && <Button type="submit" size="sm"
              disabled={save.isPending || !line || !destination || !validQuantity || !validBranch}>{save.isPending && <Spinner />}OK</Button>}
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseOrderBranchTransferDialog({ purchaseOrder, mode, onClose }: BranchTransferDialogProps) {
  const { id, number } = purchaseOrder
  const preparation = useQuery({
    queryKey: [...purchaseOrderKeys.detail(id), "branches"],
    queryFn: ({ signal }) => prepareBranchTransfer(id, signal),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  if (preparation.data && (preparation.isFetchedAfterMount || !preparation.isFetching)) {
    return <BranchTransferDraft preparation={preparation.data} mode={mode} onClose={onClose} />
  }
  return (
    <ErpDataDialog description={number} title={titles[mode]} defaultWidth={650} onOpenChange={(open) => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {preparation.isError
          ? <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(preparation.error)}</AlertDescription></Alert>
          : <div aria-label="Cargando partidas" role="status" className="flex min-h-12 items-center justify-center"><Spinner /></div>}
        <footer className="flex justify-end"><Button type="button" size="sm" variant="outline" onClick={onClose}>Cancelar</Button></footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
