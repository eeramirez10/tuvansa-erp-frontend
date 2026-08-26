import { productTypeLabels, productTypeOptions } from "@/features/inventories/products/constants"
import type { Product } from "@/features/inventories/products/model"
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
  product: Product
}

const numberFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  )
}

export function ProductCatalogDetails({ product }: ProductCatalogDetailsProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>Catálogo de productos</CardTitle>
          <CardAction>
            <Badge variant={product.isActive ? "secondary" : "destructive"}>
              {product.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-2 md:grid-cols-12">
            <ReadonlyProductField
              className="md:col-span-3"
              label="Código"
              value={product.code}
            />
            <ReadonlyProductField
              className="md:col-span-9"
              label="Descripción"
              value={product.description}
            />
            <ReadonlyProductField
              className="md:col-span-3"
              label="Unidad"
              value={`${product.classification.unit.code} · ${product.classification.unit.description}`}
            />
            <ReadonlyProductField
              className="md:col-span-5"
              label="Familia"
              value={product.classification.familyCode}
            />
            <Field
              className="md:col-span-2 md:self-end"
              data-disabled
              orientation="horizontal"
            >
              <Checkbox
                checked={product.classification.usesColorAndSize}
                disabled
                id="product-color-size"
              />
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
              <RadioGroup
                className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                disabled
                value={product.classification.type}
              >
                {productTypeOptions.map((type) => (
                  <Field data-disabled key={type.value} orientation="horizontal">
                    <RadioGroupItem
                      disabled
                      id={`product-type-${type.value}`}
                      value={type.value}
                    />
                    <FieldLabel htmlFor={`product-type-${type.value}`}>
                      {type.label}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
              {product.classification.type === "unknown" && (
                <Badge variant="outline">
                  {productTypeLabels[product.classification.type]}
                </Badge>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>Precios de Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
                {product.prices.sale.map((price, index) => (
                  <div className="contents" key={`sale-price-${index + 1}`}>
                    <ReadonlyProductField
                      inputMode="decimal"
                      label={`Precio ${index + 1}`}
                      value={formatNumber(price.amount)}
                    />
                    <ReadonlyProductField
                      inputMode="numeric"
                      label="Moneda"
                      value={price.currencyId}
                    />
                  </div>
                ))}
              </FieldGroup>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>Costos</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid gap-2 sm:grid-cols-2">
                <ReadonlyProductField
                  inputMode="decimal"
                  label="Promedio 4"
                  value={formatNumber(product.prices.costs.average)}
                />
                <ReadonlyProductField
                  inputMode="decimal"
                  label="Último 5"
                  value={formatNumber(product.prices.costs.last)}
                />
                <ReadonlyProductField
                  inputMode="decimal"
                  label="Anterior 6"
                  value={formatNumber(product.prices.costs.previous)}
                />
                <ReadonlyProductField
                  inputMode="numeric"
                  label="Moneda"
                  value={product.prices.costs.currencyId}
                />
                <ReadonlyProductField
                  inputMode="decimal"
                  label="Advalorem"
                  value={formatNumber(product.prices.costs.adValorem)}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>Cuentas / Info. Almacén</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid gap-2 sm:grid-cols-2">
                <ReadonlyProductField
                  label="Mínimo"
                  value={formatNumber(product.warehouse.minimum)}
                />
                <ReadonlyProductField
                  label="Máximo"
                  value={formatNumber(product.warehouse.maximum)}
                />
                <div className="sm:col-span-2">
                  <ReadonlyProductField
                    label="Localización"
                    value={product.warehouse.location}
                  />
                </div>
                <ReadonlyProductField label="EAN" value={product.warehouse.ean} />
                <ReadonlyProductField label="UPC" value={product.warehouse.upc} />
                <ReadonlyProductField
                  label="Cta. Primaria"
                  value={product.warehouse.accounts.primary}
                />
                <ReadonlyProductField
                  label="Cta. Sec."
                  value={product.warehouse.accounts.secondary}
                />
                <ReadonlyProductField
                  label="Cta. Costo vts"
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
                value={formatNumber(product.accumulated.assigned)}
              />
              <ReadonlyProductField
                label="Confirmado"
                value={formatNumber(product.accumulated.confirmed)}
              />
              <ReadonlyProductField
                label="Pedido"
                value={formatNumber(product.accumulated.customerOrders)}
              />
              <ReadonlyProductField
                label="Cot. cliente"
                value={formatNumber(product.accumulated.customerQuotes)}
              />
              <ReadonlyProductField
                label="Ordenado"
                value={formatNumber(product.accumulated.supplierOrders)}
              />
              <ReadonlyProductField
                label="Cot. proveedor"
                value={formatNumber(product.accumulated.supplierQuotes)}
              />
              <ReadonlyProductField
                label="Stock actual"
                value={formatNumber(product.accumulated.currentStock)}
              />
              <ReadonlyProductField
                label="Stock anterior"
                value={formatNumber(product.accumulated.previousStock)}
              />
              <ReadonlyProductField
                label="Stock acumulado"
                value={formatNumber(product.accumulated.accumulatedStock)}
              />
              <ReadonlyProductField
                label="Cantidad anterior"
                value={formatNumber(product.accumulated.previousQuantity)}
              />
              <ReadonlyProductField
                label="Cantidad acumulada"
                value={formatNumber(product.accumulated.accumulatedQuantity)}
              />
              <ReadonlyProductField
                label="Stk. pzas"
                value={formatNumber(product.accumulated.pieceStock)}
              />
              <ReadonlyProductField label="Alta" value={formatDate(product.createdAt)} />
              <ReadonlyProductField
                label="Baja"
                value={formatDate(product.deactivatedAt)}
              />
              <ReadonlyProductField
                label="Vta 6s"
                value={formatNumber(product.accumulated.salesLastSixMonths)}
              />
              <ReadonlyProductField
                label="Días Inv."
                value={product.accumulated.inventoryDays}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
