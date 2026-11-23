import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { bankAccountKeys } from "@/features/treasury/banking/logic"
import type { BankPanel } from "@/features/treasury/banking/model"
import { saveBankClassifiers } from "@/features/treasury/banking/services/bank-panel-settings-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

const labels = ["Agente", "Giro o sector", "Sucursal", "Clasificador 4", "Clasificador 5", "Clasificador 6", "Flete", "Origen", "Proyecto"]
const schema = z.object({ values: z.array(z.string()).length(9) })

type Group = {
  type: string
  value?: string
  items: { code: string; description: string }[]
}

export function BankClassifiersPanel({ accountId, data }: { accountId: number; data: BankPanel }) {
  const queryClient = useQueryClient()
  const groups = data.items as Group[]
  const { control, handleSubmit, formState: { isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { values: groups.map(({ value }) => value ?? "") },
  })
  const save = useMutation({
    mutationFn: (values: string[]) => saveBankClassifiers(accountId, Number(data.summary?.revision ?? 0), values),
    onSuccess: async () => {
      toast.success("Clasificadores guardados.")
      await queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    },
  })
  const noOptions = groups.every(({ value, items }) => !value && items.length === 0)

  return (
    <form className="mx-auto grid w-full max-w-md gap-2" onSubmit={handleSubmit(({ values }) => { save.mutate(values) })}>
      {groups.map((group, index) => {
        const options = group.items.map(({ code, description }) => ({ value: code, label: `${code} ${description}` }))
        if (group.value && !options.some(({ value }) => value === group.value)) {
          options.unshift({ value: group.value, label: group.value })
        }
        return (
          <Controller control={control} key={group.type} name={`values.${index}`} render={({ field }) => {
            const items = [{ value: "-", label: "Sin clasificador" }, ...options]
            return <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-1">
              <Label htmlFor={`bank-classifier-${accountId}-${index}`}>{labels[index]}</Label>
              <Select disabled={data.readOnly || save.isPending || options.length === 0}
                items={items} onValueChange={(value) => field.onChange(value === "-" ? "" : value)} value={field.value || "-"}>
                <SelectTrigger className="w-full" id={`bank-classifier-${accountId}-${index}`} size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>{items.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          }} />
        )
      })}
      {noOptions && <p className="text-muted-foreground">El catálogo de Bancos no tiene opciones de clasificación.</p>}
      {save.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription></Alert>}
      <div className="flex justify-end">
        <Button disabled={noOptions || data.readOnly || !isDirty || save.isPending} size="sm" type="submit">Guardar Todos</Button>
      </div>
    </form>
  )
}
