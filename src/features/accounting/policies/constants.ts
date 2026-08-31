import type { AccountingPolicyAction } from "@/features/accounting/policies/model"

export const primaryAccountingPolicyActions: readonly AccountingPolicyAction[] = [
  { key: "classifications", label: "Clasificar", panel: "classifications" },
  { key: "comments", label: "Comentarios" },
  { key: "duplicate", label: "Duplicar" },
  { key: "duplicate-liability", label: "Duplicar pasivo" },
  { key: "print", label: "Imprimir" },
]

export const secondaryAccountingPolicyActions: readonly AccountingPolicyAction[] = [
  { key: "apply", label: "Aplicar" },
  { key: "unapply", label: "Des - Aplicar" },
]
