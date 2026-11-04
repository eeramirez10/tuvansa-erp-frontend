import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
export function ReportSelect({ id, label, value, options, onChange, disabled = false }: {
  id: string; label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void; disabled?: boolean
}) {
  return <div className="grid gap-1"><Label htmlFor={id}>{label}</Label>
    <Select value={value} items={options} onValueChange={next => { if (next !== null) onChange(next) }} disabled={disabled} modal={false}>
      <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}
