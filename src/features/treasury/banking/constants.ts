import type { BankPanelDefinition } from "@/features/treasury/banking/model"

export const availableBankPanels: readonly BankPanelDefinition[] = [
  { key: "movements", label: "Movimientos" },
  { key: "deposits", label: "Depósitos" },
  { key: "payments", label: "Pagos" },
  { key: "reconciliation", label: "Conciliar" },
  { key: "automatic-reconciliation", label: "Concilia Automático" },
  { key: "auxiliary", label: "Auxiliar" },
  { key: "supplier-expenses", label: "Gastos por prv." },
  { key: "general-ledger", label: "Mayor" },
  { key: "cost-center-ledger", label: "Mayor C.C." },
  { key: "authorization-review", label: "Revisar" },
  { key: "classifiers", label: "Clasificar" },
  { key: "transfer", label: "Traspasos entre Cuentas" },
  { key: "unapplied-auxiliary", label: "Aux. no aplicados" },
]

export const bankActionLabels = [
  "Movimientos", "Depósitos", "Pagos", "Conciliar", "Concilia Automático",
  "Auxiliar", "Gastos por prv.", "Mayor", "Mayor C.C.", "Revisar", "Clasificar",
  "Traspasos entre Cuentas", "Aux. no aplicados",
] as const
