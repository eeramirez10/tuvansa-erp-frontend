import { z } from "zod"
import type { AccountingPolicy, ManualPolicyCaptureOptions, ManualPolicyInput } from "@/features/accounting/policies/model"

export const manualPolicyLineLimit = 100
export const manualPolicyBlankLine = () => ({ accountCode: "", accountName: "", costCenter: 0, debit: "", credit: "", reference: "" })
const amountLimit = 9_999_999_999.99

const amount = z.string().trim()
  .regex(/^(?:\d+(?:[.,]\d{1,2})?|[.,]\d{1,2})?$/, "Captura un importe positivo con hasta dos decimales.")
  .transform(value => Number(value.replace(",", ".")))
  .pipe(z.number().nonnegative().max(amountLimit, "El importe rebasa el límite."))

export function manualPolicySchema(options: ManualPolicyCaptureOptions) {
  const centers = new Set(options.costCenters.map(center => center.code))
  return z.object({
    date: z.iso.date({ error: "Captura una fecha válida." })
      .refine(date => (!options.fiscalStart || date >= options.fiscalStart) && (!options.fiscalEnd || date <= options.fiscalEnd), "La fecha debe estar en el periodo contable abierto."),
    concept: z.string().trim().max(90),
    beneficiary: z.string().trim().max(85),
    family: z.string().trim().max(20),
    lines: z.array(z.object({
      accountCode: z.string().trim().toUpperCase().min(1, "Captura una cuenta del catálogo.").max(16),
      accountName: z.string(),
      costCenter: z.number().int().refine(center => centers.has(center), "Selecciona un centro del catálogo."),
      debit: amount,
      credit: amount,
      reference: z.string().trim().max(45),
    }).superRefine(({ debit, credit }, ctx) => {
      if ((debit > 0) === (credit > 0)) ctx.addIssue({
        code: "custom", path: ["debit"], message: "Captura un cargo o un abono por partida.",
      })
    })).min(2).max(manualPolicyLineLimit),
  }).superRefine(({ lines }, ctx) => {
    const debit = lines.reduce((total, line) => total + Math.round(line.debit * 100), 0)
    const credit = lines.reduce((total, line) => total + Math.round(line.credit * 100), 0)
    if (debit !== credit) ctx.addIssue({ code: "custom", path: ["lines"], message: "El total de cargos y abonos debe ser igual." })
  })
}

export type ManualPolicyDraft = z.input<ReturnType<typeof manualPolicySchema>>
export type ManualPolicyValues = z.output<ReturnType<typeof manualPolicySchema>>

export function manualPolicyDefaults(options: ManualPolicyCaptureOptions, policy?: AccountingPolicy): ManualPolicyDraft {
  if (!policy) return {
    date: options.defaults.date, concept: "", beneficiary: "", family: "", lines: [manualPolicyBlankLine(), manualPolicyBlankLine()],
  }
  return {
    date: policy.date ?? options.defaults.date, concept: policy.concept, beneficiary: policy.beneficiary, family: policy.family,
    lines: policy.movements.map(line => ({
      accountCode: line.accountCode, accountName: line.accountName, costCenter: line.costCenter,
      debit: line.debit ? line.debit.toFixed(2) : "", credit: line.credit ? line.credit.toFixed(2) : "", reference: line.reference,
    })),
  }
}

export function manualPolicyPayload(draft: ManualPolicyValues): Omit<ManualPolicyInput, "requestKey"> {
  return { ...draft, lines: draft.lines.map(({ accountCode, costCenter, debit, credit, reference }) =>
    ({ accountCode, costCenter, debit, credit, reference })) }
}

export function manualPolicyTotals(lines: ManualPolicyDraft["lines"]) {
  return lines.reduce((sums, line) => {
    const debit = amount.safeParse(line.debit)
    const credit = amount.safeParse(line.credit)
    return {
      debit: sums.debit + (debit.success ? Math.round(debit.data * 100) : 0),
      credit: sums.credit + (credit.success ? Math.round(credit.data * 100) : 0),
    }
  }, { debit: 0, credit: 0 })
}
