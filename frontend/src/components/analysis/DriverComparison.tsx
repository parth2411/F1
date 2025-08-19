// frontend/src/components/analysis/DriverComparison.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { SessionData } from '@/types/f1'

interface DriverComparisonProps {
  sessionData: SessionData
}

export default function DriverComparison({ sessionData }: DriverComparisonProps) {
  const [driver1, setDriver1] = useState<string>('')
  const [driver2, setDriver2] = useState<string>('')
  
  const drivers = Object.values(sessionData.drivers)
  
  const getComparisonData = () => {
    if (!driver1 || !driver2 || !sessionData.drivers[driver1] || !sessionData.drivers[driver2]) {
      return null
    }
    
    const d1 = sessionData.drivers[driver1]
    const d2 = sessionData.drivers[driver2]
    
    // Lap time comparison
    const maxLaps = Math.max(d1.laps.length, d2.laps.length)
    const lapComparison = []
    
    for (let i = 0; i < maxLaps; i++) {
      const lap1 = d1.laps[i]
      const lap2 = d2.laps[i]
      
      lapComparison.push({
        lap: i + 1,
        [d1.abbreviation]: lap1?.lap_time || null,
        [d2.abbreviation]: lap2?.lap_time || null,
        [`${d1.abbreviation}_compound`]: lap1?.compound,
        [`${d2.abbreviation}_compound`]: lap2?.compound
      })
    }
    
    // Sector comparison (best times)
    const d1Sectors = d1.laps.filter(l => l.sector1_time && l.sector2_time && l.sector3_time)
    const d2Sectors = d2.laps.filter(l => l.sector1_time && l.sector2_time && l.sector3_time)
    
    const sectorComparison = [
      {
        sector: 'Sector 1',
        [d1.abbreviation]: d1Sectors.length > 0 ? Math.min(...d1Sectors.map(l => l.sector1_time!)) : 0,
        [d2.abbreviation]: d2Sectors.length > 0 ? Math.min(...d2Sectors.map(l => l.sector1_time!)) : 0
      },
      {
        sector: 'Sector 2', 
        [d1.abbreviation]: d1Sectors.length > 0 ? Math.min(...d1Sectors.map(l => l.sector2_time!)) : 0,
        [d2.abbreviation]: d2Sectors.length > 0 ? Math.min(...d2Sectors.map(l => l.sector2_time!)) : 0
      },
      {
        sector: 'Sector 3',
        [d1.abbreviation]: d1Sectors.length > 0 ? Math.min(...d1Sectors.map(l => l.sector3_time!)) : 0,
        [d2.abbreviation]: d2Sectors.length > 0 ? Math.min(...d2Sectors.map(l => l.sector3_time!)) : 0
      }
    ]
    
    return {
      driver1: d1,
      driver2: d2,
      lapComparison,
      sectorComparison
    }
  }
  
  const comparisonData = getComparisonData()
  
  return (
    <div className="space-y-6">
      {/* Driver Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Drivers to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Select value={driver1} onValueChange={setDriver1}>
              <SelectTrigger>
                <SelectValue placeholder="Select Driver 1" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver.driver_number} value={driver.driver_number}>
                    {driver.abbreviation} - {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={driver2} onValueChange={setDriver2}>
              <SelectTrigger>
                <SelectValue placeholder="Select Driver 2" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver.driver_number} value={driver.driver_number}>
                    {driver.abbreviation} - {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {comparisonData && (
        <>
          {/* Driver Stats */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: comparisonData.driver1.team_color }}
                  />
                  {comparisonData.driver1.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Team:</strong> {comparisonData.driver1.team}</div>
                  <div><strong>Fastest Lap:</strong> {comparisonData.driver1.fastest_lap?.toFixed(3)}s</div>
                  <div><strong>Total Laps:</strong> {comparisonData.driver1.laps.length}</div>
                  <div><strong>Avg Lap Time:</strong> {
                    comparisonData.driver1.laps.filter(l => l.lap_time).length > 0 
                      ? (comparisonData.driver1.laps
                          .filter(l => l.lap_time)
                          .reduce((sum, l) => sum + l.lap_time!, 0) / 
                        comparisonData.driver1.laps.filter(l => l.lap_time).length).toFixed(3) + 's'
                      : 'N/A'
                  }</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: comparisonData.driver2.team_color }}
                  />
                  {comparisonData.driver2.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Team:</strong> {comparisonData.driver2.team}</div>
                  <div><strong>Fastest Lap:</strong> {comparisonData.driver2.fastest_lap?.toFixed(3)}s</div>
                  <div><strong>Total Laps:</strong> {comparisonData.driver2.laps.length}</div>
                  <div><strong>Avg Lap Time:</strong> {
                    comparisonData.driver2.laps.filter(l => l.lap_time).length > 0 
                      ? (comparisonData.driver2.laps
                          .filter(l => l.lap_time)
                          .reduce((sum, l) => sum + l.lap_time!, 0) / 
                        comparisonData.driver2.laps.filter(l => l.lap_time).length).toFixed(3) + 's'
                      : 'N/A'
                  }</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Lap Time Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lap Time Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData.lapComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lap" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        value ? `${value.toFixed(3)}s` : 'No data', 
                        name
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={comparisonData.driver1.abbreviation}
                      stroke={comparisonData.driver1.team_color}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={comparisonData.driver2.abbreviation}
                      stroke={comparisonData.driver2.team_color}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Sector Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Best Sector Times Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData.sectorComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(3)}s`, '']} />
                    <Legend />
                    <Bar 
                      dataKey={comparisonData.driver1.abbreviation}
                      fill={comparisonData.driver1.team_color}
                      name={comparisonData.driver1.abbreviation}
                    />
                    <Bar 
                      dataKey={comparisonData.driver2.abbreviation}
                      fill={comparisonData.driver2.team_color}
                      name={comparisonData.driver2.abbreviation}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}