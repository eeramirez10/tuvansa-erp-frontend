export type SalesCriteria = { from: string; to: string; branch: string; family: string }
export type SalesMeasure = "amount" | "meters"
export type SalesOptions = { company: string; defaultFrom: string; defaultTo: string; defaultBranch: string
  branches: Array<{ code: string; name: string; companyId: number }>; families: Array<{ code: string; name: string }> }
export type SalesProduct = { productId: number; code: string; description: string; family: string; familyName: string; companyId: number; branch: string; unit: string
  quantity: string; sales: string; returns: string; net: string; movements: number; firstDate: string; lastDate: string; movementTypes: string; missingPrices: number
  amount: number; saleAmount: number; returnAmount: number; units: number; metersPerUnit: number | null; meters: number | null }
export type SalesCell = { branch: string; amount: number; meters: number; percentage: number | null; meterPercentage: number | null }
export type SalesFamily = { code: string; name: string; amount: number; saleAmount: number; returnAmount: number; meters: number
  percentage: number | null; meterPercentage: number | null; cells: SalesCell[]; products: SalesProduct[] }
export type SalesByFamily = { title: string; company: string; criteria: SalesCriteria; productType: 1; generatedAt: string; source: "derivada"
  columns: Array<{ code: string; name: string }>; groups: SalesFamily[]; totals: SalesCell[]; amount: number; saleAmount: number; returnAmount: number
  meters: number; movements: number; missingPrices: number; unconvertedProducts: number; empty: boolean; notes: string[] }
