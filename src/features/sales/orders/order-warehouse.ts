// Mexico can arrive as 1 in historical order headers.
export const normalizeOrderWarehouse = (warehouse: string): string => {
  const code = warehouse.trim()
  return code === "1" ? "01" : code
}
