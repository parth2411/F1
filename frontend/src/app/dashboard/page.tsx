'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useF1Data } from '@/hooks/useF1Data'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedRound, setSelectedRound] = useState('')
  const [selectedSession, setSelectedSession] = useState('Race')
  
  const { 
    schedule, 
    sessionData, 
    telemetryData, 
    isLoading, 
    error,
    loadSchedule,
    loadSession 
  } = useF1Data()

  useEffect(() => {
    loadSchedule(selectedYear)
  }, [selectedYear, loadSchedule])

  useEffect(() => {
    if (selectedYear && selectedRound && selectedSession) {
      loadSession(selectedYear, selectedRound, selectedSession)
    }
  }, [selectedYear, selectedRound, selectedSession, loadSession])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
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

        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md">
            Error: {error}
          </div>
        )}

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
                <Card>
                  <CardHeader>
                    <CardTitle>Live Timing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionData ? (
                      <div className="space-y-4">
                        <p className="text-gray-400">
                          Session: {sessionData.session_info?.event_name} - {sessionData.session_info?.session_type}
                        </p>
                        <div className="text-sm text-gray-500">
                          Live timing data will be displayed here when available
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">Select a session to view timing data</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionData ? (
                      <div className="space-y-2 text-sm">
                        <div><strong>Event:</strong> {sessionData.session_info?.event_name}</div>
                        <div><strong>Location:</strong> {sessionData.session_info?.location}</div>
                        <div><strong>Date:</strong> {sessionData.session_info?.date}</div>
                        <div><strong>Session:</strong> {sessionData.session_info?.session_type}</div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No session selected</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Weather</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionData?.weather?.[0] ? (
                      <div className="space-y-2 text-sm">
                        <div><strong>Air Temp:</strong> {sessionData.weather[0].air_temp}°C</div>
                        <div><strong>Track Temp:</strong> {sessionData.weather[0].track_temp}°C</div>
                        <div><strong>Humidity:</strong> {sessionData.weather[0].humidity}%</div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No weather data</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Telemetry Tab */}
          <TabsContent value="telemetry" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Telemetry Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {telemetryData ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Telemetry charts will be displayed here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Data available for visualization
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No telemetry data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Driver Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-400">Driver comparison tools will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Race Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-400">Strategy analysis will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Track Tab */}
          <TabsContent value="track" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Track Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-400">Interactive track map will be shown here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>F1 AI Assistant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-gray-400">AI chatbot interface will be available here</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Ask questions about F1 data, strategy, and more
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-700 rounded text-sm text-gray-300">
                        • Explain DRS zones for this track
                      </div>
                      <div className="p-2 bg-gray-700 rounded text-sm text-gray-300">
                        • Compare tire strategies
                      </div>
                      <div className="p-2 bg-gray-700 rounded text-sm text-gray-300">
                        • Analyze fastest lap telemetry
                      </div>
                      <div className="p-2 bg-gray-700 rounded text-sm text-gray-300">
                        • Weather impact on performance
                      </div>
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