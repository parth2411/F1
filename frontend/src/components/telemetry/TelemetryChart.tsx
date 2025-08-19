// frontend/src/components/telemetry/TelemetryChart.tsx
'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TelemetryData } from '@/types/f1'

interface TelemetryChartProps {
  telemetryData: TelemetryData
  selectedMetrics: string[]
  onMetricToggle: (metric: string) => void
}

export default function TelemetryChart({ telemetryData, selectedMetrics, onMetricToggle }: TelemetryChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (!telemetryData.distance) return

    const data = telemetryData.distance.map((distance, index) => ({
      distance,
      speed: telemetryData.speed[index],
      rpm: telemetryData.rpm[index],
      gear: telemetryData.gear[index],
      throttle: telemetryData.throttle[index],
      brake: telemetryData.brake[index]
    }))

    setChartData(data)
  }, [telemetryData])

  const metrics = [
    { key: 'speed', label: 'Speed (km/h)', color: '#8884d8' },
    { key: 'rpm', label: 'RPM', color: '#82ca9d' },
    { key: 'gear', label: 'Gear', color: '#ffc658' },
    { key: 'throttle', label: 'Throttle (%)', color: '#ff7300' },
    { key: 'brake', label: 'Brake (%)', color: '#ff0000' }
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Telemetry Data</CardTitle>
        <div className="flex flex-wrap gap-2">
          {metrics.map(metric => (
            <Button
              key={metric.key}
              variant={selectedMetrics.includes(metric.key) ? "default" : "outline"}
              size="sm"
              onClick={() => onMetricToggle(metric.key)}
              className="text-xs"
            >
              {metric.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="distance" 
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              
              {metrics.map(metric => 
                selectedMetrics.includes(metric.key) && (
                  <Line
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={false}
                    name={metric.label}
                  />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}