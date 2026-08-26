import type { Client } from "@/features/accounts-receivable/clients/model"
import { ReadonlyClientField } from "@/features/accounts-receivable/clients/components/readonly-client-field"
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

type ClientCatalogDetailsProps = { client: Client }

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function money(value: number) {
  return moneyFormatter.format(value)
}

function date(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  )
}

export function ClientCatalogDetails({ client }: ClientCatalogDetailsProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>Catálogo de clientes</CardTitle>
          <CardAction className="flex items-center gap-1">
            {client.indicators.hasEvents && <Badge variant="outline">Eventos *</Badge>}
            <Badge variant={client.isActive ? "secondary" : "destructive"}>
              {client.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-2 md:grid-cols-12">
            <ReadonlyClientField className="md:col-span-3" label="Cliente" value={client.code} />
            <ReadonlyClientField className="md:col-span-9" label="Razón social" value={client.name} />
            <ReadonlyClientField className="md:col-span-8" label="Dirección" value={client.address.street} />
            <ReadonlyClientField className="md:col-span-2" label="Num Ext." value={client.address.exteriorNumber} />
            <ReadonlyClientField className="md:col-span-2" label="Num Int." value={client.address.interiorNumber} />
            <ReadonlyClientField className="md:col-span-5" label="Colonia" value={client.address.neighborhood} />
            <ReadonlyClientField className="md:col-span-4" label="Delegación" value={client.address.borough} />
            <ReadonlyClientField className="md:col-span-3" label="C.P." value={client.address.postalCode} />
            <ReadonlyClientField className="md:col-span-4" label="Ciudad" value={client.address.city} />
            <ReadonlyClientField className="md:col-span-4" label="Estado" value={client.address.state} />
            <ReadonlyClientField className="md:col-span-4" label="País" value={client.address.countryCode} />
            <ReadonlyClientField className="md:col-span-6" label="Teléfonos" value={client.contact.phones} />
            <ReadonlyClientField className="md:col-span-6" label="Fax" value={client.contact.fax} />
            <ReadonlyClientField className="md:col-span-4" label="Contacto" value={client.contact.name} />
            <ReadonlyClientField className="md:col-span-5" label="e-mail" value={client.contact.email} />
            <ReadonlyClientField className="md:col-span-3" label="Web" value={client.contact.website} />
            <ReadonlyClientField className="md:col-span-4" label="R.F.C." value={client.fiscal.taxId} />
            <ReadonlyClientField className="md:col-span-4" label="CURP" value={client.fiscal.curp} />
            <ReadonlyClientField className="md:col-span-4" label="Sucursal" value={client.fiscal.branch} />
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-2 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader className="border-b"><CardTitle>Condiciones</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-2 sm:grid-cols-2">
              <ReadonlyClientField label="Lista" value={client.terms.priceList} />
              <ReadonlyClientField label="Plazo" value={client.terms.paymentTermDays} />
              <ReadonlyClientField label="Descuento 1" value={money(client.terms.discounts[0])} />
              <ReadonlyClientField label="Descuento 2" value={money(client.terms.discounts[1])} />
              <ReadonlyClientField label="Descuento 3" value={money(client.terms.discounts[2])} />
              <ReadonlyClientField label="Crédito" value={money(client.terms.creditLimit)} />
              <ReadonlyClientField label="Cad." value={date(client.terms.creditExpiresAt)} />
              <ReadonlyClientField label="Aplicar a" value={client.terms.applyToClientCode} />
              <ReadonlyClientField label="Revisión, día" value={client.terms.reviewDay} />
              <ReadonlyClientField label="Hora" value={client.terms.reviewTime} />
              <ReadonlyClientField label="Pagos, día" value={client.terms.paymentDay} />
              <ReadonlyClientField label="Hora" value={client.terms.paymentTime} />
              <ReadonlyClientField label="Alta" value={date(client.createdAt)} />
              <ReadonlyClientField label="Cta. cont." value={client.fiscal.accountingAccount} />
              <Field className="sm:col-span-2" data-disabled orientation="horizontal">
                <Checkbox checked={client.terms.reviewStartsFromInvoice} disabled id="review-from-invoice" />
                <FieldLabel htmlFor="review-from-invoice">Desde revisión</FieldLabel>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="border-b"><CardTitle>Acumulados</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-2 sm:grid-cols-2">
              <ReadonlyClientField label="Plazo real" value={client.totals.actualPaymentTermDays} />
              <ReadonlyClientField label="Última compra" value={date(client.totals.lastPurchaseAt)} />
              <ReadonlyClientField label="Último pago" value={date(client.totals.lastPaymentAt)} />
              <ReadonlyClientField label="Último pedido" value={date(client.totals.lastOrderAt)} />
              <ReadonlyClientField label="Baja" value={date(client.deactivatedAt)} />
              <ReadonlyClientField inputMode="decimal" label="Saldo anterior" value={money(client.totals.previousBalance)} />
              <ReadonlyClientField inputMode="decimal" label="Saldo actual" value={money(client.totals.currentBalance)} />
              <ReadonlyClientField inputMode="decimal" label="C. Disponible" value={money(client.totals.availableCredit)} />
              <ReadonlyClientField inputMode="decimal" label="Acumulado" value={money(client.totals.accumulatedSales)} />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
