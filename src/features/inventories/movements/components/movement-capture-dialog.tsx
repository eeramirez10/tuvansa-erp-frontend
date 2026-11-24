import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { MovementCaptureLine } from "@/features/inventories/movements/components/movement-capture-line"
import { movementCaptureQueryOptions, movementKeys } from "@/features/inventories/movements/logic"
import {
  emptyMovementCaptureLine, movementCapturePayload, movementCaptureProduct, movementCaptureSchema, movementLineLimit,
  type MovementCaptureDraft, type MovementCaptureValues,
} from "@/features/inventories/movements/movement-capture-form"
import { movementCaptureWindowId, type InventoryMovement, type MovementCaptureOptions, type MovementCaptureType } from "@/features/inventories/movements/model"
import { createInventoryMovement } from "@/features/inventories/movements/services/movement-service"
import { ProductSearchDialog } from "@/features/inventories/products/components/product-search-dialog"
import { productKeys } from "@/features/inventories/products/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { FieldError } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function CaptureForm({ options, locked, saving, onClose, onSubmit }: {
  options: MovementCaptureOptions
  locked: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (values: MovementCaptureValues) => void
}) {
  const form = useForm<MovementCaptureDraft, unknown, MovementCaptureValues>({
    resolver: zodResolver(movementCaptureSchema(options)),
    defaultValues: {
      type: options.types[0]?.code ?? "EI",
      date: options.defaultDate,
      warehouse: options.warehouses.some(warehouse => warehouse.code === options.defaultWarehouse) ? options.defaultWarehouse : "",
      destinationWarehouse: "",
      reference: "",
      document: "",
      lines: [emptyMovementCaptureLine()],
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" })
  const [searchRow, setSearchRow] = useState<string | null>(null)
  const id = useId()
  const type = useWatch({ control: form.control, name: "type" })
  const origin = useWatch({ control: form.control, name: "warehouse" })
  const transfer = type === "TR"
  const errors = form.formState.errors
  const disabled = saving || Boolean(searchRow)
  const typeItems = options.types.map(item => ({ value: item.code, label: `${item.code} · ${item.name}` }))
  const warehouseItems = options.warehouses.map(item => ({ value: item.code, label: `${item.code} · ${item.name}` }))
  const destinationItems = warehouseItems.filter(item => item.value !== origin)

  return (
    <>
      <form className="grid gap-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className={transfer ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.2fr_1fr_1.3fr]"}>
          <div className="grid content-start gap-1">
            <Label htmlFor={`${id}-type`}>Tipo</Label>
            <Controller control={form.control} name="type" render={({ field }) => (
              <Select disabled={disabled} items={typeItems} value={field.value} onValueChange={value => {
                if (value) field.onChange(value as MovementCaptureType)
              }}>
                <SelectTrigger aria-invalid={Boolean(errors.type)} className="h-6" id={`${id}-type`} onBlur={field.onBlur} ref={field.ref}>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>{typeItems.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <FieldError errors={[errors.type]} />
          </div>
          <div className="grid content-start gap-1">
            <Label htmlFor={`${id}-date`}>Fecha</Label>
            <Input aria-invalid={Boolean(errors.date)} className="h-6" disabled={disabled} id={`${id}-date`}
              type="date" {...form.register("date")} />
            <FieldError errors={[errors.date]} />
          </div>
          <div className="grid content-start gap-1">
            <Label htmlFor={`${id}-warehouse`}>{transfer ? "Almacén origen" : "Almacén"}</Label>
            <Controller control={form.control} name="warehouse" render={({ field }) => (
              <Select disabled={disabled} items={warehouseItems} value={field.value || null} onValueChange={value => {
                if (value) {
                  field.onChange(value)
                  if (form.getValues("destinationWarehouse") === value) form.setValue("destinationWarehouse", "")
                }
              }}>
                <SelectTrigger aria-invalid={Boolean(errors.warehouse)} className="h-6" id={`${id}-warehouse`} onBlur={field.onBlur} ref={field.ref}>
                  <SelectValue placeholder="Selecciona un almacén" />
                </SelectTrigger>
                <SelectContent>{warehouseItems.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <FieldError errors={[errors.warehouse]} />
          </div>
          {transfer && <div className="grid content-start gap-1">
            <Label htmlFor={`${id}-destination`}>Almacén destino</Label>
            <Controller control={form.control} name="destinationWarehouse" render={({ field }) => (
              <Select disabled={disabled} items={destinationItems} value={field.value || null} onValueChange={value => {
                if (value) field.onChange(value)
              }}>
                <SelectTrigger aria-invalid={Boolean(errors.destinationWarehouse)} className="h-6" id={`${id}-destination`}
                  onBlur={field.onBlur} ref={field.ref}>
                  <SelectValue placeholder="Selecciona un destino" />
                </SelectTrigger>
                <SelectContent>{destinationItems.map(item => <SelectItem value={item.value} key={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <FieldError errors={[errors.destinationWarehouse]} />
          </div>}
          <div className="grid content-start gap-1">
            <Label htmlFor={`${id}-document`}>Documento</Label>
            <Input aria-invalid={Boolean(errors.document)} className="h-6 uppercase" disabled={disabled}
              id={`${id}-document`} maxLength={15} placeholder="Folio automático" {...form.register("document")} />
            <FieldError errors={[errors.document]} />
          </div>
          <div className="grid content-start gap-1">
            <Label htmlFor={`${id}-reference`}>Referencia</Label>
            <Input aria-invalid={Boolean(errors.reference)} className="h-6" disabled={disabled}
              id={`${id}-reference`} maxLength={64} {...form.register("reference")} />
            <FieldError errors={[errors.reference]} />
          </div>
        </div>
        <ErpDataTableViewport axes="xy" className="max-h-72">
          <Table className="min-w-[575px]">
            <TableHeader className="sticky top-0 z-[1] bg-muted">
              <TableRow>
                <TableHead>Producto</TableHead><TableHead>Descripción</TableHead><TableHead>U.M.</TableHead>
                <TableHead className="text-right">{transfer ? "Cantidad" : type === "SI" ? "Salida" : "Entrada"}</TableHead>
                <TableHead className="text-right">Costo</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>{fields.map((field, index) => (
              <MovementCaptureLine canRemove={fields.length > 1} disabled={disabled} form={form} index={index} key={field.id}
                onRemove={() => remove(index)} onSearch={() => setSearchRow(field.id)} />
            ))}</TableBody>
          </Table>
        </ErpDataTableViewport>
        {options.automaticPeps && type === "SI" && (
          <p className="text-xs text-muted-foreground">Para productos con PEPS, deja vacío el costo. La salida usa el costo promedio y consume las capas automáticamente.</p>
        )}
        <div className="flex flex-wrap justify-between gap-1">
          <Button disabled={disabled || fields.length >= movementLineLimit} onClick={() => append(emptyMovementCaptureLine(), {
            focusName: `lines.${fields.length}.code`,
          })} size="xs" type="button" variant="outline">Agregar partida</Button>
          <div className="flex gap-1">
            <Button disabled={disabled} onClick={onClose} size="xs" type="button" variant="outline">Cancelar</Button>
            <Button disabled={disabled || locked} size="xs" type="submit">
              {saving && <Spinner />}
              OK
            </Button>
          </div>
        </div>
      </form>
      {searchRow && (
        <DesktopWindowIdentity id={`${movementCaptureWindowId}:search`}>
          <ProductSearchDialog onOpenChange={open => { if (!open) setSearchRow(null) }} status="active" onSelect={product => {
            const index = fields.findIndex(field => field.id === searchRow)
            if (index >= 0 && product.isActive) {
              form.setValue(`lines.${index}.code`, product.code, { shouldDirty: true })
              form.setValue(`lines.${index}.product`, movementCaptureProduct(product), { shouldDirty: true })
              form.clearErrors(`lines.${index}.code`)
            }
            setSearchRow(null)
          }} />
        </DesktopWindowIdentity>
      )}
    </>
  )
}

export function MovementCaptureDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (movement: InventoryMovement) => void }) {
  const queryClient = useQueryClient()
  const query = useQuery(movementCaptureQueryOptions())
  const inFlight = useRef(false)
  const request = useRef<{ signature: string; key: string } | null>(null)
  const save = useMutation({
    mutationFn: createInventoryMovement,
    onSuccess: movement => {
      queryClient.setQueryData(movementKeys.detail(movement.header.id), movement)
      void queryClient.invalidateQueries({ queryKey: movementKeys.all })
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "reports"] })
      onSaved(movement)
    },
    onSettled: () => { inFlight.current = false },
  })
  const options = query.data
  const canCapture = options?.writable && options.types.length > 0 && options.warehouses.length > 0
  const close = () => { if (!inFlight.current) onClose() }
  function submit(values: MovementCaptureValues) {
    if (!canCapture || query.isFetching || query.isError || inFlight.current) return
    const input = movementCapturePayload(values)
    const signature = JSON.stringify(input)
    if (request.current?.signature !== signature) request.current = { signature, key: crypto.randomUUID() }
    inFlight.current = true
    save.mutate({ ...input, requestKey: request.current.key })
  }

  return (
    <ErpDataDialog defaultWidth={760} description="Registro de entradas, salidas y traspasos de inventario."
      onOpenChange={open => { if (!open) close() }} title="Captura de movimientos de inventario">
      <ErpDataDialogBody className="grid gap-2 text-[10px]/normal" onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close() }
      }}>
        {query.isFetching && !options && <div className="flex gap-1" role="status"><Spinner /> Consultando tipos y almacenes…</div>}
        {query.isError && <Alert variant="destructive">
          <AlertTitle>No fue posible consultar la captura</AlertTitle>
          <AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription>
          <Button className="w-fit" onClick={() => void query.refetch()} size="xs" type="button" variant="outline">Reintentar</Button>
        </Alert>}
        {options && !canCapture && <Alert role="status"><AlertDescription>{options.reason || "No hay tipos y almacenes disponibles."}</AlertDescription></Alert>}
        {save.isError && <Alert variant="destructive">
          <AlertTitle>No fue posible guardar el movimiento</AlertTitle>
          <AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription>
        </Alert>}
        {options && canCapture ? <CaptureForm locked={query.isFetching || query.isError}
          onClose={close} onSubmit={submit} options={options} saving={save.isPending} />
          : <Button className="justify-self-end" onClick={close} size="xs" type="button" variant="outline">Cerrar</Button>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
