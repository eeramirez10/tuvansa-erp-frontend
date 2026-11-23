import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { purchaseOrderKeys } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import {
  getPurchaseOrderPieceEditor,
  importPurchaseOrderPieces,
  updatePurchaseOrderPieces,
  type PurchaseOrderPieceImport,
  type PurchaseOrderPieceImportEntry,
  type PurchaseOrderPieceUpdate,
} from "@/features/purchasing/purchase-orders/services/purchase-order-piece-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const quantityFormat = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const serialLength = 30
const isScaledQuantity = (value: number) => {
  const scaled = value * 1000
  const nearest = Math.round(scaled)
  return Number.isSafeInteger(nearest) && Math.abs(scaled - nearest) <= Math.max(1, Math.abs(scaled)) * Number.EPSILON * 4
}

const formSchema = z.object({
  entries: z.array(z.object({
    pieceId: z.number().int().positive().nullable(),
    productCode: z.string().min(1),
    serial: z.string().max(serialLength),
    quantity: z.number().refine(isScaledQuantity),
  })),
})

type PieceDraftForm = z.infer<typeof formSchema>
type Revision = Pick<PurchaseOrderPieceUpdate, "revision" | "legacyVersion">
type Draft = Revision & (
  | { kind: "change"; productCode: string }
  | { kind: "import" }
)
type Save = { kind: "change"; payload: PurchaseOrderPieceUpdate } | { kind: "import"; payload: PurchaseOrderPieceImport }

function readPieceRows(content: string, productCodes: readonly string[]): PurchaseOrderPieceImportEntry[] {
  const canonicalCodes = new Map(productCodes.map((code) => [code.toUpperCase(), code]))
  const lines = content.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/).entries()
  const entries: PurchaseOrderPieceImportEntry[] = []
  let firstRow = true
  for (const [index, line] of lines) {
    if (!line.trim()) continue
    const columns = line.split("\t").map((part) => part.trim())
    const [code = "", amount = "", serial = ""] = columns
    const header = firstRow && /^c[oó]digo$/i.test(code) && /^cantidad$/i.test(amount)
    firstRow = false
    if (header) continue
    if (columns.length < 2 || columns.length > 3) {
      throw new Error(`Fila ${index + 1}. Se esperaba Código, Cantidad y Serie separados por tabuladores.`)
    }
    const productCode = canonicalCodes.get(code.toUpperCase())
    if (!productCode) {
      throw new Error(`Fila ${index + 1}. El producto ${code || "(vacío)"} no pertenece a la orden.`)
    }
    const quantity = Number(amount)
    if (!/^\d+(?:\.\d{1,3})?$/.test(amount) || quantity <= 0 || !isScaledQuantity(quantity)) {
      throw new Error(`Fila ${index + 1}. Captura una cantidad positiva de hasta tres decimales.`)
    }
    if (serial.length > serialLength) throw new Error(`Fila ${index + 1}. La serie admite hasta ${serialLength} caracteres.`)
    entries.push({ productCode, serial, quantity })
  }
  if (!entries.length) throw new Error("El archivo está vacío.")
  return entries
}

export function PurchaseOrderPieceEditorDialog({ purchaseOrder, onClose }: {
  purchaseOrder: PurchaseOrder
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { id, number } = purchaseOrder
  const productId = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const importRun = useRef(0)
  const [selectedCode, setSelectedCode] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState("")
  const panelKey = purchaseOrderKeys.panel(id, "pieces")
  const editorKey = [...panelKey, "editor"]
  const query = useQuery({
    queryKey: editorKey,
    queryFn: ({ signal }) => getPurchaseOrderPieceEditor(id, signal),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
  const editor = query.data
  const products = editor?.products ?? []
  const isImportDraft = draft?.kind === "import"
  const activeCode = draft?.kind === "change" ? draft.productCode : selectedCode
  const product = products.find(({ productCode }) => productCode === activeCode) ?? products[0]
  const entries = (editor?.items ?? []).filter(({ productCode }) => productCode === product?.productCode)
  const { control, register, reset, handleSubmit, formState: { errors } } = useForm<PieceDraftForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { entries: [] },
  })
  const { fields, append } = useFieldArray({ control, name: "entries" })
  const draftRows = useWatch({ control, name: "entries" })
  const total = (draft ? draftRows : entries).reduce((sum, row) => sum + (Number.isFinite(row.quantity) ? row.quantity : 0), 0)

  function cancelDraft() {
    importRun.current += 1
    setImporting(false)
    setImportError("")
    setDraft(null)
    reset({ entries: [] })
  }

  const save = useMutation({
    networkMode: "always",
    mutationFn: (change: Save) => change.kind === "change"
      ? updatePurchaseOrderPieces(id, change.payload)
      : importPurchaseOrderPieces(id, change.payload),
    onSuccess: async (updated) => {
      await queryClient.cancelQueries({ queryKey: editorKey, exact: true })
      queryClient.setQueryData(editorKey, updated)
      cancelDraft()
      void queryClient.invalidateQueries({ queryKey: panelKey, exact: true })
    },
  })
  const canEdit = Boolean(editor?.canWrite && product && !query.isFetching && !query.isError)
  const busy = save.isPending || importing

  function change() {
    if (!editor || !product || !canEdit) return
    save.reset()
    setImportError("")
    const current = entries.map(({ id, productCode, serial, quantity }) => ({ pieceId: id, productCode, serial, quantity }))
    reset({ entries: current })
    setDraft({ kind: "change", revision: editor.revision, legacyVersion: editor.legacyVersion, productCode: product.productCode })
  }

  function cancel() {
    if (save.isPending) return
    save.reset()
    cancelDraft()
    if (!draft) onClose()
  }

  async function importFile(file: File) {
    if (!editor || !canEdit || busy) return
    const run = ++importRun.current
    setImporting(true)
    setImportError("")
    try {
      const imported = readPieceRows(await file.text(), products.map(({ productCode }) => productCode))
      if (run !== importRun.current) return
      if (draft?.kind === "change" && imported.some(({ productCode }) => productCode !== draft.productCode)) {
        throw new Error("Guarda o cancela el cambio antes de importar piezas de otros productos.")
      }

      save.reset()
      const rows = imported.map((entry) => ({ pieceId: null, ...entry }))
      if (draft) {
        append(rows, { shouldFocus: false })
      } else {
        reset({ entries: rows })
        setDraft({ kind: "import", revision: editor.revision, legacyVersion: editor.legacyVersion })
      }
    } catch (error) {
      if (run === importRun.current) setImportError(error instanceof Error ? error.message : "No fue posible leer el archivo.")
    } finally {
      if (run === importRun.current) setImporting(false)
    }
  }

  const submit = handleSubmit(({ entries }) => {
    if (!draft || !canEdit || busy) return
    setImportError("")
    const { revision, legacyVersion } = draft
    if (draft.kind === "import") {
      if (entries.some(({ quantity }) => quantity < 0)) {
        setImportError("La cantidad de una pieza importada no puede ser negativa.")
        return
      }
      const imported = entries.filter(({ quantity }) => quantity > 0)
        .map(({ productCode, quantity, serial }) => ({ productCode, quantity, serial }))
      if (!imported.length) {
        setImportError("Agrega al menos una pieza para importar.")
        return
      }

      save.mutate({ kind: "import", payload: { revision, legacyVersion, entries: imported } })
    } else {
      save.mutate({ kind: "change", payload: {
        revision, legacyVersion, productCode: draft.productCode,
        entries: entries.map(({ pieceId, serial, quantity }) => ({ id: pieceId, serial, quantity })),
      } })
    }
  })

  return (
    <ErpDataDialog defaultWidth={460} description={number} title="Alta Piezas"
      onOpenChange={(open) => {
        if (!open && !save.isPending) {
          cancelDraft()
          onClose()
        }
      }}>
      <ErpDataDialogBody>
        <form className="grid gap-2" onSubmit={(event) => void submit(event)} onKeyDown={(event) => {
          if (event.key === "Escape" && !event.defaultPrevented) {
            event.preventDefault()
            event.stopPropagation()
            cancel()
          }
        }}>
          {query.isPending && <div className="grid min-h-28 place-items-center"><Spinner /></div>}
          {query.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription></Alert>}
          {editor && !editor.canWrite && editor.reason && <Alert><AlertDescription>{editor.reason}</AlertDescription></Alert>}

          {editor && (
            <>
              {!isImportDraft && <div className="grid gap-1">
                <Label htmlFor={productId}>Producto</Label>
                <Select value={product?.productCode ?? null} disabled={Boolean(draft) || busy || !products.length}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedCode(value)
                      setImportError("")
                      save.reset()
                    }
                  }}>
                  <SelectTrigger className="w-full" id={productId} size="sm">
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(({ productCode, description }) => (
                      <SelectItem key={productCode} value={productCode}>{productCode} {description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>}

              <ErpDataTableViewport axes="xy" className="h-52">
                <Table>
                  <TableHeader><TableRow>
                    {isImportDraft && <TableHead>Producto</TableHead>}
                    <TableHead>Serie</TableHead>
                    <TableHead className="w-32 text-right">Cant.</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {draft ? fields.map((row, index) => (
                      <TableRow key={row.id}>
                        {isImportDraft && <TableCell>{row.productCode}</TableCell>}
                        <TableCell><Input aria-label={`Serie ${index + 1}`} maxLength={serialLength} readOnly={busy || !canEdit}
                          {...register(`entries.${index}.serial`)} /></TableCell>
                        <TableCell><Input aria-label={`Cant. ${index + 1}`} className="text-right" required readOnly={busy || !canEdit}
                          min={isImportDraft ? 0 : undefined} step="0.001" type="number"
                          {...register(`entries.${index}.quantity`, { valueAsNumber: true })} /></TableCell>
                      </TableRow>
                    )) : entries.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.serial}</TableCell>
                        <TableCell className="text-right">{quantityFormat.format(row.quantity)}</TableCell>
                      </TableRow>
                    ))}
                    {(draft ? !fields.length : !entries.length) && (
                      <TableRow><TableCell colSpan={isImportDraft ? 3 : 2}>Sin piezas</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ErpDataTableViewport>
              {!isImportDraft && product && <div className="flex justify-end gap-3 text-[10px] tabular-nums">
                <span>Pedido {quantityFormat.format(product.ordered)}</span>
                <span>Total {quantityFormat.format(total)}</span>
              </div>}
            </>
          )}

          {draft && <p className="text-[10px] text-muted-foreground">
            {isImportDraft ? "Cantidad 0 omite la fila al guardar." : "Cantidad 0 elimina la pieza al guardar."}
          </p>}
          {importError && <Alert variant="destructive"><AlertDescription>{importError}</AlertDescription></Alert>}
          {errors.entries && <Alert variant="destructive"><AlertDescription>Revisa las series y cantidades de las piezas.</AlertDescription></Alert>}
          {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}

          <div className="flex flex-wrap items-center gap-1">
            {editor && (
              <>
                {draft?.kind === "change" &&
                  <Button disabled={busy || !canEdit} onClick={() => append({ pieceId: null, productCode: draft.productCode, serial: "", quantity: 0 })}
                    size="sm" type="button" variant="outline">Agregar pieza</Button>}
                {!draft && <Button disabled={!canEdit || busy} onClick={change} size="sm" type="button" variant="outline">Cambio</Button>}
                <Input accept=".tsv,.txt,text/tab-separated-values,text/plain" aria-label="Archivo de piezas" className="hidden"
                  ref={fileInput} type="file" onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    event.currentTarget.value = ""
                    if (file) void importFile(file)
                  }} />
                <Button disabled={busy || !canEdit} onClick={() => fileInput.current?.click()} size="sm" type="button" variant="outline">
                  {importing && <Spinner />}Importar
                </Button>
              </>
            )}
            <div className="ml-auto flex gap-1">
              <Button disabled={save.isPending} onClick={cancel} size="sm" type="button" variant="outline">Cancelar</Button>
              {draft
                ? <Button disabled={busy || !canEdit} size="sm" type="submit">{save.isPending && <Spinner />}OK</Button>
                : <Button disabled={importing} onClick={onClose} size="sm" type="button">OK</Button>}
            </div>
          </div>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
