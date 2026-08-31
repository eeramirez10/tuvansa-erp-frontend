import type { Supplier } from "@/features/accounts-payable/suppliers/model"
import { ReadonlySupplierField } from "@/features/accounts-payable/suppliers/components/readonly-supplier-field"
import { Badge } from "@/shared/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { FieldGroup } from "@/shared/ui/field"

type Props = { supplier: Supplier }

const numberFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function money(value: number) {
  return numberFormatter.format(value)
}

function date(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  )
}

const typeLabels = ["Proveedor", "Acreedor", "Deudor"] as const

export function SupplierCatalogDetails({ supplier }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Card size="sm">
        <CardHeader className="border-b bg-module-payable/10">
          <CardTitle>Catálogo de proveedores</CardTitle>
          <CardAction className="flex items-center gap-1">
            {supplier.indicators.hasEvents && <Badge variant="outline">Eventos *</Badge>}
            <Badge variant={supplier.isActive ? "secondary" : "destructive"}>
              {supplier.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-2 md:grid-cols-12">
            <ReadonlySupplierField className="md:col-span-3" label="Proveedor" value={supplier.code} />
            <ReadonlySupplierField className="md:col-span-9" label="Razón social" value={supplier.name} />
            <ReadonlySupplierField className="md:col-span-12" label="Dirección" value={supplier.address.street} />
            <ReadonlySupplierField className="md:col-span-12" label="Colonia" value={supplier.address.neighborhood} />
            <ReadonlySupplierField className="md:col-span-7" label="Ciudad" value={supplier.address.city} />
            <ReadonlySupplierField className="md:col-span-2" label="C.P." value={supplier.address.postalCode} />
            <ReadonlySupplierField className="md:col-span-3" label="Teléfono" value={supplier.contact.phone} />
            <ReadonlySupplierField className="md:col-span-7" label="Estado" value={supplier.address.state} />
            <ReadonlySupplierField className="md:col-span-5" label="Fax" value={supplier.contact.fax} />
            <ReadonlySupplierField className="md:col-span-7" label="Contacto" value={supplier.contact.name} />
            <ReadonlySupplierField className="md:col-span-5" label="Tel 2" value={supplier.contact.phone2} />
            <ReadonlySupplierField className="md:col-span-7" label="Obs." value={supplier.notes} />
            <ReadonlySupplierField className="md:col-span-5" label="e-mail" value={supplier.contact.email} />
            <ReadonlySupplierField className="md:col-span-6" label="R.F.C." value={supplier.fiscal.taxId} />
            <ReadonlySupplierField className="md:col-span-6" label="CURP" value={supplier.fiscal.curp} />
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-2 lg:grid-cols-[1.25fr_1fr]">
        <Card size="sm">
          <CardHeader className="border-b bg-module-payable/10"><CardTitle>Condiciones</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-2 sm:grid-cols-2">
              <ReadonlySupplierField label="Lista" value={supplier.terms.priceList} />
              <ReadonlySupplierField label="Plazo" value={supplier.terms.paymentTermDays} />
              <ReadonlySupplierField label="Descuento 1" value={money(supplier.terms.discounts[0])} />
              <ReadonlySupplierField label="Descuento 2" value={money(supplier.terms.discounts[1])} />
              <ReadonlySupplierField label="Aplicar a" value={supplier.terms.applyToSupplierCode} />
              <ReadonlySupplierField inputMode="decimal" label="Crédito" value={money(supplier.terms.creditLimit)} />
              <ReadonlySupplierField label="Cta. cont." value={supplier.fiscal.accountingAccount} />
              <ReadonlySupplierField label="Moneda" value={supplier.terms.currencyId} />
              <ReadonlySupplierField label="Alta" value={date(supplier.createdAt)} />
              <div className="flex min-h-5 items-center justify-end gap-3 text-[9px] sm:col-span-2">
                {typeLabels.map((label, index) => (
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
              <ReadonlySupplierField inputMode="decimal" label="Saldo anterior" value={money(supplier.totals.previousBalance)} />
              <ReadonlySupplierField label="Baja" value={date(supplier.deactivatedAt)} />
              <ReadonlySupplierField inputMode="decimal" label="Actual" value={money(supplier.totals.currentBalance)} />
              <ReadonlySupplierField className="sm:col-span-2" inputMode="decimal" label="Acumulado" value={money(supplier.totals.accumulatedPurchases)} />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
