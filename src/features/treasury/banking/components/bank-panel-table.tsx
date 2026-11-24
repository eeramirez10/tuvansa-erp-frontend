import type { ReactNode } from "react"
import { Link } from "react-router"

import { paths } from "@/app/router/paths"
import { bankMoney } from "@/features/treasury/banking/logic"
import { ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

export type BankPanelColumn = {
  label: string
  key: string
  numeric?: boolean
  render?: (row: Record<string, unknown>) => ReactNode
}

const text = (value: unknown) => value === null || value === undefined ? "" : String(value)

function cellValue(row: Record<string, unknown>, column: BankPanelColumn) {
  if (column.render) return column.render(row)
  if (column.numeric) return bankMoney(row[column.key])

  const value = text(row[column.key])
  if (column.key === "policyNumber" && value && typeof row.policyId === "number") {
    return <Link className="text-primary underline" to={paths.accountingPolicy(row.policyId)}>{value}</Link>
  }
  return value
}

function withRunningBalances(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  let balance = 0
  return rows.map((row) => {
    balance += Number(row.charge ?? 0) - Number(row.credit ?? 0)
    return { ...row, runningBalance: balance }
  })
}

export function BankPanelTable({ columns, rows, minWidth = "min-w-[1080px]", height = "h-[24rem]", runningBalance = false,
  onSelect, selectedId }: {
  columns: BankPanelColumn[]
  rows: Array<Record<string, unknown>>
  minWidth?: string
  height?: string
  runningBalance?: boolean
  onSelect?: (row: Record<string, unknown>) => void
  selectedId?: number | null
}) {
  const displayRows = runningBalance ? withRunningBalances(rows) : rows
  return (
    <ErpDataTableViewport className={height} axes="xy">
      <Table className={`${minWidth} text-[9px]`} containerClassName="overflow-visible">
        <TableHeader className="sticky top-0 z-[1] bg-muted">
          <TableRow>
            {columns.map((column) => (
              <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayRows.map((row, index) => (
            <TableRow key={text(row.movementId ?? row.code ?? index)} data-state={row.movementId === selectedId ? "selected" : undefined}
              className={onSelect ? "cursor-pointer" : undefined} tabIndex={onSelect ? 0 : undefined}
              onClick={onSelect ? () => onSelect(row) : undefined}
              onKeyDown={onSelect ? (event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault()
                  onSelect(row)
                }
              } : undefined}>
              {columns.map((column) => (
                <TableCell className={`whitespace-nowrap px-1 py-0.5 ${column.numeric ? "text-right tabular-nums" : ""}`} key={column.key}>
                  {cellValue(row, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ErpDataTableViewport>
  )
}
