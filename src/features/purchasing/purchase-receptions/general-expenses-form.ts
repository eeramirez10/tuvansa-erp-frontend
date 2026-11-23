import { z } from "zod"
import type {
  GeneralExpensesInput,
  GeneralExpensesPreview,
  GeneralExpensesTaxAccount,
} from "@/features/purchasing/purchase-receptions/model"

export const generalExpensesTaxFields = [
  { key: "vat", label: "I.V.A.", accountLabel: "Cuenta de I.V.A." },
  { key: "vatWithholding", label: "Ret. I.V.A.", accountLabel: "Cuenta de retención de I.V.A." },
  { key: "incomeWithholding", label: "Ret. I.S.R.", accountLabel: "Cuenta de retención de I.S.R." },
] as const

export const normalizeGeneralExpenseCode = (value: string) => value.trim().toUpperCase()

export function generalExpenseCents(value: string): number | null {
  const text = value.trim()
  if (!text) return 0
  if (!/^[+-]?(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(text)) return null
  const cents = Math.round(Number(text.replace(",", ".")) * 100)
  return Math.abs(cents) <= 999_999_999_999 ? cents : null
}

const monetaryValue = z.string().refine((value) => generalExpenseCents(value) !== null, {
  error: "Captura un importe válido con hasta dos decimales.",
})
const lineSchema = z.object({
  supplierCode: z.string().transform(normalizeGeneralExpenseCode).pipe(z.string().min(1, "Captura el proveedor.").max(6)),
  productCode: z.string().transform(normalizeGeneralExpenseCode).pipe(z.string().min(1, "Captura el código de gasto.").max(13)),
  reference: z.string().trim().max(23),
  base: monetaryValue,
  vat: monetaryValue,
  vatWithholding: monetaryValue,
  incomeWithholding: monetaryValue,
  costCenter: z.string(),
})

const accountSelectionSchema = z.object({
  vat: z.string(), vatWithholding: z.string(), incomeWithholding: z.string(),
})

export function generalExpensesDraftSchema(preview: GeneralExpensesPreview) {
  return z.object({
    date: z.iso.date({ error: "Captura una fecha válida." }),
    reference: z.string().trim().max(13),
    beneficiary: z.string().trim().max(85),
    description: z.string().trim().max(90),
    taxAccounts: accountSelectionSchema,
    lines: z.array(lineSchema).min(1, "Captura al menos una partida."),
  }).superRefine(({ date, lines, taxAccounts }, context) => {
    if ((preview.fiscalStart && date < preview.fiscalStart) || (preview.fiscalEnd && date > preview.fiscalEnd)) {
      context.addIssue({ code: "custom", path: ["date"], message: "La fecha está fuera del período fiscal habilitado." })
    }
    const documents = new Map<string, { index: number; lines: GeneralExpenseDraftLine[] }>()
    lines.forEach((line, index) => {
      if (!preview.costCenters.some(({ code }) => code === line.costCenter)) {
        context.addIssue({ code: "custom", path: ["lines", index, "costCenter"], message: "Selecciona un centro de costos." })
      }
      const documentKey = JSON.stringify([line.supplierCode, line.reference.toUpperCase()])
      const document = documents.get(documentKey) ?? { index, lines: [] }
      document.lines.push(line)
      documents.set(documentKey, document)
    })
    for (const { index, lines: items } of documents.values()) {
      if (items.some((line) => [line.base, ...generalExpensesTaxFields.map(({ key }) => line[key])].some((value) => generalExpenseCents(value) === null))) continue
      if (generalExpenseTotals(items).total <= 0) {
        context.addIssue({
          code: "custom", path: ["lines", index, "base"],
          message: "El saldo de este proveedor y referencia debe ser positivo.",
        })
      }
    }
    for (const { key, accountLabel } of generalExpensesTaxFields) {
      if (!usesGeneralExpenseTax(lines, key)) continue
      const code = taxAccounts[key]
      const verifiedDefault = preview.defaultTaxAccounts?.[key]
      if ((code && code === verifiedDefault) || preview.taxAccounts[key].some((item) => item.code === code)) continue
      context.addIssue({
        code: "custom", path: ["taxAccounts", key],
        message: preview.taxAccounts[key].length
          ? `Selecciona ${accountLabel.toLowerCase()}.`
          : "No hay una cuenta contable habilitada para este impuesto.",
      })
    }
  })
}

export type GeneralExpensesDraft = z.infer<ReturnType<typeof generalExpensesDraftSchema>>
export type GeneralExpenseDraftLine = z.infer<typeof lineSchema>

export function newGeneralExpenseLine(preview: GeneralExpensesPreview): GeneralExpenseDraftLine {
  return {
    supplierCode: "", productCode: "", reference: "", base: "", vat: "", vatWithholding: "", incomeWithholding: "",
    costCenter: preview.costCenters.some(({ code }) => code === "0") ? "0" : "",
  }
}

export function usesGeneralExpenseTax(lines: GeneralExpenseDraftLine[], key: GeneralExpensesTaxAccount) {
  if (key !== "vat") return lines.some((line) => (generalExpenseCents(line[key]) ?? 0) !== 0)
  const byReference = new Map<string, number>()
  for (const line of lines) {
    const reference = line.reference.trim().toUpperCase()
    byReference.set(reference, (byReference.get(reference) ?? 0) + (generalExpenseCents(line.vat) ?? 0))
  }
  return [...byReference.values()].some((cents) => cents !== 0)
}

export function generalExpenseTotals(lines: GeneralExpenseDraftLine[]) {
  const totals = { base: 0, vat: 0, vatWithholding: 0, incomeWithholding: 0 }
  for (const line of lines) {
    totals.base += generalExpenseCents(line.base) ?? 0
    for (const { key } of generalExpensesTaxFields) totals[key] += generalExpenseCents(line[key]) ?? 0
  }
  return { ...totals, total: totals.base + totals.vat - totals.vatWithholding - totals.incomeWithholding }
}

export function generalExpensesPayload(values: GeneralExpensesDraft): Omit<GeneralExpensesInput, "requestKey"> {
  const { taxAccounts, lines, ...header } = values
  const selected: GeneralExpensesInput["taxAccounts"] = {}
  for (const { key } of generalExpensesTaxFields) {
    if (usesGeneralExpenseTax(lines, key) && taxAccounts[key]) selected[key] = taxAccounts[key]
  }
  return {
    ...header,
    ...(Object.keys(selected).length ? { taxAccounts: selected } : {}),
    lines: lines.map(({ base, vat, vatWithholding, incomeWithholding, ...line }) => ({
      ...line, base: (generalExpenseCents(base) ?? 0) / 100, vat: (generalExpenseCents(vat) ?? 0) / 100,
      vatWithholding: (generalExpenseCents(vatWithholding) ?? 0) / 100,
      incomeWithholding: (generalExpenseCents(incomeWithholding) ?? 0) / 100,
    })),
  }
}
