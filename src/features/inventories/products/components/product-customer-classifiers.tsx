import { Button } from "@/shared/ui/button"

const classifierLabels = [
  "AGENTE", "GIRO O SECTOR", "SUCURSAL", "", "",
  "", "FLETE", "ORIGEN", "PROYECTO",
] as const

type ProductCustomerClassifiersProps = {
  selected?: number
  onSelect: (classifier: number) => void
}

export function ProductCustomerClassifiers({ selected, onSelect }: ProductCustomerClassifiersProps) {
  return (
    <div className="mt-1 grid grid-cols-5 gap-0.5">
      {classifierLabels.map((label, index) => {
        const classifier = index + 1
        return (
          <Button
            aria-label={label || `Clasificador ${classifier}`}
            aria-pressed={selected === classifier}
            className="h-6 px-1 text-[9px]"
            key={classifier}
            onClick={() => onSelect(classifier)}
            type="button"
            variant={selected === classifier ? "secondary" : "outline"}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}
