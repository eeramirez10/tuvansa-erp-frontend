import type { ReactNode } from "react"

export type QueryRow = Record<string, unknown>

export type QueryColumn = {
  key: string
  label: string
  width?: string
  align?: "left" | "center" | "right"
  render?: (row: QueryRow) => ReactNode
}

export function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value)
}

export function formatNumber(value: unknown, decimals = 3) {
  const number = numberValue(value)
  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(decimals).replace(/0+$/, "").replace(/\.$/, "")
}

export function formatMoney(value: unknown) {
  return numberValue(value).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDate(value: unknown) {
  const text = textValue(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : text
}

