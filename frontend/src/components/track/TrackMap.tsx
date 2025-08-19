// frontend/src/components/track/TrackMap.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TelemetryData, CircuitInfo } from '@/types/f1'

interface TrackMapProps {
  circuitInfo: CircuitInfo
  telemetryData: Record<string, TelemetryData>
}

export default function TrackMap({ circuitInfo, telemetryData }: TrackMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedDriver, setSelectedDriver] = useState<string>('')
  const [selectedMetric, setSelectedMetric] = useState<'speed' | 'throttle' | 'brake' | 'gear'>('speed')
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number>()
  
  const drivers = Object.keys(telemetryData)
  
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriver) {
      setSelectedDriver(drivers[0])
    }
  }, [drivers, selectedDriver])
  
  useEffect(() => {
    drawTrackMap()
  }, [selectedDriver, selectedMetric, telemetryData, circuitInfo])
  
  const drawTrackMap = () => {
    const canvas = canvasRef.current
    if (!canvas || !selectedDriver || !telemetryData[selectedDriver]) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const data = telemetryData[selectedDriver]
    if (!data.x || !data.y || data.x.length === 0) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Calculate bounds and scale
    const minX = Math.min(...data.x)
    const maxX = Math.max(...data.x)
    const minY = Math.min(...data.y)
    const maxY = Math.max(...data.y)
    
    const padding = 50
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX)
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY)
    const scale = Math.min(scaleX, scaleY)
    
    const offsetX = (canvas.width - (maxX - minX) * scale) / 2
    const offsetY = (canvas.height - (maxY - minY) * scale) / 2
    
    // Transform coordinates
    const transformX = (x: number) => (x - minX) * scale + offsetX
    const transformY = (y: number) => (y - minY) * scale + offsetY
    
    // Get metric data for coloring
    const metricData = data[selectedMetric] || data.speed
    const minMetric = Math.min(...metricData)
    const maxMetric = Math.max(...metricData)
    
    // Draw track line with color coding
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    for (let i = 0; i < data.x.length - 1; i++) {
      const x1 = transformX(data.x[i])
      const y1 = transformY(data.y[i])
      const x2 = transformX(data.x[i + 1])
      const y2 = transformY(data.y[i + 1])
      
      // Color based on metric
      const normalizedValue = (metricData[i] - minMetric) / (maxMetric - minMetric)
      const color = getColorForValue(normalizedValue, selectedMetric)
      
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    
    // Draw corner markers
    if (circuitInfo.corners && circuitInfo.corners.length > 0) {
      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 2
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      circuitInfo.corners.forEach(corner => {
        if (corner.x !== undefined && corner.y !== undefined) {
          const x = transformX(corner.x)
          const y = transformY(corner.y)
          
          // Draw corner circle
          ctx.beginPath()
          ctx.arc(x, y, 15, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          
          // Draw corner number
          ctx.fillStyle = 'black'
          ctx.fillText(corner.number.toString(), x, y)
          ctx.fillStyle = 'white'
        }
      })
    }
    
    // Draw start/finish line
    if (data.x.length > 0) {
      const startX = transformX(data.x[0])
      const startY = transformY(data.y[0])
      
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 3
      ctx.setLineDash([10, 5])
      ctx.beginPath()
      ctx.moveTo(startX - 20, startY)
      ctx.lineTo(startX + 20, startY)
      ctx.stroke()
      ctx.setLineDash([])
      
      ctx.fillStyle = 'white'
      ctx.font = '14px Arial'
      ctx.fillText('START/FINISH', startX, startY - 25)
    }
  }
  
  const getColorForValue = (normalizedValue: number, metric: string): string => {
    // Clamp value between 0 and 1
    const value = Math.max(0, Math.min(1, normalizedValue))
    
    switch (metric) {
      case 'speed':
        // Blue (slow) to Red (fast)
        return `hsl(${240 - (value * 240)}, 100%, 50%)`
      case 'throttle':
        // Black (no throttle) to Green (full throttle)
        return `hsl(120, 100%, ${value * 50}%)`
      case 'brake':
        // Black (no brake) to Red (full brake)
        return value > 0 ? `hsl(0, 100%, ${50 + value * 50}%)` : '#333'
      case 'gear':
        // Different colors for different gears
        const gearColors = ['#333', '#ff0000', '#ff8800', '#ffff00', '#88ff00', '#00ff00', '#00ff88', '#0088ff']
        return gearColors[Math.floor(value * 7)] || '#333'
      default:
        return '#666'
    }
  }
  
  const startAnimation = () => {
    if (!selectedDriver || !telemetryData[selectedDriver] || isAnimating) return
    
    setIsAnimating(true)
    const data = telemetryData[selectedDriver]
    let currentIndex = 0
    
    const animate = () => {
      if (currentIndex >= data.x.length) {
        setIsAnimating(false)
        return
      }
      
      drawTrackMapWithProgress(currentIndex)
      currentIndex += 5 // Skip frames for smoother animation
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
  }
  
  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setIsAnimating(false)
    drawTrackMap()
  }
  
  const drawTrackMapWithProgress = (currentIndex: number) => {
    const canvas = canvasRef.current
    if (!canvas || !selectedDriver || !telemetryData[selectedDriver]) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const data = telemetryData[selectedDriver]
    
    // Clear and redraw up to current index
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // ... (same transformation logic as drawTrackMap)
    const minX = Math.min(...data.x)
    const maxX = Math.max(...data.x)
    const minY = Math.min(...data.y)
    const maxY = Math.max(...data.y)
    
    const padding = 50
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX)
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY)
    const scale = Math.min(scaleX, scaleY)
    
    const offsetX = (canvas.width - (maxX - minX) * scale) / 2
    const offsetY = (canvas.height - (maxY - minY) * scale) / 2
    
    const transformX = (x: number) => (x - minX) * scale + offsetX
    const transformY = (y: number) => (y - minY) * scale + offsetY
    
    const metricData = data[selectedMetric] || data.speed
    const minMetric = Math.min(...metricData)
    const maxMetric = Math.max(...metricData)
    
    // Draw track up to current position
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    
    for (let i = 0; i < Math.min(currentIndex, data.x.length - 1); i++) {
      const x1 = transformX(data.x[i])
      const y1 = transformY(data.y[i])
      const x2 = transformX(data.x[i + 1])
      const y2 = transformY(data.y[i + 1])
      
      const normalizedValue = (metricData[i] - minMetric) / (maxMetric - minMetric)
      const color = getColorForValue(normalizedValue, selectedMetric)
      
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    
    // Draw current position
    if (currentIndex < data.x.length) {
      const currentX = transformX(data.x[currentIndex])
      const currentY = transformY(data.y[currentIndex])
      
      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interactive Track Map</CardTitle>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver} value={driver}>
                    Driver {driver}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speed">Speed</SelectItem>
                <SelectItem value="throttle">Throttle</SelectItem>
                <SelectItem value="brake">Brake</SelectItem>
                <SelectItem value="gear">Gear</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button 
                onClick={startAnimation} 
                disabled={isAnimating}
                variant="outline"
                size="sm"
              >
                {isAnimating ? 'Animating...' : 'Animate Lap'}
              </Button>
              <Button 
                onClick={stopAnimation} 
                disabled={!isAnimating}
                variant="outline"
                size="sm"
              >
                Stop
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border rounded-lg bg-gray-900 w-full"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            
            {/* Color Legend */}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-semibold mb-2">Color Legend - {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}</h4>
              <div className="flex items-center gap-4">
                {selectedMetric === 'speed' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm">Slow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm">Fast</span>
                    </div>
                  </>
                )}
                {selectedMetric === 'throttle' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-800 rounded"></div>
                      <span className="text-sm">No Throttle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm">Full Throttle</span>
                    </div>
                  </>
                )}
                {selectedMetric === 'brake' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-800 rounded"></div>
                      <span className="text-sm">No Brake</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm">Full Brake</span>
                    </div>
                  </>
                )}
                {selectedMetric === 'gear' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm">1st-2nd</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm">3rd-4th</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm">5th-6th</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm">7th-8th</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}