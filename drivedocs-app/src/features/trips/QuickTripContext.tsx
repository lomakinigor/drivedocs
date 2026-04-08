import { createContext, useContext } from 'react'

const QuickTripContext = createContext<() => void>(() => {})

export const QuickTripProvider = QuickTripContext.Provider

export function useOpenQuickTrip(): () => void {
  return useContext(QuickTripContext)
}
