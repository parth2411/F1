import { create } from 'zustand'
import { SessionData } from '@/types/f1'

interface DashboardStore {
  currentSession: SessionData | null
  selectedYear: string
  selectedRound: string
  selectedSessionType: string
  selectedDrivers: string[]
  isLoading: boolean
  setCurrentSession: (session: SessionData | null) => void
  setSelectedYear: (year: string) => void
  setSelectedRound: (round: string) => void
  setSelectedSessionType: (sessionType: string) => void
  setSelectedDrivers: (drivers: string[]) => void
  setIsLoading: (loading: boolean) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  currentSession: null,
  selectedYear: new Date().getFullYear().toString(),
  selectedRound: '',
  selectedSessionType: 'Race',
  selectedDrivers: [],
  isLoading: false,
  setCurrentSession: (session) => set({ currentSession: session }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSelectedRound: (round) => set({ selectedRound: round }),
  setSelectedSessionType: (sessionType) => set({ selectedSessionType: sessionType }),
  setSelectedDrivers: (drivers) => set({ selectedDrivers: drivers }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}))