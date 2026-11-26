import pdfMake from "pdfmake/build/pdfmake"
import fonts from "pdfmake/build/vfs_fonts"
import type { Column, Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces"

import type { OrderPrintSection } from "./order-print-document"

pdfMake.addVirtualFileSystem(fonts)

function reportContent(section: OrderPrintSection, pageBreak: boolean): Content[] {
  const fields: Content[] = section.header.map(({ label, value }) => ({
    stack: [{ text: label, fontSize: 8, color: "#444444" }, { text: value }],
    margin: [0, 0, 0, 5],
  }))
  const notes: Content[] = section.notes.map(({ label, value }) => ({
    stack: [{ text: label, bold: true, fontSize: 8.5 }, { text: value }],
    margin: [0, 0, 0, 7],
  }))
  const totals: Content[] = [
    ...(section.totalNote ? [{ text: "Importes del folio", fontSize: 8, color: "#444444" }] : []),
    ...section.amounts.map(({ label, value }) => ({
      columns: [{ width: "*", text: label }, { width: "auto", text: value, bold: label === "Total" }],
      margin: [0, 4, 0, 0] as [number, number, number, number],
    })),
  ]
  const body: TableCell[][] = [
    section.columns.map(text => ({ text, bold: true, fontSize: 8.5 })),
    ...section.rows.map(row => row.map(cell => ({ text: cell.value, alignment: cell.align }))),
  ]
  if (body.length === 1) {
    body.push([{ text: "Sin partidas para la selección", colSpan: section.columns.length, alignment: "center" },
      ...section.columns.slice(1).map(() => "")])
  }
  const widths = section.columns.length === 2 ? ["*", 110]
    : section.columns.length === 4 ? [64, "*", 75, 30]
    : [48, "*", 38, 22, 58, 32, 47, 47]

  return [
    {
      columns: [
        { width: "*", text: section.company, bold: true },
        { width: 245, text: section.title, alignment: "right", bold: true, fontSize: 16 },
      ],
      columnGap: 12,
      margin: [0, 0, 0, 12],
      ...(pageBreak ? { pageBreak: "before" } : {}),
    },
    { stack: fields.slice(0, 1), margin: [0, 0, 0, 5] },
    ...Array.from({ length: Math.ceil((fields.length - 1) / 3) }, (_, row) => ({
      columns: fields.slice(1 + row * 3, 4 + row * 3).map(field => ({ width: "*", stack: [field] })),
      columnGap: 12,
    })),
    {
      layout: "lightHorizontalLines",
      margin: [0, 4, 0, 0],
      table: { headerRows: 1, widths, body, dontBreakRows: true },
    },
    ...(notes.length || section.amounts.length ? [{
      columns: [
        { width: "*", stack: notes },
        ...(section.amounts.length ? [{ width: 165, stack: totals, unbreakable: true } satisfies Column] : []),
      ],
      columnGap: 20,
      margin: [0, 12, 0, 0],
    } satisfies Content] : []),
    ...(section.signatures.length ? [{
      columns: section.signatures.map(text => ({
        width: "*",
        table: { widths: ["*"], body: [[{ text, alignment: "center", fontSize: 9, border: [false, true, false, false] }]] },
        layout: { paddingTop: () => 5 },
      })),
      columnGap: 14,
      margin: [0, 28, 0, 0],
      unbreakable: true,
    } satisfies Content] : []),
  ]
}

export function createOrderPrintPdf(sections: OrderPrintSection[], copies: number) {
  const definition: TDocumentDefinitions = {
    pageSize: "LETTER", pageMargins: [40, 40, 40, 40],
    defaultStyle: { font: "Roboto", fontSize: 10 },
    info: { title: sections.length === 1 ? sections[0]?.title : "Pedidos" },
    content: Array.from({ length: copies }, () => sections).flat()
      .flatMap((section, index) => reportContent(section, index > 0)),
  }
  return pdfMake.createPdf(definition).getBlob()
}
