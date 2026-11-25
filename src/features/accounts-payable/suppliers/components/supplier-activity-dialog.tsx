import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { supplierKeys, supplierPanelQueryOptions } from "@/features/accounts-payable/suppliers/logic"
import type {
  Supplier, SupplierActivityCommand, SupplierActivityItem, SupplierActivityKind, SupplierPanelDefinition,
} from "@/features/accounts-payable/suppliers/model"
import { saveSupplierActivity } from "@/features/accounts-payable/suppliers/services/supplier-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/utils/cn"

type Field = { name: string; label: string; type?: "date" | "textarea"; max?: number }
const fieldsByKind: Record<SupplierActivityKind, Field[]> = {
  events: [
    { name: "date", label: "Fecha", type: "date" }, { name: "title", label: "Título", max: 70 },
    { name: "followUpAt", label: "Recordar", type: "date" }, { name: "dueAt", label: "Borrar", type: "date" },
    { name: "project", label: "Proyecto", max: 12 }, { name: "description", label: "Descripción", type: "textarea", max: 19200 },
  ],
  contacts: [
    { name: "name", label: "Nombre", max: 50 }, { name: "position", label: "Puesto", max: 50 },
    { name: "phone1", label: "Teléfono", max: 15 }, { name: "phone2", label: "Tel2", max: 15 },
    { name: "fax", label: "Fax", max: 15 }, { name: "email", label: "Mail", max: 50 },
    { name: "interests", label: "Área de interés", max: 50 }, { name: "birthday", label: "Cumpleaños", type: "date" },
    { name: "notes", label: "Obs.", type: "textarea", max: 400 },
  ],
}
const today = () => new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeZone: "America/Mexico_City" }).format()
const text = (value: unknown) => typeof value === "string" ? value : ""

function EntryForm({ fields, item, readOnly, busy, submit, cancel }: {
  fields: Field[]
  item?: SupplierActivityItem
  readOnly: boolean
  busy: boolean
  submit: (values: Record<string, string | null>) => void
  cancel: () => void
}) {
  const schema = z.object(Object.fromEntries(fields.map(({ name, type, max }) => [
    name, type === "date" ? name === "date" ? z.iso.date() : z.union([z.iso.date(), z.literal("")])
      : z.string().max(max ?? 0),
  ])))
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map(({ name }) => [
      name, item ? text(item[name]) : name === "date" && !readOnly ? today() : "",
    ])),
  })
  return (
    <form className="grid grid-cols-2 gap-1.5" onSubmit={handleSubmit((values) => {
      if (readOnly) return
      submit(Object.fromEntries(fields.map(({ name, type }) => [name, type === "date" ? values[name] || null : values[name] ?? ""])))
    })}>
      {fields.map(({ name, label, type, max }) => (
        <label className={cn("grid min-w-0 gap-0.5", type === "textarea" && "col-span-full")} key={name}>
          <span>{label}</span>
          {type === "textarea"
            ? <Textarea readOnly={readOnly || busy} rows={4} maxLength={max} {...register(name)} />
            : <Input className="h-6 text-[10px]" readOnly={readOnly || busy} type={type ?? "text"} maxLength={max} {...register(name)} />}
        </label>
      ))}
      {Object.keys(formState.errors).length > 0 && <p className="col-span-full text-destructive">Revisa los campos de la ficha.</p>}
      {!readOnly && <div className="col-span-full flex justify-end gap-1">
        <Button disabled={busy} size="xs" type="submit">{busy && <Spinner />}OK</Button>
        <Button disabled={busy} size="xs" type="button" variant="outline" onClick={cancel}>Cancelar</Button>
      </div>}
    </form>
  )
}

export function SupplierActivityDialog({ supplier, panel, kind, onOpenChange }: {
  supplier: Supplier
  panel: SupplierPanelDefinition
  kind: SupplierActivityKind
  onOpenChange: (open: boolean) => void
}) {
  const events = kind === "events"
  const [selected, setSelected] = useState<SupplierActivityItem["id"]>()
  const [editor, setEditor] = useState<{ operation: SupplierActivityCommand["operation"]; item?: SupplierActivityItem }>()
  const operation = editor?.operation
  const latest = useRef<{ key: string; command: SupplierActivityCommand }>(null)
  const pending = useRef(false)
  const queryClient = useQueryClient()
  const query = useQuery(supplierPanelQueryOptions(supplier.id, panel))
  const items = (query.data?.data.items ?? []) as SupplierActivityItem[]
  const item = items.find(row => row.id === selected) ?? items[0]
  const canWrite = query.data?.data.detail?.canWrite === true
  const save = useMutation({
    mutationFn: (command: SupplierActivityCommand) => saveSupplierActivity(supplier.id, kind, command),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: supplierKeys.all })
      setSelected(result?.id)
      setEditor(undefined)
      latest.current = null
    },
    onSettled: () => { pending.current = false },
  })

  function begin(next?: SupplierActivityCommand["operation"]) {
    if (pending.current) return
    latest.current = null
    save.reset()
    setEditor(next ? { operation: next, item: next === "create" ? undefined : item } : undefined)
  }

  function submit(values?: Record<string, string | null>) {
    if (!canWrite || !editor || pending.current) return
    const { operation, item: original } = editor
    if (operation !== "create" && !original) return
    const input = {
      operation,
      ...(original ? { id: original.id, revision: original.revision } : {}),
      ...(values ? { fields: values } : {}),
    }
    const key = JSON.stringify(input)
    if (latest.current?.key !== key) latest.current = { key, command: { ...input, requestKey: crypto.randomUUID() } }
    pending.current = true
    save.mutate(latest.current.command)
  }

  const editing = operation === "create" || operation === "change"
  const display = editor ? editor.item : item
  const disableActions = !canWrite || Boolean(operation) || save.isPending
  const columns = events ? ["Fecha", "Título", "Recordar", "Borrar"] : ["Nombre", "Código"]
  const keys = events ? ["date", "title", "followUpAt", "dueAt"] : ["name", "position"]

  return (
    <ErpDataDialog defaultWidth={events ? 690 : 820} description={supplier.code} tone="payable" title={panel.title}
      onOpenChange={open => { if (open || !pending.current) onOpenChange(open) }}>
      <ErpDataDialogBody className={cn("grid gap-2 text-[10px]", !events && "sm:grid-cols-2")}>
        <div>
          <ErpDataTableViewport axes="xy" className={events ? "h-40" : "h-64"}>
            <Table className="text-[10px]">
              <TableHeader><TableRow>{columns.map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {items.map(row => <TableRow data-state={row.id === item?.id ? "selected" : undefined} key={row.id}
                  onClick={() => { if (!operation) setSelected(row.id) }}>
                  {keys.map((key, index) => <TableCell key={key}>{index === 0
                    ? <Button aria-pressed={row.id === item?.id} disabled={Boolean(operation)} size="xs" variant="ghost">
                      {text(row[key]) || "—"}
                    </Button>
                    : text(row[key])}</TableCell>)}
                </TableRow>)}
              </TableBody>
            </Table>
            {query.isPending && <div className="grid justify-center py-3"><Spinner /></div>}
          </ErpDataTableViewport>
          <div className="mt-2 flex gap-1">
            <Button disabled={disableActions} onClick={() => begin("create")} size="xs" variant="outline">{events ? "Nuevo" : "Alta"}</Button>
            {!events && <Button disabled={disableActions || !item} onClick={() => begin("remove")} size="xs" variant="outline">Baja</Button>}
            <Button disabled={!events || disableActions || !item} onClick={() => begin("change")} size="xs" variant="outline">{events ? "Cambiar" : "Cambio"}</Button>
            {events && <Button disabled={disableActions || !item} onClick={() => begin("remove")} size="xs" variant="outline">Eliminar</Button>}
          </div>
        </div>
        <div className="grid content-start gap-1.5">
          {events && Boolean(display?.requestedBy) && <p>Generó {text(display?.requestedBy)}</p>}
          {!events && <p>Código {supplier.code}</p>}
          <EntryForm busy={save.isPending} cancel={() => begin()}
            fields={fieldsByKind[kind]} item={display}
            key={`${operation ?? "view"}/${display?.id ?? ""}/${display?.revision ?? ""}`} readOnly={!editing} submit={submit} />
          {operation === "remove" && <Alert><AlertDescription>
            ¿Deseas dar de baja {events ? "el evento" : "el contacto"}?
            <div className="mt-1 flex gap-1">
              <Button disabled={save.isPending} onClick={() => submit()} size="xs">Sí</Button>
              <Button disabled={save.isPending} onClick={() => begin()} size="xs" variant="outline">Cancelar</Button>
            </div>
          </AlertDescription></Alert>}
          {(query.error || save.error) && <Alert variant="destructive"><AlertDescription>
            {getApiErrorMessage(query.error ?? save.error)}
          </AlertDescription></Alert>}
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
