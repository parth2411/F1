// frontend/src/components/strategy/RaceStrategy.tsx
'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SessionData } from '@/types/f1'

interface RaceStrategyProps {
  sessionData: SessionData
}

interface Stint {
  driver: string
  driverName: string
  abbreviation: string
  teamColor: string
  startLap: number
  endLap: number
  compound: string
  stintLength: number
  averageTime?: number
}

export default function RaceStrategy({ sessionData }: RaceStrategyProps) {
  const strategyData = useMemo(() => {
    const strategies: Record<string, Stint[]> = {}
    
    Object.values(sessionData.drivers).forEach(driver => {
      const stints: Stint[] = []
      let currentStint: any = null
      
      driver.laps.forEach(lap => {
        if (!lap.compound) return
        
        if (!currentStint || currentStint.compound !== lap.compound) {
          // End current stint
          if (currentStint) {
            stints.push({
              driver: driver.driver_number,
              driverName: driver.name,
              abbreviation: driver.abbreviation,
              teamColor: driver.team_color,
              startLap: currentStint.startLap,
              endLap: currentStint.endLap,
              compound: currentStint.compound,
              stintLength: currentStint.endLap - currentStint.startLap + 1,
              averageTime: currentStint.times.length > 0 
                ? currentStint.times.reduce((a: number, b: number) => a + b, 0) / currentStint.times.length 
                : undefined
            })
          }
          
          // Start new stint
          currentStint = {
            startLap: lap.lap_number,
            endLap: lap.lap_number,
            compound: lap.compound,
            times: lap.lap_time ? [lap.lap_time] : []
          }
        } else {
          // Continue current stint
          currentStint.endLap = lap.lap_number
          if (lap.lap_time) {
            currentStint.times.push(lap.lap_time)
          }
        }
      })
      
      // Add final stint
      if (currentStint) {
        stints.push({
          driver: driver.driver_number,
          driverName: driver.name,
          abbreviation: driver.abbreviation,
          teamColor: driver.team_color,
          startLap: currentStint.startLap,
          endLap: currentStint.endLap,
          compound: currentStint.compound,
          stintLength: currentStint.endLap - currentStint.startLap + 1,
          averageTime: currentStint.times.length > 0 
            ? currentStint.times.reduce((a: number, b: number) => a + b, 0) / currentStint.times.length 
            : undefined
        })
      }
      
      if (stints.length > 0) {
        strategies[driver.driver_number] = stints
      }
    })
    
    return strategies
  }, [sessionData])
  
  const getCompoundColor = (compound: string): string => {
    const colors = {
      'SOFT': 'bg-red-500 text-white',
      'MEDIUM': 'bg-yellow-500 text-black',
      'HARD': 'bg-white text-black border',
      'INTERMEDIATE': 'bg-green-500 text-white',
      'WET': 'bg-blue-500 text-white'
    }
    return colors[compound as keyof typeof colors] || 'bg-gray-500 text-white'
  }
  
  const maxLaps = Math.max(...Object.values(strategyData).flat().map(stint => stint.endLap))
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tire Strategy Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(strategyData).map(([driverNumber, stints]) => {
              const driver = stints[0]
              const totalStops = stints.length - 1
              
              return (
                <div key={driverNumber} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: driver.teamColor }}
                      />
                      <span className="font-semibold">{driver.abbreviation}</span>
                      <span className="text-sm text-gray-600">{driver.driverName}</span>
                    </div>
                    <div className="text-sm">
                      <Badge variant="outline">{totalStops} stop{totalStops !== 1 ? 's' : ''}</Badge>
                    </div>
                  </div>
                  
                  {/* Strategy Timeline */}
                  <div className="relative">
                    <div className="flex h-8 bg-gray-100 rounded overflow-hidden">
                      {stints.map((stint, index) => {
                        const widthPercent = (stint.stintLength / maxLaps) * 100
                        
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-center text-xs font-medium ${getCompoundColor(stint.compound)}`}
                            style={{ width: `${widthPercent}%` }}
                            title={`${stint.compound} (Laps ${stint.startLap}-${stint.endLap})`}
                          >
                            {stint.compound.charAt(0)}
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Lap markers */}
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span>
                      {maxLaps > 20 && <span>{Math.floor(maxLaps / 2)}</span>}
                      <span>{maxLaps}</span>
                    </div>
                  </div>
                  
                  {/* Stint Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {stints.map((stint, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getCompoundColor(stint.compound)}>
                            {stint.compound}
                          </Badge>
                          <span className="font-medium">Stint {index + 1}</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div>Laps: {stint.startLap}-{stint.endLap} ({stint.stintLength} laps)</div>
                          {stint.averageTime && (
                            <div>Avg: {stint.averageTime.toFixed(3)}s</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Strategy Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Popular Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const strategyPatterns: Record<string, number> = {}
              
              Object.values(strategyData).forEach(stints => {
                const pattern = stints.map(s => s.compound).join(' → ')
                strategyPatterns[pattern] = (strategyPatterns[pattern] || 0) + 1
              })
              
              const mostPopular = Object.entries(strategyPatterns)
                .sort(([,a], [,b]) => b - a)[0]
              
              return mostPopular ? (
                <div>
                  <div className="font-medium mb-2">{mostPopular[0]}</div>
                  <div className="text-sm text-gray-600">
                    Used by {mostPopular[1]} driver{mostPopular[1] !== 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">No strategy data available</div>
              )
            })()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Pit Stops</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const strategies = Object.values(strategyData)
              if (strategies.length === 0) return <div className="text-sm text-gray-600">No data</div>
              
              const avgStops = strategies.reduce((sum, stints) => sum + (stints.length - 1), 0) / strategies.length
              
              return (
                <div>
                  <div className="text-2xl font-bold">{avgStops.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">stops per driver</div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compound Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const compoundCount: Record<string, number> = {}
              
              Object.values(strategyData).forEach(stints => {
                stints.forEach(stint => {
                  compoundCount[stint.compound] = (compoundCount[stint.compound] || 0) + 1
                })
              })
              
              return (
                <div className="space-y-2">
                  {Object.entries(compoundCount)
                    .sort(([,a], [,b]) => b - a)
                    .map(([compound, count]) => (
                      <div key={compound} className="flex items-center justify-between">
                        <Badge className={getCompoundColor(compound)}>
                          {compound}
                        </Badge>
                        <span className="text-sm">{count} stints</span>
                      </div>
                    ))
                  }
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}