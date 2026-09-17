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
export interface CaptureProduct {
  id: number; code: string; description: string; unit: string; price: number
  cost: number
  taxPercentage: number; excisePercentage: number; currencyId: number
  stock: number; assigned: number; available: number; weight: number; volume: number
}
export const captureHeaderSchema = z.object({
  warehouse: z.string().min(1, "Selecciona un almacén"), typeCode: z.literal("P"),
  customerCode: z.string().trim().min(1, "Captura el cliente").max(6),
  customerOrderNumber: z.string().max(30), orderedAt: z.iso.date(), from: z.iso.date(), dueAt: z.iso.date(),
  department: z.string().max(20), initial: z.boolean(), agentCode: z.string().min(1, "Captura el agente").max(5),
  termsDays: z.number().int().min(0).max(999), store: z.string().max(4), observations: z.string().max(21),
}).refine(v => v.from <= v.dueAt, { message: "Desde no puede ser posterior a Vence", path: ["dueAt"] })
export const captureLineSchema = z.object({
  productCode: z.string().trim().min(1, "Captura el código").max(13),
  quantity: z.number().positive("La cantidad debe ser mayor que cero").max(999999).multipleOf(0.001),
  price: z.number().min(0).max(999999999).multipleOf(0.00001), discount: z.number().min(0).max(100).multipleOf(0.01),
})
export type CaptureHeader = z.infer<typeof captureHeaderSchema>
export type CaptureLine = z.infer<typeof captureLineSchema>
export type CaptureInput = CaptureHeader & { documentKind: "quote" | "order"; lines: CaptureLine[] }
export type CaptureDraftLine = CaptureLine & { product: CaptureProduct }

export const captureTotals = (lines: CaptureDraftLine[]) => {
  const result = lines.reduce((sum, l) => {
    const gross = l.quantity * l.price, discount = gross * l.discount / 100
    return { quantity: sum.quantity + l.quantity, subtotal: sum.subtotal + gross, discount: sum.discount + discount,
      tax: sum.tax + (gross - discount) * l.product.taxPercentage / 100,
      weight: sum.weight + l.quantity * l.product.weight, volume: sum.volume + l.quantity * l.product.volume }
  }, { quantity: 0, subtotal: 0, discount: 0, tax: 0, weight: 0, volume: 0 })
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
  return { ...result, subtotal: round(result.subtotal), discount: round(result.discount), tax: round(result.tax),
    total: round(round(result.subtotal) - round(result.discount) + round(result.tax)) }
}
