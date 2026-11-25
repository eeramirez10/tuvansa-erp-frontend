import { Link, useLocation } from "react-router"
import { getApiErrorMessage, isApiSessionRequired } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { signInPath } from "../logic"
import { groupIds } from "../model"

export function AccessError({ error, retry }: { error: unknown; retry?: () => void }) {
  const location = useLocation()
  return (
    <Alert role="alert" variant="destructive">
      <AlertDescription className="flex flex-wrap items-center gap-2">
        {getApiErrorMessage(error)}
        {isApiSessionRequired(error) ? (
          <Button size="sm" variant="outline" render={<Link to={signInPath(location.pathname + location.search)} />}>Iniciar sesión</Button>
        ) : retry && <Button size="sm" variant="outline" onClick={retry}>Reintentar</Button>}
      </AlertDescription>
    </Alert>
  )
}

export function GroupSelect({ value, onChange, all = false, id, disabled }: {
  value: number | null; onChange: (value: number | null) => void; all?: boolean; id: string; disabled?: boolean
}) {
  const items = groupIds.map(group => ({ value: String(group), label: `Grupo ${group}` }))
  if (all) items.unshift({ value: "all", label: "Todos los grupos" })
  return (
    <Select items={items} value={value === null ? "all" : String(value)} disabled={disabled}
      onValueChange={group => { if (group !== null) onChange(group === "all" ? null : Number(group)) }}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
    </Select>
  )
}

export function DirectoryPagination({ offset, limit, total, move }: { offset: number; limit: number; total: number; move: (offset: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-xs text-muted-foreground">{total ? `${Math.min(offset + 1, total)}–${Math.min(offset + limit, total)} de ${total}` : "0 resultados"}</span>
      <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => move(Math.max(offset - limit, 0))}>Anterior</Button>
      <Button variant="outline" size="sm" disabled={offset + limit >= total} onClick={() => move(offset + limit)}>Siguiente</Button>
    </div>
  )
}
