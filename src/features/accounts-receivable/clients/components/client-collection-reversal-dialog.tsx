import { PostingReversalDialog } from "@/features/accounts-payable/components/posting-reversal-dialog"
import { clientKeys } from "@/features/accounts-receivable/clients/logic"
import { getClientCollectionReversalPreview, reverseClientCollection } from "@/features/accounts-receivable/clients/services/client-service"

export function ClientCollectionReversalDialog({ clientId, collectionId, tone = "receivable", onClose }: {
  clientId: number
  collectionId: number
  tone?: "banking" | "receivable"
  onClose: () => void
}) {
  return <PostingReversalDialog
    kind="collection"
    load={signal => getClientCollectionReversalPreview(clientId, collectionId, signal)}
    onClose={onClose}
    queryKey={clientKeys.collectionReversal(clientId, collectionId)}
    record={input => reverseClientCollection(clientId, collectionId, input)}
    tone={tone}
  />
}
