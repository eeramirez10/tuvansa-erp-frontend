import FloppyDiskIcon from "@hugeicons/core-free-icons/FloppyDiskIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, type FieldError, type UseFormRegisterReturn } from "react-hook-form"

import { getClientFormDefaults, clientKeys, toClientMutationInput } from "@/features/accounts-receivable/clients/logic"
import { clientFormSchema, type Client, type ClientFormValues } from "@/features/accounts-receivable/clients/model"
import { createClient, updateClient } from "@/features/accounts-receivable/clients/services/client-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Field, FieldError as FormFieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Spinner } from "@/shared/ui/spinner"

type ClientFormDialogProps = {
  mode: "create" | "edit"
  client?: Client
  onOpenChange: (open: boolean) => void
  onSaved: (client: Client, mode: "create" | "edit") => void
}

function ClientInput({ label, registration, error, type = "text", step }: {
  label: string
  registration: UseFormRegisterReturn
  error?: FieldError
  type?: "text" | "number" | "date"
  step?: string
}) {
  return (
    <Field className="gap-1" data-invalid={Boolean(error)} orientation="horizontal">
      <FieldLabel className="shrink-0 whitespace-nowrap">{label}</FieldLabel>
      <div className="min-w-0 flex-1">
        <Input aria-invalid={Boolean(error)} className="h-6 px-1 text-[10px]" step={step} type={type} {...registration} />
        <FormFieldError errors={[error]} />
      </div>
    </Field>
  )
}

export function ClientFormDialog({ mode, client, onOpenChange, onSaved }: ClientFormDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<ClientFormValues>({
    defaultValues: getClientFormDefaults(client),
    resolver: zodResolver(clientFormSchema),
  })
  const mutation = useMutation({
    mutationFn: (values: ClientFormValues) => {
      const input = toClientMutationInput(values)
      return mode === "create" ? createClient(input) : updateClient(client!.id, input)
    },
    onSuccess: async (savedClient) => {
      queryClient.setQueryData(clientKeys.detail(savedClient.id), savedClient)
      await queryClient.invalidateQueries({ queryKey: clientKeys.all })
      onSaved(savedClient, mode)
    },
  })
  const registerNumber = (name: "priceList" | "discount1" | "discount2" | "discount3" | "paymentTermDays" | "creditLimit") => form.register(name, { valueAsNumber: true })

  return (
    <ErpDataDialog className="sm:max-w-5xl" description="Capture los campos visibles del Catálogo de clientes." onOpenChange={onOpenChange} title={mode === "create" ? "Nuevo cliente" : "Editar cliente"} tone="receivable">
      <ErpDataDialogBody className="p-3">
        <form className="flex min-h-0 flex-col gap-3" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <ScrollArea className="h-[68vh] pr-3">
            <div className="flex flex-col gap-3">
              {mutation.isError && <Alert variant="destructive"><AlertTitle>No fue posible guardar el cliente</AlertTitle><AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription></Alert>}
              <FieldSet>
                <FieldLegend>Catálogo de clientes</FieldLegend>
                <FieldGroup className="grid gap-2 md:grid-cols-12">
                  <div className="md:col-span-3"><ClientInput error={form.formState.errors.code} label="Cliente" registration={form.register("code")} /></div>
                  <div className="md:col-span-9"><ClientInput error={form.formState.errors.name} label="Razón social" registration={form.register("name")} /></div>
                  <div className="md:col-span-8"><ClientInput label="Dirección" registration={form.register("street")} /></div>
                  <div className="md:col-span-2"><ClientInput label="Num Ext." registration={form.register("exteriorNumber")} /></div>
                  <div className="md:col-span-2"><ClientInput label="Num Int." registration={form.register("interiorNumber")} /></div>
                  <div className="md:col-span-4"><ClientInput label="Colonia" registration={form.register("neighborhood")} /></div>
                  <div className="md:col-span-3"><ClientInput label="Delegación" registration={form.register("borough")} /></div>
                  <div className="md:col-span-3"><ClientInput label="Ciudad" registration={form.register("city")} /></div>
                  <div className="md:col-span-2"><ClientInput label="C.P." registration={form.register("postalCode")} /></div>
                  <div className="md:col-span-4"><ClientInput label="Estado" registration={form.register("state")} /></div>
                  <div className="md:col-span-2"><ClientInput label="País" registration={form.register("countryCode")} /></div>
                  <div className="md:col-span-6"><ClientInput label="Teléfonos" registration={form.register("phones")} /></div>
                  <div className="md:col-span-4"><ClientInput label="Contacto" registration={form.register("contactName")} /></div>
                  <div className="md:col-span-4"><ClientInput label="e-mail" registration={form.register("email")} /></div>
                  <div className="md:col-span-4"><ClientInput label="Web" registration={form.register("website")} /></div>
                  <div className="md:col-span-4"><ClientInput label="Fax" registration={form.register("fax")} /></div>
                  <div className="md:col-span-3"><ClientInput label="R.F.C." registration={form.register("taxId")} /></div>
                  <div className="md:col-span-3"><ClientInput label="CURP" registration={form.register("curp")} /></div>
                  <div className="md:col-span-3"><ClientInput label="Sucursal" registration={form.register("branch")} /></div>
                </FieldGroup>
              </FieldSet>
              <FieldSet>
                <FieldLegend>Condiciones</FieldLegend>
                <FieldGroup className="grid gap-2 md:grid-cols-3">
                  <ClientInput label="Lista" registration={registerNumber("priceList")} type="number" />
                  <ClientInput label="Descuento 1" registration={registerNumber("discount1")} step="0.01" type="number" />
                  <ClientInput label="Descuento 2" registration={registerNumber("discount2")} step="0.01" type="number" />
                  <ClientInput label="Descuento 3" registration={registerNumber("discount3")} step="0.01" type="number" />
                  <ClientInput label="Plazo" registration={registerNumber("paymentTermDays")} type="number" />
                  <ClientInput label="Crédito" registration={registerNumber("creditLimit")} step="0.01" type="number" />
                  <ClientInput label="Cad." registration={form.register("creditExpiresAt")} type="date" />
                  <ClientInput label="Revisión, día" registration={form.register("reviewDay")} />
                  <ClientInput label="Hora" registration={form.register("reviewTime")} />
                  <ClientInput label="Pagos, día" registration={form.register("paymentDay")} />
                  <ClientInput label="Hora" registration={form.register("paymentTime")} />
                  <ClientInput label="Aplicar a" registration={form.register("applyToClientCode")} />
                  <ClientInput label="Cta. cont." registration={form.register("accountingAccount")} />
                  <Controller control={form.control} name="reviewStartsFromInvoice" render={({ field }) => <Field orientation="horizontal"><Checkbox checked={field.value} id="client-review-from-invoice" onCheckedChange={field.onChange} /><FieldLabel htmlFor="client-review-from-invoice">Desde revisión</FieldLabel></Field>} />
                </FieldGroup>
              </FieldSet>
            </div>
          </ScrollArea>
          <footer className="flex justify-end gap-2">
            <Button disabled={mutation.isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">Cancelar</Button>
            <Button disabled={mutation.isPending} type="submit">{mutation.isPending ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon data-icon="inline-start" icon={FloppyDiskIcon} strokeWidth={2} />}Guardar</Button>
          </footer>
        </form>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
