import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { directoryState, usersOptions } from "../logic"
import type { DirectoryFilters, DirectoryPosition } from "../model"
import { AccessError, DirectoryPagination, GroupSelect } from "./directory-controls"

const states = [
  { value: "all", label: "Todos" }, { value: "active", label: "Activos" },
  { value: "pending", label: "Por activar" }, { value: "inactive", label: "Inactivos" },
] as const

export function UserSearchDialog({ initialFilters, close, select }: {
  initialFilters: DirectoryFilters
  close: () => void
  select: (id: string, position: DirectoryPosition) => void
}) {
  const [filters, setFilters] = useState(initialFilters)
  const results = useQuery(usersOptions(filters))
  const choose = (index: number) => {
    const result = results.data
    const user = result?.items[index]
    if (user && result) select(user.id, { filters, index: filters.offset + index, total: result.total })
  }

  return (
    <ErpDataDialog title="Encuentra usuario" description="Usuarios" defaultWidth={745} defaultHeight={510} fillHeight
      onOpenChange={open => { if (!open) close() }}>
      <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-40 flex-1 gap-1">
            <Label htmlFor="directory-search">Código o nombre</Label>
            <Input id="directory-search" autoFocus maxLength={100} value={filters.search}
              onChange={event => setFilters({ ...filters, search: event.target.value, offset: 0 })}
              onKeyDown={event => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing && results.data?.items.length) {
                  event.preventDefault()
                  choose(0)
                }
              }} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="directory-group">Grupo</Label>
            <GroupSelect id="directory-group" all value={filters.group ?? null}
              onChange={group => setFilters({ ...filters, group: group ?? undefined, offset: 0 })} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="directory-state">Estado</Label>
            <Select<(typeof states)[number]["value"]> items={states} value={filters.state ?? "all"}
              onValueChange={state => setFilters({ ...filters, state: state === "all" || state === null ? undefined : state, offset: 0 })}>
              <SelectTrigger id="directory-state"><SelectValue /></SelectTrigger>
              <SelectContent>{states.map(state => <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {results.isPending && <p role="status" className="flex items-center gap-2"><Spinner />Consultando usuarios</p>}
        {results.isError && <AccessError error={results.error} retry={() => void results.refetch()} />}
        {results.data && <>
          <div className="min-h-0 flex-1 overflow-auto rounded-md border">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Código</TableHead><TableHead>Nombre</TableHead><TableHead>Grupo</TableHead>
                <TableHead>Estado web</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {results.data.items.length === 0 && <TableRow><TableCell colSpan={4}>Sin usuarios para estos filtros</TableCell></TableRow>}
                {results.data.items.map((user, index) => (
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => choose(index)}>
                    <TableCell>
                      <Button size="sm" variant="link" className="h-auto p-0" aria-label={`Seleccionar ${user.identification || user.id}`}
                        onClick={event => { event.stopPropagation(); choose(index) }}>{user.identification || "—"}</Button>
                    </TableCell>
                    <TableCell>{user.name || "—"}</TableCell><TableCell>{user.group}</TableCell>
                    <TableCell>{directoryState(user)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DirectoryPagination offset={filters.offset} limit={filters.limit} total={results.data.total}
            move={offset => setFilters({ ...filters, offset })} />
        </>}
        <div className="mt-auto flex justify-end"><Button variant="outline" onClick={close}>Cancelar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
