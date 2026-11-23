import { PostingReversalDialog } from "@/features/accounts-payable/components/posting-reversal-dialog"
import { supplierKeys } from "@/features/accounts-payable/suppliers/logic"
import { getSupplierPaymentReversalPreview, reverseSupplierPayment } from "@/features/accounts-payable/suppliers/services/supplier-service"

export function SupplierPaymentReversalDialog({ supplierId, paymentId, tone, onClose }: {
  supplierId: number
  paymentId: number
  tone?: "banking"
  onClose: () => void
}) {
  return <PostingReversalDialog
    kind="payment"
    load={signal => getSupplierPaymentReversalPreview(supplierId, paymentId, signal)}
    onClose={onClose}
    queryKey={supplierKeys.paymentReversal(supplierId, paymentId)}
    record={input => reverseSupplierPayment(supplierId, paymentId, input)}
    tone={tone}
  />
}
