import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import type { Order } from "@/features/sales/orders/model"
import { captureHeaderSchema, captureLineSchema, captureTotals, type CaptureCustomer, type CaptureCustomerMatch, type CaptureDraftLine, type CaptureHeader, type CaptureLine, type CaptureProduct } from "@/features/sales/orders/capture-model"
import { captureCustomerMatchesQuery, captureCustomerQuery, captureOptionsQuery, captureProductQuery } from "@/features/sales/orders/capture-logic"
import { orderKeys } from "@/features/sales/orders/logic"
import { saveCapturedOrder } from "@/features/sales/orders/services/order-capture-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/ui/alert-dialog"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

const inputClass = "h-5 min-w-0 rounded-none px-1 py-0 text-[10px]"
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` }
const money = (value: number) => value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const lineColumns = [
  ["Código", "11%"], ["Descripción", "32%"], ["Cantidad", "8%"],
  ["UM", "5%"], ["Precio", "8%"], ["Dto", "5%"],
  ["Importe", "9%"], ["Sucursal", "8%"], ["Pzas.", "10%"],
] as const

export function OrderCaptureDialog({ onOpenChange, onSaved }: { onOpenChange: (open: boolean) => void; onSaved: (order: Order) => void }) {
  const queryClient = useQueryClient()
  const options = useQuery(captureOptionsQuery())
  const [stage, setStage] = useState<"warehouse" | "capture" | "comments" | "continue">("warehouse")
  const [customer, setCustomer] = useState<CaptureCustomer | null>(null)
  const [customerMatches, setCustomerMatches] = useState<CaptureCustomerMatch[]>([])
  const [product, setProduct] = useState<CaptureProduct | null>(null)
  const [lines, setLines] = useState<CaptureDraftLine[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<Order | null>(null)
  const [discard, setDiscard] = useState(false)
  const [priceWarning, setPriceWarning] = useState(false)
  const lookupVersion = useRef(0)
  const saving = useRef(false)
  const form = useForm<CaptureHeader>({ resolver: zodResolver(captureHeaderSchema), defaultValues: {
    warehouse: "", typeCode: "P", customerCode: "", customerOrderNumber: "", orderedAt: localDate(), from: localDate(), dueAt: localDate(),
    department: "", initial: false, agentCode: "", termsDays: 0, store: "", observations: "",
  } })
  const lineForm = useForm<CaptureLine>({ resolver: zodResolver(captureLineSchema), defaultValues: { productCode: "", quantity: 0, price: 0, discount: 0 } })
  const totals = captureTotals(lines)
  const draft = useWatch({ control: lineForm.control })
  const headerDirty = form.formState.isDirty
  const lineDirty = lineForm.formState.isDirty
  useEffect(() => {
    if (product && !loading) lineForm.setFocus("quantity")
  }, [product, loading, lineForm])
  const mutation = useMutation({ mutationFn: saveCapturedOrder, retry: false, onSuccess: async order => {
    setSaved(order); setStage("continue")
    await queryClient.invalidateQueries({ queryKey: orderKeys.all })
    await queryClient.invalidateQueries({ queryKey: ["inventories", "products"] })
    await queryClient.invalidateQueries({ queryKey: ["accounts-receivable", "clients"] })
  } })
  const close = () => {
    if (saving.current) return
    if (saved) { onSaved(saved); return }
    if (lines.length || headerDirty || lineDirty) { setDiscard(true); return }
    onOpenChange(false)
  }
  const applyCustomer = (value: CaptureCustomer) => {
    setCustomer(value); form.setValue("customerCode", value.code); form.setValue("agentCode", value.agentCode)
    form.setValue("termsDays", value.termsDays); form.setValue("store", value.store); setCustomerMatches([])
  }
  const loadCustomer = async (selectedCode?: string) => {
    const code = selectedCode ?? form.getValues("customerCode").trim()
    if (!code || customer?.code === code) return
    const version = ++lookupVersion.current
    setCustomer(null); setLoading(true); setError("")
    try {
      const value = await queryClient.fetchQuery(captureCustomerQuery(code))
      if (version !== lookupVersion.current || form.getValues("customerCode").trim() !== code) return
      applyCustomer(value)
    } catch (e) {
      if (version !== lookupVersion.current) return
      try {
        const matches = await queryClient.fetchQuery(captureCustomerMatchesQuery(code))
        if (matches.length) { setCustomerMatches(matches); setError("") }
        else setError(getApiErrorMessage(e))
      } catch { setError(getApiErrorMessage(e)) }
    }
    finally { if (version === lookupVersion.current) setLoading(false) }
  }
  const loadProduct = async () => {
    const code = lineForm.getValues("productCode").trim()
    if (!code || product?.code === code) return
    const version = ++lookupVersion.current
    setProduct(null); setLoading(true); setError("")
    try {
      const value = await queryClient.fetchQuery(captureProductQuery(code, form.getValues("warehouse"), "P", form.getValues("customerCode")))
      if (version !== lookupVersion.current || lineForm.getValues("productCode").trim() !== code) return
      setProduct(value); lineForm.setValue("price", value.price); lineForm.setValue("discount", 0)
    } catch (e) { if (version === lookupVersion.current) setError(getApiErrorMessage(e)) }
    finally { if (version === lookupVersion.current) setLoading(false) }
  }
  const addLine = lineForm.handleSubmit(value => {
    if (!product || product.code !== value.productCode.trim()) { setError("Carga el producto antes de agregar la partida."); return }
    if (value.price < product.cost) { setPriceWarning(true); return }
    setLines(current => [...current, { ...value, product }]); setProduct(null); setError("")
    lineForm.reset({ productCode: "", quantity: 0, price: 0, discount: 0 }); lineForm.setFocus("productCode")
  })
  const openComments = form.handleSubmit(() => {
    if (!customer || customer.code !== form.getValues("customerCode").trim()) { setError("Carga un cliente válido."); return }
    if (!lines.length) { setError("Agrega al menos una partida."); return }
    if (lineForm.getValues("productCode")) { setError("Agrega la partida pendiente antes de continuar."); return }
    setError(""); setStage("comments")
  })
  const save = () => form.handleSubmit(async values => {
    if (saving.current) return
    saving.current = true; setError("")
    try { await mutation.mutateAsync({ ...values, documentKind: "quote", lines: lines.map(({productCode, quantity, price, discount}) => ({productCode, quantity, price, discount})) }) }
    catch (e) { setError(getApiErrorMessage(e)) }
    finally { saving.current = false }
  })()
  const errors = [...Object.values(form.formState.errors), ...Object.values(lineForm.formState.errors)].flatMap(e => e.message ? [e.message] : [])
  return <ErpDataDialog defaultHeight={567} defaultWidth={1025} fillHeight title={stage === "comments" ? "Comentarios del pedido" : "Captura de pedido"} description="Alta de pedido" tone="sales" onOpenChange={open => { if (!open) close() }}>
    <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-1 text-[10px]">
        {(error || errors.length > 0 || options.isError) && <Alert variant="destructive"><AlertDescription>{error || errors.join(" · ") || getApiErrorMessage(options.error)}</AlertDescription>{options.isError && <Button size="sm" onClick={() => void options.refetch()}>Reintentar</Button>}</Alert>}
        {discard ? <div className="grid gap-2"><p>¿Descartar la captura sin guardar?</p><div className="flex gap-2"><Button size="sm" onClick={() => onOpenChange(false)}>Sí, descartar</Button><Button size="sm" variant="outline" onClick={() => setDiscard(false)}>Continuar captura</Button></div></div> : stage === "warehouse" ? <>
          <h3 className="font-semibold">Almacén</h3>
          {options.isPending ? <Spinner /> : <div className="max-h-72 overflow-auto border"><table className="w-full text-left"><thead><tr><th>Almacén</th><th>Descripción</th></tr></thead><tbody>{options.data?.warehouses.map(w => <tr key={w.code} className="border-t hover:bg-muted"><td colSpan={2}><button className="grid w-full grid-cols-[5rem_1fr] p-2 text-left" onClick={() => { form.setValue("warehouse", w.code); setStage("capture") }}><span>{w.code}</span><span>{w.description}</span></button></td></tr>)}</tbody></table>{options.data?.warehouses.length === 0 && <p className="p-2">No hay almacenes disponibles.</p>}</div>}
          <Button size="sm" variant="outline" onClick={close}>Cancelar</Button>
        </> : stage === "continue" ? <>
          <p className="font-semibold">{saved?.number} guardado · Cotización · {money(saved?.totals.total ?? 0)} PESOS</p>
          <p>¿Continuo?</p><div className="flex gap-2"><Button size="sm" onClick={() => {
            setSaved(null); setCustomer(null); setProduct(null); setLines([]); form.reset(); lineForm.reset(); setStage("warehouse"); mutation.reset()
          }}>Sí</Button><Button size="sm" variant="outline" onClick={() => { if (saved) onSaved(saved) }}>No</Button></div>
        </> : <>
          <fieldset disabled={mutation.isPending || loading} className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
            {stage === "capture" ? <>
              <strong className="ml-2 w-[6.5rem] bg-module-sales py-1 text-center text-[11px] text-white">Pedido</strong>
              <div className="-mt-3 ml-[7.25rem] mr-2 grid grid-cols-[4rem_3.5rem_18rem_4.4375rem_6.5rem_4.3125rem_5.3125rem_6.625rem] items-center gap-x-1 gap-y-0.5">
                <span className="text-right">Tipo</span><Input aria-label="Tipo" className={inputClass} value="P" readOnly /><Input aria-label="Descripción" className={inputClass} value={options.data?.types[0]?.description ?? ""} readOnly />
                <span className="text-right">Número</span><Input aria-label="Número" className={inputClass} value={options.data?.types[0]?.nextNumber ?? ""} readOnly title="El folio definitivo se asigna al guardar" />
                <span className="text-right">Fecha</span><Input aria-label="Fecha" className={inputClass} type="date" {...form.register("orderedAt")} />
                <label className="flex items-center justify-center gap-1"><input type="checkbox" {...form.register("initial")} />Inicial</label>

                <span className="text-right">Cliente</span><Input aria-label="Cliente" className={inputClass} maxLength={6} {...form.register("customerCode", { onChange: () => { setCustomer(null); setProduct(null) } })} onBlur={e => { void form.register("customerCode").onBlur(e); void loadCustomer() }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void loadCustomer() } }} disabled={lines.length > 0} /><Input aria-label="Nombre" className={inputClass} value={customer?.name ?? ""} readOnly />
                <span className="text-right">Desde</span><Input aria-label="Desde" className={inputClass} type="date" {...form.register("from")} />
                <span className="text-right">Vence</span><Input aria-label="Vence" className={inputClass} type="date" {...form.register("dueAt")} />
                <span className="text-center">Puntos Cli</span>

                <span className="text-right">Agente</span><select aria-label="Agente" className="h-5 min-w-0 rounded-none border bg-background px-0.5 text-[10px]" {...form.register("agentCode")} title={customer?.agentName}><option value="">—</option>{options.data?.agents.map(agent => <option key={agent.code} value={agent.code}>{agent.displayCode} — {agent.name}</option>)}</select><div className="flex items-center gap-1"><Input aria-label="Porcentaje del agente" className={`${inputClass} w-12 text-right`} value="0.00" readOnly /><span>%</span></div>
                <span className="text-right">Pedido del cliente</span><Input aria-label="Pedido del cliente" className={inputClass} maxLength={30} {...form.register("customerOrderNumber")} />
                <span className="text-right">Depto</span><Input aria-label="Depto" className={inputClass} {...form.register("department")} /><Input aria-label="Puntos Cli" className={`${inputClass} text-right`} value="0.00" readOnly />
              </div>
              <fieldset disabled={!customer} className="ml-[7.9375rem] mr-5 grid min-w-0 gap-1 pt-4">
                <div className="overflow-x-auto border border-input bg-background"><table className="w-full min-w-[810px] table-fixed border-collapse"><colgroup>{lineColumns.map(([label,width]) => <col key={label} style={{ width }} />)}</colgroup><thead className="bg-muted"><tr>{lineColumns.map(([label]) => <th className="h-6 border-r border-input px-1 font-normal last:border-r-0" key={label}>{label}</th>)}</tr></thead><tbody><tr>
                  <td><Input aria-label="Código del producto" className={inputClass} {...lineForm.register("productCode", { onChange: () => setProduct(null) })} onBlur={e => { void lineForm.register("productCode").onBlur(e); void loadProduct() }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void loadProduct() } }} /></td>
                  <td><Input aria-label="Descripción del producto" className={inputClass} value={product?.description ?? ""} readOnly tabIndex={-1} /></td>
                  <td><Input aria-label="Cantidad" className={inputClass} type="number" step="0.001" {...lineForm.register("quantity", { valueAsNumber: true })} /></td>
                  <td><Input aria-label="UM" className={inputClass} value={product?.unit ?? ""} readOnly /></td>
                  <td><Input aria-label="Precio" className={inputClass} type="number" step="0.00001" {...lineForm.register("price", { valueAsNumber: true, onBlur: () => { if (product && lineForm.getValues("price") < product.cost) setPriceWarning(true) } })} /></td>
                  <td><Input aria-label="Dto" className={inputClass} type="number" step="0.01" {...lineForm.register("discount", { valueAsNumber: true })} /></td>
                  <td><Input aria-label="Importe" className={inputClass} readOnly value={money((draft.quantity || 0) * (draft.price || 0) * (1 - (draft.discount || 0)/100))} /></td>
                  <td><Input aria-label="Sucursal de la partida" className={inputClass} value="0" readOnly title="Asignación de sucursal pendiente de captura" /></td>
                  <td><Input aria-label="Pzas." className={inputClass} value="" readOnly onKeyDown={e => { if (e.key === "Tab" && !e.shiftKey && product) { e.preventDefault(); void addLine() } }} /></td>
                </tr></tbody></table></div>
                <div className="flex items-center justify-end gap-2"><span>Disp</span><Input aria-label="Disponible" className={`${inputClass} w-16 text-right`} value={money(product?.available ?? 0)} readOnly /><Input aria-label="Asignado" className={`${inputClass} w-16 text-right`} value={money(product?.assigned ?? 0)} readOnly /><Button className="h-5 rounded-none px-2 text-[9px]" variant="outline" disabled={!product} onClick={() => void addLine()}>Agregar partida</Button></div>
              </fieldset>
              <div className="ml-[7.8125rem] mr-1.5 min-h-0 flex-1 overflow-auto border border-input bg-background"><table className="w-full min-w-[810px] table-fixed border-collapse"><colgroup>{lineColumns.map(([label,width]) => <col key={label} style={{ width }} />)}</colgroup><thead><tr className="h-5 bg-muted">{lineColumns.map(([label],i) => <th className="border-r border-input px-1 text-right font-normal last:border-r-0" key={label}>{i === 2 ? totals.quantity.toFixed(3) : i === 4 ? totals.subtotal.toFixed(5) : i === 5 ? totals.discount.toFixed(2) : i === 6 ? totals.total.toFixed(2) : ""}</th>)}</tr></thead><tbody>{lines.map((line,index) => <tr className="h-5 border-t border-input" key={index}><td className="px-1">{line.productCode}</td><td className="truncate px-1" title={line.product.description}>{line.product.description}</td><td className="px-1 text-right">{line.quantity.toFixed(3)}</td><td className="px-1 text-center">{line.product.unit}</td><td className="px-1 text-right">{line.price.toFixed(5)}</td><td className="px-1 text-right">{line.discount.toFixed(2)}</td><td className="px-1 text-right">{money(line.quantity*line.price*(1-line.discount/100))}</td><td className="px-1 text-right">0</td><td className="px-1 text-right"><Button className="h-4 w-4 rounded-none p-0 text-[9px]" variant="ghost" aria-label={`Quitar partida ${index+1}`} onClick={() => setLines(current => current.filter((_,lineIndex) => lineIndex !== index))}>×</Button></td></tr>)}</tbody></table></div>
              <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-7 pb-8 pl-2 pt-4">
                <div className="flex flex-col gap-1"><Button className="h-8 justify-start rounded-none" disabled={!customer || lines.length === 0} onClick={() => void openComments()}>✓&nbsp;&nbsp; OK</Button><Button className="h-8 justify-start rounded-none" variant="outline" onClick={close}>×&nbsp;&nbsp; Cancelar</Button></div>
                <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-5">
                  <div className="grid grid-cols-[4.5rem_1fr] items-center gap-x-1 gap-y-0.5"><span className="text-right">Tot Cant.</span><Input aria-label="Tot Cant." className={`${inputClass} text-right`} value={totals.quantity.toFixed(3)} readOnly /><span className="text-right">Volumen</span><Input aria-label="Volumen" className={`${inputClass} text-right`} value={money(totals.volume)} readOnly /><span className="text-right">Peso</span><Input aria-label="Peso" className={`${inputClass} text-right`} value={money(totals.weight)} readOnly /></div>
                  <div className="grid content-end gap-0.5">
                    <div className="grid grid-cols-[10rem_4.5rem_12rem] items-end gap-2"><label className="grid gap-0.5 text-center">Descuentos<div className="grid grid-cols-3"><Input className={`${inputClass} text-right`} value="0.00" readOnly /><Input className={`${inputClass} text-right`} value="0.00" readOnly /><Input className={`${inputClass} text-right`} value="0.00" readOnly /></div></label><label>Flete<Input aria-label="Flete" className={`${inputClass} text-right`} value="0.00" readOnly /></label><label>Seguros<div className="grid grid-cols-2 gap-1"><Input aria-label="Seguros" className={`${inputClass} text-right`} value="0.00" readOnly /><Input aria-label="Total seguros" className={`${inputClass} text-right`} value="0.00" readOnly /></div></label></div>
                    <div className="grid grid-cols-7 gap-1">{[["Subtotal",money(totals.subtotal)],["Descuento",money(totals.discount)],["IEPS","0.00"],["% IVA",product?.taxPercentage.toFixed(2) ?? "16.00"],["IVA",money(totals.tax)],["Gran Total",money(totals.total)],["A cuenta","0.00"]].map(([label,value]) => <label className="text-right" key={label}>{label}<Input aria-label={label} className={`${inputClass} text-right`} readOnly value={value} /></label>)}</div>
                  </div>
                </div>
              </div>
            </> : <>
              <div className="grid grid-cols-4 gap-1">
                <label className="col-span-3">Pedido cliente<Input className={inputClass} {...form.register("customerOrderNumber")} maxLength={30} /></label><label className="flex items-center gap-1"><input type="checkbox" {...form.register("initial")} />Inicial</label>
                {([["orderedAt","Fecha"],["from","Desde"],["dueAt","Hasta"]] as const).map(([name,label]) => <label key={name}>{label}<Input className={inputClass} type="date" {...form.register(name)} /></label>)}<label>Importe asignado<Input className={inputClass} value="0.00" readOnly /></label>
                {["Descto 1","Descto 2","Descto 3","T.C."].map(label => <label key={label}>{label}<Input className={inputClass} value="0.00" readOnly /></label>)}
                <label>Depto<Input className={inputClass} {...form.register("department")} /></label>{["Cajas","Volumen","Peso","Sucursal","Moneda de cobro"].map(label => <label key={label}>{label}<Input className={inputClass} value="0" readOnly /></label>)}
                <label>Plazo<Input className={inputClass} type="number" {...form.register("termsDays", { valueAsNumber: true })} /></label><label>Comisión<Input className={inputClass} value="0.00" readOnly /></label><label className="col-span-2 flex items-center gap-1"><input type="checkbox" disabled />No acepta entregas parciales</label>
                <label>Tda Vende<Input className={inputClass} {...form.register("store")} maxLength={4} /></label><label>Almacén<Input className={inputClass} value={form.getValues("warehouse")} readOnly /></label><label>Transporte<Input className={inputClass} value="" readOnly /></label>
              </div>
              <fieldset className="grid gap-1"><legend>Comentarios:</legend>{["Pedido Cliente","Entregar en","Contacto"].map(label => <label key={label}>{label}<Input className={inputClass} readOnly value="" title="Este campo aún no tiene una escritura validada" /></label>)}<label>Obs.<Input className={inputClass} maxLength={21} {...form.register("observations")} /></label><textarea className="h-16 resize-none border bg-muted" readOnly aria-label="Comentarios adicionales" value="" /></fieldset>
              <div className="flex justify-between"><span>Total {money(totals.total)} PESOS</span><span>Se guardará como Cotización; Cotiz la convierte en Pedido.</span></div>
              <div className="flex gap-2"><Button size="sm" onClick={() => void save()}>{mutation.isPending && <Spinner />}OK</Button><Button size="sm" variant="outline" onClick={() => setStage("capture")}>Cancelar</Button></div>
            </>}
          </fieldset>
          {loading && <div role="status" className="flex items-center gap-1"><Spinner />Cargando datos…</div>}
        </>}
      </div>
      <AlertDialog open={customerMatches.length > 0} onOpenChange={open => { if (!open) setCustomerMatches([]) }}><AlertDialogContent className="max-w-[64rem]"><AlertDialogHeader><AlertDialogTitle>Encuentra cliente por código o nombre</AlertDialogTitle><AlertDialogDescription>Seleccione una coincidencia para cargar el cliente.</AlertDialogDescription></AlertDialogHeader><div className="max-h-80 overflow-auto border"><table className="min-w-[900px] text-[10px]"><thead className="sticky top-0 bg-muted"><tr>{["Código","Nombre","Sucursal","RFC","EAN","Tel.","Cel.","E-mail"].map(label => <th className="px-2 py-1 text-left" key={label}>{label}</th>)}</tr></thead><tbody>{customerMatches.map(match => <tr className="cursor-pointer border-t hover:bg-muted" key={match.id} onDoubleClick={() => void loadCustomer(match.code)}><td className="px-2 py-1"><button className="font-mono underline" onClick={() => void loadCustomer(match.code)}>{match.code}</button></td><td className="px-2 py-1">{match.name}</td><td className="px-2 py-1">{match.branch}</td><td className="px-2 py-1">{match.taxId}</td><td className="px-2 py-1">{match.ean}</td><td className="px-2 py-1">{match.phone}</td><td className="px-2 py-1">{match.mobile}</td><td className="px-2 py-1">{match.email}</td></tr>)}</tbody></table></div><AlertDialogFooter><AlertDialogAction onClick={() => setCustomerMatches([])}>Cancelar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={priceWarning} onOpenChange={setPriceWarning}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Advertencia</AlertDialogTitle><AlertDialogDescription>No se puede vender abajo del costo</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction onClick={() => { setPriceWarning(false); lineForm.setFocus("price") }}>OK</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </ErpDataDialogBody>
  </ErpDataDialog>
}
