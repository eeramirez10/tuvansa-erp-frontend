import * as React from "react"

const MOBILE_BREAKPOINT = 768
const mobileMediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribeToMobileQuery(callback: () => void) {
  const mediaQueryList = window.matchMedia(mobileMediaQuery)
  mediaQueryList.addEventListener("change", callback)

  return () => mediaQueryList.removeEventListener("change", callback)
}

function getMobileSnapshot() {
  return window.matchMedia(mobileMediaQuery).matches
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    () => false
  )
}
