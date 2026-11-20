import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState, type FormEvent } from "react"

import { movementSearchQueryOptions, normalizeMovementSearch } from "@/features/inventories/movements/logic"
import {
  movementSearchFields,
  type InventoryMovementHeader,
  type MovementSearchCriteria,
  type MovementSearchField,
} from "@/features/inventories/movements/model"
import { formatDate } from "@/features/inventories/products/query-formatters"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type InventoryMovementSearchDialogProps = {
  onClose: () => void
  onSelect: (movement: InventoryMovementHeader) => void
}

const resultValues = (movement: InventoryMovementHeader) => [
  movement.document,
  formatDate(movement.date),
  movement.reference,
  movement.reference2,
  movement.warehouse,
  movement.supplierCode,
  movement.customerCode,
]

export function InventoryMovementSearchDialog({ onClose, onSelect }: InventoryMovementSearchDialogProps) {
  const queryClient = useQueryClient()
  const latestSearch = useRef(0)
  const [draft, setDraft] = useState<MovementSearchCriteria>({})
  const [criteria, setCriteria] = useState<MovementSearchCriteria | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<InventoryMovementHeader | null>(null)
  const [validationError, setValidationError] = useState("")
  const results = useQuery({
    ...movementSearchQueryOptions(criteria ?? {}, page),
    enabled: criteria !== null,
  })
  const movements = results.data?.data ?? []
  const pagination = results.data?.pagination
  const pageCount = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0

  useEffect(() => () => {
    latestSearch.current++
  }, [])

  function close() {
    latestSearch.current++
    onClose()
  }

  function edit(field: MovementSearchField, value: string) {
    latestSearch.current++
    setDraft((current) => ({ ...current, [field]: value }))
    setCriteria(null)
    setSelected(null)
    setValidationError("")
  }

  function turnPage(next: number) {
    latestSearch.current++
    setPage(next)
    setSelected(null)
  }

  function applyDraft() {
    let normalized: MovementSearchCriteria
    try {
      normalized = normalizeMovementSearch(draft)
    } catch (error) {
      setValidationError(getApiErrorMessage(error))
      return null
    }
    if (Object.keys(normalized).length === 0) return null
    setCriteria(normalized)
    setPage(1)
    setValidationError("")
    return normalized
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selected) {
      onSelect(selected)
      return
    }

    const normalized = applyDraft()
    if (normalized === null) return
    const attempt = ++latestSearch.current
    try {
      const response = await queryClient.fetchQuery(movementSearchQueryOptions(normalized, 1))
      if (latestSearch.current !== attempt || normalized.document === undefined) return

      const document = normalized.document.toUpperCase()
      const matches = response.data.filter((movement) => movement.document.trim().toUpperCase() === document)
      if (matches.length === 1) onSelect(matches[0])
    } catch {
      // The query renders the request error, including a retry via OK.
    }
  }

  return (
    <ErpDataDialog
      defaultWidth={665}
      description="Buscar un documento de movimientos de inventario."
      onOpenChange={(open) => { if (!open) close() }}
      title="Búsqueda"
    >
      <ErpDataDialogBody>
        <form
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLInputElement && !event.nativeEvent.isComposing) {
              event.preventDefault()
              event.currentTarget.requestSubmit()
              return
            }
            if (event.key !== "Escape") return
            event.preventDefault()
            event.stopPropagation()
            close()
          }}
          onSubmit={(event) => void submit(event)}
        >
          <div className="grid grid-cols-7 gap-0.5">
            {movementSearchFields.map(({ key, label }) => (
              <label className="grid min-w-0 gap-0.5" key={key}>
                <span className="truncate px-1" title={label}>{label}</span>
                <Input
                  autoComplete="off"
                  autoFocus={key === "document"}
                  className="h-5 bg-background text-[9px] shadow-inner"
                  name={key}
                  onBlur={() => { if (criteria === null) applyDraft() }}
                  onChange={(event) => edit(key, event.target.value)}
                  value={draft[key] ?? ""}
                />
              </label>
            ))}
          </div>
          {(validationError || (criteria !== null && results.isError)) && (
            <Alert className="mt-1" variant="destructive">
              <AlertTitle>No fue posible buscar documentos</AlertTitle>
              <AlertDescription>
                {validationError || getApiErrorMessage(results.error)}
                {!validationError && (
                  <Button disabled={results.isFetching} onClick={() => void results.refetch()} size="sm" type="button" variant="outline">
                    Reintentar
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          <ErpDataTableViewport className="mt-1 h-56">
            <table className="w-full min-w-[38rem] table-fixed border-collapse text-[9px]/none">
              <thead className="sr-only">
                <tr>{movementSearchFields.map(({ key, label }) => <th key={key} scope="col">{label}</th>)}</tr>
              </thead>
              <tbody>
                {criteria !== null && movements.map((movement) => (
                  <tr
                    aria-selected={selected?.id === movement.id}
                    className={cn(
                      "h-4 cursor-pointer border-b border-input hover:bg-module-inventory/20",
                      selected?.id === movement.id && "bg-module-inventory text-module-inventory-foreground",
                    )}
                    key={movement.id}
                    onClick={() => setSelected(movement)}
                    onDoubleClick={() => onSelect(movement)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        onSelect(movement)
                      }
                    }}
                    tabIndex={0}
                  >
                    {resultValues(movement).map((value, index) => (
                      <td className="truncate border-r border-input px-1" key={movementSearchFields[index].key} title={value ?? ""}>{value}</td>
                    ))}
                  </tr>
                ))}
                {criteria !== null && movements.length === 0 && !results.isError && (
                  <tr>
                    <td className="h-48 text-center text-muted-foreground" colSpan={7}>
                      {results.isFetching
                        ? <span className="inline-flex items-center gap-1"><Spinner /> Buscando…</span>
                        : "Sin documentos para los filtros"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ErpDataTableViewport>
          <footer className="relative mt-1 flex flex-wrap items-center justify-center gap-1">
            <Button onClick={close} size="sm" type="button" variant="outline">Cancelar</Button>
            <Button size="sm" type="submit" variant="outline">OK</Button>
            {(pageCount > 1 || page > 1) && (
              <div className="ml-auto flex items-center gap-1">
                <Button disabled={page <= 1 || results.isFetching} onClick={() => turnPage(page - 1)} size="sm" type="button" variant="outline">Anterior</Button>
                <span>{pageCount ? `${page} / ${pageCount}` : page}</span>
                <Button disabled={page >= pageCount || results.isFetching} onClick={() => turnPage(page + 1)} size="sm" type="button" variant="outline">Siguiente</Button>
              </div>
            )}
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
