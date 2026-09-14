import { z } from "zod"

export const fiscalValuesSchema = z.object({
  taxId: z.string().trim().min(1, "Capture el RFC").max(15),
  name: z.string().trim().min(1, "Capture el nombre").max(255),
  postalCode: z.string().trim().min(1, "Capture el código postal").max(12),
  fiscalRegime: z.string().trim().regex(/^\d{3}$/, "Capture un régimen de tres dígitos"),
})
export type FiscalValues = z.infer<typeof fiscalValuesSchema>
export type CapitalRegime = { code: string; description: string }
export type ClientFiscal = {
  clientId: number
  code: string
  values: FiscalValues
  version: string
  verification: "pending" | "legacy-marker-present"
  capitalRegimes: CapitalRegime[]
  verificationAvailable: boolean
}

export type ClientFiscalVerificationResponse = {
  data: { clientId: number; version: string; status: "provider-validated"; legacySync: "pending" }
  message: string
}

// Derived presentation rule: only split an exact catalogue suffix after comma-space.
export function splitFiscalName(name: string, regimes: CapitalRegime[]) {
  const selected = [...regimes].filter((r) => r.code)
    .sort((a, b) => b.code.length - a.code.length)
    .find((r) => name.endsWith(`, ${r.code}`))
  return selected
    ? { baseName: name.slice(0, -selected.code.length - 2), capitalRegime: selected.code }
    : { baseName: name, capitalRegime: "" }
}
