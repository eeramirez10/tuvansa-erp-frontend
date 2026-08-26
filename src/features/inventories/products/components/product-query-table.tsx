import { cn } from "@/shared/utils/cn"
import { ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import type {
  QueryColumn,
  QueryRow,
} from "@/features/inventories/products/query-formatters"
import { textValue } from "@/features/inventories/products/query-formatters"

type ProductQueryTableProps = {
  rows: QueryRow[]
  columns: QueryColumn[]
  emptyMessage?: string
  axes?: "xy" | "x" | "y"
  className?: string
  tableClassName?: string
}

export function ProductQueryTable({
  rows,
  columns,
  emptyMessage = "Sin registros para este producto",
  axes = "xy",
  className,
  tableClassName,
}: ProductQueryTableProps) {
  return (
    <ErpDataTableViewport axes={axes} className={cn("h-64", className)}>
      <table
        className={cn(
          "w-max min-w-full table-fixed border-collapse text-[9px]/none tabular-nums",
          tableClassName,
        )}
      >
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width ?? "5rem" }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="h-4 border-b border-input text-left font-normal">
            {columns.map((column) => (
              <th
                className={cn(
                  "whitespace-nowrap border-r border-input px-1 font-normal last:border-r-0",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                )}
                key={column.key}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className={cn(
                "h-4 hover:bg-muted/55",
                index === 0 && "bg-module-inventory text-module-inventory-foreground",
              )}
              key={textValue(row.id) || index}
            >
              {columns.map((column) => (
                <td
                  className={cn(
                    "truncate border-r border-input px-1 last:border-r-0",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                  )}
                  key={column.key}
                  title={textValue(row[column.key])}
                >
                  {column.render ? column.render(row) : textValue(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="h-48 text-center text-muted-foreground" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ErpDataTableViewport>
  )
}
