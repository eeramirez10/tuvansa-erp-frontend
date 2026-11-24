import { z } from "zod"
import type { Supplier, SupplierCatalogFields } from "@/features/accounts-payable/suppliers/model"

export const supplierFieldWidths = {
  code: 6, name: 80,
  "address.street": 45, "address.neighborhood": 35, "address.city": 30, "address.state": 30, "address.postalCode": 7,
  "contact.name": 30, "contact.phone": 15, "contact.phone2": 20, "contact.fax": 15, "contact.email": 254,
  "fiscal.taxId": 15, "fiscal.curp": 20, "fiscal.accountingAccount": 16,
  "terms.applyToSupplierCode": 6, notes: 127,
} as const

const text = (field: keyof typeof supplierFieldWidths) => z.string().trim().max(supplierFieldWidths[field])
const integer = z.number({ error: "Captura un número." }).int("Captura un entero.").nonnegative()
const discount = z.number({ error: "Captura un descuento." }).min(0).max(100).multipleOf(0.01, "Captura hasta dos decimales.")

export const supplierCodeSchema = text("code").toUpperCase().min(1, "Captura el código del proveedor.")

export function supplierCatalogSchema(accountRequired: boolean) {
  return z.object({
    code: supplierCodeSchema,
    name: text("name").min(1, "Captura la razón social."),
    address: z.object({
      street: text("address.street"), neighborhood: text("address.neighborhood"),
      city: text("address.city"), state: text("address.state"), postalCode: text("address.postalCode"),
    }),
    contact: z.object({
      name: text("contact.name"), phone: text("contact.phone"), phone2: text("contact.phone2"),
      fax: text("contact.fax"), email: text("contact.email"),
    }),
    fiscal: z.object({
      taxId: text("fiscal.taxId").toUpperCase(), curp: text("fiscal.curp").toUpperCase(),
      accountingAccount: text("fiscal.accountingAccount").refine(value => !accountRequired || Boolean(value), "Captura la cuenta contable."),
    }),
    terms: z.object({
      priceList: integer.min(1).max(5), discounts: z.tuple([discount, discount]),
      paymentTermDays: integer.max(2_147_483_647), applyToSupplierCode: text("terms.applyToSupplierCode").toUpperCase(),
      creditLimit: integer.max(2_147_483_647), currencyId: integer.max(2), type: integer.max(2),
    }),
    notes: text("notes"),
  })
}

export function newSupplierDisplay(fields: SupplierCatalogFields): Supplier {
  return {
    ...fields, id: 0, isActive: true, deactivatedAt: null, createdAt: null, indicators: { hasEvents: false },
    totals: { actualPaymentTermDays: 0, previousBalance: 0, currentBalance: 0, accumulatedPurchases: 0, lastPurchaseAt: null, lastPaymentAt: null },
  }
}
