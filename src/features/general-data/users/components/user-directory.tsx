import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { userDirectoryKey, usersOptions, webSessionKey } from "../logic"
import type { DirectoryFilters, DirectoryUser } from "../model"
import { AccessError, DirectoryPagination, GroupSelect } from "./directory-controls"
import { UserActivation } from "./user-activation"
import { UserEditor } from "./user-editor"

const states = [
  { value: "all", label: "Todos" }, { value: "active", label: "Activos" },
  { value: "pending", label: "Por activar" }, { value: "inactive", label: "Inactivos" },
] as const
const limit = 25

export function UserDirectory() {
  const [filters, setFilters] = useState<DirectoryFilters>({ search: "", limit, offset: 0 })
  const [editor, setEditor] = useState<DirectoryUser | "create" | null>(null)
  const [activation, setActivation] = useState<DirectoryUser | null>(null)
  const queryClient = useQueryClient()
  const users = useQuery(usersOptions(filters))
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: userDirectoryKey })
    void queryClient.invalidateQueries({ queryKey: webSessionKey })
  }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor="directory-search">Buscar</Label>
          <Input id="directory-search" className="w-52" placeholder="Identificación o nombre" maxLength={100} value={filters.search}
            onChange={event => setFilters({ ...filters, search: event.target.value, offset: 0 })} />
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
        <Button className="ml-auto" onClick={() => setEditor("create")}>Alta</Button>
      </div>
      {users.isPending && <p className="flex items-center gap-2"><Spinner />Consultando usuarios</p>}
      {users.isError && <AccessError error={users.error} retry={() => void users.refetch()} />}
      {users.data && <>
        <div className="rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Identificación</TableHead><TableHead>Nombre</TableHead><TableHead>Grupo</TableHead>
              <TableHead>Origen</TableHead><TableHead>Estado web</TableHead><TableHead>Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {users.data.items.length === 0 && <TableRow><TableCell colSpan={6}>Sin usuarios para estos filtros</TableCell></TableRow>}
              {users.data.items.map(user => <TableRow key={user.id}>
                <TableCell>{user.identification || "—"}</TableCell><TableCell>{user.name || "—"}</TableCell>
                <TableCell>{user.group}{user.administrator && <span className="ml-1 text-muted-foreground">· Administrador</span>}</TableCell>
                <TableCell>{user.legacyId ? `German${user.shared ? " · Compartido" : ""}` : "Web"}</TableCell>
                <TableCell>{!user.effectiveActive ? "Inactivo" : user.configured ? "Activo" : "Por activar"}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="outline" aria-label={`Cambio de ${user.identification || user.id}`} onClick={() => setEditor(user)}>Cambio</Button>
                  <Button size="sm" variant="ghost" disabled={!user.effectiveActive} onClick={() => setActivation(user)}>
                    {user.configured ? "Restablecer" : "Activar"}
                  </Button>
                </div></TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </div>
        <DirectoryPagination offset={filters.offset} limit={limit} total={users.data.total} move={offset => setFilters({ ...filters, offset })} />
      </>}
      {editor && <UserEditor user={editor === "create" ? undefined : editor} close={() => setEditor(null)}
        onSaved={() => { setEditor(null); refresh() }} />}
      {activation && <UserActivation user={activation} onClose={changed => { setActivation(null); if (changed) refresh() }} />}
    </div>
  )
}
