import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import type { Order } from "@/features/sales/orders/model"
import { updateOrder } from "@/features/sales/orders/services/order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

const schema = z.object({ lines: z.array(z.object({
  productId: z.number().int().positive(), quantity: z.number().positive(),
  price: z.number().nonnegative(), discount: z.number().min(0).max(100),
})).min(1) })
type Values = z.infer<typeof schema>

export function OrderFormDialog({ order, onOpenChange, onSaved }: {
  order: Order; onOpenChange: (open: boolean) => void; onSaved: (order: Order) => void
}) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { lines: order.lines.map(line => ({
    productId: line.productId, quantity: line.ordered, price: line.price, discount: line.discount,
  })) } })
  const { fields } = useFieldArray({ control: form.control, name: "lines" })
  const mutation = useMutation({ mutationFn: (values: Values) => updateOrder(order.id, { lines: values.lines }), onSuccess: onSaved })
  return <ErpDataDialog defaultHeight={560} defaultWidth={1000} fillHeight title="Cambio de pedido" description={`Cambio de partidas del pedido ${order.number}`} tone="sales" onOpenChange={onOpenChange}>
    <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2 text-[10px]">
      {mutation.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription></Alert>}
      <form className="flex min-h-0 flex-1 flex-col gap-2" onSubmit={form.handleSubmit(values => mutation.mutate(values))}>
        <div className="min-h-0 flex-1 overflow-auto border"><table className="w-full min-w-[900px]"><thead className="sticky top-0 bg-muted"><tr>{["Código","Descripción","Pedido","UM","Surtido","Precio","Sucursal","Dto","Fecha","Pzas."].map(label => <th className="px-2 py-1 text-left" key={label}>{label}</th>)}</tr></thead><tbody>{fields.map((field,index) => {
          const line=order.lines[index]!
          return <tr className="border-t" key={field.id}><td className="px-2 py-1 font-mono">{line.productCode}</td><td className="max-w-64 truncate px-2 py-1" title={line.description}>{line.description}</td><td className="p-1"><Input className="h-5 text-right text-[10px]" min={0.001} step="0.001" type="number" {...form.register(`lines.${index}.quantity`,{valueAsNumber:true})} /></td><td className="px-2 py-1">{line.unit}</td><td className="px-2 py-1 text-right">{line.fulfilled.toFixed(3)}</td><td className="p-1"><Input className="h-5 text-right text-[10px]" min={0} step="0.00001" type="number" {...form.register(`lines.${index}.price`,{valueAsNumber:true})} /></td><td className="px-2 py-1 text-right">{line.branch}</td><td className="p-1"><Input className="h-5 text-right text-[10px]" min={0} max={100} step="0.01" type="number" {...form.register(`lines.${index}.discount`,{valueAsNumber:true})} /></td><td className="px-2 py-1">31/12/1900</td><td className="px-2 py-1">{line.piecesAssignment}</td></tr>
        })}</tbody></table></div>
        <footer className="flex justify-center gap-2"><Button disabled={mutation.isPending} size="sm" type="submit">{mutation.isPending && <Spinner />}OK</Button><Button onClick={() => onOpenChange(false)} size="sm" type="button" variant="outline">Cancelar</Button></footer>
      </form>
    </ErpDataDialogBody>
  </ErpDataDialog>
}
