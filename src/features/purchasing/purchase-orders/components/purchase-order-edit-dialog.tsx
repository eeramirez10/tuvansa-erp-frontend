import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { purchaseOrderEditorQueryOptions, purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrderEditLine, PurchaseOrderEditor, PurchaseOrderEditProduct } from "@/features/purchasing/purchase-orders/model"
import { editPurchaseOrder, searchPurchaseOrderEditProducts } from "@/features/purchasing/purchase-orders/services/purchase-order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
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

function ProductPicker({ id, initial, onSelect, onClose }: {
  id: number; initial: string; onSelect: (product: PurchaseOrderEditProduct) => void; onClose: () => void
}) {
  const [query, setQuery] = useState(initial)
  const [submitted, setSubmitted] = useState(initial)
  const products = useQuery({
    queryKey: [...purchaseOrderKeys.editor(id), "products", submitted],
    queryFn: ({ signal }) => searchPurchaseOrderEditProducts(id, submitted, signal),
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

function EditLines({ editor, onClose }: { editor: PurchaseOrderEditor; onClose: () => void }) {
  const { id, number, revision, legacyVersion, priceLocked, supplierUnits } = editor
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(0)
  const [confirmation, setConfirmation] = useState<PurchaseOrderEditLine[] | null>(null)
  const [productError, setProductError] = useState("")
  const [pendingLookups, setPendingLookups] = useState(0)
  const verifiedCodes = useRef(editor.lines.map((line) => normalizeCode(line.productCode)))
  const committedUnits = useRef(editor.lines.map((line) => line.unit))
  const committedFactors = useRef(editor.lines.map((line) => line.factor))
  const { windows: productWindows, openWindow: openProductWindow, closeWindow: closeProductWindow } = useDesktopWindowCollection<number>()
  const { control, getValues, handleSubmit, register, setFocus, setValue, formState } = useForm<Draft>({
    resolver: zodResolver(schema), defaultValues: { lines: editor.lines.length > 0 ? editor.lines : [blankLine] },
  })
  const { fields, append } = useFieldArray({ control, name: "lines", keyName: "key" })
  const lines = useWatch({ control, name: "lines" })
  const current = lines[selected]
  const codeField = `lines.${selected}.productCode` as const
  const unitField = `lines.${selected}.unit` as const
  const productInput = register(codeField)
  const unitInput = register(unitField)

  useEffect(() => { setFocus(codeField, { shouldSelect: true }) }, [codeField, setFocus])

  const save = useMutation({
    mutationFn: (input: { removeZero: boolean; lines: PurchaseOrderEditLine[] }) =>
      editPurchaseOrder(id, { ...input, revision, legacyVersion }),
    onSuccess: async (saved) => {
      const detailKey = purchaseOrderKeys.detail(id)
      await queryClient.cancelQueries({ queryKey: detailKey })
      queryClient.setQueryData(detailKey, saved)
      void queryClient.invalidateQueries({ queryKey: detailKey, predicate: (entry) => entry.queryKey.length > detailKey.length })
      void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
      onClose()
    },
  })

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
    setProductError("")
  }

  function lookup(code: string) {
    return queryClient.fetchQuery({
      queryKey: [...purchaseOrderKeys.editor(id), "products", code],
      queryFn: ({ signal }) => searchPurchaseOrderEditProducts(id, code, signal),
    })
  }

  async function validateProduct(index: number) {
    const path = `lines.${index}.productCode` as const
    const code = normalizeCode(getValues(path))
    if (!code) {
      setValue(`lines.${index}.description`, "")
      setProductError("")
      return
    }
    if (code === verifiedCodes.current[index]) {
      const original = editor.lines[index]
      if (original?.productCode === code) setValue(`lines.${index}.description`, original.description)
      setProductError("")
      return
    }
    setPendingLookups((count) => count + 1)
    try {
      const product = (await lookup(code)).find((item) => item.code === code)
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
      const product = (await lookup(code)).find((item) => item.code === code)
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
    else if (current?.productCode.trim()) {
      append(blankLine, { shouldFocus: false })
      setSelected(fields.length)
    }
  }
  const disabled = save.isPending || confirmation !== null
  const errorText = save.isError ? getApiErrorMessage(save.error) : productError ||
    (formState.errors.lines ? "Revisa los valores de la partida." : "")
  const confirm = (removeZero: boolean) => {
    if (!confirmation) return
    save.mutate({ lines: confirmation, removeZero })
    setConfirmation(null)
  }

  return (
    <>
      <ErpDataDialog defaultWidth={682} description={number} title="Cambio de orden de compra"
        onOpenChange={(open) => { if (!open && !disabled) onClose() }}>
        <ErpDataDialogBody>
          <form className="grid min-w-[38rem] gap-1.5"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !disabled) { event.preventDefault(); event.stopPropagation(); onClose() }
            }}
            onSubmit={handleSubmit(({ lines: draft }) => {
              if (disabled || pendingLookups || productError) return
              setConfirmation(draft.map(({ id: lineId, productCode, quantity, unit, discount, price, branch, pieces }) =>
                ({ id: lineId, productCode, quantity, unit, discount, price, branch, pieces })))
            })}>
            <fieldset className="grid grid-cols-[1.6fr_1fr_2.5rem_1fr_1fr_.8fr_1.2fr] gap-x-1.5 gap-y-1" disabled={disabled}>
              <Field label="Producto">
                <div className="flex gap-0.5">
                  <Input {...productInput} aria-label="Producto" className={`${fieldClass} uppercase`} maxLength={13}
                    onBlur={(event) => { void productInput.onBlur(event); void validateProduct(selected) }}
                    onChange={(event) => { void productInput.onChange(event); setProductError("") }} />
                  <Button aria-label="Buscar producto" className="h-5 px-1" size="xs" type="button" variant="outline"
                    onClick={() => openProductWindow(`purchase-orders:${id}:edit-products`, selected)}>…</Button>
                </div>
              </Field>
              <Field label="Pedido"><Input {...register(`lines.${selected}.quantity`, numberField)} className={fieldClass} type="number" step="0.001" /></Field>
              <Field label="U.M."><Input {...unitInput} className={`${fieldClass} uppercase`} maxLength={3}
                onBlur={(event) => { void unitInput.onBlur(event); void changeUnit(selected) }} /></Field>
              <Field label="Descuento"><Input {...register(`lines.${selected}.discount`, numberField)} className={fieldClass} readOnly={priceLocked} type="number" step="0.01" /></Field>
              <Field label="Precio"><Input {...register(`lines.${selected}.price`, numberField)} className={fieldClass} readOnly={priceLocked} type="number" step="0.00001" /></Field>
              <Field label="Sucursal"><Input {...register(`lines.${selected}.branch`, numberField)} className={fieldClass} type="number" step="1" /></Field>
              <Field label="Pzas."><Input {...register(`lines.${selected}.pieces`)} className={fieldClass} maxLength={1000}
                readOnly={current?.id == null} title={current?.id == null ? "Disponible en partidas guardadas" : undefined}
                onKeyDown={(event) => {
                  if (event.key === "Tab" && !event.shiftKey && (selected + 1 < fields.length || current?.productCode.trim())) {
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
            <footer className="flex items-center justify-center gap-1">
              <Button disabled={disabled || pendingLookups > 0 || !!productError} size="sm" type="submit">
                {save.isPending && <Spinner />}OK
              </Button>
              <Button disabled={disabled} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
            </footer>
          </form>
        </ErpDataDialogBody>
      </ErpDataDialog>
      {confirmation && (
        <DesktopWindowIdentity id={`purchase-orders:${id}:edit-zero`}>
          <ErpDataDialog defaultWidth={350} description={number} title="¿Borrar los productos con cantidad en cero?"
            onOpenChange={(open) => !open && setConfirmation(null)}>
            <ErpDataDialogBody className="flex justify-end gap-1">
              <Button autoFocus onClick={() => confirm(false)} size="sm" variant="outline">No</Button>
              <Button onClick={() => confirm(true)} size="sm">Sí</Button>
            </ErpDataDialogBody>
          </ErpDataDialog>
        </DesktopWindowIdentity>
      )}
      {productWindows.map(({ id: windowId, payload: index }) => (
        <DesktopWindowIdentity id={windowId} key={windowId}>
          <ProductPicker id={id} initial={getValues(`lines.${index}.productCode`)}
            onClose={() => closeProductWindow(windowId)}
            onSelect={(product) => {
              selectProduct(index, product)
              closeProductWindow(windowId)
              setSelected(index)
              setFocus(`lines.${index}.quantity`, { shouldSelect: true })
            }} />
        </DesktopWindowIdentity>
      ))}
    </>
  )
}

export function PurchaseOrderEditDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const query = useQuery(purchaseOrderEditorQueryOptions(id))
  const editor = query.data
  if (editor?.canWrite && (query.isFetchedAfterMount || !query.isFetching)) {
    return <EditLines editor={editor} key={editor.revision} onClose={onClose} />
  }
  return (
    <ErpDataDialog defaultWidth={550} title="Cambio de orden de compra" description={editor?.number ?? "Orden de compra"}
      onOpenChange={(open) => !open && onClose()}>
      <ErpDataDialogBody className="grid gap-1">
        {query.isError ? <Alert variant="destructive"><AlertTitle>No fue posible abrir la orden</AlertTitle>
          <AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>
          : query.isFetching ? <div className="grid min-h-32 place-items-center"><Spinner /></div>
            : <Alert><AlertDescription>{editor?.reason}</AlertDescription></Alert>}
        <div className="flex justify-end"><Button onClick={onClose} size="sm" variant="outline">Cerrar</Button></div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
