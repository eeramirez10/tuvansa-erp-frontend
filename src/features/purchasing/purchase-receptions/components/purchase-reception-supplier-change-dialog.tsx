import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useId, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { supplierKeys } from "@/features/accounts-payable/suppliers/logic"
import { movementKeys } from "@/features/inventories/movements/logic"
import { productKeys } from "@/features/inventories/products/logic"
import { PurchaseSupplierSearchDialog } from "@/features/purchasing/components/purchase-supplier-search-dialog"
import { purchaseReceptionKeys, purchaseReceptionSupplierChangeQueryOptions } from "@/features/purchasing/purchase-receptions/logic"
import type { PurchaseReception, PurchaseReceptionSupplierChange, PurchaseReceptionSupplierSearch } from "@/features/purchasing/purchase-receptions/model"
import { changePurchaseReceptionSupplier, searchPurchaseReceptionSuppliers } from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"

const schema = z.object({ supplierCode: z.string().trim().min(1, "Ingresa el código del proveedor.").max(6).toUpperCase() })
type Supplier = PurchaseReception["supplier"]

function SupplierEditor({ initial, onClose }: { initial: PurchaseReceptionSupplierChange; onClose: () => void }) {
  const [state] = useState(initial)
  const { reception, supplier, revision } = state
  const codeId = useId()
  const queryClient = useQueryClient()
  const search = useDesktopWindowCollection<PurchaseReceptionSupplierSearch>()
  const [selected, setSelected] = useState<Supplier | null>(supplier)
  const { register, handleSubmit, getValues, setValue, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { supplierCode: supplier.code },
  })
  const searchId = `purchase-receptions:${reception.id}:supplier-search`
  const openSearch = (value: string) => {
    const code = value.trim().toUpperCase()
    search.openWindow(searchId, { code: code === supplier.code ? "" : code, name: "" })
  }

  const save = useMutation({
    mutationFn: (code: string) => changePurchaseReceptionSupplier(reception.id, { supplierCode: code, revision }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseReceptionKeys.all })
      void queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      void queryClient.invalidateQueries({ queryKey: movementKeys.all })
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      onClose()
    },
    onError: (error, code) => {
      if (isAxiosError(error) && error.response?.status === 404 && error.response.data?.error?.message === "Proveedor no encontrado") {
        openSearch(code)
      }
    },
  })
  const close = () => { if (!save.isPending) onClose() }
  const error = formState.errors.supplierCode?.message ?? (save.isError ? getApiErrorMessage(save.error) : null)

  return (
    <>
      <ErpDataDialog defaultWidth={355} title="Búsqueda de proveedor" description={reception.number}
        onOpenChange={(open) => { if (!open) close() }}>
        <ErpDataDialogBody>
          <form className="grid gap-2" onSubmit={(event) => void handleSubmit(({ supplierCode }) => {
            if (!save.isPending) save.mutate(supplierCode)
          })(event)}>
            <fieldset className="grid grid-cols-[auto_minmax(4rem,1fr)_auto] items-center gap-1.5" disabled={save.isPending}>
              <Label htmlFor={codeId}>Proveedor</Label>
              <Input autoFocus id={codeId} className="uppercase" maxLength={6} onFocus={(event) => event.target.select()}
                {...register("supplierCode", { onChange: () => { setSelected(null); save.reset() } })} />
              <Button onClick={() => openSearch(getValues("supplierCode"))} size="sm" type="button" variant="outline">Buscar</Button>
              {selected && <div className="col-start-2 col-end-4 text-muted-foreground">{selected.name}</div>}
            </fieldset>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <footer className="flex justify-end gap-1">
              <Button disabled={save.isPending} size="sm" type="submit">{save.isPending ? "Guardando…" : "OK"}</Button>
              <Button disabled={save.isPending} onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
            </footer>
          </form>
        </ErpDataDialogBody>
      </ErpDataDialog>
      {search.windows.map(({ id, payload }) => (
        <DesktopWindowIdentity id={id} key={id}>
          <PurchaseSupplierSearchDialog codeLength={6} description={reception.number} initial={payload}
            queryKey={(filters) => purchaseReceptionKeys.supplierChoices(reception.id, filters)}
            search={(filters, signal) => searchPurchaseReceptionSuppliers(reception.id, filters, signal)}
            onClose={() => search.closeWindow(id)} onSelect={(option) => {
              setSelected(option)
              setValue("supplierCode", option.code, { shouldValidate: true })
              save.reset()
              search.closeWindow(id)
            }} />
        </DesktopWindowIdentity>
      ))}
    </>
  )
}

export function PurchaseReceptionSupplierChangeDialog({ reception, onClose }: {
  reception: PurchaseReception
  onClose: () => void
}) {
  const query = useQuery(purchaseReceptionSupplierChangeQueryOptions(reception.id))
  const [confirmed, setConfirmed] = useState(false)
  if (confirmed && query.data?.canWrite) return <SupplierEditor initial={query.data} onClose={onClose} />

  const canConfirm = query.isFetchedAfterMount && !query.isError && query.data?.canWrite
  return (
    <ErpDataDialog defaultWidth={420} title="Cambia Prv" description={reception.number}
      onOpenChange={(open) => { if (!open) onClose() }}>
      <ErpDataDialogBody className="grid gap-2">
        {query.isFetching && <div className="grid min-h-12 place-items-center"><Spinner /></div>}
        {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
        {query.data?.reason && <Alert><AlertDescription>{query.data.reason}</AlertDescription></Alert>}
        {canConfirm && <p>¿Está seguro de querer cambiar el documento de proveedor?</p>}
        <footer className="flex justify-end gap-1">
          {canConfirm && <Button onClick={() => setConfirmed(true)} size="sm" type="button">Sí</Button>}
          <Button onClick={onClose} size="sm" type="button" variant="outline">{canConfirm ? "No" : "Cerrar"}</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
