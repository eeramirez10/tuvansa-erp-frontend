import FloppyDiskIcon from "@hugeicons/core-free-icons/FloppyDiskIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Controller,
  useForm,
  type FieldError as RhfFieldError,
  type UseFormRegisterReturn,
} from "react-hook-form"

import { productTypeOptions } from "@/features/inventories/products/constants"
import {
  getProductFormDefaults,
  productKeys,
  toProductMutationInput,
} from "@/features/inventories/products/logic"
import {
  productFormSchema,
  type Product,
  type ProductFormValues,
} from "@/features/inventories/products/model"
import {
  createProduct,
  updateProduct,
} from "@/features/inventories/products/services/product-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Spinner } from "@/shared/ui/spinner"

type ProductFormDialogProps = {
  mode: "create" | "edit"
  product?: Product
  onOpenChange: (open: boolean) => void
  onSaved: (product: Product, mode: "create" | "edit") => void
}

type ProductInputFieldProps = {
  error?: RhfFieldError
  label: string
  registration: UseFormRegisterReturn
  type?: "text" | "number"
  step?: string
}

function ProductInputField({
  error,
  label,
  registration,
  type = "text",
  step,
}: ProductInputFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        min={type === "number" ? 0 : undefined}
        step={step}
        type={type}
        {...registration}
      />
      <FieldError errors={[error]} />
    </Field>
  )
}

export function ProductFormDialog({
  mode,
  product,
  onOpenChange,
  onSaved,
}: ProductFormDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<ProductFormValues>({
    defaultValues: getProductFormDefaults(product),
    resolver: zodResolver(productFormSchema),
  })
  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const input = toProductMutationInput(values)
      return mode === "create"
        ? createProduct(input)
        : updateProduct(product!.id, input)
    },
    onSuccess: async (savedProduct) => {
      queryClient.setQueryData(productKeys.detail(savedProduct.id), savedProduct)
      await queryClient.invalidateQueries({ queryKey: productKeys.all })
      onSaved(savedProduct, mode)
    },
  })

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuevo producto" : "Editar producto"}
          </DialogTitle>
          <DialogDescription>
            Capture los campos de la ficha de Inventarios PT. Los acumulados se
            calculan en el ERP y son de consulta.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-col gap-3"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <ScrollArea className="h-[65vh] pr-3">
            <div className="flex flex-col gap-4">
              {mutation.isError && (
                <Alert variant="destructive">
                  <AlertTitle>No fue posible guardar el producto</AlertTitle>
                  <AlertDescription>
                    {getApiErrorMessage(mutation.error)}
                  </AlertDescription>
                </Alert>
              )}

              <FieldSet>
                <FieldLegend>Catálogo de productos</FieldLegend>
                <FieldGroup className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <ProductInputField
                      error={form.formState.errors.code}
                      label="Código"
                      registration={form.register("code")}
                    />
                  </div>
                  <div className="md:col-span-9">
                    <ProductInputField
                      error={form.formState.errors.description}
                      label="Descripción"
                      registration={form.register("description")}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <ProductInputField
                      error={form.formState.errors.unitId}
                      label="Unidad (ID)"
                      registration={form.register("unitId", { valueAsNumber: true })}
                      type="number"
                    />
                  </div>
                  <div className="md:col-span-7">
                    <ProductInputField
                      error={form.formState.errors.familyCode}
                      label="Familia"
                      registration={form.register("familyCode")}
                    />
                  </div>
                  <Controller
                    control={form.control}
                    name="hasPhoto"
                    render={({ field }) => (
                      <Field className="md:col-span-2 md:self-end" orientation="horizontal">
                        <Checkbox
                          checked={field.value}
                          id="mutation-has-photo"
                          onCheckedChange={field.onChange}
                        />
                        <FieldLabel htmlFor="mutation-has-photo">Foto</FieldLabel>
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Field className="md:col-span-12">
                        <FieldLabel>Tipo de producto</FieldLabel>
                        <RadioGroup
                          className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          {productTypeOptions.map((type) => (
                            <Field key={type.value} orientation="horizontal">
                              <RadioGroupItem
                                id={`mutation-type-${type.value}`}
                                value={type.value}
                              />
                              <FieldLabel htmlFor={`mutation-type-${type.value}`}>
                                {type.label}
                              </FieldLabel>
                            </Field>
                          ))}
                        </RadioGroup>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Precios de Venta</FieldLegend>
                <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((priceNumber) => {
                    const amountName = `salePrice${priceNumber}` as
                      | "salePrice1"
                      | "salePrice2"
                      | "salePrice3"
                    const currencyName = `saleCurrency${priceNumber}` as
                      | "saleCurrency1"
                      | "saleCurrency2"
                      | "saleCurrency3"
                    return (
                      <FieldGroup
                        className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2 rounded-md border p-2"
                        key={priceNumber}
                      >
                        <ProductInputField
                          error={form.formState.errors[amountName]}
                          label={`Precio ${priceNumber}`}
                          registration={form.register(amountName, { valueAsNumber: true })}
                          step="0.01"
                          type="number"
                        />
                        <ProductInputField
                          error={form.formState.errors[currencyName]}
                          label="Moneda"
                          registration={form.register(currencyName, {
                            valueAsNumber: true,
                          })}
                          type="number"
                        />
                      </FieldGroup>
                    )
                  })}
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Costos</FieldLegend>
                <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <ProductInputField
                    error={form.formState.errors.averageCost}
                    label="Promedio 4"
                    registration={form.register("averageCost", { valueAsNumber: true })}
                    step="0.01"
                    type="number"
                  />
                  <ProductInputField
                    error={form.formState.errors.lastCost}
                    label="Último 5"
                    registration={form.register("lastCost", { valueAsNumber: true })}
                    step="0.01"
                    type="number"
                  />
                  <ProductInputField
                    error={form.formState.errors.previousCost}
                    label="Anterior 6"
                    registration={form.register("previousCost", { valueAsNumber: true })}
                    step="0.01"
                    type="number"
                  />
                  <ProductInputField
                    error={form.formState.errors.costCurrency}
                    label="Moneda"
                    registration={form.register("costCurrency", { valueAsNumber: true })}
                    type="number"
                  />
                  <ProductInputField
                    error={form.formState.errors.adValorem}
                    label="Advalorem"
                    registration={form.register("adValorem", { valueAsNumber: true })}
                    step="0.01"
                    type="number"
                  />
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Cuentas / Info. Almacén</FieldLegend>
                <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <ProductInputField
                    error={form.formState.errors.minimum}
                    label="Mínimo"
                    registration={form.register("minimum", { valueAsNumber: true })}
                    step="0.01"
                    type="number"
                  />
                  <ProductInputField
                    error={form.formState.errors.maximum}
                    label="Máximo"
                    registration={form.register("maximum", { valueAsNumber: true })}
                    step="0.01"
                    type="number"
                  />
                  <ProductInputField
                    error={form.formState.errors.location}
                    label="Localización"
                    registration={form.register("location")}
                  />
                  <ProductInputField
                    error={form.formState.errors.ean}
                    label="EAN"
                    registration={form.register("ean")}
                  />
                  <ProductInputField
                    error={form.formState.errors.upc}
                    label="UPC"
                    registration={form.register("upc")}
                  />
                  <ProductInputField
                    error={form.formState.errors.primaryAccount}
                    label="Cta. Primaria"
                    registration={form.register("primaryAccount")}
                  />
                  <ProductInputField
                    error={form.formState.errors.secondaryAccount}
                    label="Cta. Sec."
                    registration={form.register("secondaryAccount")}
                  />
                  <ProductInputField
                    error={form.formState.errors.costOfSalesAccount}
                    label="Cta. Costo vts"
                    registration={form.register("costOfSalesAccount")}
                  />
                </FieldGroup>
              </FieldSet>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HugeiconsIcon
                  data-icon="inline-start"
                  icon={FloppyDiskIcon}
                  strokeWidth={2}
                />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
