import { useState, useCallback } from 'react'
import { SessionData, Schedule, TelemetryData } from '@/types/f1'

export function useF1Data() {
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSchedule = useCallback(async (year: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/f1/schedule/${year}`)
      const data = await response.json()
      
      if (data.success) {
        setSchedule(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadSession = useCallback(async (year: string, round: string, session: string) => {
    try {
    setIsLoading(true)
    setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/f1/session/${year}/${round}/${session}`)
      const data = await response.json()
      
      if (data.success) {
        setSessionData(data.data)
        
        // Load telemetry for the fastest driver
        const drivers = Object.keys(data.data.drivers)
        if (drivers.length > 0) {
          const fastestDriver = drivers[0] // Simplified - should find actual fastest
          const telemetryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/f1/telemetry/${year}/${round}/${session}/${fastestDriver}`)
          const telemetryData = await telemetryResponse.json()
          
          if (telemetryData.success) {
            setTelemetryData(telemetryData.data)
          }
        }
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setIsLoading(false)
    }
    }, [])
    return {
    schedule,
    sessionData,
    telemetryData,
    isLoading,
    error,
    loadSchedule,
    loadSession
    }
  }