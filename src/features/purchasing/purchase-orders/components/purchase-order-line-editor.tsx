import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import type { PurchaseOrderEditLine, PurchaseOrderEditor, PurchaseOrderEditProduct } from "@/features/purchasing/purchase-orders/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity, useDesktopWindowCollection } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableRow } from "@/shared/ui/table"

const lineSchema = z.object({
  id: z.number().int().positive().nullable(),
  productCode: z.string().max(13),
  description: z.string(),
  taxable: z.boolean().optional(),
  exciseTaxPercentage: z.number().optional(),
  quantity: z.number(),
  unit: z.string().max(3),
  discount: z.number(),
  price: z.number(),
  branch: z.number().int(),
  pieces: z.string().max(1000),
})
const schema = z.object({ lines: z.array(lineSchema) })
type Draft = z.infer<typeof schema>

const blankLine: Draft["lines"][number] = {
  id: null, productCode: "", description: "", quantity: 0, unit: "", discount: 0, price: 0, branch: 0, pieces: "",
}

const quantityFormat = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const priceFormat = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 5, maximumFractionDigits: 5 })
const discountFormat = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const normalizeCode = (code: string) => code.trim().toUpperCase()
const fieldClass = "h-5 min-w-0 rounded-sm px-1 text-[9px]"
const numberField = { setValueAs: (value: string | number) => Number(value) }

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-0.5"><span className="truncate">{label}</span>{children}</label>
}

type ProductLookup = {
  key: readonly unknown[]
  search: (query: string, signal: AbortSignal) => Promise<PurchaseOrderEditProduct[]>
}

function ProductPicker({ lookup, initial, onSelect, onClose }: {
  lookup: ProductLookup; initial: string; onSelect: (product: PurchaseOrderEditProduct) => void; onClose: () => void
}) {
  const [query, setQuery] = useState(initial)
  const [submitted, setSubmitted] = useState(initial)
  const products = useQuery({
    queryKey: [...lookup.key, submitted],
    queryFn: ({ signal }) => lookup.search(submitted, signal),
    enabled: submitted !== "",
  })
  return (
    <ErpDataDialog defaultWidth={570} title="Buscar producto" description="Productos para la orden de compra"
      onOpenChange={(open) => !open && onClose()}>
      <ErpDataDialogBody className="grid gap-1.5">
        <form className="flex items-center gap-1" onSubmit={(event) => { event.preventDefault(); setSubmitted(query.trim()) }}>
          <Input aria-label="Código o descripción" autoFocus className="h-6" maxLength={60} onChange={(event) => setQuery(event.target.value)} value={query} />
          <Button disabled={!query.trim() || products.isFetching} size="sm" type="submit">Buscar</Button>
        </form>
        {products.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(products.error)}</AlertDescription></Alert>}
        <ErpDataTableViewport className="h-52">
          <Table className="min-w-96">
            <TableBody>
              {products.data?.map((product) => (
                <TableRow key={product.code}>
                  <TableCell className="p-0">
                    <Button className="flex min-w-full justify-start text-left" disabled={!product.eligible}
                      onClick={() => onSelect(product)} size="xs" variant="ghost">
                      <span className="w-20 shrink-0 font-mono">{product.code}</span>
                      {product.description}{!product.eligible && " · No disponible para compras"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products.data?.length === 0 && <TableRow><TableCell>Sin resultados</TableCell></TableRow>}
            </TableBody>
          </Table>
        </ErpDataTableViewport>
        <div className="flex justify-end"><Button onClick={onClose} size="sm" variant="outline">Cancelar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export type PurchaseOrderDraftLine = Draft["lines"][number]

type Props = {
  windowId: string
  title: string
  description: string
  initialLines: PurchaseOrderEditor["lines"]
  priceLocked: boolean
  supplierUnits: boolean
  lookup: ProductLookup
  onSubmit: (lines: PurchaseOrderEditLine[], removeZero: boolean) => void
  onClose: () => void
  saving: boolean
  error: string
  creation?: {
    canCapture: boolean
    header: (hasLines: boolean) => ReactNode
    footer: (lines: PurchaseOrderDraftLine[]) => ReactNode
    maxLines: number
  }
}

export function PurchaseOrderLineEditor({
  windowId, title, description, initialLines, priceLocked, supplierUnits, lookup, onSubmit, onClose, saving, error, creation,
}: Props) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(0)
  const [confirmation, setConfirmation] = useState<PurchaseOrderEditLine[] | null>(null)
  const [productError, setProductError] = useState("")
  const [pendingLookups, setPendingLookups] = useState(0)
  const verifiedCodes = useRef(initialLines.map((line) => normalizeCode(line.productCode)))
  const committedUnits = useRef(initialLines.map((line) => line.unit))
  const committedFactors = useRef(initialLines.map((line) => line.factor))
  const { windows: productWindows, openWindow: openProductWindow, closeWindow: closeProductWindow } = useDesktopWindowCollection<number>()
  const { control, getValues, handleSubmit, register, setFocus, setValue, formState } = useForm<Draft>({
    resolver: zodResolver(schema), defaultValues: { lines: initialLines.length > 0 ? initialLines : [blankLine] },
  })
  const { fields, append } = useFieldArray({ control, name: "lines", keyName: "key" })
  const lines = useWatch({ control, name: "lines" })
  const current = lines[selected]
  const codeField = `lines.${selected}.productCode` as const
  const unitField = `lines.${selected}.unit` as const
  const productInput = register(codeField)
  const unitInput = register(unitField)

  const canCapture = creation?.canCapture ?? true
  const isCreation = creation !== undefined
  useEffect(() => {
    if (canCapture && !isCreation) setFocus(codeField, { shouldSelect: true })
  }, [canCapture, codeField, isCreation, setFocus])

  function selectProduct(index: number, product: PurchaseOrderEditProduct) {
    if (!product.eligible) return
    const previousCode = verifiedCodes.current[index]
    if (previousCode !== product.code) {
      const unit = product.units.find((option) => option.code === product.defaultUnit)
      setValue(`lines.${index}.unit`, product.defaultUnit, { shouldDirty: true })
      setValue(`lines.${index}.price`, unit?.suggestedPrice ?? Number.NaN, { shouldDirty: true })
      if (priceLocked) setValue(`lines.${index}.discount`, 0, { shouldDirty: true })
      committedUnits.current[index] = product.defaultUnit
      committedFactors.current[index] = unit?.factor ?? 1
    }
    verifiedCodes.current[index] = product.code
    setValue(`lines.${index}.productCode`, product.code, { shouldDirty: true })
    setValue(`lines.${index}.description`, product.description)
    if (isCreation) {
      setValue(`lines.${index}.taxable`, product.taxable)
      setValue(`lines.${index}.exciseTaxPercentage`, product.exciseTaxPercentage)
    }
    setProductError("")
  }

  function loadProduct(code: string) {
    return queryClient.fetchQuery({
      queryKey: [...lookup.key, code],
      queryFn: ({ signal }) => lookup.search(code, signal),
    })
  }

  async function validateProduct(index: number) {
    const path = `lines.${index}.productCode` as const
    const code = normalizeCode(getValues(path))
    if (!code) {
      if (isCreation) verifiedCodes.current[index] = ""
      setValue(`lines.${index}.description`, "")
      setProductError("")
      return
    }
    if (code === verifiedCodes.current[index]) {
      const original = initialLines[index]
      if (original?.productCode === code) setValue(`lines.${index}.description`, original.description)
      setProductError("")
      return
    }
    setPendingLookups((count) => count + 1)
    try {
      const product = (await loadProduct(code)).find((item) => item.code === code)
      if (normalizeCode(getValues(path)) !== code) return
      if (!product?.eligible) {
        setValue(`lines.${index}.description`, "")
        setProductError(product ? `El producto ${code} no está disponible para esta compra.` : `El producto ${code} no existe.`)
        return
      }
      selectProduct(index, product)
    } catch (error) {
      setProductError(getApiErrorMessage(error))
    } finally {
      setPendingLookups((count) => count - 1)
    }
  }

  async function changeUnit(index: number) {
    const line = getValues(`lines.${index}`)
    const previous = committedUnits.current[index]
    const next = normalizeCode(line.unit)
    const code = normalizeCode(line.productCode)
    if (!code || previous === next) return
    setPendingLookups((count) => count + 1)
    try {
      const product = (await loadProduct(code)).find((item) => item.code === code)
      const currentLine = getValues(`lines.${index}`)
      if (normalizeCode(currentLine.productCode) !== code || normalizeCode(currentLine.unit) !== next) return
      const newFactor = product?.units.find((option) => option.code === next)?.factor ??
        (supplierUnits && /^\d{3}$/.test(next) ? Number(next) || 1 : undefined)
      if (!newFactor) {
        setProductError(`La unidad ${next} no corresponde al producto ${code}.`)
        return
      }
      const oldFactor = committedFactors.current[index] ?? 1
      setValue(`lines.${index}.price`, Number((currentLine.price / oldFactor * newFactor).toFixed(5)), { shouldDirty: true })
      setValue(`lines.${index}.unit`, next, { shouldDirty: true })
      committedUnits.current[index] = next
      committedFactors.current[index] = newFactor
      setProductError("")
    } catch (error) {
      setProductError(getApiErrorMessage(error))
    } finally {
      setPendingLookups((count) => count - 1)
    }
  }

  const moveNext = () => {
    if (selected + 1 < fields.length) setSelected(selected + 1)
    else if (current?.productCode.trim() && (!creation?.maxLines || fields.length < creation.maxLines)) {
      append(blankLine, { shouldFocus: false })
      setSelected(fields.length)
      if (isCreation) requestAnimationFrame(() => setFocus(`lines.${fields.length}.productCode`))
    }
  }
  const disabled = saving || confirmation !== null
  const errorText = error || productError ||
    (formState.errors.lines ? "Revisa los valores de la partida." : "")
  const confirm = (removeZero: boolean) => {
    if (!confirmation) return
    onSubmit(confirmation, removeZero)
    setConfirmation(null)
  }

  return (
    <>
      <ErpDataDialog defaultWidth={isCreation ? 875 : 682} description={description} title={title}
        onOpenChange={(open) => { if (!open && !disabled) onClose() }}>
        <ErpDataDialogBody>
          <form className={`grid gap-1.5 ${isCreation ? "min-w-[50rem]" : "min-w-[38rem]"}`}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !disabled) { event.preventDefault(); event.stopPropagation(); onClose() }
            }}
            onSubmit={(event) => { void handleSubmit(({ lines: draft }) => {
              if (disabled || !canCapture || pendingLookups || productError) return
              const submitted = draft.map(({ id: lineId, productCode, quantity, unit, discount, price, branch, pieces }) =>
                ({ id: lineId, productCode: normalizeCode(productCode), quantity, unit, discount, price, branch, pieces }))
              if (isCreation) {
                if (submitted.some((line, index) => line.productCode && line.productCode !== verifiedCodes.current[index])) {
                  setProductError("Verifica el código de cada partida antes de guardar.")
                  return
                }
                onSubmit(submitted, false)
              } else setConfirmation(submitted)
            })(event) }}>
            {creation?.header(lines.some((line) => !!line.productCode.trim()))}
            <fieldset className="grid grid-cols-[1.6fr_1fr_2.5rem_1fr_1fr_.8fr_1.2fr] gap-x-1.5 gap-y-1" disabled={disabled || !canCapture}>
              <Field label="Producto">
                <div className="flex gap-0.5">
                  <Input {...productInput} aria-label="Producto" className={`${fieldClass} uppercase`} maxLength={13}
                    onBlur={(event) => { void productInput.onBlur(event); void validateProduct(selected) }}
                    onChange={(event) => { void productInput.onChange(event); setProductError("") }} />
                  <Button aria-label="Buscar producto" className="h-5 px-1" size="xs" type="button" variant="outline"
                    onClick={() => openProductWindow(`${windowId}:products`, selected)}>…</Button>
                </div>
              </Field>
              <Field label={isCreation ? "Cantidad" : "Pedido"}><Input {...register(`lines.${selected}.quantity`, numberField)} className={fieldClass} type="number" step="0.001" /></Field>
              <Field label="U.M."><Input {...unitInput} className={`${fieldClass} uppercase`} maxLength={3}
                onBlur={(event) => { void unitInput.onBlur(event); void changeUnit(selected) }} /></Field>
              <Field label="Descuento"><Input {...register(`lines.${selected}.discount`, numberField)} className={fieldClass} readOnly={priceLocked} type="number" step="0.01" /></Field>
              <Field label="Precio"><Input {...register(`lines.${selected}.price`, numberField)} className={fieldClass} readOnly={priceLocked} type="number" step="0.00001" /></Field>
              <Field label="Sucursal"><Input {...register(`lines.${selected}.branch`, numberField)} className={fieldClass} type="number" step="1" /></Field>
              <Field label="Pzas."><Input {...register(`lines.${selected}.pieces`)} className={fieldClass} maxLength={1000}
                readOnly={!isCreation && current?.id == null} title={!isCreation && current?.id == null ? "Disponible en partidas guardadas" : undefined}
                onKeyDown={(event) => {
                  if (!isCreation && event.key === "Tab" && !event.shiftKey && (selected + 1 < fields.length || current?.productCode.trim())) {
                    event.preventDefault()
                    moveNext()
                  }
                }} /></Field>
              <label className="col-span-5 flex items-center gap-2"><span>Descripción</span>
                <Input className={`${fieldClass} bg-muted`} readOnly value={current?.description ?? ""} />
              </label>
            </fieldset>
            {errorText && <Alert variant="destructive"><AlertDescription>{errorText}</AlertDescription></Alert>}
            <ErpDataTableViewport className="h-[17rem]">
              <Table className="min-w-[37rem] text-[9px]" aria-label="Partidas de la orden">
                <TableBody>
                  {fields.map(({ key }, index) => {
                    const line = lines[index] ?? blankLine
                    return (
                      <TableRow data-state={selected === index ? "selected" : undefined} key={key}
                        onClick={() => { if (!disabled) setSelected(index) }}>
                        <TableCell className="p-0">
                          <Button aria-pressed={selected === index} className="w-full justify-start px-1 font-mono" disabled={disabled}
                            onClick={() => setSelected(index)} size="xs" type="button" variant="ghost">{line.productCode || "Nueva partida"}</Button>
                        </TableCell>
                        <TableCell className="max-w-52 truncate px-1">{line.description}</TableCell>
                        <TableCell className="px-1 text-right">{quantityFormat.format(line.quantity)}</TableCell>
                        <TableCell className="px-1">{line.unit}</TableCell>
                        <TableCell className="px-1 text-right">{discountFormat.format(line.discount)}</TableCell>
                        <TableCell className="px-1 text-right">{priceFormat.format(line.price)}</TableCell>
                        <TableCell className="px-1 text-right">{line.branch}</TableCell>
                        <TableCell className="max-w-16 truncate px-1">{line.pieces}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ErpDataTableViewport>
            {creation?.footer(lines)}
            <footer className="flex items-center justify-center gap-1">
              {isCreation && <Button disabled={disabled || !canCapture || !current?.productCode.trim() || (!!creation?.maxLines && fields.length >= creation.maxLines && selected + 1 >= fields.length)}
                onClick={moveNext} size="sm" type="button" variant="outline">Siguiente partida</Button>}
              <Button disabled={disabled || !canCapture || pendingLookups > 0 || !!productError || (isCreation && !lines.some((line) => line.productCode.trim() && line.quantity > 0))} size="sm" type="submit">
                {saving && <Spinner />}OK
              </Button>
              <Button disabled={disabled} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
            </footer>
          </form>
        </ErpDataDialogBody>
      </ErpDataDialog>
      {confirmation && (
        <DesktopWindowIdentity id={`${windowId}:zero`}>
          <ErpDataDialog defaultWidth={350} description={description} title="¿Borrar los productos con cantidad en cero?"
            onOpenChange={(open) => !open && setConfirmation(null)}>
            <ErpDataDialogBody className="flex justify-end gap-1">
              <Button autoFocus onClick={() => confirm(false)} size="sm" variant="outline">No</Button>
              <Button onClick={() => confirm(true)} size="sm">Sí</Button>
            </ErpDataDialogBody>
          </ErpDataDialog>
        </DesktopWindowIdentity>
      )}
      {productWindows.map(({ id: productWindowId, payload: index }) => (
        <DesktopWindowIdentity id={productWindowId} key={productWindowId}>
          <ProductPicker lookup={lookup} initial={getValues(`lines.${index}.productCode`)}
            onClose={() => closeProductWindow(productWindowId)}
            onSelect={(product) => {
              selectProduct(index, product)
              closeProductWindow(productWindowId)
              setSelected(index)
              setFocus(`lines.${index}.quantity`, { shouldSelect: true })
            }} />
        </DesktopWindowIdentity>
      ))}
    </>
  )
}
