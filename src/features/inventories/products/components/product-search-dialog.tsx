import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { productSearchQueryOptions } from "@/features/inventories/products/logic"
import type { Product } from "@/features/inventories/products/model"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

const searchSchema = z.object({
  query: z.string().trim().min(1, "Escriba un código, descripción, EAN o UPC"),
})

type SearchValues = z.infer<typeof searchSchema>

type ProductSearchDialogProps = {
  onOpenChange: (open: boolean) => void
  onSelect: (product: Product) => void
}

export function ProductSearchDialog({
  onOpenChange,
  onSelect,
}: ProductSearchDialogProps) {
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null)
  const form = useForm<SearchValues>({
    defaultValues: { query: "" },
    resolver: zodResolver(searchSchema),
  })
  const resultsQuery = useQuery({
    ...productSearchQueryOptions({
      q: submittedQuery ?? "",
      status: "all",
      page: 1,
      pageSize: 25,
    }),
    enabled: submittedQuery !== null,
  })

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Encuentra producto</DialogTitle>
          <DialogDescription>
            Busque por código, descripción, EAN o UPC, como en la ventana de OMNIS.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(({ query }) => setSubmittedQuery(query))}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.query)}>
              <FieldLabel htmlFor="product-search">Producto</FieldLabel>
              <div className="flex gap-2">
                <Input
                  aria-invalid={Boolean(form.formState.errors.query)}
                  autoFocus
                  id="product-search"
                  placeholder="Código o descripción"
                  {...form.register("query")}
                />
                <Button disabled={resultsQuery.isFetching} type="submit">
                  {resultsQuery.isFetching ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <HugeiconsIcon
                      data-icon="inline-start"
                      icon={Search01Icon}
                      strokeWidth={2}
                    />
                  )}
                  Buscar
                </Button>
              </div>
              <FieldError errors={[form.formState.errors.query]} />
            </Field>
          </FieldGroup>
        </form>

        {resultsQuery.isError && (
          <Alert variant="destructive">
            <AlertTitle>No fue posible buscar productos</AlertTitle>
            <AlertDescription>
              {getApiErrorMessage(resultsQuery.error)}
            </AlertDescription>
          </Alert>
        )}

        {resultsQuery.data && (
          <div className="max-h-[55vh] overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Abrir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultsQuery.data.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell className="max-w-sm truncate">
                      {product.description}
                    </TableCell>
                    <TableCell>{product.classification.unit.code}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "secondary" : "destructive"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => onSelect(product)} size="sm" variant="outline">
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {resultsQuery.data.data.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                No se encontraron productos.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
