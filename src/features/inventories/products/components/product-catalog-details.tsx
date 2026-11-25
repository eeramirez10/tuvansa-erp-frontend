import { Controller } from "react-hook-form"

import { productTypeLabels, productTypeOptions } from "@/features/inventories/products/constants"
import type { Product, ProductCatalogDetailsData } from "@/features/inventories/products/model"
import { CatalogEditField, CatalogUnitField, type ProductCatalogEditor } from "@/features/inventories/products/components/product-catalog-edit-field"
import { ReadonlyProductField } from "@/features/inventories/products/components/readonly-product-field"
import { Badge } from "@/shared/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"

type ProductCatalogDetailsProps = {
  product: ProductCatalogDetailsData
  editor?: ProductCatalogEditor
}

function numberFormatter(fractionDigits: number) {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

const wholeNumbers = numberFormatter(0)
const quantities = numberFormatter(2)
const stock = numberFormatter(3)
const prices = numberFormatter(4)
const calendarDate = new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" })

function formatUnit({ code, description, catalogOption }: Product["classification"]["unit"]) {
  if (catalogOption === null) return code
  if (catalogOption === undefined) return [code, description].filter(Boolean).join(" · ")

  const optionCode = catalogOption.code === code ? "" : catalogOption.code
  return [code, optionCode, catalogOption.description].filter(Boolean).join(" · ")
}

function formatDate(value: string | null) {
  if (typeof value !== "string") return "—"
  const day = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(value)?.[1]
  if (!day || day.startsWith("0000-") || day === "1900-12-31") return "—"
  const date = new Date(`${day}T00:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return "—"
  return calendarDate.format(date)
}

export function ProductCatalogDetails({ product, editor }: ProductCatalogDetailsProps) {
  const colorEditor = editor?.fields.has("usesColorAndSize") ? editor : undefined
  const typeEditor = editor?.fields.has("type") ? editor : undefined
  const renderTypes = (value: Product["classification"]["type"], onChange?: (value: string) => void) => {
    const disabled = !typeEditor || typeEditor.disabled
    return (
      <RadioGroup
        aria-label="Tipo de producto"
        className="grid grid-cols-2 gap-2 sm:grid-cols-5"
        disabled={disabled}
        onValueChange={onChange}
        value={value}
      >
        {productTypeOptions.map((type) => (
          <Field data-disabled={disabled || undefined} key={type.value} orientation="horizontal">
            <RadioGroupItem disabled={disabled} id={`product-type-${type.value}`} value={type.value} />
            <FieldLabel htmlFor={`product-type-${type.value}`}>{type.label}</FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>Catálogo de productos</CardTitle>
          {product.code && (
            <CardAction>
              <Badge variant={product.isActive ? "secondary" : "destructive"}>
                {product.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-2 md:grid-cols-12">
            <CatalogEditField
              className="md:col-span-3"
              editor={editor}
              label="Código"
              name="code"
              value={product.code}
            />
            <CatalogEditField
              className="md:col-span-9"
              editor={editor}
              label="Descripción"
              name="description"
              value={product.description}
            />
            <CatalogUnitField
              className="md:col-span-3"
              editor={editor}
              unit={product.classification.unit}
              value={formatUnit(product.classification.unit)}
            />
            <CatalogEditField
              className="md:col-span-5"
              editor={editor}
              label="Familia"
              name="familyCode"
              value={product.classification.familyCode}
            />
            <Field
              className="md:col-span-2 md:self-end"
              data-disabled={!colorEditor || colorEditor.disabled || undefined}
              orientation="horizontal"
            >
              {colorEditor ? (
                <Controller
                  control={colorEditor.control}
                  name="changes.usesColorAndSize"
                  render={({ field }) => (
                    <Checkbox checked={field.value ?? product.classification.usesColorAndSize} disabled={colorEditor.disabled} id="product-color-size" onCheckedChange={field.onChange} />
                  )}
                />
              ) : <Checkbox checked={product.classification.usesColorAndSize} disabled id="product-color-size" />}
              <FieldLabel htmlFor="product-color-size">Color y talla</FieldLabel>
            </Field>
            <Field
              className="md:col-span-2 md:self-end"
              data-disabled
              orientation="horizontal"
            >
              <Checkbox
                checked={product.classification.hasPhoto}
                disabled
                id="product-photo"
              />
              <FieldLabel htmlFor="product-photo">Foto</FieldLabel>
            </Field>
            <Field className="md:col-span-12">
              <FieldLabel>Tipo de producto</FieldLabel>
              {typeEditor ? (
                <Controller
                  control={typeEditor.control}
                  name="changes.type"
                  render={({ field }) => renderTypes(field.value ?? product.classification.type, field.onChange)}
                />
              ) : renderTypes(product.classification.type)}
              {product.classification.type === "unknown" && (
                <Badge variant="outline">
                  {productTypeLabels[product.classification.type]}
                </Badge>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-2 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>Precios de Venta</CardTitle>
              {product.prices.hasActiveOffer && (
                <CardAction>
                  <span aria-label="Oferta vigente" role="img" title="Oferta vigente">*</span>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
                {product.prices.sale.map((price, index) => (
                  <div className="contents" key={`sale-price-${index + 1}`}>
                    <CatalogEditField
                      editor={editor}
                      inputMode="decimal"
                      label={`Precio ${index + 1}`}
                      name={`salePrice${(index + 1) as 1 | 2 | 3}`}
                      value={prices.format(price.amount)}
                    />
                    <CatalogEditField
                      editor={editor}
                      inputMode="numeric"
                      label="Moneda"
                      name={`saleCurrency${(index + 1) as 1 | 2 | 3}`}
                      value={price.currencyId}
                    />
                  </div>
                ))}
              </FieldGroup>
            </CardContent>
          </Card>

          {product.prices.costs.average !== null && <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>Costos</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid gap-2 sm:grid-cols-2">
                <CatalogEditField
                  editor={editor}
                  inputMode="decimal"
                  label="Promedio 4"
                  name="averageCost"
                  value={prices.format(product.prices.costs.average)}
                />
                <CatalogEditField
                  editor={editor}
                  inputMode="decimal"
                  label="Último 5"
                  name="lastCost"
                  value={prices.format(product.prices.costs.last)}
                />
                <CatalogEditField
                  editor={editor}
                  inputMode="decimal"
                  label="Anterior 6"
                  name="previousCost"
                  value={prices.format(product.prices.costs.previous)}
                />
                <CatalogEditField
                  editor={editor}
                  inputMode="numeric"
                  label="Moneda"
                  name="costCurrency"
                  value={product.prices.costs.currencyId}
                />
                <CatalogEditField
                  editor={editor}
                  inputMode="decimal"
                  label="Advalorem"
                  name="adValorem"
                  value={quantities.format(product.prices.costs.adValorem)}
                />
              </FieldGroup>
            </CardContent>
          </Card>}

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>Cuentas / Info. Almacén</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid gap-2 sm:grid-cols-2">
                <CatalogEditField
                  editor={editor}
                  inputMode="decimal"
                  label="Mínimo"
                  name="minimum"
                  value={quantities.format(product.warehouse.minimum)}
                />
                <CatalogEditField
                  editor={editor}
                  inputMode="decimal"
                  label="Máximo"
                  name="maximum"
                  value={quantities.format(product.warehouse.maximum)}
                />
                <div className="sm:col-span-2">
                  <CatalogEditField
                    editor={editor}
                    label="Localización"
                    name="location"
                    value={product.warehouse.location}
                  />
                </div>
                <CatalogEditField editor={editor} label="EAN" name="ean" value={product.warehouse.ean} />
                <CatalogEditField editor={editor} label="UPC" name="upc" value={product.warehouse.upc} />
                <CatalogEditField
                  editor={editor}
                  label="Cta. Primaria"
                  name="primaryAccount"
                  value={product.warehouse.accounts.primary}
                />
                <CatalogEditField
                  editor={editor}
                  label="Cta. Sec."
                  name="secondaryAccount"
                  value={product.warehouse.accounts.secondary}
                />
                <CatalogEditField
                  editor={editor}
                  label="Cta. Costo vts"
                  name="costOfSalesAccount"
                  value={product.warehouse.accounts.costOfSales}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit" size="sm">
          <CardHeader className="border-b">
            <CardTitle>Acumulados</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-2 sm:grid-cols-2">
              <ReadonlyProductField
                label="Última Compra"
                value={formatDate(product.accumulated.lastPurchaseAt)}
              />
              <ReadonlyProductField
                label="Venta"
                value={formatDate(product.accumulated.lastSaleAt)}
              />
              <ReadonlyProductField
                label="Asignado"
                value={quantities.format(product.accumulated.assigned)}
              />
              <ReadonlyProductField
                label="Confirmado"
                value={stock.format(product.accumulated.confirmed)}
              />
              <ReadonlyProductField
                label="Pedido"
                value={quantities.format(product.accumulated.customerOrders)}
              />
              <ReadonlyProductField
                label="Cot. cliente"
                value={wholeNumbers.format(product.accumulated.customerQuotes)}
              />
              <ReadonlyProductField
                label="Ordenado"
                value={quantities.format(product.accumulated.supplierOrders)}
              />
              <ReadonlyProductField
                label="Cot. proveedor"
                value={wholeNumbers.format(product.accumulated.supplierQuotes)}
              />
              <ReadonlyProductField
                label="Stock actual"
                value={stock.format(product.accumulated.currentStock)}
              />
              <ReadonlyProductField
                label="Stock anterior"
                value={stock.format(product.accumulated.previousStock)}
              />
              <ReadonlyProductField
                label="Stock acumulado"
                value={stock.format(product.accumulated.accumulatedStock)}
              />
              <ReadonlyProductField
                label="Cantidad anterior"
                value={quantities.format(product.accumulated.previousQuantity)}
              />
              <ReadonlyProductField
                label="Cantidad acumulada"
                value={quantities.format(product.accumulated.accumulatedQuantity)}
              />
              <ReadonlyProductField
                label="Stk. pzas"
                value={wholeNumbers.format(product.accumulated.pieceStock)}
              />
              <ReadonlyProductField label="Alta" value={formatDate(product.createdAt)} />
              <ReadonlyProductField
                label="Baja"
                value={formatDate(product.deactivatedAt)}
              />
              <CatalogEditField
                editor={editor}
                inputMode="numeric"
                label="Vta 6s"
                name="salesLastSixWeeks"
                value={wholeNumbers.format(product.accumulated.salesLastSixWeeks ?? product.accumulated.salesLastSixMonths)}
              />
              <CatalogEditField
                editor={editor}
                inputMode="numeric"
                label="Días Inv."
                name="inventoryDays"
                value={product.accumulated.inventoryDays}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
