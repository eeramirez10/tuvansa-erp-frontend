import { useId } from "react"
import { Controller } from "react-hook-form"
import type { Supplier } from "@/features/accounts-payable/suppliers/model"
import { supplierDateLabel } from "@/features/accounts-payable/suppliers/logic"
import { ReadonlySupplierField } from "@/features/accounts-payable/suppliers/components/readonly-supplier-field"
import { SupplierCatalogField, type SupplierCatalogEditor } from "@/features/accounts-payable/suppliers/components/supplier-catalog-field"
import { Badge } from "@/shared/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { FieldError, FieldGroup } from "@/shared/ui/field"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"

type Props = { supplier: Supplier; editor?: SupplierCatalogEditor }

const numberFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function money(value: number) {
  return numberFormatter.format(value)
}

function date(value: string | null) {
  return supplierDateLabel(value) || "—"
}

const typeLabels = ["Proveedor", "Acreedor", "Deudor"] as const

export function SupplierCatalogDetails({ supplier, editor }: Props) {
  const typeId = useId()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Card size="sm">
        <CardHeader className="border-b bg-module-payable/10">
          <CardTitle>Catálogo de proveedores</CardTitle>
          <CardAction className="flex items-center gap-1">
            {supplier.indicators.hasEvents && <Badge variant="outline">Eventos *</Badge>}
            {supplier.id > 0 && <Badge variant={supplier.isActive ? "secondary" : "destructive"}>
              {supplier.isActive ? "Activo" : "Inactivo"}
            </Badge>}
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-2 md:grid-cols-12">
            <SupplierCatalogField className="md:col-span-3" editor={editor} field="code" label="Proveedor" value={supplier.code} />
            <SupplierCatalogField className="md:col-span-9" editor={editor} field="name" label="Razón social" value={supplier.name} />
            <SupplierCatalogField className="md:col-span-12" editor={editor} field="address.street" label="Dirección" value={supplier.address.street} />
            <SupplierCatalogField className="md:col-span-12" editor={editor} field="address.neighborhood" label="Colonia" value={supplier.address.neighborhood} />
            <SupplierCatalogField className="md:col-span-7" editor={editor} field="address.city" label="Ciudad" value={supplier.address.city} />
            <SupplierCatalogField className="md:col-span-2" editor={editor} field="address.postalCode" label="C.P." value={supplier.address.postalCode} />
            <SupplierCatalogField className="md:col-span-3" editor={editor} field="contact.phone" label="Teléfono" value={supplier.contact.phone} inputMode="tel" />
            <SupplierCatalogField className="md:col-span-7" editor={editor} field="address.state" label="Estado" value={supplier.address.state} />
            <SupplierCatalogField className="md:col-span-5" editor={editor} field="contact.fax" label="Fax" value={supplier.contact.fax} />
            <SupplierCatalogField className="md:col-span-7" editor={editor} field="contact.name" label="Contacto" value={supplier.contact.name} />
            <SupplierCatalogField className="md:col-span-5" editor={editor} field="contact.phone2" label="Tel 2" value={supplier.contact.phone2} inputMode="tel" />
            <SupplierCatalogField className="md:col-span-7" editor={editor} field="notes" label="Obs." value={supplier.notes} />
            <SupplierCatalogField className="md:col-span-5" editor={editor} field="contact.email" label="e-mail" value={supplier.contact.email} inputMode="email" />
            <SupplierCatalogField className="md:col-span-6" editor={editor} field="fiscal.taxId" label="R.F.C." value={supplier.fiscal.taxId} />
            <SupplierCatalogField className="md:col-span-6" editor={editor} field="fiscal.curp" label="CURP" value={supplier.fiscal.curp} />
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-2 lg:grid-cols-[1.25fr_1fr]">
        <Card size="sm">
          <CardHeader className="border-b bg-module-payable/10"><CardTitle>Condiciones</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-2 sm:grid-cols-2">
              <SupplierCatalogField editor={editor} field="terms.priceList" label="Lista" numeric value={supplier.terms.priceList} />
              <SupplierCatalogField editor={editor} field="terms.paymentTermDays" label="Plazo" numeric value={supplier.terms.paymentTermDays} />
              <SupplierCatalogField decimal editor={editor} field="terms.discounts.0" label="Descuento 1" value={money(supplier.terms.discounts[0])} />
              <SupplierCatalogField decimal editor={editor} field="terms.discounts.1" label="Descuento 2" value={money(supplier.terms.discounts[1])} />
              <SupplierCatalogField editor={editor} field="terms.applyToSupplierCode" label="Aplicar a" value={supplier.terms.applyToSupplierCode} />
              {supplier.terms.creditLimit !== null && <SupplierCatalogField editor={editor} field="terms.creditLimit"
                inputMode="numeric" label="Crédito" numeric value={money(supplier.terms.creditLimit)} />}
              <SupplierCatalogField editor={editor} field="fiscal.accountingAccount" label="Cta. cont." value={supplier.fiscal.accountingAccount} />
              <SupplierCatalogField editor={editor} field="terms.currencyId" label="Moneda" numeric value={supplier.terms.currencyId} />
              <ReadonlySupplierField label="Alta" value={date(supplier.createdAt)} />
              <div className="flex min-h-5 items-center justify-end gap-3 text-[9px] sm:col-span-2">
                {editor ? <Controller control={editor.form.control} name="terms.type" render={({ field, fieldState }) => (
                  <div className="grid gap-1">
                    <RadioGroup aria-label="Tipo de proveedor" className="flex items-center gap-3" disabled={editor.disabled}
                      onValueChange={value => field.onChange(Number(value))} value={field.value}>
                      {typeLabels.map((label, index) => (
                        <div className="flex items-center gap-1" key={label}>
                          <RadioGroupItem id={`${typeId}-${index}`} value={index} />
                          <Label htmlFor={`${typeId}-${index}`}>{label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <FieldError errors={[fieldState.error]} />
                  </div>
                )} /> : typeLabels.map((label, index) => (
                  <label className="flex items-center gap-1" key={label}>
                    <input checked={supplier.terms.type === index} disabled readOnly type="radio" />
                    {label}
                  </label>
                ))}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b bg-module-payable/10"><CardTitle>Acumulados</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-2 sm:grid-cols-2">
              <ReadonlySupplierField label="Plazo real" value={supplier.totals.actualPaymentTermDays} />
              <ReadonlySupplierField label="Última compra" value={date(supplier.totals.lastPurchaseAt)} />
              <ReadonlySupplierField label="Pago" value={date(supplier.totals.lastPaymentAt)} />
              {supplier.totals.previousBalance !== null && <ReadonlySupplierField inputMode="decimal" label="Saldo anterior" value={money(supplier.totals.previousBalance)} />}
              <ReadonlySupplierField label="Baja" value={date(supplier.deactivatedAt)} />
              {supplier.totals.currentBalance !== null && <ReadonlySupplierField inputMode="decimal" label="Actual" value={money(supplier.totals.currentBalance)} />}
              <ReadonlySupplierField className="sm:col-span-2" inputMode="decimal" label="Acumulado" value={money(supplier.totals.accumulatedPurchases)} />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
