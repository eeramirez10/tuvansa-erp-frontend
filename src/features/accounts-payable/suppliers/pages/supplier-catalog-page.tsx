import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { paths } from "@/app/router/paths"
import { SupplierCatalogDetails } from "@/features/accounts-payable/suppliers/components/supplier-catalog-details"
import { SupplierPanelButtons } from "@/features/accounts-payable/suppliers/components/supplier-panel-buttons"
import { SupplierPanelDialog } from "@/features/accounts-payable/suppliers/components/supplier-panel-dialog"
import { SupplierSearchDialog } from "@/features/accounts-payable/suppliers/components/supplier-search-dialog"
import { SupplierToolbar } from "@/features/accounts-payable/suppliers/components/supplier-toolbar"
import { supplierActionPanels, supplierQueryPanels } from "@/features/accounts-payable/suppliers/constants"
import { supplierKeys, supplierQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import type { Supplier, SupplierPanelDefinition } from "@/features/accounts-payable/suppliers/model"
import { getAdjacentSupplier } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"

type Notice = { kind: "success" | "error"; title: string; message: string }

export function SupplierCatalogPage() {
  const supplierId = Number(useParams().supplierId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: supplier } = useSuspenseQuery(supplierQueryOptions(supplierId))
  const [searchOpen, setSearchOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [selectedPanel, setSelectedPanel] = useState<SupplierPanelDefinition | null>(null)

  const openSupplier = (nextSupplier: Supplier) => {
    queryClient.setQueryData(supplierKeys.detail(nextSupplier.id), nextSupplier)
    void navigate(paths.accountsPayableSupplier(nextSupplier.id))
  }

  const navigationMutation = useMutation({
    mutationFn: (direction: "previous" | "next") => getAdjacentSupplier(supplier.id, direction),
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

  return (
    <section className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-2">
      <SupplierToolbar
        disabled={navigationMutation.isPending}
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

      <div className="grid min-w-0 items-start gap-2 xl:grid-cols-[10rem_minmax(0,1fr)_14rem]">
        <aside className="min-w-0"><SupplierPanelButtons onSelect={setSelectedPanel} panels={supplierActionPanels} title="Acciones" /></aside>
        <SupplierCatalogDetails supplier={supplier} />
        <aside className="min-w-0"><SupplierPanelButtons onSelect={setSelectedPanel} panels={supplierQueryPanels} title="Consultas" /></aside>
      </div>

      {searchOpen && <SupplierSearchDialog onOpenChange={setSearchOpen} onSelect={(selected) => { setSearchOpen(false); setNotice(null); openSupplier(selected) }} />}
      {selectedPanel && <SupplierPanelDialog key={`${supplier.id}-${selectedPanel.key}`} onOpenChange={(open) => { if (!open) setSelectedPanel(null) }} panel={selectedPanel} supplier={supplier} />}
    </section>
  )
}
