import { useState } from "react"

import { env } from "@/app/config/env"
import type { CaptureProductMatch } from "@/features/sales/orders/capture-model"
import { Button } from "@/shared/ui/button"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"

const variants = [
  ["normal", "Normal"], ["sketch", "Boceto"], ["second-sketch", "Boceto 2"],
  ["color", "Color"], ["full", "Completo"],
] as const

function Photo({ product, variant }: { product: CaptureProductMatch; variant: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "missing">("loading")
  return (
    <div className="grid min-h-40 place-items-center bg-white p-2">
      {status === "loading" && <Spinner />}
      {status === "missing" && <p role="status" className="text-slate-600">Sin foto disponible.</p>}
      {status !== "missing" && <img
        alt={`Foto de ${product.code}`} className="max-h-[52vh] max-w-full object-contain" hidden={status === "loading"}
        crossOrigin="anonymous"
        src={`${env.apiUrl}/inventories/products/${product.id}/actions/photo/image?variant=${variant}`}
        onLoad={() => setStatus("loaded")} onError={() => setStatus("missing")}
      />}
    </div>
  )
}

export function OrderProductPhotoDialog({ product, onClose }: { product: CaptureProductMatch; onClose: () => void }) {
  const [variant, setVariant] = useState<(typeof variants)[number][0]>("normal")
  return (
    <ErpDataDialog defaultWidth={540} description={product.description} onOpenChange={onClose} title="Foto" tone="sales">
      <ErpDataDialogBody className="grid gap-2">
        <Photo key={variant} product={product} variant={variant} />
        <div className="flex flex-wrap gap-1">
          {variants.map(([key, label]) => (
            <Button aria-pressed={variant === key} key={key} onClick={() => setVariant(key)} size="xs" type="button" variant="outline">
              {label}
            </Button>
          ))}
          <Button className="ml-auto" onClick={onClose} size="xs" type="button" variant="outline">Cerrar</Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
