import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { Button } from "@/shared/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { initialDirectoryFilters, userDetailOptions, userDirectoryKey, webSessionKey } from "../logic"
import { groupIds, type DirectoryDirection, type DirectoryPosition, type DirectoryUserDetail, type SavedDirectoryUser } from "../model"
import { adjacentUser, listUsers, saveUser } from "../services/users-service"
import { AccessError } from "./directory-controls"
import { GroupPermissions } from "./group-permissions"
import { UserActivation } from "./user-activation"
import { UserEditor } from "./user-editor"
import { UserSearchDialog } from "./user-search-dialog"

type Editor = { mode: "create" } | { mode: "edit"; user: DirectoryUserDetail }
type Overlay = "search" | "permissions" | "activation"
const firstPosition: DirectoryPosition = { filters: initialDirectoryFilters, index: null, total: null }

export function UserDirectory() {
  const queryClient = useQueryClient()
  const searchButton = useRef<HTMLButtonElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [position, setPosition] = useState(firstPosition)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [confirmRemoval, setConfirmRemoval] = useState(false)
  const [notice, setNotice] = useState("")
  const detail = useQuery({ ...userDetailOptions(selectedId ?? ""), enabled: selectedId !== null })
  const user = detail.data ?? null
  const detailBusy = selectedId !== null && detail.isPending
  const navigation = useMutation({
    mutationFn: async (direction: DirectoryDirection) => {
      if (selectedId) return adjacentUser(position.filters, selectedId, direction)
      const results = await listUsers({ ...initialDirectoryFilters, limit: 1 })
      return { ...results, position: results.items.length ? 0 : null }
    },
    onSuccess: (result, direction) => {
      const item = result.items[0]
      if (item) {
        setSelectedId(item.id)
        setPosition(current => ({
          filters: { ...current.filters, offset: Math.floor((result.position ?? 0) / current.filters.limit) * current.filters.limit },
          index: result.position, total: result.total,
        }))
        setNotice("")
      } else {
        setPosition(current => ({
          ...current, total: result.total, index: direction === "previous" ? 0 : Math.max(0, result.total - 1),
        }))
        setNotice(direction === "previous" ? "No hay usuarios anteriores." : "No hay más usuarios.")
      }
    },
  })
  const removal = useMutation({
    mutationFn: (record: DirectoryUserDetail) => saveUser({
      identification: record.identification, name: record.name, group: record.group, active: false, administrator: record.administrator,
    }, record),
    onSuccess: record => { saved(record); setNotice("Usuario dado de baja.") },
  })

  function closeSearch() {
    setOverlay(null)
    requestAnimationFrame(() => searchButton.current?.focus())
  }

  function selectUser(id: string, selectedPosition: DirectoryPosition) {
    setSelectedId(id)
    setPosition(selectedPosition)
    setNotice("")
    navigation.reset()
    closeSearch()
  }

  function refreshAccess() {
    void queryClient.invalidateQueries({ queryKey: userDirectoryKey })
    void queryClient.invalidateQueries({ queryKey: webSessionKey })
  }

  function saved(record: SavedDirectoryUser) {
    const previous = editor?.mode === "edit" ? editor.user : null
    queryClient.setQueryData(userDetailOptions(record.id).queryKey, {
      ...record,
      legacyDetails: previous?.legacyDetails ?? null,
      activationExpiresAt: record.effectiveActive ? previous?.activationExpiresAt ?? null : null,
    })
    setSelectedId(record.id)
    setPosition(firstPosition)
    setNotice(editor?.mode === "create" ? "Usuario creado." : "Cambios guardados.")
    setEditor(null)
    refreshAccess()
  }

  const busy = Boolean(overlay) || navigation.isPending || detailBusy || removal.isPending || confirmRemoval
  const editing = editor !== null
  const editable = !busy && !editing
  const record = editor?.mode === "edit" ? editor.user : editor?.mode === "create" ? null : user
  const previousAvailable = selectedId !== null && position.index !== 0
  const nextAvailable = position.index === null || position.total === null || position.index + 1 < position.total
  const activeGroup = user && groupIds.includes(user.group) ? user.group : 0

  return (
    <Card className="mx-auto w-full max-w-5xl overflow-hidden">
      <CardHeader className="border-b bg-muted/35">
        <CardTitle>Usuarios</CardTitle>
      </CardHeader>
      <CardContent className="grid items-start gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <aside aria-label="Acciones de usuarios" className="rounded-md border bg-muted/25 sm:self-stretch">
          <h2 className="rounded-t-md border-b bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">Acciones</h2>
          <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-1">
            <Button variant="outline" disabled={!editable || !nextAvailable} onClick={() => navigation.mutate("next")}>Siguiente</Button>
            <Button variant="outline" disabled={!editable || !previousAvailable} onClick={() => navigation.mutate("previous")}>Anterior</Button>
            <Button ref={searchButton} variant="outline" disabled={!editable} onClick={() => setOverlay("search")}>Encuentra</Button>
            <Button disabled={!editable} onClick={() => { setNotice(""); setEditor({ mode: "create" }) }}>Alta</Button>
            {user && <Button variant="outline" disabled={!editable} onClick={() => { setNotice(""); setEditor({ mode: "edit", user }) }}>Cambio</Button>}
            {user?.effectiveActive && <Button variant="outline" disabled={!editable} onClick={() => { removal.reset(); setConfirmRemoval(true) }}>Eliminar</Button>}
          </div>
        </aside>
        <div className="grid min-w-0 gap-3">
          {(detailBusy || navigation.isPending) && <p role="status" className="flex items-center gap-2"><Spinner />Consultando usuario</p>}
          {detail.isError && <AccessError error={detail.error} retry={() => void detail.refetch()} />}
          {navigation.error && <AccessError error={navigation.error} />}
          {removal.error && <AccessError error={removal.error} />}
          {notice && <p role="status" className="text-xs font-medium text-primary">{notice}</p>}
          {(!detailBusy || editing) && (
            <UserEditor key={editor ? `${editor.mode}:${record?.id ?? ""}` : `view:${record?.id ?? ""}:${record?.revision ?? 0}`}
              user={record} mode={editor?.mode ?? "view"} busy={busy} onSaved={saved}
              onCancel={() => setEditor(null)}
              onReload={() => { setEditor(null); void detail.refetch() }}
              onActivation={() => setOverlay("activation")} onPermissions={() => setOverlay("permissions")} />
          )}
        </div>
      </CardContent>
      <AlertDialog open={confirmRemoval} onOpenChange={setConfirmRemoval}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario web</AlertDialogTitle>
            <AlertDialogDescription>La baja de {user?.identification} deshabilitará su acceso y cerrará sus sesiones web.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => {
              setConfirmRemoval(false)
              if (user) removal.mutate(user)
            }}>Dar de baja</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {overlay === "search" && <UserSearchDialog initialFilters={position.filters} close={closeSearch} select={selectUser} />}
      {overlay === "activation" && user && <UserActivation user={user}
        onClose={changed => {
          setOverlay(null)
          if (changed) {
            setPosition(firstPosition)
            refreshAccess()
          }
        }} />}
      {overlay === "permissions" && (
        <ErpDataDialog title="Permisos por grupo" description={user?.identification ?? "Usuarios"}
          defaultWidth={950} defaultHeight={600} fillHeight onOpenChange={open => { if (!open) setOverlay(null) }}>
          <ErpDataDialogBody className="min-h-0 flex-1 overflow-auto">
            <GroupPermissions initialGroup={activeGroup} />
            <div className="mt-3 flex justify-end"><Button variant="outline" onClick={() => setOverlay(null)}>Cerrar</Button></div>
          </ErpDataDialogBody>
        </ErpDataDialog>
      )}
    </Card>
  )
}
