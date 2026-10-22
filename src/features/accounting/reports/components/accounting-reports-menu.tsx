import { useRef } from "react"
import { Link } from "react-router"
import { paths } from "@/app/router/paths"

export function AccountingReportsMenu() {
  const details = useRef<HTMLDetailsElement>(null)
  return <details className="relative text-[11px]" ref={details}>
    <summary className="flex h-7 cursor-pointer list-none items-center gap-1 rounded-sm border bg-background px-2 hover:bg-muted">Reportes <span aria-hidden="true">▾</span></summary>
    <nav aria-label="Reportes de contabilidad" className="absolute right-0 z-50 mt-1 w-48 rounded-sm border bg-background p-1 shadow-lg">
      <Link className="block rounded-sm px-2 py-1.5 hover:bg-muted" onClick={() => { if (details.current) details.current.open=false }} to={paths.incomeStatement}>Estado de resultados</Link>
    </nav>
  </details>
}
