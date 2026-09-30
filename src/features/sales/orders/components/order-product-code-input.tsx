import { useQuery } from "@tanstack/react-query"
import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"

import { captureProductMatchesQuery } from "@/features/sales/orders/capture-logic"
import type { CaptureProductMatch } from "@/features/sales/orders/capture-model"
import { useDesktopWindowStore } from "@/shared/ui/desktop-window-store"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/utils/cn"

type Props = Omit<ComponentProps<"input">, "onChange" | "onBlur" | "onKeyDown" | "value"> & {
  value: string
  warehouse: string
  resolved: boolean
  onChangeCode: (code: string) => void
  onResolve: (code?: string) => void
  onSearch: () => void
}

export function OrderProductCodeInput({ value, warehouse, resolved, onChangeCode, onResolve, onSearch, ref, className, ...props }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const skipBlur = useRef(false)
  const [focused, setFocused] = useState(false)
  const [debounced, setDebounced] = useState("")
  const [active, setActive] = useState(-1)
  const [anchor, setAnchor] = useState({ left: 0, top: 0, width: 360 })
  const listId = useId()
  const topLayer = useDesktopWindowStore(state => state.nextZIndex)
  const term = value.trim()
  const enabled = focused && !resolved && !props.disabled && Boolean(term && warehouse)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 200)
    return () => window.clearTimeout(timer)
  }, [term])
  const result = useQuery({ ...captureProductMatchesQuery({ code: debounced }, warehouse), enabled: enabled && Boolean(debounced), retry: false })
  const matches = term === debounced ? (result.data ?? []).slice(0, 10) : []
  const showList = enabled && matches.length > 0
  useEffect(() => {
    if (!showList) return
    let frame: number
    const reposition = () => {
      const rect = inputRef.current?.getBoundingClientRect()
      if (rect) {
        const width = Math.min(Math.max(rect.width, 360), window.innerWidth - 16)
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
        const top = rect.bottom + 2
        setAnchor(previous => previous.left === left && previous.top === top && previous.width === width ? previous : { left, top, width })
      }
      frame = requestAnimationFrame(reposition)
    }
    reposition()
    return () => cancelAnimationFrame(frame)
  }, [showList])
  const resolve = (match?: CaptureProductMatch) => {
    skipBlur.current = true
    setFocused(false); setActive(-1)
    onResolve(match?.code)
  }
  const search = () => {
    skipBlur.current = true
    setFocused(false); setActive(-1)
    onSearch()
  }
  const keyboard = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && showList) {
      event.preventDefault(); event.stopPropagation()
      setActive(index => event.key === "ArrowDown" ? Math.min(index + 1, matches.length - 1) : Math.max(index - 1, 0))
    } else if (event.key === "Escape" && showList) {
      event.preventDefault(); event.stopPropagation(); setFocused(false); setActive(-1)
    } else if (event.key === "F2") {
      event.preventDefault(); event.stopPropagation(); search()
    } else if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey && term && !resolved)) {
      event.preventDefault(); event.stopPropagation()
      resolve(showList && active >= 0 ? matches[active] : undefined)
    }
  }
  return <>
    <div className="relative min-w-0">
      <Input {...props} ref={element => {
        inputRef.current = element
        if (typeof ref === "function") ref(element)
        else if (ref) ref.current = element
      }} className={cn(className, "pr-4")} value={value} role="combobox" aria-autocomplete="list" aria-expanded={showList} aria-controls={showList ? listId : undefined} aria-activedescendant={showList && active >= 0 ? listId + "-" + active : undefined} autoComplete="off"
        onFocus={() => { skipBlur.current = false; setFocused(true) }}
        onChange={event => { skipBlur.current = false; setFocused(true); setActive(-1); onChangeCode(event.target.value) }}
        onBlur={() => { setFocused(false); if (skipBlur.current) { skipBlur.current = false; return }; if (term && !resolved && !props.disabled) onResolve() }}
        onKeyDown={keyboard} />
      <button aria-label="Buscar producto" title="Buscar producto (F2)" className="absolute inset-y-0 right-px w-4 text-[10px] hover:bg-muted" disabled={props.disabled} tabIndex={-1} type="button" onMouseDown={event => event.preventDefault()} onClick={search}>…</button>
    </div>
    {showList && createPortal(<div className="fixed max-h-60 overflow-auto rounded-sm border border-input bg-background p-0.5 text-[10px] shadow-lg" style={{ ...anchor, zIndex: topLayer + 1 }} onMouseDown={event => event.preventDefault()}>
      <div id={listId} role="listbox" aria-label="Coincidencias de productos">
        {matches.map((match, index) => <button className={cn("grid w-full grid-cols-[6rem_1fr] gap-1 px-1 py-1 text-left hover:bg-muted", index === active && "bg-module-sales/15")} id={listId + "-" + index} key={match.id} role="option" aria-selected={index === active} tabIndex={-1} type="button" onClick={() => resolve(match)}>
          <span className="font-mono">{match.code}</span><span className="truncate">{match.description}</span>
        </button>)}
      </div>
      <button className="w-full border-t px-1 py-1 text-left text-module-sales" tabIndex={-1} type="button" onClick={search}>Buscar por código, IEAN o descripción…</button>
    </div>, document.body)}
  </>
}
