import { printPurchaseOrderDocument } from "@/features/purchasing/purchase-orders/components/purchase-order-print"

export type PurchaseOrderLabelType = "A" | "B" | "C" | "D" | "E" | "F"

export const purchaseOrderLabelTypes: readonly { value: PurchaseOrderLabelType; label: string }[] = [
  { value: "A", label: "A · Código de barras EAN" },
  { value: "B", label: "B · Código de producto y descripción" },
  { value: "C", label: "C · Código de producto y segunda descripción" },
  { value: "D", label: "D · Colada" },
  { value: "E", label: "E · EAN" },
  { value: "F", label: "F · Descripción, localización, EAN y UPC" },
]

export type PurchaseOrderLabelLine = {
  lineId: number
  assigned: number
  productCode: string
  description: string
  extendedDescription: string
  secondDescription: string
  ean: string
  upc: string
  location: string
}

export type PurchaseOrderLabelsOptions = {
  type: PurchaseOrderLabelType
  orderNumber: string
  selectedLineIds?: readonly number[]
}

// Alternating Code 128 bar and space widths from ISO/IEC 15417 Table 1.
const code128Patterns = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
]

const company = "TUBERIA Y VALVULAS DEL NORTE SA DE CV"
const companyAddress = [
  "CERRADA DE SAN BUENAVENTURA No. 12",
  "COL.FRAC. INDUSTRIAL SANBUENAVENTURA",
  "EDO. DE MEXICO, TLALNEPANTLA DE BAZ, C.P.06090",
  "R.F.C. TVN820506NT0",
]

const styles = `
  @page { size: letter; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #111; background: #fff; font-family: Arial, sans-serif; }
  main { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 3mm; }
  article { position: relative; border: 1px dotted #bbb; break-inside: avoid; flex: 0 0 auto; }
  article span { position: absolute; white-space: nowrap; }
  .barcode { position: absolute; display: flex; align-items: stretch; }
  .barcode i { height: 100%; }
  @media screen { body { margin: 10mm auto; padding: 0 8mm; max-width: 216mm; } }
  @media print { body { margin: 0; } }
`

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;")

const millimeters = (dots: number) => `${dots / 8}mm`

const labelText = (value: string, left: number, top: number, fontSize: number) =>
  `<span style="left:${millimeters(left)};top:${millimeters(top)};font-size:${millimeters(fontSize)}">${escapeHtml(value)}</span>`

function code128(value: string, left: number, top: number, height: number, moduleWidth: number) {
  if (!/^[\x20-\x7e]+$/.test(value)) {
    throw new Error(`El valor «${value}» no se puede representar como código de barras.`)
  }

  const pairs = /^(?:\d{2}){2,}$/.test(value) ? value.match(/\d{2}/g) : null
  const start = pairs ? 105 : 104
  const data = pairs ? pairs.map(Number) : Array.from(value, (character) => character.charCodeAt(0) - 32)
  const checksum = data.reduce((sum, code, index) => sum + (index + 1) * code, start) % 103
  const symbols = [start, ...data, checksum, 106]
  const modules = symbols.map((symbol) => code128Patterns[symbol]).join("")
  const bars = Array.from(modules, (size, index) => {
    const width = millimeters(Number(size) * moduleWidth)
    const ink = index % 2 === 0 ? `;border-left:${width} solid #000` : ""
    return `<i style="width:${width}${ink}"></i>`
  }).join("")

  return {
    markup: `<div class="barcode" role="img" aria-label="Código de barras ${escapeHtml(value)}" style="left:${millimeters(left)};top:${millimeters(top)};height:${millimeters(height)}">${bars}</div>`,
    right: left + ((symbols.length - 1) * 11 + 13 + 10) * moduleWidth,
  }
}

function renderLabel(line: PurchaseOrderLabelLine, type: PurchaseOrderLabelType) {
  const ean = line.ean.trim()
  const code = line.productCode.trim()
  let width = 440
  let height = 206
  let fields: string[]

  switch (type) {
    case "A": {
      if (!ean) throw new Error(`La partida ${code || line.lineId} no tiene EAN para el tipo A.`)
      const barcode = code128(ean, 240, 290, 80, 3)
      width = Math.max(845, barcode.right)
      height = 424
      fields = [
        labelText(company, 230, 84, 22),
        ...companyAddress.map((address, index) => labelText(address, 250, 105 + 17 * index, 14)),
        labelText(`CODIGO: ${code}`, 40, 220, 20),
        labelText(`DESCRIPCION: ${line.extendedDescription}`, 40, 255, 19),
        barcode.markup,
        labelText(ean, 300, 380, 20),
      ]
      break
    }
    case "B":
    case "C": {
      if (!code) throw new Error(`La partida ${line.lineId} no tiene código de producto para el tipo ${type}.`)
      const barcode = code128(code, 70, 115, 45, 2)
      const description = type === "B" ? line.extendedDescription : line.secondDescription
      width = Math.max(width, barcode.right)
      fields = [
        labelText(company, 5, 10, 15),
        labelText(`CODIGO: ${code}`, 2, 40, 20),
        labelText(description.slice(0, 38), 2, 70, 15),
        labelText(description.slice(38, 76), 2, 95, 15),
        barcode.markup,
        labelText(ean, 110, 169, 20),
      ]
      break
    }
    case "D":
    case "E": {
      if (!ean) throw new Error(`La partida ${code || line.lineId} no tiene EAN para el tipo ${type}.`)
      fields = [
        labelText(company, 5, 20, 15),
        ...(type === "D" ? [labelText("COLADA:", 2, 50, 22)] : []),
        labelText(ean, type === "D" ? 50 : 3, 100, 28),
      ]
      break
    }
    case "F":
      fields = [
        labelText(line.description, 2, 20, 16),
        labelText(line.location, 2, 40, 16),
        labelText(ean, 2, 60, 16),
        labelText(line.upc, 2, 80, 16),
      ]
      break
  }

  return `<article data-line-id="${line.lineId}" style="width:${millimeters(width)};height:${millimeters(height)}">${fields.join("")}</article>`
}

export function buildPurchaseOrderLabelsDocument(
  lines: readonly PurchaseOrderLabelLine[],
  { type, orderNumber, selectedLineIds }: PurchaseOrderLabelsOptions,
) {
  const selected = selectedLineIds && new Set(selectedLineIds)
  const labels = lines.flatMap((line) => {
    if ((selected && !selected.has(line.lineId)) || !Number.isFinite(line.assigned) || line.assigned <= 0) return []
    const copies = Math.round(line.assigned)
    return copies > 0 ? [{ line, copies }] : []
  })
  const copies = labels.reduce((total, label) => total + label.copies, 0)

  if (copies === 0) throw new Error("No hay partidas con cantidad confirmada para imprimir etiquetas.")
  if (copies > 5000) throw new Error("La vista previa admite hasta 5,000 etiquetas. Reduce la selección para imprimir por grupos.")

  return `<!doctype html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Etiquetas ${escapeHtml(orderNumber)}</title>
      <style>${styles}</style>
    </head>
    <body data-format="PCL_Z201_BI${type}">
      <main aria-label="Etiquetas de la orden ${escapeHtml(orderNumber)}">
        ${labels.map(({ line, copies }) => renderLabel(line, type).repeat(copies)).join("")}
      </main>
    </body>
    </html>`
}

export function printPurchaseOrderLabels(lines: readonly PurchaseOrderLabelLine[], options: PurchaseOrderLabelsOptions) {
  return printPurchaseOrderDocument(buildPurchaseOrderLabelsDocument(lines, options), "Etiquetas de la orden de compra")
}
