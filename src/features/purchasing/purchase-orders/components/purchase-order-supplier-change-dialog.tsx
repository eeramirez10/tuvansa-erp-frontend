import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState, type FormEvent } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { purchaseOrderAuthorizationSupplierQueryOptions, purchaseOrderSupplierActionQueryOptions, refreshPurchaseOrder } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderSupplierChangeMode, PurchaseOrderSupplierChangeState, PurchaseOrderSupplierSearch } from "@/features/purchasing/purchase-orders/model"
import { replacePurchaseOrderSupplier } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableRow } from "@/shared/ui/table"

type Supplier = PurchaseOrder["supplier"]
const supplierCodeSchema = z.object({ supplierCode: z.string().trim().min(1, "Ingresa el código del proveedor.").max(20).toUpperCase() })

function SupplierSearch({ initial, description, onSelect, onClose }: {
  initial: PurchaseOrderSupplierSearch
  description: string
  onSelect: (supplier: Supplier) => void
  onClose: () => void
}) {
  const codeId = useId()
  const nameId = useId()
  const [filters, setFilters] = useState(initial)
  const [submitted, setSubmitted] = useState(initial)
  const [selected, setSelected] = useState<Supplier | null>(null)
  const query = useQuery(purchaseOrderAuthorizationSupplierQueryOptions(submitted))

  return (
    <ErpDataDialog defaultWidth={520} title="Buscar proveedor" description={description} tone="sales"
      onOpenChange={(open) => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="grid grid-cols-[minmax(4rem,1fr)_minmax(6rem,3fr)_auto] items-end gap-1" onSubmit={(event) => {
          event.preventDefault()
          setSelected(null)
          setSubmitted({ code: filters.code.trim().toUpperCase(), name: filters.name.trim() })
        }}>
          <div className="grid gap-0.5">
            <Label htmlFor={codeId}>Código</Label>
            <Input autoFocus id={codeId} className="uppercase" maxLength={20} value={filters.code}
              onChange={(event) => setFilters({ ...filters, code: event.target.value })} />
          </div>
          <div className="grid gap-0.5">
            <Label htmlFor={nameId}>Nombre</Label>
            <Input id={nameId} maxLength={60} value={filters.name}
              onChange={(event) => setFilters({ ...filters, name: event.target.value })} />
          </div>
          <Button disabled={query.isFetching || (!filters.code.trim() && !filters.name.trim())} size="sm" type="submit">Buscar</Button>
        </form>
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        <ErpDataTableViewport className="h-44">
          <Table className="min-w-80">
            <TableBody>
              {query.data?.map((supplier) => (
                <TableRow key={supplier.id} data-state={selected?.id === supplier.id ? "selected" : undefined}>
                  <TableCell className="p-0">
                    <Button aria-pressed={selected?.id === supplier.id} className="flex w-full justify-start text-left"
                      size="xs" variant="ghost" onClick={() => setSelected(supplier)} onDoubleClick={() => onSelect(supplier)}>
                      <span className="w-20 shrink-0 font-mono">{supplier.code}</span>{supplier.name}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {query.isFetching && <TableRow><TableCell><Spinner aria-label="Buscando proveedores" /></TableCell></TableRow>}
              {query.data?.length === 0 && <TableRow><TableCell>Sin proveedores para la búsqueda.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </ErpDataTableViewport>
        <div className="flex justify-end gap-1">
          <Button disabled={!selected || query.isFetching} onClick={() => { if (selected) onSelect(selected) }} size="sm">OK</Button>
          <Button onClick={onClose} size="sm" variant="outline">Cancelar</Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function PurchaseOrderSupplierChangeDialog({ state: initialState, mode, onChange, onClose }: {
  state: PurchaseOrderSupplierChangeState
  mode: PurchaseOrderSupplierChangeMode
  onChange: (order: PurchaseOrder) => void
  onClose: () => void
}) {
  const title = mode === "action" ? "Cambia Prv" : "Cambia proveedor"
  const [state] = useState(initialState)
  const queryClient = useQueryClient()
  const codeId = useId()
  const keyId = useId()
  const credentialInput = useRef<HTMLInputElement>(null)
  const credential = useRef("")
  const [selected, setSelected] = useState<Supplier | null>(null)
  const searchWindow = useDesktopWindowCollection<PurchaseOrderSupplierSearch>()
  const { register, handleSubmit, setValue, getValues, setError, clearErrors, formState: { errors } } = useForm({
    resolver: zodResolver(supplierCodeSchema),
    defaultValues: { supplierCode: state.supplier.code },
  })
  const change = useMutation({
    networkMode: "always",
    mutationFn: (supplierCode: string) => {
      const key = credential.current
      credential.current = ""
      return replacePurchaseOrderSupplier(mode, supplierCode, state, key)
        .catch((error: unknown) => { throw new Error(getApiErrorMessage(error)) })
    },
    onSuccess: async (order) => {
      await refreshPurchaseOrder(queryClient, order)
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
      onChange(order)
    },
  })
  const cancel = () => { if (!change.isPending) onClose() }
  function submit(event: FormEvent<HTMLFormElement>) {
    void handleSubmit(({ supplierCode }) => {
      change.reset()
      if (mode === "authorization" && supplierCode === state.supplier.code) {
        setError("supplierCode", { message: "Selecciona un proveedor distinto de COMPRA." }, { shouldFocus: true })
        return
      }
      const key = credentialInput.current?.value.trim() ?? ""
      if (!/^[0-9a-f]{64}$/i.test(key)) {
        setError("root", { message: "Ingresa una clave de autorización válida." })
        credentialInput.current?.focus()
        return
      }
      clearErrors("root")
      credential.current = key
      if (credentialInput.current) credentialInput.current.value = ""
      change.mutate(supplierCode)
    })(event)
  }
  const code = register("supplierCode", { onChange: () => setSelected(null) })
  const openSearch = () => {
    const value = getValues("supplierCode").trim().toUpperCase()
    searchWindow.openWindow(`purchase-orders:${state.id}:${mode}:supplier-search`, {
      code: value === state.supplier.code ? "" : value, name: "",
    })
  }
  const error = errors.supplierCode?.message || errors.root?.message || change.error?.message

  return <>
    <ErpDataDialog defaultWidth={430} title={title} description={state.number} tone="sales"
      onOpenChange={(open) => { if (!open) cancel() }}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={submit}>
          <fieldset className="grid gap-2" disabled={change.isPending}>
            <div className="grid grid-cols-[6rem_minmax(4rem,1fr)_auto] items-center gap-1.5">
              <Label htmlFor={codeId}>Proveedor</Label>
              <Input {...code} autoFocus className="uppercase" id={codeId} maxLength={20}
                onFocus={(event) => event.target.select()} />
              <Button onClick={openSearch} size="sm" type="button" variant="outline">Buscar</Button>
              {selected && <p className="col-start-2 col-end-4 text-muted-foreground">{selected.name}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor={keyId}>Clave de autorización</Label>
              <Input autoComplete="off" className="max-w-52" id={keyId} maxLength={64} ref={credentialInput}
                spellCheck={false} type="password" />
            </div>
          </fieldset>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex justify-end gap-1">
            <Button disabled={change.isPending} size="sm" type="submit">{change.isPending ? <Spinner /> : "OK"}</Button>
            <Button disabled={change.isPending} onClick={cancel} size="sm" type="button" variant="outline">Cancelar</Button>
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
    {searchWindow.windows.map(({ id, payload }) => (
      <DesktopWindowIdentity key={id} id={id}>
        <SupplierSearch initial={payload} description={title} onClose={() => searchWindow.closeWindow(id)} onSelect={(supplier) => {
          setSelected(supplier)
          setValue("supplierCode", supplier.code, { shouldValidate: true })
          change.reset()
          searchWindow.closeWindow(id)
        }} />
      </DesktopWindowIdentity>
    ))}
  </>
}

export function PurchaseOrderSupplierActionDialog({ purchaseOrder, onClose }: {
  purchaseOrder: PurchaseOrder
  onClose: () => void
}) {
  const query = useQuery(purchaseOrderSupplierActionQueryOptions(purchaseOrder.id))
  if (query.data?.canWrite && (query.isFetchedAfterMount || !query.isFetching)) {
    return <PurchaseOrderSupplierChangeDialog mode="action" state={query.data} onChange={onClose} onClose={onClose} />
  }
  return (
    <ErpDataDialog defaultWidth={430} title="Cambia Prv" description={purchaseOrder.number} tone="sales"
      onOpenChange={(open) => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {query.isFetching && <Spinner aria-label="Cargando estado del proveedor" />}
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {query.data && !query.data.canWrite && <Alert><AlertDescription>{query.data.reason}</AlertDescription></Alert>}
        <div className="flex justify-end"><Button onClick={onClose} size="sm" variant="outline">Cancelar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
