import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { InventoryMovementPrintDialog } from "@/features/inventories/movements/components/inventory-movement-print-dialog"
import { InventoryMovementSearchDialog } from "@/features/inventories/movements/components/inventory-movement-search-dialog"
import { MovementCaptureDialog } from "@/features/inventories/movements/components/movement-capture-dialog"
import { movementDetailsQueryOptions, movementKeys } from "@/features/inventories/movements/logic"
import { isLocalInventoryAdjustment, movementCaptureWindowId, movementPrintWindowId, movementSearchWindowId, movementWindowId, type InventoryMovementLine } from "@/features/inventories/movements/model"
import { cancelMovement } from "@/features/inventories/movements/services/movement-service"
import { ProductQueryTable } from "@/features/inventories/products/components/product-query-table"
import { productKeys } from "@/features/inventories/products/logic"
import { formatDate, formatMoney, formatNumber, numberValue, type QueryColumn } from "@/features/inventories/products/query-formatters"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { selectRestoreDesktopWindow, useDesktopWindowStore } from "@/shared/ui/desktop-window-store"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

type InventoryMovementsDialogProps = {
  searchOpen: boolean
  onClose: () => void
  onSearch: () => void
  onCloseSearch: () => void
}

const lineColumns = (precision: number, lines?: InventoryMovementLine[]): QueryColumn[] => [
  { key: "productCode", label: "Producto", width: "6rem" },
  { key: "description", label: "Descripción", width: "12rem" },
  {
    key: "incoming",
    label: "Entradas",
    width: "4rem",
    align: "right",
    render: (row) => numberValue(row.quantity) > 0 ? numberValue(row.quantity).toFixed(precision) : "",
  },
  {
    key: "outgoing",
    label: "Salidas",
    width: "4rem",
    align: "right",
    render: (row) => numberValue(row.quantity) < 0 ? Math.abs(numberValue(row.quantity)).toFixed(precision) : "",
  },
  { key: "unit", label: "U.M.", width: "3rem" },
  { key: "cost", label: "Costo", width: "5rem", align: "right", render: (row) => numberValue(row.cost).toFixed(4) },
  {
    key: "pieces",
    label: "Pzas.",
    width: "4rem",
    align: "right",
    render: (row) => typeof row.piecesText === "string" && row.piecesText.trim()
      ? row.piecesText
      : numberValue(row.pieces) ? formatNumber(row.pieces) : "",
  },
  { key: "warehouse", label: "Alm.", width: "3rem" },
  ...(lines?.some(line => line.lotId)
    ? [{ key: "lotId", label: "Capa", width: "8rem", render: (row: Record<string, unknown>) => row.lotId ? String(row.lotId) : "" }] : []),
  ...(lines?.some(line => line.lotWarehouse && line.lotWarehouse !== line.warehouse)
    ? [{ key: "lotWarehouse", label: "Alm. capa", width: "5rem" }] : []),
]

function MovementField({
  label,
  value,
  labelVisible = true,
}: {
  label: string
  value?: string | number | null
  labelVisible?: boolean
}) {
  return (
    <label className="flex min-w-0 items-center gap-1">
      <span className={labelVisible ? "w-16 shrink-0 text-right" : "sr-only"}>{label}</span>
      <output className="block h-4 min-w-0 flex-1 truncate border border-input bg-background px-1 leading-4 shadow-inner" title={value == null ? undefined : String(value)}>
        {value}
      </output>
    </label>
  )
}

export function InventoryMovementsDialog({
  searchOpen,
  onClose,
  onSearch,
  onCloseSearch,
}: InventoryMovementsDialogProps) {
  const queryClient = useQueryClient()
  const [movementId, setMovementId] = useState<number | null>(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [printDocument, setPrintDocument] = useState<{ id: number; document: string } | null>(null)
  const [cancellationNotice, setCancellationNotice] = useState("")
  const detail = useQuery(movementDetailsQueryOptions(movementId))
  const movement = detail.data
  const header = movement?.header
  const canPrint = header && (header.type === "EI" || header.type === "SI") && header.document.startsWith(header.type)
    && header.company === 1 && header.status === 0 && header.inventoryFlag === 1 && header.billingFlag === 0
    && movement.lines.some((line) => line.type !== "K" && line.quantity !== 0)
  const local = header && isLocalInventoryAdjustment(header.id)
  const transfer = local && (header.type === "TR" || (header.type === "K" && /^TR/.test(header.document))) && Boolean(header.reference2)
  const precision = local ? 3 : 2
  const entries = movement?.totals.entries ?? 0
  const exits = Math.abs(movement?.totals.exits ?? 0)
  const modalLayer = useDesktopWindowStore((state) => state.nextZIndex + 20)
  const restoreWindow = useDesktopWindowStore(selectRestoreDesktopWindow)
  const cancellation = useMutation({
    mutationFn: cancelMovement,
    onSuccess: (_, id) => {
      setConfirmationOpen(false)
      setPrintDocument((current) => current?.id === id ? null : current)
      if (isLocalInventoryAdjustment(id)) {
        setCancellationNotice("El documento se marcó como cancelado.")
        void queryClient.invalidateQueries({ queryKey: movementKeys.detail(id), exact: true })
      } else {
        setMovementId((current) => current === id ? null : current)
        setCancellationNotice("El documento ha sido eliminado.")
        queryClient.removeQueries({ queryKey: movementKeys.detail(id), exact: true })
      }
      void queryClient.invalidateQueries({ queryKey: movementKeys.all, refetchType: "none" })
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      void queryClient.invalidateQueries({ queryKey: ["inventories", "reports"] })
    },
    onError: () => setConfirmationOpen(false),
  })

  return (
    <>
      <ErpDataDialog
        defaultHeight={490}
        defaultWidth={740}
        description="Consulta y cancelación de documentos de movimientos de inventario."
        fillHeight
        onOpenChange={(open) => { if (!open && !cancellation.isPending && !captureOpen) onClose() }}
        title="Consulta de movimientos de inventario"
      >
        <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-1">
          <div className="grid gap-1 min-[540px]:grid-cols-[minmax(0,1fr)_11rem_auto]">
            <div className="grid gap-0.5">
              <div className="grid grid-cols-[minmax(7rem,1fr)_minmax(0,2fr)] gap-1">
                <MovementField label="Documento" value={header?.document} />
                <MovementField label="Referencia" value={header?.reference} />
              </div>
              {transfer && <div className="grid grid-cols-2 gap-1">
                <MovementField label="Alm. origen" value={header.reference2} />
                <MovementField label="Alm. destino" value={header.warehouse} />
              </div>}
              <div className="grid grid-cols-[minmax(7rem,1fr)_minmax(0,3fr)] gap-1">
                <MovementField label="Cliente" value={header?.customerCode} />
                <MovementField label="Nombre del cliente" labelVisible={false} value={header?.customerName} />
              </div>
              <div className="max-w-44">
                <MovementField label="Fecha" value={formatDate(header?.date)} />
              </div>
            </div>
            <div className="grid grid-cols-2 items-center gap-0.5">
              <div className="col-start-2">
                <MovementField label="Tipo" labelVisible={false} value={header?.type} />
              </div>
              <MovementField label="Indicador de facturación" labelVisible={false} value={header?.billingFlag} />
              <MovementField label="Indicador de inventario" labelVisible={false} value={header?.inventoryFlag} />
              <MovementField label="Almacen" labelVisible={false} value={header?.warehouse} />
              <MovementField label="Usuario" labelVisible={false} value={header?.userId} />
            </div>
            <Button aria-label="Buscar documento" disabled={cancellation.isPending || captureOpen} onClick={onSearch} size="icon-sm" title="Buscar documento" type="button" variant="outline">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </Button>
          </div>

          {movementId !== null && detail.isPending ? (
            <div className="flex min-h-36 flex-1 items-center justify-center gap-1.5 border border-input bg-background">
              <Spinner /> Cargando documento…
            </div>
          ) : detail.isError ? (
            <Alert className="flex-1" variant="destructive">
              <AlertTitle>No fue posible cargar el documento</AlertTitle>
              <AlertDescription>
                {getApiErrorMessage(detail.error)}
                <Button onClick={() => void detail.refetch()} size="sm" type="button" variant="outline">Reintentar</Button>
              </AlertDescription>
            </Alert>
          ) : (
            <ProductQueryTable
              className="h-auto min-h-36 flex-1"
              columns={lineColumns(precision, movement?.lines)}
              emptyMessage={movement ? "Sin partidas en este documento" : ""}
              rows={movement?.lines ?? []}
              tableClassName="w-[43rem]"
            />
          )}

          {cancellation.isError && (
            <Alert variant="destructive">
              <AlertTitle>No fue posible cancelar el documento</AlertTitle>
              <AlertDescription>{getApiErrorMessage(cancellation.error)}</AlertDescription>
            </Alert>
          )}
          {cancellationNotice && <p className="px-1" role="status">{cancellationNotice}</p>}

          <footer className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 px-1">
            <div className="flex flex-wrap gap-1">
              <Button disabled={cancellation.isPending || confirmationOpen || captureOpen || searchOpen} onClick={() => setCaptureOpen(true)}
                size="sm" type="button" variant="outline">Capturar movimiento</Button>
              {movement && (
                <>
                  <Button disabled={!canPrint || cancellation.isPending}
                    onClick={() => setPrintDocument({ id: movement.header.id, document: movement.header.document })}
                    size="sm" type="button" variant="outline">Imprimir</Button>
                  <Button onClick={() => setCommentOpen(true)} size="sm" type="button" variant="outline">Comentarios</Button>
                </>
              )}
            </div>
            <div className="grid min-w-24 gap-1 text-center tabular-nums">
              <div className="grid grid-cols-2 gap-2">
                <output aria-label="Entradas totales">{entries ? entries.toFixed(precision) : ""}</output>
                <output aria-label="Salidas totales">{exits ? exits.toFixed(precision) : ""}</output>
              </div>
              <output aria-label="Costo total">{formatMoney(movement?.totals.cost ?? 0)}</output>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {movement && (
                <>
                  <Button
                    disabled={!movement.cancellationAvailable || cancellation.isPending || captureOpen}
                    onClick={() => setConfirmationOpen(true)}
                    size="sm"
                    title={movement.cancellationReason}
                    type="button"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button disabled size="sm" type="button" variant="outline">CT</Button>
                </>
              )}
            </div>
          </footer>
          {movement?.cancellationReason && !movement.cancellationAvailable && (
            <p className="text-right text-muted-foreground">{movement.cancellationReason}</p>
          )}
        </ErpDataDialogBody>
      </ErpDataDialog>

      {searchOpen && (
        <DesktopWindowIdentity id={movementSearchWindowId}>
          <InventoryMovementSearchDialog
            onClose={onCloseSearch}
            onSelect={(selected) => {
              setMovementId(selected.id)
              setCancellationNotice("")
              cancellation.reset()
              onCloseSearch()
            }}
          />
        </DesktopWindowIdentity>
      )}
      {captureOpen && (
        <DesktopWindowIdentity id={movementCaptureWindowId}>
          <MovementCaptureDialog onClose={() => {
            setCaptureOpen(false)
            restoreWindow(movementWindowId)
          }} onSaved={saved => {
            setMovementId(saved.header.id)
            cancellation.reset()
            setCancellationNotice(`${saved.header.document} registrado.`)
            setCaptureOpen(false)
            restoreWindow(movementWindowId)
          }} />
        </DesktopWindowIdentity>
      )}
      {printDocument && (
        <DesktopWindowIdentity id={movementPrintWindowId}>
          <InventoryMovementPrintDialog {...printDocument} onClose={() => setPrintDocument(null)} />
        </DesktopWindowIdentity>
      )}

      <AlertDialog onOpenChange={setCommentOpen} open={commentOpen}>
        <AlertDialogContent style={{ zIndex: modalLayer }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Comentarios · {header?.document}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {movement?.comment || "Sin comentarios para este documento."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel variant="default">OK</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        onOpenChange={(open) => { if (!cancellation.isPending) setConfirmationOpen(open) }}
        open={confirmationOpen}
      >
        <AlertDialogContent style={{ zIndex: modalLayer }}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de querer cancelar el documento?</AlertDialogTitle>
            <AlertDialogDescription>{header?.document}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellation.isPending}>No</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancellation.isPending || !movement?.cancellationAvailable}
              onClick={() => { if (movement) cancellation.mutate(movement.header.id) }}
              variant="destructive"
            >
              {cancellation.isPending ? "Cancelando…" : "Sí"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
