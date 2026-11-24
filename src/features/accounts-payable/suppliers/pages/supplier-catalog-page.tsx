import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { SupplierCatalogCapture } from "@/features/accounts-payable/suppliers/components/supplier-catalog-capture"
import { SupplierCatalogDetails } from "@/features/accounts-payable/suppliers/components/supplier-catalog-details"
import { SupplierPanelButtons } from "@/features/accounts-payable/suppliers/components/supplier-panel-buttons"
import { SupplierPanelDialog } from "@/features/accounts-payable/suppliers/components/supplier-panel-dialog"
import { SupplierRemovalDialog } from "@/features/accounts-payable/suppliers/components/supplier-removal-dialog"
import { SupplierSearchDialog } from "@/features/accounts-payable/suppliers/components/supplier-search-dialog"
import { SupplierToolbar } from "@/features/accounts-payable/suppliers/components/supplier-toolbar"
import { supplierActionPanels, supplierQueryPanels } from "@/features/accounts-payable/suppliers/constants"
import { supplierKeys, supplierQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import type { Supplier, SupplierPanelDefinition } from "@/features/accounts-payable/suppliers/model"
import { getAdjacentSupplier } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import { purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import { bankAccountKeys } from "@/features/treasury/banking/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"

type Notice = { kind: "success" | "error"; title: string; message: string }
type SupplierPanelWindow = { supplier: Supplier; panel: SupplierPanelDefinition }
type Capture = { supplierId: number; supplier: Supplier | null }

export function SupplierCatalogPage() {
  const supplierId = Number(useParams().supplierId ?? 0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const supplierQuery = useQuery({ ...supplierQueryOptions(supplierId), enabled: supplierId > 0 })
  const supplier = supplierQuery.data
  const [searchOpen, setSearchOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [capture, setCapture] = useState<Capture | null>(null)
  const [removing, setRemoving] = useState<Supplier | null>(null)
  const { windows: panelWindows, openWindow: openPanelWindow, closeWindow: closePanelWindow } = useDesktopWindowCollection<SupplierPanelWindow>()
  const activeCapture = capture?.supplierId === supplierId ? capture : null

  const openSupplier = (nextSupplier: Supplier) => {
    void navigate(paths.accountsPayableSupplier(nextSupplier.id))
  }

  const navigationMutation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentSupplier(supplierId, direction),
    onSuccess: (nextSupplier, direction) => {
      if (!nextSupplier) {
        setNotice({
          kind: "success",
          title: "Fin del catálogo",
          message: direction === "previous" ? "Este es el primer proveedor disponible." : "Este es el último proveedor disponible.",
        })
        return
      }
      setNotice(null)
      openSupplier(nextSupplier)
    },
    onError: (error) => setNotice({ kind: "error", title: "No fue posible navegar", message: getApiErrorMessage(error) }),
  })

  function refreshConsumers(removedId?: number) {
    void queryClient.invalidateQueries({
      queryKey: supplierKeys.all,
      predicate: ({ queryKey }) => queryKey[2] !== "detail" || queryKey[3] !== removedId,
    })
    void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all })
    void queryClient.invalidateQueries({ queryKey: purchaseReceptionKeys.all })
    void queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
  }

  function saved(next: Supplier) {
    queryClient.setQueryData(supplierKeys.detail(next.id), next)
    const creating = activeCapture?.supplier === null
    setCapture(null)
    setNotice({ kind: "success", title: creating ? "Proveedor dado de alta" : "Proveedor actualizado", message: `${next.code} · ${next.name}` })
    refreshConsumers()
    if (creating) openSupplier(next)
  }

  async function removed(target: Supplier) {
    for (const window of panelWindows) {
      if (window.payload.supplier.id === target.id) closePanelWindow(window.id)
    }
    refreshConsumers(target.id)
    setNotice({ kind: "success", title: "Proveedor dado de baja", message: `${target.code} · ${target.name}` })
    setRemoving(null)
    await navigate(paths.accountsPayableSuppliers, { replace: true })
    queryClient.removeQueries({ queryKey: supplierKeys.detail(target.id), type: "inactive" })
  }

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <SupplierToolbar
        disabled={navigationMutation.isPending || Boolean(activeCapture) || Boolean(removing)}
        hasSupplier={Boolean(supplier)}
        onCreate={() => { setNotice(null); setCapture({ supplierId, supplier: null }) }}
        onEdit={() => { if (supplier) { setNotice(null); setCapture({ supplierId, supplier }) } }}
        onDelete={() => { if (supplier) setRemoving(supplier) }}
        onNext={() => navigationMutation.mutate("next")}
        onPrevious={() => navigationMutation.mutate("previous")}
        onSearch={() => setSearchOpen(true)}
      />

      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <HugeiconsIcon icon={notice.kind === "error" ? AlertCircleIcon : InformationCircleIcon} strokeWidth={2} />
          <AlertTitle>{notice.title}</AlertTitle><AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}

      {activeCapture ? (
        <SupplierCatalogCapture onClose={() => setCapture(null)} onSaved={saved} supplier={activeCapture.supplier} />
      ) : supplier ? <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)_14rem]">
        <aside className="min-w-0"><SupplierPanelButtons onSelect={(panel) => openPanelWindow(`suppliers:${supplier.id}:${panel.key}`, { supplier, panel })} panels={supplierActionPanels} title="Acciones" /></aside>
        <SupplierCatalogDetails supplier={supplier} />
        <aside className="min-w-0"><SupplierPanelButtons onSelect={(panel) => openPanelWindow(`suppliers:${supplier.id}:${panel.key}`, { supplier, panel })} panels={supplierQueryPanels} title="Consultas" /></aside>
      </div> : <Alert>
        <AlertDescription>{supplierId > 0
          ? (supplierQuery.isError ? getApiErrorMessage(supplierQuery.error) : "Consultando proveedor…")
          : "No hay proveedores en el catálogo."}</AlertDescription>
      </Alert>}

      {searchOpen && <DesktopWindowIdentity id="suppliers:search"><SupplierSearchDialog onOpenChange={setSearchOpen} onSelect={(selected) => { setSearchOpen(false); setNotice(null); openSupplier(selected) }} /></DesktopWindowIdentity>}
      {panelWindows.map((window) => <DesktopWindowIdentity id={window.id} key={window.id}><SupplierPanelDialog onOpenChange={(open) => { if (!open) closePanelWindow(window.id) }} panel={window.payload.panel} supplier={window.payload.supplier} /></DesktopWindowIdentity>)}
      {removing && <DesktopWindowIdentity id={`suppliers:${removing.id}:removal`}>
        <SupplierRemovalDialog key={removing.id} onClose={() => setRemoving(null)} onRemoved={() => removed(removing)} supplier={removing} />
      </DesktopWindowIdentity>}
    </section>
  )
}
