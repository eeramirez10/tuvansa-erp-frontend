import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientFiscalQueryOptions } from "@/features/accounts-receivable/clients/fiscal-logic"
import { fiscalValuesSchema, splitFiscalName, type ClientFiscal, type FiscalValues } from "@/features/accounts-receivable/clients/fiscal-model"
import { clientKeys } from "@/features/accounts-receivable/clients/logic"
import { saveClientFiscal } from "@/features/accounts-receivable/clients/services/client-fiscal-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert"
import { Spinner } from "@/shared/ui/spinner"

type Props = { clientId: number; onOpenChange: (open: boolean) => void; onSaved: (message: string) => void }

function FiscalForm({ data: loadedData, onOpenChange, onSaved, onBusy }: Props & { data: ClientFiscal; onBusy: (busy: boolean) => void }) {
  // Keep the version paired with the values originally opened, even after a background refetch.
  const [data] = useState(loadedData)
  const queryClient = useQueryClient()
  const initial = splitFiscalName(data.values.name, data.capitalRegimes)
  const [baseName, setBaseName] = useState(initial.baseName)
  const [regime, setRegime] = useState(initial.capitalRegime)
  const [other, setOther] = useState("")
  const form = useForm<FiscalValues>({ defaultValues: data.values, resolver: zodResolver(fiscalValuesSchema) })
  const fullName = useWatch({ control: form.control, name: 'name' })
  const updateName = (base: string, code: string, custom: string) => {
    const suffix = code === "__other" ? custom.trim() : code
    form.setValue("name", suffix ? `${base.trim()}, ${suffix}` : base.trim(), { shouldDirty: true, shouldValidate: true })
  }
  const mutation = useMutation({
    mutationFn: (values: FiscalValues) => saveClientFiscal(data.clientId, values, data.version),
    onMutate: () => onBusy(true),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: clientKeys.all })
      onSaved(result.message)
    },
    onSettled: () => onBusy(false),
  })
  return (
    <form className="flex min-h-0 flex-col gap-2" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
      <Alert><AlertTitle>Verificación pendiente</AlertTitle><AlertDescription>Los cambios se guardan sin verificar. Complete la verificación fiscal en PROSCAI.</AlertDescription></Alert>
      {mutation.isError && <Alert variant="destructive"><AlertTitle>No fue posible guardar</AlertTitle><AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription></Alert>}
      <fieldset disabled={mutation.isPending} className="contents">
        <div className="grid grid-cols-3 gap-2">
          {([['taxId', 'RFC'], ['postalCode', 'Código postal'], ['fiscalRegime', 'Régimen fiscal']] as const).map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1 text-xs">{label}
              <Input {...form.register(key)} aria-invalid={!!form.formState.errors[key]} />
              <span className="bg-muted px-1">{data.values[key]}</span>
              {form.formState.errors[key] && <span role="alert">{form.formState.errors[key]?.message}</span>}
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs">nombre
          <Input value={baseName} onChange={(e) => { setBaseName(e.target.value); updateName(e.target.value, regime, other) }} />
          <span className="bg-muted px-1">{data.values.name}</span>
          {form.formState.errors.name && <span role="alert">{form.formState.errors.name.message}</span>}
        </label>
        <div className="flex items-center justify-between text-xs"><span>Régimen de capital (sólo personas morales):</span><Button type="button" size="xs" disabled title="Actualización del catálogo pendiente de investigar">Act.</Button></div>
        <div className="max-h-[38vh] min-h-28 overflow-auto border">
          <table className="w-full min-w-[38rem] text-xs"><thead className="sr-only"><tr><th>Selección</th><th>Código</th><th>Descripción</th></tr></thead><tbody>
            {[...data.capitalRegimes, { code: '__other', description: 'SELECCIONE ESTA LÍNEA SI NO ENCUENTRA EL RÉGIMEN DE CAPITAL EN LA LISTA.' }].map((row) => (
              <tr className={regime === row.code ? 'bg-muted' : ''} key={row.code}>
                <td><input type="radio" name="capital-regime" aria-label={row.description} checked={regime === row.code} onChange={() => { setRegime(row.code); updateName(baseName, row.code, other) }} /></td>
                <td className="whitespace-nowrap p-1">{row.code === '__other' ? '--- OTRO ---' : row.code}</td><td className="whitespace-nowrap p-1">{row.description}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        {data.capitalRegimes.length === 0 && <p role="status">No hay regímenes de capital configurados. Puede conservar el nombre completo.</p>}
        <label className="flex flex-col gap-1 text-xs">Otro:<Input disabled={regime !== '__other'} value={other} onChange={(e) => { setOther(e.target.value); updateName(baseName, regime, e.target.value) }} /></label>
        <p className="text-xs">Nombre a guardar: {fullName}</p>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit">{mutation.isPending && <Spinner />}OK</Button></div>
      </fieldset>
    </form>
  )
}

export function ClientFiscalDialog(props: Props) {
  const query = useQuery(clientFiscalQueryOptions(props.clientId))
  const [busy, setBusy] = useState(false)
  const close = (open: boolean) => { if (!busy) props.onOpenChange(open) }
  return (
    <ErpDataDialog title="Cliente - Datos Fiscal" description="Datos fiscales del cliente" tone="receivable" onOpenChange={close}>
      <ErpDataDialogBody className="p-3">
        {query.isPending ? <Spinner /> : query.isError ? <Alert variant="destructive"><AlertTitle>No fue posible cargar los datos fiscales</AlertTitle><AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription><Button onClick={() => void query.refetch()}>Reintentar</Button></Alert> : <FiscalForm {...props} onOpenChange={close} onBusy={setBusy} data={query.data} />}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
