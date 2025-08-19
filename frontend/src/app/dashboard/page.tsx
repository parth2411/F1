// frontend/src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import LiveTiming from '@/components/dashboard/LiveTiming'
import TelemetryChart from '@/components/telemetry/TelemetryChart'
import F1Chatbot from '@/components/chat/F1Chatbot'
import DriverComparison from '../../components/analysis/DriverComparison'
import RaceStrategy from '../../components/strategy/RaceStrategy'
import TrackMap from '../../components/track/TrackMap'
import { useF1Data } from '../../hooks/useF1Data'

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedRound, setSelectedRound] = useState('')
  const [selectedSession, setSelectedSession] = useState('Race')
  const [selectedMetrics, setSelectedMetrics] = useState(['speed', 'throttle'])
  
  const { 
    schedule, 
    sessionData, 
    telemetryData, 
    isLoading, 
    error,
    loadSession 
  } = useF1Data()

  useEffect(() => {
    if (selectedYear && selectedRound && selectedSession) {
      loadSession(selectedYear, selectedRound, selectedSession)
    }
  }, [selectedYear, selectedRound, selectedSession, loadSession])

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-f1-red to-red-600 bg-clip-text text-transparent">
            F1 Dashboard
          </h1>
          
          {/* Session Selector */}
          <div className="flex gap-4 flex-wrap">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2023, 2022, 2021, 2020].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Race" />
              </SelectTrigger>
              <SelectContent>
                {schedule?.map(race => (
                  <SelectItem key={race.round} value={race.round.toString()}>
                    {race.event_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FP1">Practice 1</SelectItem>
                <SelectItem value="FP2">Practice 2</SelectItem>
                <SelectItem value="FP3">Practice 3</SelectItem>
                <SelectItem value="Q">Qualifying</SelectItem>
                <SelectItem value="Race">Race</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="live">Live Timing</TabsTrigger>
            <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="track">Track</TabsTrigger>
            <TabsTrigger value="chat">AI Assistant</TabsTrigger>
          </TabsList>

          {/* Live Timing Tab */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                {selectedRound && (
                  <LiveTiming sessionId={`${selectedYear}-${selectedRound}-${selectedSession}`} />
                )}
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionData && (
                      <div className="space-y-2 text-sm">
                        <div><strong>Event:</strong> {sessionData.session_info?.event_name}</div>
                        <div><strong>Location:</strong> {sessionData.session_info?.location}</div>
                        <div><strong>Date:</strong> {sessionData.session_info?.date}</div>
                        <div><strong>Session:</strong> {sessionData.session_info?.session_type}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Weather</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionData?.weather?.[0] && (
                      <div className="space-y-2 text-sm">
                        <div><strong>Air Temp:</strong> {sessionData.weather[0].air_temp}°C</div>
                        <div><strong>Track Temp:</strong> {sessionData.weather[0].track_temp}°C</div>
                        <div><strong>Humidity:</strong> {sessionData.weather[0].humidity}%</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Telemetry Tab */}
          <TabsContent value="telemetry" className="space-y-6">
            {telemetryData && (
              <TelemetryChart
                telemetryData={telemetryData}
                selectedMetrics={selectedMetrics}
                onMetricToggle={handleMetricToggle}
              />
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {sessionData && (
              <DriverComparison sessionData={sessionData} />
            )}
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-6">
            {sessionData && (
              <RaceStrategy sessionData={sessionData} />
            )}
          </TabsContent>

          {/* Track Tab */}
          <TabsContent value="track" className="space-y-6">
            {sessionData && telemetryData && (
              <TrackMap 
                circuitInfo={sessionData.circuit_info}
                telemetryData={telemetryData}
              />
            )}
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <F1Chatbot sessionContext={sessionData} />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full text-left justify-start">
                        Explain DRS zones for this track
                      </Button>
                      <Button variant="outline" className="w-full text-left justify-start">
                        Compare tire strategies
                      </Button>
                      <Button variant="outline" className="w-full text-left justify-start">
                        Analyze fastest lap telemetry
                      </Button>
                      <Button variant="outline" className="w-full text-left justify-start">
                        Weather impact on performance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}