export interface IncomeStatementCriteria { accounts: "8"; month: number; level: number }
export interface IncomeStatementOptions {
  companyName: string; companyLegalName: string; fiscalStart: string; fiscalEnd: string;
  months: Array<{value:number;label:string;asOf:string}>
  levels: Array<{value:number;codeLength:number}>
  defaultMonth: number; defaultLevel: number
}
export interface IncomeStatementRow {
  key: string; code: string; label: string; depth: number;
  kind: "section" | "group" | "account" | "subtotal" | "section-total" | "result"
  month: number | null; accumulated: number | null
}
export interface IncomeStatement {
  title: string; companyName: string; companyLegalName: string; generatedAt: string; asOf: string
  criteria: IncomeStatementCriteria; rows: IncomeStatementRow[]
  totals: {month:number;accumulated:number}; empty: boolean
  financial?: FinancialIncomeStatement
}


export interface FinancialIncomeStatementRow {
  key: string
  label: string
  kind: "detail" | "total" | "result" | "spacer"
  month: number | null
  accumulated: number | null
  monthPercent: number | null
  accumulatedPercent: number | null
  sourceCodes: string[]
}
export interface FinancialIncomeStatement {
  scopeLabel: string
  rows: FinancialIncomeStatementRow[]
  notices: string[]
  reconciliation: {
    month: number
    accumulated: number
    differenceMonth: number
    differenceAccumulated: number
  }
}


export interface MexicoIncomeStatementCriteria { month: number; year: number }
export interface MexicoIncomeStatementOptions {
  companyName: string
  year: number
  branch: { warehouseCode: "01"; name: string; companyId: number; costCenter: number }
  months: Array<{ value: number; label: string }>
  defaultMonth: number
}


export type IncomeStatementFormat = "branches" | "financial" | "proscai"
export interface IncomeStatementBranch { warehouseCode:string; name:string; companyId:number; costCenter:number }
export interface BranchIncomeStatementsOptions {
  companyName:string; year:number; branches:IncomeStatementBranch[];
  months:Array<{value:number;label:string}>; defaultMonth:number
}
export interface BranchIncomeStatements {
  year:number; month:number; generatedAt:string;
  branches:Array<{branch:IncomeStatementBranch;report:IncomeStatement}>;
  consolidated:IncomeStatement; empty:boolean
}
