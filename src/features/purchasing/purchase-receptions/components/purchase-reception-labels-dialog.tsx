import { PurchaseLabelsDialog } from "@/features/purchasing/purchase-orders/components/purchase-order-labels-dialog"
import { purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import { getPurchaseReceptionLabels } from "@/features/purchasing/purchase-receptions/services/purchase-reception-labels-service"

export function PurchaseReceptionLabelsDialog({ id, number, selectedLineIds, onClose }: {
  id: number
  number: string
  selectedLineIds?: readonly number[]
  onClose: () => void
}) {
  return <PurchaseLabelsDialog document="reception" number={number} selectedLineIds={selectedLineIds} onClose={onClose}
    queryKey={[...purchaseReceptionKeys.detail(id), "labels"]}
    load={(signal) => getPurchaseReceptionLabels(id, signal)} />
}
