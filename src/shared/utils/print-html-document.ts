export function printHtmlDocument(html: string, title: string) {
  const frame = document.createElement("iframe")
  frame.title = title
  frame.setAttribute("aria-hidden", "true")
  frame.style.cssText = "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0"
  frame.srcdoc = html

  return new Promise<void>((resolve, reject) => {
    const fail = () => {
      frame.remove()
      reject(new Error("No fue posible abrir la vista de impresión."))
    }
    frame.addEventListener("error", fail, { once: true })
    frame.addEventListener("load", () => {
      const printWindow = frame.contentWindow
      if (!printWindow) {
        fail()
        return
      }

      try {
        printWindow.addEventListener("afterprint", () => frame.remove(), { once: true })
        printWindow.print()
        resolve()
      } catch {
        fail()
      }
    }, { once: true })
    document.body.append(frame)
  })
}
