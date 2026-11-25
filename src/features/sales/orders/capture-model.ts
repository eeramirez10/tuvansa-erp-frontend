import { z } from "zod"

export interface CaptureOptions {
  warehouses: Array<{ code: string; description: string }>
  types: Array<{ code: string; description: string; nextNumber: string; taxPercentage: number }>
  agents: Array<{ code: string; displayCode: string; name: string }>
}
export interface CaptureCustomer {
  id: number; code: string; name: string; agentCode: string; agentName: string
  termsDays: number; store: string; classification: string
  branches: Array<{ code: number; name: string }>
}
export interface CaptureCustomerMatch {
  id: number; code: string; name: string; branch: string; taxId: string
  ean: string; phone: string; mobile: string; email: string
}
export interface CaptureCustomerSearchCriteria {
  code?: string
  name?: string
  taxId?: string
}
export interface CaptureProduct {
  id: number; code: string; description: string; unit: string; price: number
  cost: number | null; costCurrencyId: CaptureCurrencyId | null
  taxPercentage: number; excisePercentage: number; currencyId: CaptureCurrencyId
  stock: number; assigned: number; available: number; weight: number; volume: number
}
export interface CaptureProductMatch {
  id: number; code: string; description: string; available: number; price: number
  currencyId: CaptureCurrencyId
  warehouse: string; family: string; secondaryFamily: string
  nextReceipt: string | null; supplierCode: string
}
export interface CaptureProductSearchCriteria {
  code?: string
  description?: string
  supplierCode?: string
  familyPattern?: string
  exactCode?: string
}
export interface CaptureProductFamily {
  position: number
  label: string
  start: number
  width: number
  options: Array<{ code: string; description: string }>
}
export const captureHeaderSchema = z.object({
  warehouse: z.string().min(1, "Selecciona un almacén"), typeCode: z.literal("P"),
  customerCode: z.string().trim().min(1, "Captura el cliente").max(6),
  customerOrderNumber: z.string().max(30), orderedAt: z.iso.date(), from: z.iso.date(), dueAt: z.iso.date(),
  department: z.string().max(20), initial: z.boolean(), agentCode: z.string().min(1, "Captura el agente").max(5),
  termsDays: z.number().int().min(0).max(999), store: z.string().max(4), observations: z.string().max(21),
  exchangeRate: z.number().positive().max(999999), boxes: z.number().int().nonnegative().max(999999),
  branch: z.number().int().nonnegative().max(999999), collectionCurrency: z.enum(["PESOS", "DOLARES"]),
  orderDiscounts: z.tuple([
    z.number().min(0).max(100).multipleOf(0.01), z.number().min(0).max(100).multipleOf(0.01),
    z.number().min(0).max(100).multipleOf(0.01), z.number().min(0).max(100).multipleOf(0.01),
  ]),
  commission: z.number().min(0).max(100).multipleOf(0.01), noPartialDeliveries: z.boolean(),
  transportation: z.string().max(100), deliveryAddress: z.tuple([z.string().max(100), z.string().max(100), z.string().max(100)]),
  contact: z.string().max(100), additionalComments: z.string().max(2000),
}).refine(v => v.from <= v.dueAt, { message: "Desde no puede ser posterior a Vence", path: ["dueAt"] })
export const captureLineSchema = z.object({
  productCode: z.string().trim().min(1, "Captura el código").max(13),
  quantity: z.number().positive("La cantidad debe ser mayor que cero").max(999999).multipleOf(0.001),
  price: z.number().min(0).max(999999999).multipleOf(0.00001), discount: z.number().min(0).max(100).multipleOf(0.01),
  currencyId: z.union([z.literal(1), z.literal(2)]).optional(),
})
export type CaptureHeader = z.infer<typeof captureHeaderSchema>
export type CaptureLine = z.infer<typeof captureLineSchema>
export type CaptureInput = CaptureHeader & { documentKind: "quote" | "order"; lines: CaptureLine[] }
export type CaptureDraftLine = CaptureLine & { product: CaptureProduct }
export type CaptureCurrencyId = 1 | 2
export type CaptureCurrencyName = "DOLARES" | "PESOS"

export const captureCurrencyId = (currency: CaptureCurrencyName): CaptureCurrencyId => currency === "PESOS" ? 1 : 2
export const captureCurrencyName = (currencyId: CaptureCurrencyId): CaptureCurrencyName => currencyId === 1 ? "PESOS" : "DOLARES"
export const convertCaptureAmount = (amount: number, from: CaptureCurrencyId, to: CaptureCurrencyId, exchangeRate: number) =>
  from === to ? amount : from === 2 ? amount * exchangeRate : amount / exchangeRate
export function isBelowCaptureCost(price: number, product: CaptureProduct, currency: CaptureCurrencyId, exchangeRate: number) {
  return product.cost !== null && product.costCurrencyId !== null &&
    price < convertCaptureAmount(product.cost, product.costCurrencyId, currency, exchangeRate)
}

export const captureTotals = (
  lines: CaptureDraftLine[],
  targetCurrency: CaptureCurrencyName = "PESOS",
  exchangeRate = 1,
  orderDiscounts: [number, number, number, number] = [0, 0, 0, 0],
) => {
  const targetCurrencyId = captureCurrencyId(targetCurrency)
  const result = lines.reduce((sum, l) => {
    const sourceCurrencyId = l.currencyId ?? l.product.currencyId
    const price = convertCaptureAmount(l.price, sourceCurrencyId, targetCurrencyId, exchangeRate)
    const gross = l.quantity * price
    let taxable = gross * (1 - l.discount / 100)
    for (const percentage of orderDiscounts) taxable *= 1 - percentage / 100
    return { quantity: sum.quantity + l.quantity, subtotal: sum.subtotal + gross, discount: sum.discount + gross - taxable,
      tax: sum.tax + taxable * l.product.taxPercentage / 100,
      weight: sum.weight + l.quantity * l.product.weight, volume: sum.volume + l.quantity * l.product.volume }
  }, { quantity: 0, subtotal: 0, discount: 0, tax: 0, weight: 0, volume: 0 })
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
  return { ...result, subtotal: round(result.subtotal), discount: round(result.discount), tax: round(result.tax),
    total: round(round(result.subtotal) - round(result.discount) + round(result.tax)) }
}
