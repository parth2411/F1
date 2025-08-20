import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Zap, MessageCircle, Globe } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-f1-black to-gray-900 text-white">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-f1-red to-red-600 bg-clip-text text-transparent">
            F1 Dashboard
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience Formula 1 like never before with real-time telemetry, advanced analytics, 
            and AI-powered insights. Your gateway to the world's fastest motorsport.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="f1" className="text-lg px-8 py-3">
                Launch Dashboard
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <Zap className="w-8 h-8 text-f1-red mb-2" />
              <CardTitle className="text-white">Real-time Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Live telemetry, timing, and race updates as they happen
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-f1-red mb-2" />
              <CardTitle className="text-white">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Deep dive into performance data with interactive charts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-f1-red mb-2" />
              <CardTitle className="text-white">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Chat with our F1 expert AI for insights and analysis
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <Globe className="w-8 h-8 text-f1-red mb-2" />
              <CardTitle className="text-white">Global Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Complete coverage of all F1 sessions and races
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Section */}
        <div className="text-center">
          <Card className="bg-gray-800/50 border-gray-700 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Frontend</span>
                  <span className="text-green-400">✅ Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Backend API</span>
                  <span className="text-yellow-400">🔄 Starting...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">AI Service</span>
                  <span className="text-yellow-400">🔄 Starting...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">F1 Data</span>
                  <span className="text-yellow-400">🔄 Loading...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}