'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Users, Trophy, Clock, MapPin, Flag } from 'lucide-react';

interface Session {
  id: number;
  year: number;
  round_number: number;
  session_type: string;
  event_name: string;
  country: string;
  location: string;
  session_date: string;
  driver_count?: number;
}

interface Driver {
  driver_number: string;
  driver_code: string;
  full_name: string;
  total_laps?: number;
  fastest_lap?: number;
}

interface DashboardStats {
  total_sessions: number;
  active_drivers: number;
  current_year_sessions: number;
  latest_session: Session;
}

export default function F1Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/f1/health`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats({
            total_sessions: statsData.data.total_sessions,
            active_drivers: statsData.data.active_drivers,
            current_year_sessions: 0,
            latest_session: null as any
          });
        }
      }

      // Fetch latest session
      const latestResponse = await fetch(`${API_BASE_URL}/api/f1/latest`);
      if (latestResponse.ok) {
        const latestData = await latestResponse.json();
        if (latestData.success && latestData.data) {
          setStats(prev => prev ? {
            ...prev,
            latest_session: latestData.data.session
          } : null);
        }
      }

      // Fetch drivers
      const driversResponse = await fetch(`${API_BASE_URL}/api/f1/drivers`);
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        if (driversData.success) {
          setDrivers(driversData.data);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/f1/sessions?year=${selectedYear}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessions(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const formatLapTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'R': return 'bg-red-500';
      case 'Q': return 'bg-yellow-500';
      case 'FP1':
      case 'FP2':
      case 'FP3': return 'bg-blue-500';
      case 'Sprint': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
          <p className="mt-4 text-lg">Loading F1 Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🏎️ F1 Dashboard</h1>
        <p className="text-gray-600">Real Formula 1 data from your personal database</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Processed F1 sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_drivers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Drivers in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Event</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.latest_session?.event_name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.latest_session?.year} • Round {stats?.latest_session?.round_number}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <p className="text-xs text-muted-foreground">
              Database connected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>F1 Sessions</CardTitle>
                  <CardDescription>
                    Browse all processed Formula 1 sessions in your database
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedYear === 2025 ? "default" : "outline"}
                    onClick={() => setSelectedYear(2025)}
                    size="sm"
                  >
                    2025
                  </Button>
                  <Button
                    variant={selectedYear === 2024 ? "default" : "outline"}
                    onClick={() => setSelectedYear(2024)}
                    size="sm"
                  >
                    2024
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No sessions found for {selectedYear}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Run your F1 processor to fetch data for this year
                    </p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getSessionTypeColor(session.session_type)}`} />
                        <div>
                          <h3 className="font-semibold">{session.event_name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {session.location}, {session.country}
                            </span>
                            <span className="flex items-center">
                              <Flag className="h-3 w-3 mr-1" />
                              Round {session.round_number}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{session.session_type}</Badge>
                        <p className="text-sm text-gray-500 mt-1">{session.year}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Drivers</CardTitle>
              <CardDescription>
                All drivers currently in the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drivers.map((driver) => (
                  <div
                    key={driver.driver_number}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{driver.full_name}</h3>
                        <p className="text-gray-500">#{driver.driver_number} • {driver.driver_code}</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Analysis</CardTitle>
              <CardDescription>
                Advanced analytics will be available here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-gray-500">
                  Advanced telemetry analysis, driver comparisons, and performance insights
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}