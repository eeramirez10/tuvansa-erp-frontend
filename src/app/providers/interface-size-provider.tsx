import { useLayoutEffect, type PropsWithChildren } from "react"

import { selectInterfaceSize, useAppStore } from "@/app/store"

const interfaceSizeAttribute = "data-erp-interface-size"

export function InterfaceSizeProvider({ children }: PropsWithChildren) {
  const interfaceSize = useAppStore(selectInterfaceSize)

  useLayoutEffect(() => {
    document.documentElement.setAttribute(
      interfaceSizeAttribute,
      interfaceSize,
    )

    return () => {
      document.documentElement.removeAttribute(interfaceSizeAttribute)
    }
  }, [interfaceSize])

  return children
}
