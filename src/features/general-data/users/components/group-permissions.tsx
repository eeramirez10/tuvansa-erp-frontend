import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { permissionGroupOptions, webSessionKey } from "../logic"
import type { Permission } from "../model"
import { savePermissionGroup } from "../services/users-service"
import { AccessError, DirectoryPagination, GroupSelect } from "./directory-controls"

const options = [
  { value: "inherit", label: "Heredar" }, { value: "allow", label: "Conceder" }, { value: "deny", label: "Retirar" },
] as const
type Override = typeof options[number]["value"]
type Draft = { revision: number; changes: Record<string, Override> }
const limit = 25
const selection = (value: boolean | null): Override => value === null ? "inherit" : value ? "allow" : "deny"
const override = (value: Override) => value === "inherit" ? null : value === "allow"

export function GroupPermissions({ initialGroup }: { initialGroup: number }) {
  const queryClient = useQueryClient()
  const [group, setGroup] = useState(initialGroup)
  const [search, setSearch] = useState("")
  const [offset, setOffset] = useState(0)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState(false)
  const query = permissionGroupOptions(group)
  const permissions = useQuery(query)
  const update = useMutation({
    mutationFn: ({ revision, changes }: Draft) => savePermissionGroup(group, revision,
      Object.entries(changes).map(([key, value]) => ({ key, allowed: override(value) }))),
    onSuccess: result => {
      queryClient.setQueryData(query.queryKey, result)
      void queryClient.invalidateQueries({ queryKey: webSessionKey })
      setDraft(null)
      setSaved(true)
    },
  })

  function choose(permission: Permission, value: Override) {
    const currentRevision = permissions.data?.revision
    if (currentRevision === undefined) return
    setDraft(current => {
      const changes = { ...current?.changes }
      if (value === selection(permission.override)) delete changes[permission.key]
      else changes[permission.key] = value
      return Object.keys(changes).length ? { revision: current?.revision ?? currentRevision, changes } : null
    })
    setSaved(false)
  }

  const term = search.trim().toLocaleLowerCase("es-MX")
  const rows = permissions.data?.items.filter(item =>
    [item.key, item.label, item.module].some(value => value.toLocaleLowerCase("es-MX").includes(term))) ?? []
  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">La web aplica estos permisos en Datos Generales, Usuarios y la autorización de Pedidos.</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor="permission-group">Grupo</Label>
          <GroupSelect id="permission-group" value={group} disabled={Boolean(draft) || update.isPending}
            onChange={value => {
              if (value === null) return
              setGroup(value)
              setOffset(0)
              setSaved(false)
              update.reset()
            }} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="permission-search">Buscar permiso</Label>
          <Input id="permission-search" className="w-56" placeholder="Clave, nombre o módulo" value={search}
            onChange={event => { setSearch(event.target.value); setOffset(0) }} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {saved && <span role="status" className="text-muted-foreground">Permisos guardados</span>}
          <Button variant="outline" disabled={!draft || update.isPending}
            onClick={() => { setDraft(null); update.reset(); void permissions.refetch() }}>Descartar cambios</Button>
          <Button disabled={!draft || update.isPending} onClick={() => { if (draft) update.mutate(draft) }}>
            {update.isPending && <Spinner />}Guardar permisos{draft ? ` (${Object.keys(draft.changes).length})` : ""}
          </Button>
        </div>
      </div>
      {permissions.isPending && <p className="flex items-center gap-2"><Spinner />Consultando permisos</p>}
      {permissions.isError && <AccessError error={permissions.error} retry={() => void permissions.refetch()} />}
      {update.error && <AccessError error={update.error} />}
      {permissions.data && <>
        <div className="rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Clave</TableHead><TableHead>Permiso</TableHead><TableHead>Módulo</TableHead>
              <TableHead>German</TableHead><TableHead>Configuración web</TableHead><TableHead>Acceso web</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={6}>Sin permisos para esta búsqueda</TableCell></TableRow>}
              {rows.slice(offset, offset + limit).map(permission => {
                const value = draft?.changes[permission.key] ?? selection(permission.override)
                const allowed = override(value) ?? permission.inherited
                return (
                  <TableRow key={permission.key}>
                    <TableCell className="font-mono">{permission.key}</TableCell>
                    <TableCell>{permission.label}</TableCell><TableCell>{permission.module || "—"}</TableCell>
                    <TableCell>{permission.inherited ? "Permitido" : "Denegado"}</TableCell>
                    <TableCell><Select items={options} value={value} disabled={permission.requiresSupervisor || update.isPending}
                      onValueChange={next => { if (next !== null) choose(permission, next) }}>
                      <SelectTrigger aria-label={`Permiso ${permission.key}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                    </Select></TableCell>
                    <TableCell>{permission.requiresSupervisor ? "Requiere supervisor" : allowed ? "Permitido" : "Denegado"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <DirectoryPagination offset={offset} limit={limit} total={rows.length} move={setOffset} />
      </>}
    </div>
  )
}
