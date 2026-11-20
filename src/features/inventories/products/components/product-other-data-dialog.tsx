import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useEffect, useState, type ReactNode } from "react"
import { Controller, useForm, type Control } from "react-hook-form"

import { productKeys, productOtherDataQueryOptions } from "@/features/inventories/products/logic"
import {
  productOtherDataFormSchema,
  type Product,
  type ProductOtherData,
  type ProductOtherDataForm,
  type ProductOtherDataUpdate,
  type ProductOtherDataValue,
} from "@/features/inventories/products/model"
import { formatDate, textValue } from "@/features/inventories/products/query-formatters"
import { updateProductOtherData } from "@/features/inventories/products/services/product-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type DataFieldProps = {
  name: string
  label: string
  kind?: "text" | "number" | "date" | "checkbox" | "radio"
  digits?: number
  className?: string
  labelHidden?: boolean
  unbound?: boolean
  radioLabels?: readonly string[]
}

type DataFieldContext = {
  control: Control<ProductOtherDataForm>
  values: ProductOtherData["values"]
  editable: ReadonlySet<string>
  tariffs: ProductOtherData["tariffs"]
  miscLabels: ProductOtherData["miscLabels"]
  setTariff: (code: string) => void
}

const fieldClass = "h-5 min-w-0 rounded-none bg-background px-1 text-[10px] read-only:bg-muted/30"
const actionClass = "h-5 min-w-14 px-1.5 text-[9px]"
const priceLists = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
const discountGroups = ["1", "2", "3", "4", "5", "6", "7", "8 (vol)"]
const taxRates = ["Gral", "Exento", "Tasa 0%"]
const taxWithholdings = ["No", "Fletes", "Rentas", "Honorarios"]
const purchaseStatuses = ["OTB", "Vigente", "Forecast", "Inactivo"]
const decimalPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/

function DataField({ name, label, kind = "text", digits, className, labelHidden, radioLabels, unbound, control, values, editable }: DataFieldProps & DataFieldContext) {
  const canEdit = !unbound && editable.has(name)
  const current = unbound ? undefined : values[name]
  const labelClass = cn("shrink-0 text-right", labelHidden ? "sr-only" : "w-2/5 max-w-[6rem]")

  return (
    <Controller
      control={control}
      name={`changes.${name}`}
      render={({ field, fieldState }) => {
        const value = canEdit ? (field.value ?? current) : current
        if (kind === "checkbox") {
          return (
            <label className={cn("flex min-h-5 items-center gap-1", className)}>
              <Checkbox
                aria-label={label}
                checked={value === true || value === 1 || value === "1"}
                className="size-3"
                disabled={!canEdit}
                onCheckedChange={(checked) => field.onChange(typeof current === "number" ? Number(checked) : checked)}
              />
              <span>{label}</span>
            </label>
          )
        }
        if (kind === "radio") {
          return (
            <div className={cn("grid justify-items-center gap-1", className)}>
              <span>{label}</span>
              <RadioGroup
                aria-label={label}
                className="flex flex-wrap justify-center gap-x-2 gap-y-1"
                disabled={!canEdit}
                onValueChange={(next) => field.onChange(typeof current === "number" ? Number(next) : next)}
                value={textValue(value)}
              >
                {radioLabels?.map((option, index) => (
                  <label className="flex items-center gap-0.5" key={option}>
                    <RadioGroupItem aria-label={option} className="size-3" value={String(index)} />
                    {option}
                  </label>
                ))}
              </RadioGroup>
            </div>
          )
        }
        const displayed = !canEdit && kind === "date"
          ? formatDate(value)
          : typeof value === "number" && digits !== undefined
            ? value.toFixed(digits)
            : textValue(value)
        return (
          <label className={cn("flex min-w-0 items-center gap-1", className)}>
            <span className={labelClass}>{label}</span>
            <Input
              aria-invalid={fieldState.invalid}
              className={cn(fieldClass, kind === "number" && "text-right tabular-nums")}
              inputMode={canEdit && kind === "number" ? "decimal" : undefined}
              name={field.name}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.value)}
              readOnly={!canEdit}
              ref={field.ref}
              title={fieldState.error?.message}
              type={canEdit && kind === "date" ? "date" : "text"}
              value={displayed}
            />
          </label>
        )
      }}
    />
  )
}

function OtherDataSection({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className={cn("min-w-0 border border-border bg-muted/35", className)}>
      <h3 className="bg-module-inventory px-2 py-0.5 text-center font-medium text-module-inventory-foreground">{title}</h3>
      <div className="grid content-start gap-1 p-2">{children}</div>
    </section>
  )
}

function OtherDataFields({ context, commands }: { context: DataFieldContext; commands: ReactNode }) {
  const field = (name: string, label: string, kind?: DataFieldProps["kind"], digits?: number, props?: Pick<DataFieldProps, "className" | "labelHidden" | "radioLabels" | "unbound">) => (
    <DataField {...context} {...props} digits={digits} kind={kind} label={label} name={name} />
  )

  return (
    <div className="grid min-w-[52rem] content-start gap-1.5 p-1.5 text-[10px]">
      <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-1.5">
        <OtherDataSection title="Dimensiones y empaque:">
          <div className="grid grid-cols-2 items-start gap-x-2 gap-y-1">
            {field("volume", "Volumen", "number", 6)}
            {field("ediPackaging", "Empaque EDI")}
            {field("weight", "Peso", "number")}
            {field("ediQuantity", "Cantidad EDI", "text", undefined, { unbound: true })}
            {field("unitsPerBox", "Caja genérica", "number", 2)}
            {field("density", "Densidad K/L", "number", 4)}
            {field("packaging", "Empaque", "number", 2)}
            {field("weightPerMeter", "Peso K/M", "number")}
            {field("length", "Largo", "number", 2)}
            {field("width", "Anch", "number", 2)}
            {field("height", "Alto", "number", 2, { className: "col-start-1" })}
            {field("location", "Localización", "text", undefined, { className: "col-span-2" })}
          </div>
        </OtherDataSection>

        <OtherDataSection title="Opciones Varias:">
          {field("composition", "Composición")}
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,4fr)] items-start gap-2">
            <div className="grid content-start gap-1 pt-5">
              {field("virtualStore", "Tienda Virtual", "checkbox")}
              {field("inactiveForPurchases", "Inactivo para compras", "checkbox")}
              {field("controlsPieces", "Control por piezas", "checkbox")}
              {field("changedBy", "Usuario último cambio", "number")}
            </div>
            <div className="grid content-start gap-1">
              {field("warehouse", "Bodega", "number")}
              {field("nextReception", "Próxima recep.", "date")}
              {field("inTransit", "Tránsito", "number", 2)}
              {field("initialPhysical", "Físico Inic.", "number", 4)}
            </div>
            <div className="grid content-start gap-1">
              {field("changedAt", "Último cambio", "date")}
              {field("salePricesChangedAt", "Cambio L1,2,3", "date")}
              {field("notShipped", "No surtidos", "number", 2)}
              {field("firstPosSaleAt", "Primer vta pos", "date")}
              {field("physicalCount", "Conteo", "number", 4)}
              {field("pointWeight", "Pesos para un punto", "number", 2)}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_2fr_1fr_3fr] gap-2">
            {field("rowCode", "Irenglón")}
            {field("rootCode", "Raíz")}
            {field("colorCode", "Color")}
            {field("externalColor", "Color externo", "text", undefined, { labelHidden: true })}
          </div>
        </OtherDataSection>
      </div>

      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)] items-start gap-1.5">
        <OtherDataSection title="Precios">
          {field("discountGroup", "Grupo descuento", "radio", undefined, { radioLabels: discountGroups })}
          <div className="grid grid-cols-[2.5rem_1fr_3rem_3rem] items-center gap-1">
            <span />
            <span className="text-center">Precios:</span>
            <span className="text-center">Moneda</span>
            <span className="text-center">Porc.</span>
            {priceLists.map((list) => (
              <div className="contents" key={list}>
                <span className="text-right">Lista {list}</span>
                {field(`list${list}`, `Precio lista ${list}`, "number", 4, { labelHidden: true })}
                {field(`currency${list}`, `Moneda lista ${list}`, "number", undefined, { labelHidden: true })}
                {list <= 6 ? field(`percentage${list}`, `Porcentaje lista ${list}`, "number", 2, { labelHidden: true }) : <span />}
              </div>
            ))}
          </div>
          <div className="grid content-start gap-1">
            {field("commissionPercentage", "% Comisión", "number", 2)}
            {field("iepsPercentage", "% IEPS", "number", 6)}
            {field("fixedIeps", "% IEPS FIJO", "number", 2)}
          </div>
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)] gap-1">
            {field("offerFrom", "Oferta del", "date")}
            {field("offerUntil", "Al", "date")}
            {field("offerDiscount", "Oferta (lista 10)", "number", 2, { labelHidden: true })}
          </div>
          {field("minimumUntil", "Mínimo Hasta", "date")}
          {field("walletPercentage", "% Monedero", "number", 2)}
          {field("taxRateType", "I.V.A.", "radio", undefined, { radioLabels: taxRates })}
          {field("vatWithholdingType", "Retención I.V.A. e I.S.R.", "radio", undefined, { radioLabels: taxWithholdings })}
        </OtherDataSection>

        <div className="grid content-start gap-1.5">
          <OtherDataSection title="Datos de importación">
            {field("noInventoryLayer", "No manejar capa:", "checkbox")}
            {field("customsEntry", "Pedimento")}
            {field("importDate", "Fecha", "date")}
            {field("customsOffice", "Aduana")}
            {field("tariff", "Arancel")}
            <Select disabled={!context.editable.has("tariff") || context.tariffs.length === 0} onValueChange={(code) => { if (code !== null) context.setTariff(code) }} value={null}>
              <SelectTrigger aria-label="Catálogo de aranceles" className="h-5 w-full" size="sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {context.tariffs.map(({ code, description }) => <SelectItem key={code} value={code}>{code} {description}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-[2fr_1fr] gap-1">
              {field("tariffPercentage", "% Aranc", "number", 2)}
              {field("lotPointer", "Referencia de lote", "number", undefined, { labelHidden: true })}
            </div>
          </OtherDataSection>
          <OtherDataSection title="Datos de producción">
            {field("productionTimeType", "Tiempo variable", "checkbox")}
            {field("lotSize", "Lote", "number", 4)}
            {field("productionTime", "Tiempo (días)", "number", 6)}
            {field("productionCapacity", "Capacidad", "number")}
            <div className="grid grid-cols-[3fr_1fr] gap-1">
              {field("assemblyDate", "Ensamble", "date")}
              {field("assemblyEnabled", "Indicador de ensamble", "number", undefined, { labelHidden: true })}
            </div>
            {field("secondCode", "Código segunda")}
            {field("thirdCode", "Código terceras")}
            {field("decreaseMinimumWithOrders", "Rebajar mínimos con pedidos", "checkbox")}
            {field("nonproductiveTime", "Tiempo improductivo (SAMS)", "checkbox")}
          </OtherDataSection>
        </div>

        <div className="grid w-36 content-start gap-1 px-1 py-2">
          {[1, 2, 3, 11].map((list) => (
            <div key={list}>{field(`planPrice${list}`, `Plan de precio lista ${list}`, "number", 4, { labelHidden: true })}</div>
          ))}
          {commands}
        </div>
      </div>

      <OtherDataSection className="w-[76%]" title="Información de compras">
        {field("baseCurrency", "Moneda de origen", "number", undefined, { className: "max-w-52" })}
        <div className="grid grid-cols-3 gap-2">
          {field("purchaseVolume", "M. cúbicos Origen", "number", 3)}
          {field("purchaseUnitsPerBox", "Caja genérica", "number")}
          {field("purchaseLocation", "Lugar de Origen")}
          {field("supplierCode", "Proveedor")}
          {field("royalty", "% Regalías", "number", 2)}
          {field("supplierProductCode", "Código proveedor")}
          {field("alternateUnit", "Unidad")}
          <div className="grid grid-cols-[3fr_1fr] gap-1">
            {field("alternateUnitFactor", "Equivale a:", "number")}
            {field("unit", "Unidad principal", "text", undefined, { labelHidden: true })}
          </div>
          {field("alternateUnitPrice", "Precio compra", "number", 4)}
          {field("seasonEndsAt", "Fin de temporada", "date")}
          {field("minimumPurchase", "Compra mínima", "number")}
          {field("temporaryCurve", "Curva de temporada", "number")}
          {field("deliveryWeeksFactor", "Factor semanas en tienda", "number", 2)}
          {field("warehouseWeeksFactor", "Factor semanas en bodega", "number", 2)}
          {field("prepack", "Cant. en 1 prepack", "number")}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          {field("purchaseStatus", "STATUS OTB", "radio", undefined, { radioLabels: purchaseStatuses })}
          {field("distributeOwnDc", "Solo reparte su CD", "checkbox")}
        </div>
      </OtherDataSection>

      <OtherDataSection className="w-[94%]" title="Varios">
        <div className="grid grid-cols-[repeat(18,minmax(0,1fr))_minmax(0,1.15fr)] items-end gap-px">
          {Array.from({ length: 18 }, (_, index) => {
            const label = context.miscLabels[index]
            return (
              <div className="min-w-0 text-center" key={index + 1}>
                <span className="block truncate" title={label}>{label || (index === 17 ? "18" : "\u00a0")}</span>
                {field(`misc${index + 1}`, label || `Varios ${index + 1}`, "number", undefined, { labelHidden: true })}
              </div>
            )
          })}
          {field("temp", "Temporal", "number", undefined, { labelHidden: true })}
        </div>
      </OtherDataSection>
    </div>
  )
}

type ProductOtherDataDialogProps = {
  product: Product
  onOpenChange: (open: boolean) => void
}

export function ProductOtherDataDialog({ product, onOpenChange }: ProductOtherDataDialogProps) {
  const queryClient = useQueryClient()
  const queryOptions = productOtherDataQueryOptions(product.id)
  const query = useQuery(queryOptions)
  const current = query.data?.data.otherData
  const [baseline, setBaseline] = useState<ProductOtherData>()
  const editing = baseline !== undefined
  const data = baseline ?? current
  const form = useForm<ProductOtherDataForm>({ defaultValues: { changes: {} }, resolver: zodResolver(productOtherDataFormSchema) })
  const { setFocus, reset } = form
  const mutation = useMutation({
    mutationFn: (input: ProductOtherDataUpdate) => updateProductOtherData(product.id, input),
    onError: (error) => {
      if (!isAxiosError<{ error?: { details?: Array<{ path: unknown[]; message: string }> } }>(error)) return
      const issues = error.response?.data.error?.details ?? []
      for (const { path, message } of issues) {
        const [section, key] = path
        if (section !== "changes" || typeof key !== "string" || !baseline?.editableFields.includes(key)) continue
        form.setError(`changes.${key}`, { message })
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData(queryOptions.queryKey, result)
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(product.id), exact: true })
      setBaseline(undefined)
      reset({ changes: {} })
    },
  })

  useEffect(() => {
    if (editing) setFocus("changes.volume", { shouldSelect: true })
  }, [editing, setFocus])

  function beginEdit() {
    if (!current?.writable) return
    mutation.reset()
    reset({ changes: {} })
    setBaseline(current)
  }

  function discard() {
    mutation.reset()
    reset({ changes: {} })
    setBaseline(undefined)
    void query.refetch()
  }

  const save = form.handleSubmit(({ changes }) => {
    if (!baseline || mutation.isPending) return
    const changed: Record<string, ProductOtherDataValue> = {}
    for (const key of baseline.editableFields) {
      const value = changes[key]
      if (value === undefined) continue
      const original = baseline.values[key]
      if (typeof original === "number" && typeof value === "string" && (!decimalPattern.test(value.trim()) || !Number.isFinite(Number(value)))) {
        form.setError(`changes.${key}`, { message: "Captura un número válido" }, { shouldFocus: true })
        return
      }
      const next = typeof original === "number" ? Number(value) : value
      if (next !== original) changed[key] = next
    }
    mutation.mutate({ revision: baseline.revision, changes: changed })
  })

  return (
    <ErpDataDialog
      defaultHeight={628}
      defaultWidth={940}
      description={`Datos adicionales del producto ${product.code}`}
      fillHeight
      onOpenChange={(open) => { if (!editing && !mutation.isPending) onOpenChange(open) }}
      title="Otros"
    >
      <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-1">
        {query.isPending && <Spinner aria-label="Cargando datos adicionales" className="mx-auto my-4" />}
        {query.isError && !data && (
          <Alert variant="destructive">
            <AlertTitle>No fue posible cargar Otros</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-2">
              {getApiErrorMessage(query.error)}
              <Button onClick={() => void query.refetch()} size="sm" type="button" variant="outline">Reintentar</Button>
            </AlertDescription>
          </Alert>
        )}
        {data && (
          <form className="flex min-h-0 flex-1 flex-col gap-1" onSubmit={save}>
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertTitle>No fue posible guardar los datos</AlertTitle>
                <AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
              </Alert>
            )}
            {form.formState.errors.changes && (
              <Alert variant="destructive"><AlertDescription>Revisa los campos marcados antes de guardar.</AlertDescription></Alert>
            )}
            <ErpDataTableViewport className="min-h-0 flex-1 bg-muted">
              <OtherDataFields
                commands={(
                  <div className="mt-3 grid gap-2.5">
                    <Button
                      className={actionClass}
                      disabled={editing || !data.writable}
                      onClick={beginEdit}
                      title={data.writable ? undefined : "Disponible para productos habilitados para edición"}
                      type="button"
                      variant="outline"
                    >
                      Cambio
                    </Button>
                    {editing && (
                      <div className="flex gap-1">
                        <Button className={actionClass} disabled={mutation.isPending} type="submit" variant="outline">
                          {mutation.isPending && <Spinner data-icon="inline-start" />} OK
                        </Button>
                        <Button className={actionClass} disabled={mutation.isPending} onClick={discard} type="button" variant="outline">
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                context={{
                  control: form.control,
                  values: data.values,
                  editable: new Set(editing && !mutation.isPending ? data.editableFields : []),
                  tariffs: data.tariffs,
                  miscLabels: data.miscLabels,
                  setTariff: (code) => {
                    const option = data.tariffs.find((tariff) => tariff.code === code)
                    if (!option) return
                    form.setValue("changes.tariff", code)
                    if (option.percentage !== null) form.setValue("changes.tariffPercentage", option.percentage)
                  },
                }}
              />
            </ErpDataTableViewport>
          </form>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
