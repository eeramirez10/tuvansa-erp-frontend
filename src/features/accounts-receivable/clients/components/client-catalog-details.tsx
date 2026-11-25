import { useId, type ComponentProps } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import type { Client, ClientFormValues } from "@/features/accounts-receivable/clients/model"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/utils/cn"

type Editor = { form: UseFormReturn<ClientFormValues>; disabled: boolean; onCodeBlur: (value: string) => void; onCodeChange: () => void }
type ClientCatalogDetailsProps = { client: Client; editor?: Editor }

function CatalogField({ editor, name, type = "text", step, ...props }: ComponentProps<typeof ReadonlyClientField> & {
  editor?: Editor
  name: Exclude<keyof ClientFormValues, "reviewStartsFromInvoice">
  type?: "text" | "date" | "number"
  step?: string
}) {
  const id = useId()
  if (!editor) return <ReadonlyClientField {...props} />
  const { form } = editor
  const registration = form.register(name, { valueAsNumber: type === "number" })
  const { error } = form.getFieldState(name, form.formState)
  return (
    <Field className={cn("min-w-0 items-center gap-1", props.className)} data-invalid={Boolean(error)} orientation="horizontal">
      <FieldLabel className="shrink-0 whitespace-nowrap" htmlFor={id}>{props.label}</FieldLabel>
      <div className="min-w-0 flex-1">
        <Input aria-invalid={Boolean(error)} className="h-5 min-w-0 px-1 text-[9px]/tight" disabled={editor.disabled}
          id={id} inputMode={props.inputMode} maxLength={name === "code" ? 6 : undefined} step={step} type={type} {...registration}
          onBlur={event => {
            const value = event.currentTarget.value
            void registration.onBlur(event)
            if (name === "code") editor.onCodeBlur(value)
          }} onChange={event => {
            if (name === "code") editor.onCodeChange()
            void registration.onChange(event)
          }} />
        <FieldError errors={[error]} />
      </div>
    </Field>
  )
}

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

export function ClientCatalogDetails({ client, editor }: ClientCatalogDetailsProps) {
  const reviewId = useId()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>Catálogo de clientes</CardTitle>
          <CardAction className="flex items-center gap-1">
            {client.indicators.hasEvents && <Badge variant="outline">Eventos *</Badge>}
            {client.id > 0 && <Badge variant={client.isActive ? "secondary" : "destructive"}>
              {client.isActive ? "Activo" : "Inactivo"}
            </Badge>}
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-2 md:grid-cols-12">
            <CatalogField className="md:col-span-3" editor={editor} label="Cliente" name="code" value={client.code} />
            <CatalogField className="md:col-span-9" editor={editor} label="Razón social" name="name" value={client.name} />
            <CatalogField className="md:col-span-8" editor={editor} label="Dirección" name="street" value={client.address.street} />
            <CatalogField className="md:col-span-2" editor={editor} label="Num Ext." name="exteriorNumber" value={client.address.exteriorNumber} />
            <CatalogField className="md:col-span-2" editor={editor} label="Num Int." name="interiorNumber" value={client.address.interiorNumber} />
            <CatalogField className="md:col-span-5" editor={editor} label="Colonia" name="neighborhood" value={client.address.neighborhood} />
            <CatalogField className="md:col-span-4" editor={editor} label="Delegación" name="borough" value={client.address.borough} />
            <CatalogField className="md:col-span-3" editor={editor} label="C.P." name="postalCode" value={client.address.postalCode} />
            <CatalogField className="md:col-span-4" editor={editor} label="Ciudad" name="city" value={client.address.city} />
            <CatalogField className="md:col-span-4" editor={editor} label="Estado" name="state" value={client.address.state} />
            <CatalogField className="md:col-span-4" editor={editor} label="País" name="countryCode" value={client.address.countryCode} />
            <CatalogField className="md:col-span-6" editor={editor} label="Teléfonos" name="phones" value={client.contact.phones} />
            <CatalogField className="md:col-span-6" editor={editor} label="Fax" name="fax" value={client.contact.fax} />
            <CatalogField className="md:col-span-4" editor={editor} label="Contacto" name="contactName" value={client.contact.name} />
            <CatalogField className="md:col-span-5" editor={editor} label="e-mail" name="email" value={client.contact.email} />
            <CatalogField className="md:col-span-3" editor={editor} label="Web" name="website" value={client.contact.website} />
            <CatalogField className="md:col-span-4" editor={editor} label="R.F.C." name="taxId" value={client.fiscal.taxId} />
            <CatalogField className="md:col-span-4" editor={editor} label="CURP" name="curp" value={client.fiscal.curp} />
            <CatalogField className="md:col-span-4" editor={editor} label="Sucursal" name="branch" value={client.fiscal.branch} />
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-2 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader className="border-b"><CardTitle>Condiciones</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-2 sm:grid-cols-2">
              <CatalogField editor={editor} label="Lista" name="priceList" value={client.terms.priceList} type="number" />
              <CatalogField editor={editor} label="Plazo" name="paymentTermDays" value={client.terms.paymentTermDays} type="number" />
              <CatalogField editor={editor} label="Descuento 1" name="discount1" value={money(client.terms.discounts[0])} type="number" step="0.01" />
              <CatalogField editor={editor} label="Descuento 2" name="discount2" value={money(client.terms.discounts[1])} type="number" step="0.01" />
              <CatalogField editor={editor} label="Descuento 3" name="discount3" value={money(client.terms.discounts[2])} type="number" step="0.01" />
              {client.terms.creditLimit !== null && <CatalogField editor={editor} label="Crédito" name="creditLimit"
                value={money(client.terms.creditLimit)} type="number" step="0.01" />}
              <CatalogField editor={editor} label="Cad." name="creditExpiresAt" value={date(client.terms.creditExpiresAt)} type="date" />
              <CatalogField editor={editor} label="Aplicar a" name="applyToClientCode" value={client.terms.applyToClientCode} />
              <CatalogField editor={editor} label="Revisión, día" name="reviewDay" value={client.terms.reviewDay} />
              <CatalogField editor={editor} label="Hora" name="reviewTime" value={client.terms.reviewTime} />
              <CatalogField editor={editor} label="Pagos, día" name="paymentDay" value={client.terms.paymentDay} />
              <CatalogField editor={editor} label="Hora" name="paymentTime" value={client.terms.paymentTime} />
              <ReadonlyClientField label="Alta" value={date(client.createdAt)} />
              <CatalogField editor={editor} label="Cta. cont." name="accountingAccount" value={client.fiscal.accountingAccount} />
              <Field className="sm:col-span-2" data-disabled={!editor || editor.disabled} orientation="horizontal">
                {editor ? <Controller control={editor.form.control} name="reviewStartsFromInvoice" render={({ field }) => (
                  <Checkbox checked={field.value} disabled={editor.disabled} id={reviewId} onBlur={field.onBlur}
                    onCheckedChange={field.onChange} ref={field.ref} />
                )} /> : <Checkbox checked={client.terms.reviewStartsFromInvoice} disabled id={reviewId} />}
                <FieldLabel htmlFor={reviewId}>Desde revisión</FieldLabel>
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
              {client.totals.currentBalance !== null && <>
                <ReadonlyClientField inputMode="decimal" label="Saldo anterior" value={money(client.totals.previousBalance)} />
                <ReadonlyClientField inputMode="decimal" label="Saldo actual" value={money(client.totals.currentBalance)} />
                <ReadonlyClientField inputMode="decimal" label="C. Disponible" value={money(client.totals.availableCredit)} />
              </>}
              <ReadonlyClientField inputMode="decimal" label="Acumulado" value={money(client.totals.accumulatedSales)} />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
