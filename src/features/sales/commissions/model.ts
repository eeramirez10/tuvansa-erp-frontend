export type CollectionCriteria = { from: string; to: string; branch: string; agent: string }
export type CollectionOptions = { company: string; defaultFrom: string; defaultTo: string
  branches: Array<{ code: string; name: string; warehouses: string[] }>; agents: Array<{ code: string; name: string }> }
export type CollectionInvoice = { id: number; number: string; canceled: boolean; date: string; firstPaymentDate: string; lastPaymentDate: string
  rowKey: string; kind: "collection" | "cancellation" | "return" | "credit-note" | "adjustment-reversal"; eventDate: string
  sourceMovementId: number | null; relatedInvoiceNumber: string | null; reviewRequired: boolean; reviewReasons: string[]
  originalAgentCode: string; originalAgentName: string; agentAssignment: "document" | "latest-invoice" | "customer-catalog"; agentReassigned: boolean
  customerCode: string; customerName: string; agentCode: string; agentName: string; warehouse: string; branch: string; currency: number; companyId: number
  subtotal: string; payments: string | null; returns: string | null; freight: string; newCustomer: string; customerStatusRaw: string; paymentCount: number; invalidVatCount: number
  days: number; subtotalAmount: number | null; paymentAmount: number | null; displayPaymentAmount: number | null; returnAmount: number | null; creditNoteAmount: number | null; totalAmount: number | null; freightAmount: number; paymentCapped: boolean
  cost: number | null; realCost: number | null; profit: number | null; signedProfit: number | null; margin: number | null; lm: number | null; lmAmount: number | null
  costMovementType: string | null; costStatus: "complete" | "unavailable"; commissionAmount: null
  customerStatus: "Nuevo" | "Recurrente" | "Viejo_Reactivado" | "Inactivo" | "Sin clasificar"; customerBonusEligible: boolean
  customerBonusRate: number | null; customerBonusBase: number | null; customerBonus: number | null }
export type CollectionMovement = { id: number; invoiceId: number; date: string; type: string; amount: string; vatRate: string; withoutVat: string | null; reference: string }
export type CollectionProduct = { id: number; invoiceId: number; productId: number; code: string; description: string; family: string
  quantity: string; billedQuantity: string; price: string; unitCost: string; applied: number; movementType: string; location: string; typeId: number | null }
export type CollectionTotals = { invoices: number; payments: number; subtotal: number | null; payment: number | null; returns: number | null; creditNotes: number | null; total: number | null; freight: number
  cost: number | null; realCost: number | null; profit: number | null; lm: number | null; lmAmount: number | null; unavailableCosts: number; displayPayment: number | null
  customerBonusBase: number | null; customerBonus: number | null; customerBonusInvoices: number; unclassifiedInvoices: number }
export type CollectionCommissions = { title: string; company: string; branchName: string; criteria: CollectionCriteria; generatedAt: string; source: "derivada"
  status: "complete" | "incomplete"; calculationReady: boolean; invoices: CollectionInvoice[]; movements: CollectionMovement[]; products: CollectionProduct[]
  agents: Array<CollectionTotals & { code: string; name: string }>; totals: CollectionTotals; empty: boolean; notes: string[]; settlement: CollectionSettlement }

export type SettlementAgentSettings = { code: string; plan: "salary" | "fixed" | "unconfirmed"; fixedRate: number; costBasis: "proportional" | "total"
  costOverride: number | null; freight: number; gratuities: number; includeLm: boolean }
export type SettlementSettings = { bonusMode: "additional" | "exclusive" | "unconfirmed"; agents: SettlementAgentSettings[] }
export type SettlementAgent = { code: string; name: string; config: SettlementAgentSettings; invoices: number; normalInvoices: number
  payment: number | null; sourceCost: number | null; cost: number | null; grossProfit: number | null; grossMargin: number | null
  freight: number; gratuities: number; netProfit: number | null; netMargin: number | null; rate: number | null; regularCommission: number | null
  customerBonusBase: number | null; customerBonus: number | null; lmBonus: number | null; totalCommission: number | null; ready: boolean; pending: string[] }
export type CollectionSettlement = { bonusMode: SettlementSettings["bonusMode"]; minimumNetMargin: number; salaryTiers: Array<{ from: number; rate: number }>
  agents: SettlementAgent[]; ready: boolean; totals: Pick<SettlementAgent,"payment" | "cost" | "grossProfit" | "freight" | "gratuities" | "netProfit" | "regularCommission" | "customerBonusBase" | "customerBonus" | "lmBonus" | "totalCommission"> }
