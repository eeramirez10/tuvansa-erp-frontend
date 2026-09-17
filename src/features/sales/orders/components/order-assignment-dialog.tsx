import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import type { Order } from "@/features/sales/orders/model"
import { setOrderAssignment } from "@/features/sales/orders/services/order-capture-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

const schema = z.object({ lines: z.array(z.object({
  lineId: z.number().int().positive(), productCode: z.string(), description: z.string(),
  ordered: z.number(), fulfilled: z.number(), previous: z.number(), assigned: z.number().min(0),
})).min(1) })
type Values = z.infer<typeof schema>

export function OrderAssignmentDialog({ order, onOpenChange, onSaved }: {
  order: Order; onOpenChange: (open: boolean) => void; onSaved: (order: Order) => void
}) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { lines: order.lines.map(line => ({
    lineId: line.id, productCode: line.productCode, description: line.description,
    ordered: line.ordered, fulfilled: line.fulfilled, previous: line.assigned, assigned: line.assigned,
  })) } })
  const { fields } = useFieldArray({ control: form.control, name: "lines" })
  const mutation = useMutation({ mutationFn: (values: Values) => setOrderAssignment(order.id,
    values.lines.map(line => ({ lineId: line.lineId, assigned: line.assigned }))), onSuccess: onSaved })
  return <ErpDataDialog defaultHeight={480} defaultWidth={920} fillHeight title="Asignación de Pedido" description={`Asignación del pedido ${order.number}`} tone="sales" onOpenChange={onOpenChange}>
    <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2 text-[10px]">
      {mutation.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription></Alert>}
      <form className="flex min-h-0 flex-1 flex-col gap-2" onSubmit={form.handleSubmit(values => mutation.mutate(values))}>
        <div className="min-h-0 flex-1 overflow-auto border"><table className="w-full min-w-[780px]"><thead className="sticky top-0 bg-muted"><tr>{["Código","Descripción","Pedido","Surtido","A Ant","A Act","Disponible"].map(label => <th className="px-2 py-1 text-left" key={label}>{label}</th>)}</tr></thead><tbody>{fields.map((field,index) => {
          const line = order.lines[index]!
          return <tr className="border-t" key={field.id}><td className="px-2 py-1 font-mono">{line.productCode}</td><td className="px-2 py-1">{line.description}</td><td className="px-2 py-1 text-right">{line.ordered.toFixed(3)}</td><td className="px-2 py-1 text-right">{line.fulfilled.toFixed(3)}</td><td className="px-2 py-1 text-right">{line.assigned.toFixed(3)}</td><td className="p-1"><Input className="h-5 text-right text-[10px]" max={Math.max(0,line.ordered-line.fulfilled)} min={0} step="0.001" type="number" {...form.register(`lines.${index}.assigned`, { valueAsNumber:true })} /></td><td className="px-2 py-1 text-right">{Math.max(0,line.ordered-line.fulfilled).toFixed(3)}</td></tr>
        })}</tbody></table></div>
        <footer className="flex justify-end gap-2"><Button disabled={mutation.isPending} size="sm" type="submit">{mutation.isPending && <Spinner />}OK</Button><Button onClick={() => onOpenChange(false)} size="sm" type="button" variant="outline">Cancelar</Button></footer>
      </form>
    </ErpDataDialogBody>
  </ErpDataDialog>
}
