export type BankStatementRow = {
  line: number
  date: string
  reference: string
  amountCents: number
}

export type BankStatementMatch =
  | { status: "matched"; row: BankStatementRow; movementId: number; policyNumber: string }
  | { status: "unmatched" | "ambiguous" | "outside-cutoff"; row: BankStatementRow }

const columns = ["Fecha", "Referencia", "Ingresos", "Egresos"]

export function bankStatementCents(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null
  const amount = String(value).trim()
  if (!/^-?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?|\.\d{1,2})$/.test(amount)) return null
  const [whole, decimals = ""] = amount.replace(/^-|,/g, "").split(".")
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, "0"))
  return Number.isSafeInteger(cents) ? (amount.startsWith("-") ? -cents : cents) : null
}

export function statementCalendarDate(value: string): string | null {
  const date = value.trim()
  const mexican = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date)
  const iso = mexican ? mexican[3] + "-" + mexican[2] + "-" + mexican[1] : date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso.startsWith("0000")) return null
  const midnight = new Date(iso + "T00:00:00.000Z")
  return Number.isNaN(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== iso ? null : iso
}

function delimitedFields(line: string, separator: string): string[] | null {
  if (!line.includes('"')) return line.split(separator).map((field) => field.trim())
  const fields: string[] = []
  let field = ""
  let quoted = false
  let closedQuote = false
  for (let index = 0; index < line.length; index++) {
    const character = line[index]
    if (quoted) {
      if (character !== '"') field += character
      else if (line[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = false
        closedQuote = true
      }
    } else if (character === separator) {
      fields.push(field.trim())
      field = ""
      closedQuote = false
    } else if (character === '"') {
      if (closedQuote || field.trim()) return null
      field = ""
      quoted = true
    } else {
      if (closedQuote && character.trim()) return null
      field += character
    }
  }
  return quoted ? null : [...fields, field.trim()]
}

export function parseBankStatement(text: string): BankStatementRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/)
  const heading = lines.findIndex((line) => line.trim() !== "")
  const header = lines[heading] ?? ""
  const separator = header.includes("\t") ? "\t" : ","
  const fields = delimitedFields(header, separator)
  if (fields?.length !== columns.length || fields.some((field, index) => field.toLowerCase() !== columns[index].toLowerCase())) {
    throw new Error("El encabezado debe contener Fecha, Referencia, Ingresos y Egresos en ese orden.")
  }

  const rows: BankStatementRow[] = []
  for (let index = heading + 1; index < lines.length; index++) {
    if (!lines[index].trim()) continue
    const line = index + 1
    const row = delimitedFields(lines[index], separator)
    if (!row || row.length !== columns.length) throw new Error("La fila " + line + " debe contener cuatro campos.")
    const [rawDate, reference, rawCharge, rawCredit] = row
    const date = statementCalendarDate(rawDate)
    if (!date) throw new Error("Fecha inválida en la fila " + line + ".")
    if (!reference) throw new Error("Falta la referencia en la fila " + line + ".")
    const charge = rawCharge === "" ? 0 : bankStatementCents(rawCharge)
    const credit = rawCredit === "" ? 0 : bankStatementCents(rawCredit)
    if (charge === null || credit === null || charge < 0 || credit < 0 || (charge === 0) === (credit === 0)) {
      throw new Error("Captura un solo importe positivo con hasta dos decimales en la fila " + line + ".")
    }
    rows.push({ line, date, reference, amountCents: charge - credit })
  }
  if (rows.length === 0) throw new Error("El archivo no contiene movimientos.")
  return rows
}

export function decodeBankStatement(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const encoding = bytes[0] === 0xFF && bytes[1] === 0xFE ? "utf-16le"
    : bytes[0] === 0xFE && bytes[1] === 0xFF ? "utf-16be" : "utf-8"
  try {
    return new TextDecoder(encoding, { fatal: true }).decode(bytes)
  } catch {
    throw new Error("El archivo debe estar codificado en UTF-8 o UTF-16 con BOM.")
  }
}

export function statementBankMovement(movement: Record<string, unknown>, cutoff: string) {
  const { movementId } = movement
  const date = typeof movement.policyDate === "string" ? statementCalendarDate(movement.policyDate.slice(0, 10)) : null
  const charge = bankStatementCents(movement.charge)
  const credit = bankStatementCents(movement.credit)
  if (movement.canReconcile !== true || typeof movementId !== "number" || !Number.isSafeInteger(movementId)
    || movementId <= 0 || !date || date > cutoff || charge === null || credit === null
    || charge < 0 || credit < 0 || charge === credit) return null
  return { movementId, date, amountCents: charge - credit, policyNumber: String(movement.policyNumber ?? "") }
}

export function matchBankStatement(
  rows: readonly BankStatementRow[],
  movements: ReadonlyArray<Record<string, unknown>>,
  cutoff: string,
  links: ReadonlyMap<number, number> = new Map(),
): BankStatementMatch[] {
  type Candidate = { movementId: number; policyNumber: string }
  const candidates = new Map<string, Candidate[]>()
  const movementsById = new Map<number, NonNullable<ReturnType<typeof statementBankMovement>>>()
  const key = (reference: string, amount: number) => JSON.stringify([reference, amount])
  for (const movement of movements) {
    const candidate = statementBankMovement(movement, cutoff)
    if (!candidate) continue
    const { movementId, amountCents, policyNumber } = candidate
    movementsById.set(movementId, candidate)
    const references = new Set([movement.bankNumber, movement.checkNumber, movement.policyNumber]
      .flatMap((value) => typeof value === "string" || typeof value === "number" ? [String(value).trim()] : [])
      .filter(Boolean))
    for (const reference of references) {
      const signature = key(reference, amountCents)
      const matched = candidates.get(signature) ?? []
      if (!matched.some((candidate) => candidate.movementId === movementId)) matched.push({ movementId, policyNumber })
      candidates.set(signature, matched)
    }
  }

  const linked = new Map<number, Candidate>()
  const linkedMovements = new Set<number>()
  for (const row of rows) {
    const candidate = movementsById.get(links.get(row.line) ?? 0)
    if (!candidate || row.date > cutoff || candidate.amountCents !== row.amountCents || linkedMovements.has(candidate.movementId)) continue
    linked.set(row.line, { movementId: candidate.movementId, policyNumber: candidate.policyNumber })
    linkedMovements.add(candidate.movementId)
  }
  const rowCandidates = rows.map((row) => row.date > cutoff || linked.has(row.line) ? []
    : (candidates.get(key(row.reference, row.amountCents)) ?? []).filter(({ movementId }) => !linkedMovements.has(movementId)))
  const timesProposed = new Map<number, number>()
  for (const candidatesForRow of rowCandidates) {
    for (const { movementId } of candidatesForRow) {
      timesProposed.set(movementId, (timesProposed.get(movementId) ?? 0) + 1)
    }
  }
  return rows.map((row, index) => {
    if (row.date > cutoff) return { row, status: "outside-cutoff" }
    const manual = linked.get(row.line)
    if (manual) return { row, status: "matched", ...manual }
    const proposed = rowCandidates[index]
    if (proposed.length === 0) return { row, status: "unmatched" }
    if (proposed.length !== 1 || timesProposed.get(proposed[0].movementId) !== 1) return { row, status: "ambiguous" }
    return { row, status: "matched", ...proposed[0] }
  })
}

export function matchedStatementCsv(matches: Array<Extract<BankStatementMatch, { status: "matched" }>>): string {
  const escape = (value: string) => '"' + (/^[=+\-@\t\r]/.test(value) ? "'" : "") + value.replace(/"/g, '""') + '"'
  const rows = matches.map(({ row, policyNumber }) => [
    row.date, escape(row.reference), (Math.max(row.amountCents, 0) / 100).toFixed(2),
    (Math.max(-row.amountCents, 0) / 100).toFixed(2), escape(policyNumber),
  ].join(","))
  return ["\uFEFF" + [...columns, "Póliza"].join(","), ...rows].join("\r\n")
}
