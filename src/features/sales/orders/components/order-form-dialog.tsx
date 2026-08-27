import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { Order, OrderMutationInput } from "@/features/sales/orders/model"
import { createOrder, updateOrder } from "@/features/sales/orders/services/order-service"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"

const schema = z.object({
  number: z.string().trim(), customerId: z.coerce.number().int().positive(),
  customerOrderNumber: z.string(), orderedAt: z.string().min(10), from: z.string().min(10), dueAt: z.string().min(10),
  status: z.string(), branch: z.coerce.number().int().nonnegative(), department: z.string(),
  attentionCode: z.string(), termsDays: z.coerce.number().int().nonnegative(), warehouse: z.string().min(1),
  currencyId: z.coerce.number().int().nonnegative(), observations: z.string(),
  productId: z.coerce.number().int().nonnegative(), quantity: z.coerce.number().nonnegative(),
  price: z.coerce.number().nonnegative(), discount: z.coerce.number().min(0).max(100),
})
type Values = z.infer<typeof schema>
type InputValues = z.input<typeof schema>
const today = new Date().toISOString().slice(0, 10)

export function OrderFormDialog({ mode, order, onOpenChange, onSaved }: { mode: "create" | "edit"; order?: Order; onOpenChange: (open: boolean) => void; onSaved: (order: Order) => void }) {
  const line = order?.lines[0]
  const form = useForm<InputValues, unknown, Values>({ resolver: zodResolver(schema), defaultValues: {
    number: order?.number ?? "", customerId: order?.customer.id ?? 0,
    customerOrderNumber: order?.customerOrderNumber ?? "", orderedAt: order?.dates.orderedAt ?? today,
    from: order?.dates.from ?? today, dueAt: order?.dates.dueAt ?? today, status: order?.status ?? "",
    branch: order?.branch ?? 0, department: order?.department ?? "", attentionCode: order?.classifications[0] ?? "",
    termsDays: order?.termsDays ?? 0, warehouse: order?.warehouse ?? "01", currencyId: order?.currencyId ?? 1,
    observations: order?.observations ?? "", productId: line?.productId ?? 0,
    quantity: line?.ordered ?? 0, price: line?.price ?? 0, discount: line?.discount ?? 0,
  } })
  const mutation = useMutation({
    mutationFn: (values: Values) => {
      const common: OrderMutationInput = {
        customerId: values.customerId, customerOrderNumber: values.customerOrderNumber,
        orderedAt: values.orderedAt, from: values.from, dueAt: values.dueAt,
        branch: values.branch, department: values.department, attentionCode: values.attentionCode,
        termsDays: values.termsDays, warehouse: values.warehouse, currencyId: values.currencyId,
        observations: values.observations,
      }
      if (mode === "create") return createOrder({ ...common, number: values.number, lines: [{ productId: values.productId, quantity: values.quantity, price: values.price, discount: values.discount }] })
      return updateOrder(order!.id, { ...common, status: values.status })
    },
    onSuccess: onSaved,
  })
  const fields: Array<[keyof Values, string, string?]> = [
    ["number", "Pedido"], ["customerId", "Cliente (ID)", "number"], ["customerOrderNumber", "Pedido cliente"],
    ["orderedAt", "Fecha", "date"], ["from", "Desde", "date"], ["dueAt", "Vence", "date"],
    ["status", "Status"], ["branch", "Sucursal", "number"], ["department", "Depto"],
    ["attentionCode", "Agente"], ["termsDays", "Plazo", "number"], ["warehouse", "Almacén"],
    ["currencyId", "Moneda", "number"],
  ]
  return (
    <ErpDataDialog className="sm:max-w-[44rem]" description={`${mode === "create" ? "Alta" : "Edición"} de pedido`} onOpenChange={onOpenChange} title={mode === "create" ? "Nuevo pedido" : "Editar pedido"}>
      <ErpDataDialogBody><form className="grid gap-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="grid grid-cols-2 gap-1 md:grid-cols-4">{fields.map(([name, label, type]) => <label className={name === "customerOrderNumber" ? "md:col-span-2" : ""} key={name}><span>{label}</span><Input className="h-5 text-[9px]" disabled={mode === "edit" && name === "number"} type={type} {...form.register(name)} /></label>)}</div>
        {mode === "create" && <fieldset className="grid grid-cols-4 gap-1 border p-1"><legend>Primera partida</legend><label>Producto (ID)<Input className="h-5 text-[9px]" type="number" {...form.register("productId")} /></label><label>Cantidad<Input className="h-5 text-[9px]" type="number" step="0.001" {...form.register("quantity")} /></label><label>Precio<Input className="h-5 text-[9px]" type="number" step="0.00001" {...form.register("price")} /></label><label>Descto %<Input className="h-5 text-[9px]" type="number" step="0.01" {...form.register("discount")} /></label></fieldset>}
        <label>Observaciones<Input className="h-12 text-[9px]" {...form.register("observations")} /></label>
        {mutation.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription></Alert>}
        <footer className="flex justify-end gap-1"><Button disabled={mutation.isPending} size="sm" type="submit" variant="outline">{mutation.isPending && <Spinner />}✓ Guardar</Button><Button onClick={() => onOpenChange(false)} size="sm" type="button" variant="outline">× Cancelar</Button></footer>
      </form></ErpDataDialogBody>
    </ErpDataDialog>
  )
}
