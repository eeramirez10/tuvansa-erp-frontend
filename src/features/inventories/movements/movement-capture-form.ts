import { z } from "zod"
import type { MovementCaptureInput, MovementCaptureOptions } from "@/features/inventories/movements/model"
import type { Product } from "@/features/inventories/products/model"

export const movementLineLimit = 100

export const emptyMovementCaptureLine = () => ({
  code: "", product: null, quantity: "", cost: "",
})

export function movementCaptureProduct(product: Product) {
  return { id: product.id, code: product.code, description: product.description, unit: product.classification.unit.code }
}

const resolvedProduct = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  description: z.string(),
  unit: z.string(),
})

const quantitySchema = z.string().trim()
  .regex(/^(?:\d+(?:[.,]\d{1,3})?|[.,]\d{1,3})$/, "Captura una cantidad con hasta tres decimales.")
  .transform(value => Number(value.replace(",", ".")))
  .pipe(z.number().gt(0, "La cantidad debe ser mayor que cero.").max(999_999_999.999, "La cantidad rebasa el límite."))

const costSchema = z.string().trim()
  .regex(/^(?:\d+(?:[.,]\d{1,4})?|[.,]\d{1,4})?$/, "Captura un costo con hasta cuatro decimales.")
  .transform(value => value ? Number(value.replace(",", ".")) : undefined)
  .pipe(z.number().min(0).max(999_999_999.9999, "El costo rebasa el límite.").optional())

export function movementCaptureSchema(options: MovementCaptureOptions) {
  return z.object({
    type: z.enum(["EI", "SI", "TR"]),
    date: z.iso.date({ error: "Captura una fecha válida." }),
    warehouse: z.string(),
    destinationWarehouse: z.string(),
    reference: z.string().trim().max(64),
    document: z.string().trim().toUpperCase().max(15),
    lines: z.array(z.object({
      code: z.string().trim().toUpperCase().max(13),
      product: resolvedProduct.nullable(),
      quantity: quantitySchema,
      cost: costSchema,
    })).min(1).max(movementLineLimit),
  }).superRefine((draft, context) => {
    if (!options.types.some(option => option.code === draft.type)) {
      context.addIssue({ code: "custom", path: ["type"], message: "Selecciona un tipo disponible." })
    }
    if (!options.warehouses.some(option => option.code === draft.warehouse)) {
      context.addIssue({ code: "custom", path: ["warehouse"], message: "Selecciona un almacén del catálogo." })
    }
    if (draft.type === "TR" && (!options.warehouses.some(option => option.code === draft.destinationWarehouse)
      || draft.destinationWarehouse === draft.warehouse)) {
      context.addIssue({ code: "custom", path: ["destinationWarehouse"], message: "Selecciona un almacén destino distinto del origen." })
    }
    if (draft.document && (!draft.document.startsWith(draft.type) || !/^(EI|SI|TR)[A-Z0-9][A-Z0-9-]*$/.test(draft.document))) {
      context.addIssue({ code: "custom", path: ["document"], message: `El folio debe iniciar con ${draft.type} y usar letras, dígitos o guiones.` })
    }
    draft.lines.forEach((line, index) => {
      if (!line.product || line.code !== line.product.code.trim().toUpperCase()) {
        context.addIssue({ code: "custom", path: ["lines", index, "code"], message: "Selecciona un producto activo del catálogo." })
      }
    })
  })
}

export type MovementCaptureDraft = z.input<ReturnType<typeof movementCaptureSchema>>
export type MovementCaptureValues = z.output<ReturnType<typeof movementCaptureSchema>>

export function movementCapturePayload(draft: MovementCaptureValues): Omit<MovementCaptureInput, "requestKey"> {
  const { type, date, warehouse, destinationWarehouse, reference, document, lines } = draft
  return {
    type, date, warehouse,
    ...(type === "TR" ? { destinationWarehouse } : {}),
    ...(reference ? { reference } : {}),
    ...(document ? { document } : {}),
    lines: lines.flatMap(({ product, quantity, cost }) => product
      ? [{ productId: product.id, quantity, ...(cost === undefined ? {} : { cost }) }]
      : []),
  }
}
