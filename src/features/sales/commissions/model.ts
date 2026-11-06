export type CollectionCriteria = { from: string; to: string; branch: string; agent: string }
export type CollectionOptions = { company: string; defaultFrom: string; defaultTo: string
  branches: Array<{ code: string; name: string; warehouses: string[] }>; agents: Array<{ code: string; name: string }> }
export type CollectionInvoice = { id: number; number: string; date: string; firstPaymentDate: string; lastPaymentDate: string
  customerCode: string; customerName: string; agentCode: string; agentName: string; warehouse: string; branch: string; currency: number; companyId: number
  subtotal: string; payments: string | null; returns: string | null; freight: string; newCustomer: string; paymentCount: number; invalidVatCount: number
  days: number; subtotalAmount: number; paymentAmount: number | null; returnAmount: number | null; totalAmount: number | null; freightAmount: number; paymentCapped: boolean
  cost: number | null; realCost: number | null; profit: number | null; signedProfit: number | null; margin: number | null; lm: number | null; lmAmount: number | null
  costMovementType: string | null; costStatus: "complete" | "unavailable"; commissionAmount: null }
export type CollectionMovement = { id: number; invoiceId: number; date: string; type: string; amount: string; vatRate: string; withoutVat: string | null; reference: string }
export type CollectionProduct = { id: number; invoiceId: number; productId: number; code: string; description: string; family: string
  quantity: string; billedQuantity: string; price: string; unitCost: string; applied: number; movementType: string; location: string }
export type CollectionTotals = { invoices: number; payments: number; subtotal: number; payment: number | null; returns: number | null; total: number | null; freight: number
  cost: number | null; realCost: number | null; profit: number | null; lm: number | null; lmAmount: number | null; unavailableCosts: number }
export type CollectionCommissions = { title: string; company: string; criteria: CollectionCriteria; generatedAt: string; source: "derivada"
  status: "complete" | "incomplete"; calculationReady: boolean; invoices: CollectionInvoice[]; movements: CollectionMovement[]; products: CollectionProduct[]
  agents: Array<CollectionTotals & { code: string; name: string }>; totals: CollectionTotals; empty: boolean; notes: string[] }
