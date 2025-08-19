// frontend/src/components/dashboard/LiveTiming.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSocket } from '@/hooks/useSocket'
import { DriverData, TimingData } from '@/types/f1'

interface LiveTimingProps {
  sessionId: string
}

export default function LiveTiming({ sessionId }: LiveTimingProps) {
  const [timingData, setTimingData] = useState<TimingData[]>([])
  const [drivers, setDrivers] = useState<DriverData[]>([])
  const socket = useSocket()

  useEffect(() => {
    if (socket) {
      socket.emit('join_session', sessionId)
      
      socket.on('timing_update', (data: TimingData[]) => {
        setTimingData(data)
      })
      
      socket.on('drivers_update', (data: DriverData[]) => {
        setDrivers(data)
      })
      
      return () => {
        socket.off('timing_update')
        socket.off('drivers_update')
      }
    }
  }, [socket, sessionId])

  const formatTime = (seconds: number | null): string => {
    if (!seconds) return '--'
    const minutes = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(3)
    return `${minutes}:${secs.padStart(6, '0')}`
  }

  const getCompoundColor = (compound: string): string => {
    const colors = {
      'SOFT': 'bg-red-500',
      'MEDIUM': 'bg-yellow-500', 
      'HARD': 'bg-white text-black',
      'INTERMEDIATE': 'bg-green-500',
      'WET': 'bg-blue-500'
    }
    return colors[compound as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Live Timing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 text-sm font-semibold border-b pb-2">
            <div>POS</div>
            <div>DRIVER</div>
            <div>GAP</div>
            <div>LAP TIME</div>
            <div>S1</div>
            <div>S2</div>
            <div>S3</div>
            <div>TYRE</div>
          </div>
          
          {timingData.map((timing, index) => {
            const driver = drivers.find(d => d.driver_number === timing.driver)
            
            return (
              <div key={timing.driver} className="grid grid-cols-8 gap-2 text-sm py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <div className="font-bold">{index + 1}</div>
                <div className="font-medium" style={{ color: driver?.team_color }}>
                  {driver?.abbreviation || timing.driver}
                </div>
                <div>{timing.gap || '--'}</div>
                <div className="font-mono">{formatTime(timing.lap_time)}</div>
                <div className="font-mono text-xs">{formatTime(timing.sector1)}</div>
                <div className="font-mono text-xs">{formatTime(timing.sector2)}</div>
                <div className="font-mono text-xs">{formatTime(timing.sector3)}</div>
                <div>
                  {timing.compound && (
                    <Badge className={`${getCompoundColor(timing.compound)} text-xs`}>
                      {timing.compound.charAt(0)}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}