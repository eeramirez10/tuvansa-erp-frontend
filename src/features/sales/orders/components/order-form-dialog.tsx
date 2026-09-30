import { normalizeOrderWarehouse } from "@/features/sales/orders/order-warehouse"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { z } from "zod"

import { captureProductQuery } from "@/features/sales/orders/capture-logic"
import { captureMinimumPrice, convertCaptureAmount, type CaptureProduct, type CaptureProductMatch } from "@/features/sales/orders/capture-model"
import type { Order } from "@/features/sales/orders/model"
import { updateOrder } from "@/features/sales/orders/services/order-service"
import { getApiErrorMessage, isApiNotFound } from "@/shared/api/api-error"
import { notifications } from "@/shared/notifications/notifications"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

const lineSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().positive("La cantidad debe ser mayor que cero"),
  price: z.number().nonnegative("El precio no puede ser negativo"),
  discount: z.number().min(0).max(100),
})

type EditableLine = z.infer<typeof lineSchema> & {
  productCode: string
  description: string
  unit: string
  fulfilled: number
  branch: number
  piecesAssignment: string
}

const emptyLine = (): EditableLine => ({
  productId: 0, productCode: "", description: "", unit: "", quantity: 0,
  fulfilled: 0, price: 0, branch: 0, discount: 0, piecesAssignment: "",
})
const inputClass = "h-5 min-w-0 rounded-none px-1 py-0 text-[10px]"

export function OrderFormDialog({ order, onProductSearch, onOpenChange, onSaved }: {
  order: Order
  onProductSearch: (initialCode: string, warehouse: string, onSelect: (match: CaptureProductMatch) => void) => void
  onOpenChange: (open: boolean) => void
  onSaved: (order: Order) => void
}) {
  const queryClient = useQueryClient()
  const documentCurrencyId = order.currencyId === 1 ? 2 : 1
  const exchangeRate = order.exchangeRate > 0 ? order.exchangeRate : 1
  const [lines, setLines] = useState<EditableLine[]>(() => order.lines.map(line => ({
    productId: line.productId, productCode: line.productCode, description: line.description,
    unit: line.unit, quantity: line.ordered, fulfilled: line.fulfilled, price: line.price,
    branch: line.branch, discount: line.discount, piecesAssignment: line.piecesAssignment,
  })))
  const [draft, setDraft] = useState<EditableLine>(emptyLine)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [loadedProduct, setLoadedProduct] = useState<CaptureProduct | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const lookupVersion = useRef(0)
  const codeRef = useRef<HTMLInputElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const discountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => codeRef.current?.focus())
    return () => { lookupVersion.current += 1 }
  }, [])

  const mutation = useMutation({
    mutationFn: (nextLines: EditableLine[]) => updateOrder(order.id, {
      lines: nextLines.map(line => ({
        productId: line.productId, quantity: line.quantity, price: line.price, discount: line.discount,
      })),
    }),
    onSuccess: onSaved,
  })

  const applyProduct = (product: CaptureProduct) => {
    const convertedPrice = convertCaptureAmount(product.price, product.currencyId, documentCurrencyId, exchangeRate)
    setLoadedProduct(product)
    setDraft(current => ({
      ...current, productId: product.id, productCode: product.code, description: product.description,
      unit: product.unit, price: convertedPrice, branch: 0,
    }))
    requestAnimationFrame(() => quantityRef.current?.focus())
  }

  const loadProduct = async (selectedCode?: string) => {
    const code = (selectedCode ?? draft.productCode).trim()
    if (!code) {
      if (editingIndex !== null) { quantityRef.current?.focus(); return }
      setError("Captura el código o IEAN del producto."); codeRef.current?.focus(); return
    }
    if (!selectedCode && draft.productId) { quantityRef.current?.focus(); return }
    const version = ++lookupVersion.current
    setLoading(true); setError("")
    try {
      const product = await queryClient.fetchQuery(captureProductQuery(code, normalizeOrderWarehouse(order.warehouse), "P", order.customer.code))
      if (version !== lookupVersion.current) return
      applyProduct(product)
    } catch (cause) {
      if (version !== lookupVersion.current) return
      if (isApiNotFound(cause)) {
        onProductSearch(code, normalizeOrderWarehouse(order.warehouse), match => { void loadProduct(match.code) })
      } else setError(getApiErrorMessage(cause))
    } finally {
      if (version === lookupVersion.current) setLoading(false)
    }
  }

  const clearDraft = () => {
    lookupVersion.current += 1
    setLoading(false)
    setDraft(emptyLine()); setEditingIndex(null); setLoadedProduct(null); setError("")
    requestAnimationFrame(() => codeRef.current?.focus())
  }

  const saveDraft = () => {
    if (mutation.isPending || loading) return
    if (!draft.productCode.trim()) {
      if (editingIndex !== null) setLines(current => current.filter((_, index) => index !== editingIndex))
      clearDraft()
      return
    }
    const parsed = lineSchema.safeParse(draft)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revisa la partida."); return }
    if (loadedProduct && draft.price < captureMinimumPrice(loadedProduct, documentCurrencyId, exchangeRate)) {
      notifications.warning("Precio debajo del costo", { description: "No se puede vender abajo del costo", id: "order-edit-price-below-cost" })
      priceRef.current?.focus(); return
    }
    setLines(current => editingIndex === null
      ? [...current, draft]
      : current.map((line, index) => index === editingIndex ? draft : line))
    clearDraft()
  }

  const editLine = (index: number) => {
    const line = lines[index]
    if (!line) return
    lookupVersion.current += 1; setLoading(false)
    setDraft({...line}); setEditingIndex(index); setLoadedProduct(null); setError("")
    requestAnimationFrame(() => { codeRef.current?.focus(); codeRef.current?.select() })
  }

  const removeLine = (index: number) => {
    setLines(current => current.filter((_, lineIndex) => lineIndex !== index))
    if (editingIndex === index) clearDraft()
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1)
  }

  const save = () => {
    if (draft.productCode.trim() || editingIndex !== null) { setError("Agrega o actualiza la partida pendiente antes de guardar."); codeRef.current?.focus(); return }
    const parsed = z.array(lineSchema).min(1, "El pedido debe conservar al menos una partida.").safeParse(lines)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revisa las partidas."); return }
    setError(""); mutation.mutate(lines)
  }

  const moveOnEnter = (event: KeyboardEvent<HTMLInputElement>, next: () => void) => {
    if (event.key !== "Enter") return
    event.preventDefault(); event.stopPropagation(); next()
  }

  const finishOnTab = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || event.shiftKey) return
    event.preventDefault(); event.stopPropagation()
    saveDraft()
  }

  const changeProductCode = (code: string) => {
    lookupVersion.current += 1
    setLoading(false); setLoadedProduct(null); setError("")
    setDraft(current => code.trim()
      ? {...current,productCode:code,productId:0,description:"",unit:""}
      : {...emptyLine(),productCode:code})
  }

  return <ErpDataDialog defaultHeight={560} defaultWidth={1000} fillHeight title="Cambio de pedido" description={`Detalle editable del pedido ${order.number}`} tone="sales" onOpenChange={onOpenChange}>
    <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2 text-[10px]">
      {(error || mutation.isError) && <Alert variant="destructive"><AlertDescription>{error || getApiErrorMessage(mutation.error)}</AlertDescription></Alert>}
      <div className="grid grid-cols-[8rem_minmax(14rem,1fr)_6rem_4rem_7rem_5rem_5rem_6rem_4rem] border border-input bg-background">
        {["Código / IEAN","Descripción","Pedido","UM","Precio","Sucursal","Dto","Pzas.",""].map(label => <div className="border-b border-r border-input bg-muted px-1 py-1 text-center last:border-r-0" key={label}>{label}</div>)}
        <Input ref={codeRef} aria-label="Código o IEAN del producto" className={inputClass} disabled={mutation.isPending || loading} value={draft.productCode} onChange={event => changeProductCode(event.target.value)} onBlur={() => { if (draft.productCode && !draft.productId) void loadProduct() }} onKeyDown={event => moveOnEnter(event, () => void loadProduct())} />
        <Input aria-label="Descripción del producto" className={inputClass} readOnly value={draft.description} />
        <Input ref={quantityRef} aria-label="Cantidad" className={`${inputClass} text-right`} disabled={mutation.isPending || loading} min="0.001" step="0.001" type="number" value={draft.quantity || ""} onChange={event => setDraft(current => ({...current,quantity:event.target.valueAsNumber}))} onKeyDown={event => moveOnEnter(event, () => priceRef.current?.focus())} />
        <Input aria-label="Unidad" className={inputClass} readOnly value={draft.unit} />
        <Input ref={priceRef} aria-label="Precio" className={`${inputClass} text-right`} disabled={mutation.isPending || loading} min="0" step="0.00001" type="number" value={Number.isFinite(draft.price) ? draft.price : ""} onChange={event => setDraft(current => ({...current,price:event.target.valueAsNumber}))} onKeyDown={event => moveOnEnter(event, () => discountRef.current?.focus())} />
        <Input aria-label="Sucursal" className={`${inputClass} text-right`} readOnly value={draft.branch} />
        <Input ref={discountRef} aria-label="Descuento" className={`${inputClass} text-right`} disabled={mutation.isPending || loading} min="0" max="100" step="0.01" type="number" value={Number.isFinite(draft.discount) ? draft.discount : ""} onChange={event => setDraft(current => ({...current,discount:event.target.valueAsNumber}))} onKeyDown={event => moveOnEnter(event, saveDraft)} />
        <Input aria-label="Piezas" className={inputClass} readOnly value={draft.piecesAssignment} onKeyDown={finishOnTab} />
        <Button className="h-5 rounded-none px-1 text-[9px]" disabled={mutation.isPending || loading} onClick={saveDraft} onKeyDown={finishOnTab} size="sm" type="button">{editingIndex === null ? "Agregar" : "Actualizar"}</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border border-input bg-background"><table className="w-full min-w-[900px] table-fixed"><thead className="sticky top-0 bg-muted"><tr>{["Código","Descripción","Pedido","UM","Surtido","Precio","Sucursal","Dto","Fecha","Pzas.",""].map(label => <th className="px-2 py-1 text-left font-normal" key={label}>{label}</th>)}</tr></thead><tbody>{lines.map((line,index) =>
        <tr aria-selected={editingIndex === index} className={`cursor-pointer border-t ${editingIndex === index ? "bg-module-sales/15" : "hover:bg-muted/60"}`} key={`${line.productId}-${index}`} onClick={() => editLine(index)} onKeyDown={event => { if (event.target === event.currentTarget && event.key === "Enter") { event.preventDefault(); event.stopPropagation(); editLine(index) } }} tabIndex={0}>
          <td className="px-2 py-1 font-mono">{line.productCode}</td><td className="truncate px-2 py-1" title={line.description}>{line.description}</td><td className="px-2 py-1 text-right">{line.quantity.toFixed(3)}</td><td className="px-2 py-1">{line.unit}</td><td className="px-2 py-1 text-right">{line.fulfilled.toFixed(3)}</td><td className="px-2 py-1 text-right">{line.price.toFixed(5)}</td><td className="px-2 py-1 text-right">{line.branch}</td><td className="px-2 py-1 text-right">{line.discount.toFixed(2)}</td><td className="px-2 py-1">31/12/1900</td><td className="px-2 py-1">{line.piecesAssignment}</td><td className="px-1 py-0.5"><Button aria-label={`Eliminar partida ${index + 1}`} className="h-5 rounded-none px-2 text-[9px]" disabled={mutation.isPending} onClick={event => { event.stopPropagation(); removeLine(index) }} size="sm" type="button" variant="destructive">Eliminar</Button></td>
        </tr>)}</tbody></table></div>

      <div className="flex items-center justify-between"><span>{lines.length} partida{lines.length === 1 ? "" : "s"}</span><footer className="flex gap-2"><Button disabled={mutation.isPending || loading} onClick={save} size="sm" type="button">{mutation.isPending && <Spinner />}OK</Button><Button disabled={mutation.isPending} onClick={() => onOpenChange(false)} size="sm" type="button" variant="outline">Cancelar</Button></footer></div>
    </ErpDataDialogBody>
  </ErpDataDialog>
}
