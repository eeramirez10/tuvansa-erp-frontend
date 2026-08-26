import Database01Icon from "@hugeicons/core-free-icons/Database01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"

import { productPanelQueryOptions } from "@/features/inventories/products/logic"
import type { ProductPanelDefinition } from "@/features/inventories/products/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Spinner } from "@/shared/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

type ProductPanelDialogProps = {
  panel: ProductPanelDefinition
  productId: number
  onOpenChange: (open: boolean) => void
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

export function ProductPanelDialog({
  panel,
  productId,
  onOpenChange,
}: ProductPanelDialogProps) {
  const panelQuery = useQuery(productPanelQueryOptions(productId, panel.key))
  const columns = panelQuery.data?.data.items[0]
    ? Object.keys(panelQuery.data.data.items[0])
    : []

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-7">
            <DialogTitle>{panel.label}</DialogTitle>
            {panelQuery.data && (
              <Badge variant="outline">
                {panelQuery.data.data.source === "mysql"
                  ? "MySQL"
                  : panelQuery.data.data.source === "product-cache"
                    ? "Ficha del producto"
                    : "No disponible"}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Consulta relacionada con el producto seleccionado en Inventarios PT.
          </DialogDescription>
        </DialogHeader>

        {panelQuery.isPending ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
            <Spinner />
            Cargando información…
          </div>
        ) : panelQuery.isError ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            <AlertTitle>No fue posible cargar la consulta</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(panelQuery.error)}
            </AlertDescription>
          </Alert>
        ) : !panelQuery.data.data.available ? (
          <Empty className="min-h-56 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Consulta no disponible</EmptyTitle>
              <EmptyDescription>
                {panelQuery.data.data.reason ??
                  "La versión actual de OMNIS no proporciona datos para este botón."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : panelQuery.data.data.items.length === 0 ? (
          <Empty className="min-h-56 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Database01Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>Sin registros</EmptyTitle>
              <EmptyDescription>
                La consulta se ejecutó correctamente, pero no encontró información para
                este producto.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="h-[60vh] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {panelQuery.data.data.items.map((item, index) => (
                  <TableRow key={`${panel.key}-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column}>
                        {formatCellValue(item[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
