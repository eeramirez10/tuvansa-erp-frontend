import type { OrderLine } from "@/features/sales/orders/model"

export const printFormats = [
  { value: "order", label: "Pedido" },
  { value: "packing-list", label: "Lista de empaque" },
  { value: "summary", label: "Resumen" },
] as const
export const printQuantities = [
  { value: "ordered", label: "Pedido" },
  { value: "remaining", label: "Pedido-surtido" },
  { value: "assigned", label: "Asignado" },
] as const

export type OrderPrintOptions = {
  format: typeof printFormats[number]["value"]
  quantities: typeof printQuantities[number]["value"]
  filter: string
}

export function orderPrintFilter(value: string): (line: OrderLine) => boolean {
  const filter = value.trim()
  if (filter === "" || filter === "1") return () => true
  if (filter === "0") return () => false
  const code = /^ICOD\s*=\s*'([^']+)'$/i.exec(filter)
  if (code?.[1]) {
    const expected = code[1].trim().toUpperCase()
    return line => line.productCode.trim().toUpperCase() === expected
  }

  const amount = /^(PLCANT|PLSURT|PLASIGNADO)\s*(<=|>=|=|<|>)\s*(-?\d+(?:\.\d+)?)$/i.exec(filter)
  if (amount) {
    const fields = { PLCANT: "ordered", PLSURT: "fulfilled", PLASIGNADO: "assigned" } as const
    const field = fields[amount[1]!.toUpperCase() as keyof typeof fields]
    const expected = Number(amount[3])
    if (Number.isFinite(expected)) {
      switch (amount[2]) {
        case "=": return line => line[field] === expected
        case ">": return line => line[field] > expected
        case "<": return line => line[field] < expected
        case ">=": return line => line[field] >= expected
        case "<=": return line => line[field] <= expected
      }
    }
  }
  throw new Error("Filtro no admitido. Usa 1, ICOD = 'código' o una comparación con PLCANT, PLSURT o PLASIGNADO.")
}
