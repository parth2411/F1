# Complete F1 Dashboard Development Plan

## 🏁 Project Overview

Build a world-class Formula 1 visualization platform inspired by f1-dash.com with modern React.js frontend, comprehensive F1 data integration, and AI-powered chatbot for F1 insights.

## 🎯 Key Features (Based on f1-dash.com Analysis)

### Core Features
- **Live Timing Dashboard** - Real-time race data visualization
- **Telemetry Analysis** - Car speed, RPM, gear, throttle, brake data
- **Driver Comparisons** - Side-by-side performance analysis
- **Race Strategy Visualization** - Pit stops, tire strategies, fuel loads
- **Track Maps** - Interactive circuit layouts with telemetry overlay
- **Weather Integration** - Real-time weather impact analysis
- **Session Analysis** - Practice, Qualifying, Race insights
- **Historical Data** - Access to F1 data from 2018 onwards

### Advanced Features
- **AI Chatbot** - F1 expert using Groq LLM + RAG
- **Predictive Analytics** - Race outcome predictions
- **Real-time Commentary** - AI-generated insights
- **Custom Dashboards** - User-personalized views
- **Multi-screen Support** - Responsive across devices
- **Data Export** - CSV, JSON export capabilities

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Next.js 14** (App Router)
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Framer Motion** for animations
- **React Query** for data fetching
- **Zustand** for state management
- **Recharts/D3.js** for visualizations
- **Socket.io Client** for real-time updates

### Backend
- **Node.js** with Express/Fastify
- **Python** for F1 data processing
- **FastF1** library for F1 data
- **PostgreSQL** for data storage
- **Redis** for caching
- **Socket.io** for real-time communication
- **Docker** for containerization

### AI & Analytics
- **Groq API** for LLM (Llama models)
- **Qdrant** for vector storage
- **LangChain** for AI orchestration
- **Python ML libraries** for predictions

### Infrastructure
- **AWS/Vercel** for deployment
- **AWS RDS** for database
- **AWS ElastiCache** for Redis
- **AWS S3** for file storage
- **Cloudflare** for CDN

## 📁 Project Structure

```
f1-dashboard/
├── frontend/                 # Next.js React app
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable components
│   │   ├── lib/             # Utilities and configs
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utilities
│   └── package.json
├── f1-processor/           # Python F1 data processor
│   ├── src/
│   │   ├── collectors/      # FastF1 data collectors
│   │   ├── processors/      # Data processing logic
│   │   ├── models/          # Data models
│   │   └── utils/           # Utilities
│   └── requirements.txt
├── ai-service/             # AI chatbot service
│   ├── src/
│   │   ├── chat/            # Chat logic
│   │   ├── rag/             # RAG implementation
│   │   ├── embeddings/      # Vector embeddings
│   │   └── llm/             # LLM integration
│   └── requirements.txt
├── shared/                 # Shared types and configs
├── docker-compose.yml      # Development environment
├── deploy/                 # Deployment configs
└── docs/                   # Documentation
```

## 🚀 Development Phases

### Phase 1: Foundation (Week 1-2)
1. **Project Setup**
   - Initialize repositories
   - Set up development environment
   - Configure Docker containers
   - Set up databases (PostgreSQL, Redis, Qdrant)

2. **Authentication System**
   - User registration/login
   - JWT token management
   - Password reset functionality
   - OAuth integration (Google, GitHub)

3. **Basic UI Framework**
   - Next.js project setup
   - Tailwind CSS configuration
   - shadcn/ui component library
   - Basic layout and navigation

### Phase 2: F1 Data Integration (Week 3-4)
1. **FastF1 Integration**
   - Set up Python data processor
   - Implement FastF1 data collectors
   - Create data models and schemas
   - Set up automated data fetching

2. **API Development**
   - RESTful API endpoints
   - Real-time WebSocket connections
   - Data caching strategies
   - Error handling and logging

3. **Core Data Visualization**
   - Live timing displays
   - Basic telemetry charts
   - Driver standings tables
   - Race calendar

### Phase 3: Advanced Features (Week 5-6)
1. **Telemetry Analysis**
   - Interactive telemetry charts
   - Driver comparison tools
   - Sector time analysis
   - Speed trap visualizations

2. **Track Maps & Strategy**
   - Interactive circuit maps
   - Pit stop visualizations
   - Tire strategy analysis
   - Race progression charts

3. **Real-time Updates**
   - Live session monitoring
   - Push notifications
   - Real-time data streaming
   - WebSocket optimization

### Phase 4: AI Integration (Week 7-8)
1. **AI Chatbot Setup**
   - Groq API integration
   - LangChain configuration
   - Vector database setup
   - RAG implementation

2. **F1 Knowledge Base**
   - F1 regulations embedding
   - Historical data indexing
   - Technical specifications
   - Driver/team information

3. **Chat Interface**
   - Chat UI components
   - Message handling
   - Context management
   - Response streaming

### Phase 5: Polish & Deploy (Week 9-10)
1. **Performance Optimization**
   - Code splitting
   - Image optimization
   - Caching strategies
   - Bundle optimization

2. **Testing & QA**
   - Unit tests
   - Integration tests
   - E2E testing
   - Performance testing

3. **Deployment**
   - Production environment setup
   - CI/CD pipeline
   - Monitoring and logging
   - Domain configuration

## 💻 Step-by-Step Implementation

### Step 1: Environment Setup

#### 1.1 Prerequisites
```bash
# Install required tools
node >= 18.0.0
python >= 3.9
docker & docker-compose
git
```

#### 1.2 Project Initialization
```bash
# Create project structure
mkdir f1-dashboard && cd f1-dashboard

# Initialize frontend (Next.js)
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir

# Initialize backend (Express)
mkdir backend && cd backend
npm init -y
npm install express cors helmet morgan dotenv socket.io redis pg

# Initialize Python services
mkdir f1-processor ai-service
```

#### 1.3 Docker Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: f1_dashboard
      POSTGRES_USER: f1_user
      POSTGRES_PASSWORD: f1_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  qdrant_data:
```

### Step 2: Frontend Foundation

#### 2.1 Next.js Configuration
```typescript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['flagcdn.com', 'cdn.f1.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
}

module.exports = nextConfig
```

#### 2.2 Tailwind Configuration
```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#E10600',
          black: '#15151E',
          white: '#FFFFFF',
          gray: {
            100: '#F8F8F8',
            200: '#E8E8E8',
            300: '#D0D0D0',
            400: '#A0A0A0',
            500: '#808080',
            600: '#606060',
            700: '#404040',
            800: '#202020',
            900: '#101010',
          }
        }
      },
      fontFamily: {
        formula: ['Formula1', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### 2.3 Authentication Pages
```typescript
// frontend/src/app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Login logic here
      console.log('Logging in:', { email, password })
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-f1-black to-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Login to F1 Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              className="w-full bg-f1-red hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 3: Backend API Development

#### 3.1 Express Server Setup
```typescript
// backend/src/server.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/f1', require('./routes/f1'))
app.use('/api/chat', require('./routes/chat'))

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId)
    console.log(`Client ${socket.id} joined session ${sessionId}`)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 8000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

#### 3.2 F1 Data Routes
```typescript
// backend/src/routes/f1.ts
import express from 'express'
import { F1Service } from '../services/F1Service'

const router = express.Router()
const f1Service = new F1Service()

// Get current season schedule
router.get('/schedule/:year?', async (req, res) => {
  try {
    const year = req.params.year || new Date().getFullYear()
    const schedule = await f1Service.getSeasonSchedule(year)
    res.json({ success: true, data: schedule })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get session data
router.get('/session/:year/:round/:session', async (req, res) => {
  try {
    const { year, round, session } = req.params
    const sessionData = await f1Service.getSessionData(year, round, session)
    res.json({ success: true, data: sessionData })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get live timing
router.get('/live/:sessionKey', async (req, res) => {
  try {
    const { sessionKey } = req.params
    const liveData = await f1Service.getLiveData(sessionKey)
    res.json({ success: true, data: liveData })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
```

### Step 4: Python F1 Data Processor

#### 4.1 FastF1 Data Collector
```python
# f1-processor/src/collectors/session_collector.py
import fastf1
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import asyncio
import aioredis
import json
from datetime import datetime

class SessionCollector:
    def __init__(self, cache_dir: str = 'cache'):
        self.cache_dir = cache_dir
        fastf1.Cache.enable_cache(cache_dir)
        
    async def collect_session_data(self, year: int, round_num: int, session: str) -> Dict:
        """Collect comprehensive session data"""
        try:
            # Load session
            session_obj = fastf1.get_session(year, round_num, session)
            session_obj.load()
            
            # Collect all data
            data = {
                'session_info': self._get_session_info(session_obj),
                'drivers': self._get_drivers_data(session_obj),
                'telemetry': self._get_telemetry_data(session_obj),
                'timing': self._get_timing_data(session_obj),
                'weather': self._get_weather_data(session_obj),
                'track_status': self._get_track_status(session_obj),
                'race_control': self._get_race_control_messages(session_obj),
                'circuit_info': self._get_circuit_info(session_obj)
            }
            
            return data
            
        except Exception as e:
            print(f"Error collecting session data: {e}")
            return {}
    
    def _get_session_info(self, session) -> Dict:
        """Extract session information"""
        return {
            'name': session.name,
            'date': session.date.isoformat() if session.date else None,
            'event_name': session.event['EventName'],
            'country': session.event['Country'],
            'location': session.event['Location'],
            'circuit_key': session.event['CircuitKey'],
            'session_type': session.name,
            'total_laps': len(session.laps) if hasattr(session, 'laps') else 0
        }
    
    def _get_drivers_data(self, session) -> Dict:
        """Extract driver data with results and lap times"""
        drivers_data = {}
        
        for driver_num in session.drivers:
            try:
                driver_info = session.get_driver(driver_num)
                driver_laps = session.laps.pick_driver(driver_num)
                
                # Process lap data
                laps_list = []
                for _, lap in driver_laps.iterrows():
                    lap_data = {
                        'lap_number': int(lap['LapNumber']),
                        'lap_time': lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None,
                        'sector1_time': lap['Sector1Time'].total_seconds() if pd.notna(lap['Sector1Time']) else None,
                        'sector2_time': lap['Sector2Time'].total_seconds() if pd.notna(lap['Sector2Time']) else None,
                        'sector3_time': lap['Sector3Time'].total_seconds() if pd.notna(lap['Sector3Time']) else None,
                        'speed_i1': lap.get('SpeedI1'),
                        'speed_i2': lap.get('SpeedI2'),
                        'speed_fl': lap.get('SpeedFL'),
                        'speed_st': lap.get('SpeedST'),
                        'compound': lap.get('Compound'),
                        'tyre_life': lap.get('TyreLife'),
                        'stint': lap.get('Stint'),
                        'pit_out_time': lap['PitOutTime'].total_seconds() if pd.notna(lap['PitOutTime']) else None,
                        'pit_in_time': lap['PitInTime'].total_seconds() if pd.notna(lap['PitInTime']) else None,
                        'is_personal_best': lap.get('IsPersonalBest', False)
                    }
                    laps_list.append(lap_data)
                
                drivers_data[str(driver_num)] = {
                    'driver_number': str(driver_num),
                    'name': driver_info.get('FullName', f'Driver {driver_num}'),
                    'abbreviation': driver_info.get('Abbreviation', str(driver_num)),
                    'team': driver_info.get('TeamName', 'Unknown'),
                    'team_color': driver_info.get('TeamColor', '#000000'),
                    'country_code': driver_info.get('CountryCode', ''),
                    'laps': laps_list,
                    'fastest_lap': min([l['lap_time'] for l in laps_list if l['lap_time']], default=None)
                }
                
            except Exception as e:
                print(f"Error processing driver {driver_num}: {e}")
                continue
        
        return drivers_data
    
    def _get_telemetry_data(self, session) -> Dict:
        """Extract telemetry data for fastest laps"""
        telemetry_data = {}
        
        for driver_num in session.drivers:
            try:
                driver_laps = session.laps.pick_driver(driver_num)
                if not driver_laps.empty:
                    fastest_lap = driver_laps.pick_fastest()
                    if fastest_lap is not None:
                        telemetry = fastest_lap.get_telemetry()
                        if not telemetry.empty:
                            telemetry_data[str(driver_num)] = {
                                'distance': telemetry['Distance'].tolist(),
                                'speed': telemetry['Speed'].tolist(),
                                'rpm': telemetry.get('RPM', []).tolist() if 'RPM' in telemetry.columns else [],
                                'gear': telemetry.get('nGear', []).tolist() if 'nGear' in telemetry.columns else [],
                                'throttle': telemetry.get('Throttle', []).tolist() if 'Throttle' in telemetry.columns else [],
                                'brake': telemetry.get('Brake', []).tolist() if 'Brake' in telemetry.columns else [],
                                'x': telemetry.get('X', []).tolist() if 'X' in telemetry.columns else [],
                                'y': telemetry.get('Y', []).tolist() if 'Y' in telemetry.columns else []
                            }
            except Exception as e:
                print(f"Error processing telemetry for driver {driver_num}: {e}")
                continue
        
        return telemetry_data
    
    def _get_timing_data(self, session) -> List[Dict]:
        """Extract timing data"""
        if not hasattr(session, 'laps') or session.laps.empty:
            return []
        
        timing_data = []
        for _, lap in session.laps.iterrows():
            timing_data.append({
                'driver': str(lap['DriverNumber']),
                'lap_number': int(lap['LapNumber']),
                'time': lap['Time'].total_seconds() if pd.notna(lap['Time']) else None,
                'lap_time': lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None,
                'position': lap.get('Position')
            })
        
        return timing_data
    
    def _get_weather_data(self, session) -> List[Dict]:
        """Extract weather data"""
        if not hasattr(session, 'weather_data') or session.weather_data.empty:
            return []
        
        weather_list = []
        for _, weather in session.weather_data.iterrows():
            weather_list.append({
                'time': weather['Time'].total_seconds() if pd.notna(weather['Time']) else None,
                'air_temp': weather.get('AirTemp'),
                'track_temp': weather.get('TrackTemp'),
                'humidity': weather.get('Humidity'),
                'pressure': weather.get('Pressure'),
                'wind_direction': weather.get('WindDirection'),
                'wind_speed': weather.get('WindSpeed'),
                'rainfall': weather.get('Rainfall')
            })
        
        return weather_list
    
    def _get_track_status(self, session) -> List[Dict]:
        """Extract track status information"""
        if not hasattr(session, 'track_status') or session.track_status.empty:
            return []
        
        status_list = []
        for _, status in session.track_status.iterrows():
            status_list.append({
                'time': status['Time'].total_seconds() if pd.notna(status['Time']) else None,
                'status': status.get('Status'),
                'message': status.get('Message', '')
            })
        
        return status_list
    
    def _get_race_control_messages(self, session) -> List[Dict]:
        """Extract race control messages"""
        if not hasattr(session, 'race_control_messages') or session.race_control_messages.empty:
            return []
        
        messages_list = []
        for _, message in session.race_control_messages.iterrows():
            messages_list.append({
                'time': message['Time'].isoformat() if pd.notna(message['Time']) else None,
                'category': message.get('Category', ''),
                'message': message.get('Message', ''),
                'status': message.get('Status', ''),
                'flag': message.get('Flag', ''),
                'scope': message.get('Scope', '')
            })
        
        return messages_list
    
    def _get_circuit_info(self, session) -> Dict:
        """Extract circuit information"""
        try:
            circuit_info = session.get_circuit_info()
            if circuit_info is None:
                return {}
            
            return {
                'corners': circuit_info.corners.to_dict('records') if hasattr(circuit_info, 'corners') else [],
                'marshal_lights': circuit_info.marshal_lights.to_dict('records') if hasattr(circuit_info, 'marshal_lights') else [],
                'marshal_sectors': circuit_info.marshal_sectors.to_dict('records') if hasattr(circuit_info, 'marshal_sectors') else [],
                'rotation': getattr(circuit_info, 'rotation', 0)
            }
        except Exception as e:
            print(f"Error getting circuit info: {e}")
            return {}
```

### Step 5: AI Chatbot Integration

#### 5.1 Groq LLM Setup
```python
# ai-service/src/llm/groq_client.py
from groq import Groq
import os
from typing import List, Dict, Optional
import asyncio

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.model = "llama-3.3-70b-versatile"
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Generate chat completion using Groq"""
        try:
            if system_prompt:
                messages.insert(0, {"role": "system", "content": system_prompt})
            
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=temperature,
                max_tokens=1024,
                stream=False
            )
            
            return chat_completion.choices[0].message.content
            
        except Exception as e:
            print(f"Error in chat completion: {e}")
            return "I apologize, but I'm experiencing technical difficulties. Please try again."

# ai-service/src/chat/f1_expert.py
from typing import List, Dict
from .groq_client import GroqClient
from ..rag.vector_store import VectorStore

class F1Expert:
    def __init__(self):
        self.llm = GroqClient()
        self.vector_store = VectorStore()
        self.system_prompt = """
        You are an expert Formula 1 analyst with deep knowledge of F1 history, regulations, 
        technical aspects, driver performance, team strategies, and race analysis.
        
        Your expertise includes:
        - F1 technical regulations and car specifications
        - Driver and team performance analysis
        - Race strategy and pit stop tactics
        - Historical F1 statistics and records
        - Circuit characteristics and track analysis
        - Telemetry data interpretation
        - Weather impact on race performance
        
        Always provide accurate, detailed, and insightful responses about Formula 1.
        When analyzing data, explain the technical aspects in an accessible way.
        If you're unsure about specific current data, acknowledge limitations.
        """
    
    async def answer_question(self, question: str, context: Dict = None) -> str:
        """Answer F1-related questions with context"""
        try:
            # Get relevant context from vector store
            relevant_docs = await self.vector_store.search(question, limit=5)
            
            # Build context
            context_text = ""
            if relevant_docs:
                context_text = "\n\nRelevant Information:\n"
                for doc in relevant_docs:
                    context_text += f"- {doc['content']}\n"
            
            # Add current session context if provided
            if context:
                context_text += f"\n\nCurrent Session Data: {context}"
            
            messages = [
                {
                    "role": "user", 
                    "content": f"{question}{context_text}"
                }
            ]
            
            response = await self.llm.chat_completion(
                messages=messages,
                system_prompt=self.system_prompt
            )
            
            return response
            
        except Exception as e:
            print(f"Error answering question: {e}")
            return "I'm having trouble processing your question. Please try again."
```

### Step 6: Real-time Dashboard Components

#### 6.1 Live Timing Component
```typescript
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
```

#### 6.2 Telemetry Chart Component
```typescript
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
```

#### 6.3 AI Chatbot Component
```typescript
// frontend/src/components/chat/F1Chatbot.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface F1ChatbotProps {
  sessionContext?: any
}

export default function F1Chatbot({ sessionContext }: F1ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your F1 expert assistant. Ask me anything about Formula 1 - from technical details to race analysis!",
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/f1-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: sessionContext,
          history: messages.slice(-5) // Last 5 messages for context
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble right now. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          F1 Expert Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-f1-red flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-f1-red flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Ask about F1 strategy, drivers, technical details..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Step 7: Main Dashboard Layout

#### 7.1 Dashboard Page
```typescript
// frontend/src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LiveTiming from '@/components/dashboard/LiveTiming'
import TelemetryChart from '@/components/telemetry/TelemetryChart'
import F1Chatbot from '@/components/chat/F1Chatbot'
import DriverComparison from '@/components/analysis/DriverComparison'
import RaceStrategy from '@/components/strategy/RaceStrategy'
import TrackMap from '@/components/track/TrackMap'
import { useF1Data } from '@/hooks/useF1Data'

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
```

### Step 8: Data Hooks and Services

#### 8.1 F1 Data Hook
```typescript
// frontend/src/hooks/useF1Data.ts
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
      const response = await fetch(`/api/f1/schedule/${year}`)
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
      
      const response = await fetch(`/api/f1/session/${year}/${round}/${session}`)
      const data = await response.json()
      
      if (data.success) {
        setSessionData(data.data)
        
        // Load telemetry for the fastest driver
        const drivers = Object.keys(data.data.drivers)
        if (drivers.length > 0) {
          const fastestDriver = drivers[0] // Simplified - should find actual fastest
          const telemetryResponse = await fetch(`/api/f1/telemetry/${year}/${round}/${session}/${fastestDriver}`)
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
```

#### 8.2 WebSocket Hook
```typescript
// frontend/src/hooks/useSocket.ts
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000', {
      transports: ['websocket'],
      autoConnect: true
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  return socketRef.current
}
```

### Step 9: Type Definitions

#### 9.1 F1 Types
```typescript
// frontend/src/types/f1.ts
export interface DriverData {
  driver_number: string
  name: string
  abbreviation: string
  team: string
  team_color: string
  country_code: string
  laps: LapData[]
  fastest_lap: number | null
}

export interface LapData {
  lap_number: number
  lap_time: number | null
  sector1_time: number | null
  sector2_time: number | null
  sector3_time: number | null
  speed_i1: number | null
  speed_i2: number | null
  speed_fl: number | null
  speed_st: number | null
  compound: string | null
  tyre_life: number | null
  stint: number | null
  pit_out_time: number | null
  pit_in_time: number | null
  is_personal_best: boolean
}

export interface TelemetryData {
  distance: number[]
  speed: number[]
  rpm: number[]
  gear: number[]
  throttle: number[]
  brake: number[]
  x: number[]
  y: number[]
}

export interface TimingData {
  driver: string
  position: number
  gap: string | null
  lap_time: number | null
  sector1: number | null
  sector2: number | null
  sector3: number | null
  compound: string | null
  tyre_life: number | null
}

export interface SessionData {
  session_info: {
    name: string
    date: string | null
    event_name: string
    country: string
    location: string
    circuit_key: string
    session_type: string
    total_laps: number
  }
  drivers: Record<string, DriverData>
  telemetry: Record<string, TelemetryData>
  timing: TimingData[]
  weather: WeatherData[]
  track_status: TrackStatusData[]
  race_control: RaceControlMessage[]
  circuit_info: CircuitInfo
}

export interface WeatherData {
  time: number | null
  air_temp: number | null
  track_temp: number | null
  humidity: number | null
  pressure: number | null
  wind_direction: number | null
  wind_speed: number | null
  rainfall: number | null
}

export interface TrackStatusData {
  time: number | null
  status: string | null
  message: string
}

export interface RaceControlMessage {
  time: string | null
  category: string
  message: string
  status: string
  flag: string
  scope: string
}

export interface CircuitInfo {
  corners: CornerData[]
  marshal_lights: any[]
  marshal_sectors: any[]
  rotation: number
}

export interface CornerData {
  number: number
  letter: string
  angle: number
  distance: number
  x: number
  y: number
}

export interface Schedule {
  round: number
  country: string
  location: string
  event_name: string
  event_date: string | null
  event_format: string
}
```

### Step 10: Environment Configuration

#### 10.1 Environment Variables
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=http://localhost:8000
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# backend/.env
PORT=8000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://f1_user:f1_password@localhost:5432/f1_dashboard
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret

# ai-service/.env
GROQ_API_KEY=your-groq-api-key
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key

# f1-processor/.env
FASTF1_CACHE_DIR=./cache
DATABASE_URL=postgresql://f1_user:f1_password@localhost:5432/f1_dashboard
REDIS_URL=redis://localhost:6379
```

### Step 11: Database Schema

#### 11.1 PostgreSQL Schema
```sql
-- Database schema for F1 Dashboard
-- File: database/schema.sql

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for F1 sessions
CREATE TABLE f1_sessions (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    session_type VARCHAR(20) NOT NULL, -- FP1, FP2, FP3, Q, Sprint, Race
    event_name VARCHAR(255) NOT NULL,
    circuit_key VARCHAR(50),
    country VARCHAR(100),
    location VARCHAR(100),
    session_date TIMESTAMP,
    weather_data JSONB,
    circuit_info JSONB,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, round_number, session_type)
);

-- Drivers table
CREATE TABLE drivers (
    driver_number VARCHAR(10) PRIMARY KEY,
    driver_code VARCHAR(3) UNIQUE,
    full_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nationality VARCHAR(100),
    date_of_birth DATE,
    team_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    constructor_name VARCHAR(255),
    team_color VARCHAR(7), -- Hex color
    nationality VARCHAR(100),
    year INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lap times table
CREATE TABLE lap_times (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES f1_sessions(id),
    driver_number VARCHAR(10) REFERENCES drivers(driver_number),
    lap_number INTEGER NOT NULL,
    lap_time DECIMAL(8,3), -- in seconds
    sector1_time DECIMAL(6,3),
    sector2_time DECIMAL(6,3),
    sector3_time DECIMAL(6,3),
    speed_i1 DECIMAL(6,2),
    speed_i2 DECIMAL(6,2),
    speed_fl DECIMAL(6,2),
    speed_st DECIMAL(6,2),
    compound VARCHAR(20),
    tyre_life INTEGER,
    stint_number INTEGER,
    position INTEGER,
    pit_in_time TIMESTAMP,
    pit_out_time TIMESTAMP,
    is_personal_best BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telemetry data table (for storing aggregated telemetry)
CREATE TABLE telemetry_data (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES f1_sessions(id),
    driver_number VARCHAR(10) REFERENCES drivers(driver_number),
    lap_number INTEGER,
    telemetry_type VARCHAR(20), -- 'fastest_lap', 'comparison', etc.
    data JSONB NOT NULL, -- Stores the actual telemetry arrays
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Race control messages
CREATE TABLE race_control_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES f1_sessions(id),
    message_time TIMESTAMP,
    category VARCHAR(50),
    message TEXT,
    status VARCHAR(50),
    flag VARCHAR(20),
    scope VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track status
CREATE TABLE track_status (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES f1_sessions(id),
    status_time TIMESTAMP,
    status VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    favorite_drivers TEXT[], -- Array of driver numbers
    favorite_teams INTEGER[], -- Array of team IDs
    dashboard_layout JSONB,
    notification_settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id INTEGER REFERENCES f1_sessions(id),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_lap_times_session_driver ON lap_times(session_id, driver_number);
CREATE INDEX idx_lap_times_lap_number ON lap_times(lap_number);
CREATE INDEX idx_telemetry_session_driver ON telemetry_data(session_id, driver_number);
CREATE INDEX idx_f1_sessions_year_round ON f1_sessions(year, round_number);
CREATE INDEX idx_race_control_session ON race_control_messages(session_id);
CREATE INDEX idx_track_status_session ON track_status(session_id);
```

### Step 12: Complete Backend Services

#### 12.1 F1 Service Implementation
```typescript
// backend/src/services/F1Service.ts
import { Pool } from 'pg'
import Redis from 'ioredis'
import { SessionData, Schedule } from '../types/f1'

export class F1Service {
  private db: Pool
  private redis: Redis
  
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    
    this.redis = new Redis(process.env.REDIS_URL)
  }

  async getSeasonSchedule(year: number): Promise<Schedule[]> {
    const cacheKey = `schedule:${year}`
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Query database
      const query = `
        SELECT 
          round_number as round,
          event_name,
          country,
          location,
          session_date as event_date,
          'Standard' as event_format
        FROM f1_sessions 
        WHERE year = $1 AND session_type = 'Race'
        ORDER BY round_number
      `
      
      const result = await this.db.query(query, [year])
      const schedule = result.rows

      // Cache for 1 hour
      await this.redis.setex(cacheKey, 3600, JSON.stringify(schedule))
      
      return schedule
    } catch (error) {
      console.error('Error fetching schedule:', error)
      throw new Error('Failed to fetch season schedule')
    }
  }

  async getSessionData(year: number, round: number, sessionType: string): Promise<SessionData | null> {
    const cacheKey = `session:${year}:${round}:${sessionType}`
    
    try {
      // Check cache first
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Get session info
      const sessionQuery = `
        SELECT * FROM f1_sessions 
        WHERE year = $1 AND round_number = $2 AND session_type = $3
      `
      const sessionResult = await this.db.query(sessionQuery, [year, round, sessionType])
      
      if (sessionResult.rows.length === 0) {
        return null
      }

      const session = sessionResult.rows[0]
      const sessionId = session.id

      // Get drivers data with lap times
      const driversData = await this.getDriversData(sessionId)
      
      // Get telemetry data
      const telemetryData = await this.getTelemetryData(sessionId)
      
      // Get timing data
      const timingData = await this.getTimingData(sessionId)
      
      // Get weather data
      const weatherData = session.weather_data || []
      
      // Get race control messages
      const raceControlData = await this.getRaceControlMessages(sessionId)
      
      // Get track status
      const trackStatusData = await this.getTrackStatus(sessionId)

      const sessionData: SessionData = {
        session_info: {
          name: session.session_type,
          date: session.session_date,
          event_name: session.event_name,
          country: session.country,
          location: session.location,
          circuit_key: session.circuit_key,
          session_type: session.session_type,
          total_laps: await this.getTotalLaps(sessionId)
        },
        drivers: driversData,
        telemetry: telemetryData,
        timing: timingData,
        weather: weatherData,
        track_status: trackStatusData,
        race_control: raceControlData,
        circuit_info: session.circuit_info || {}
      }

      // Cache for 30 minutes
      await this.redis.setex(cacheKey, 1800, JSON.stringify(sessionData))
      
      return sessionData
    } catch (error) {
      console.error('Error fetching session data:', error)
      throw new Error('Failed to fetch session data')
    }
  }

  private async getDriversData(sessionId: number): Promise<Record<string, any>> {
    const query = `
      SELECT 
        d.driver_number,
        d.full_name as name,
        d.driver_code as abbreviation,
        t.team_name as team,
        t.team_color,
        d.nationality as country_code,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'lap_number', lt.lap_number,
              'lap_time', lt.lap_time,
              'sector1_time', lt.sector1_time,
              'sector2_time', lt.sector2_time,
              'sector3_time', lt.sector3_time,
              'speed_i1', lt.speed_i1,
              'speed_i2', lt.speed_i2,
              'speed_fl', lt.speed_fl,
              'speed_st', lt.speed_st,
              'compound', lt.compound,
              'tyre_life', lt.tyre_life,
              'stint', lt.stint_number,
              'pit_out_time', EXTRACT(EPOCH FROM lt.pit_out_time),
              'pit_in_time', EXTRACT(EPOCH FROM lt.pit_in_time),
              'is_personal_best', lt.is_personal_best
            ) ORDER BY lt.lap_number
          ) FILTER (WHERE lt.lap_number IS NOT NULL), 
          '[]'::json
        ) as laps
      FROM drivers d
      LEFT JOIN teams t ON d.team_id = t.id
      LEFT JOIN lap_times lt ON d.driver_number = lt.driver_number AND lt.session_id = $1
      WHERE EXISTS (
        SELECT 1 FROM lap_times lt2 
        WHERE lt2.driver_number = d.driver_number AND lt2.session_id = $1
      )
      GROUP BY d.driver_number, d.full_name, d.driver_code, t.team_name, t.team_color, d.nationality
    `
    
    const result = await this.db.query(query, [sessionId])
    
    const driversData: Record<string, any> = {}
    result.rows.forEach(row => {
      const laps = row.laps || []
      const fastestLap = laps
        .filter((lap: any) => lap.lap_time)
        .reduce((fastest: any, current: any) => 
          !fastest || current.lap_time < fastest.lap_time ? current : fastest, null)

      driversData[row.driver_number] = {
        driver_number: row.driver_number,
        name: row.name,
        abbreviation: row.abbreviation,
        team: row.team,
        team_color: row.team_color,
        country_code: row.country_code,
        laps: laps,
        fastest_lap: fastestLap?.lap_time || null
      }
    })

    return driversData
  }

  private async getTelemetryData(sessionId: number): Promise<Record<string, any>> {
    const query = `
      SELECT driver_number, data 
      FROM telemetry_data 
      WHERE session_id = $1 AND telemetry_type = 'fastest_lap'
    `
    
    const result = await this.db.query(query, [sessionId])
    
    const telemetryData: Record<string, any> = {}
    result.rows.forEach(row => {
      telemetryData[row.driver_number] = row.data
    })

    return telemetryData
  }

  private async getTimingData(sessionId: number): Promise<any[]> {
    const query = `
      SELECT 
        driver_number as driver,
        position,
        lap_time,
        sector1_time as sector1,
        sector2_time as sector2,
        sector3_time as sector3,
        compound,
        tyre_life
      FROM lap_times 
      WHERE session_id = $1 
      ORDER BY lap_number DESC, position ASC
      LIMIT 20
    `
    
    const result = await this.db.query(query, [sessionId])
    return result.rows
  }

  private async getRaceControlMessages(sessionId: number): Promise<any[]> {
    const query = `
      SELECT 
        message_time as time,
        category,
        message,
        status,
        flag,
        scope
      FROM race_control_messages 
      WHERE session_id = $1 
      ORDER BY message_time DESC
    `
    
    const result = await this.db.query(query, [sessionId])
    return result.rows
  }

  private async getTrackStatus(sessionId: number): Promise<any[]> {
    const query = `
      SELECT 
        status_time as time,
        status,
        message
      FROM track_status 
      WHERE session_id = $1 
      ORDER BY status_time DESC
    `
    
    const result = await this.db.query(query, [sessionId])
    return result.rows
  }

  private async getTotalLaps(sessionId: number): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT lap_number) as total_laps
      FROM lap_times 
      WHERE session_id = $1
    `
    
    const result = await this.db.query(query, [sessionId])
    return result.rows[0]?.total_laps || 0
  }

  async getLiveData(sessionKey: string): Promise<any> {
    // Implementation for live timing data
    // This would connect to F1's live timing API or use FastF1's live timing
    try {
      const cacheKey = `live:${sessionKey}`
      const cached = await this.redis.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached)
      }

      // In a real implementation, this would fetch from F1 live timing
      const liveData = {
        session_key: sessionKey,
        timestamp: new Date().toISOString(),
        drivers: [],
        track_status: 'Green',
        session_status: 'Active'
      }

      // Cache for 5 seconds
      await this.redis.setex(cacheKey, 5, JSON.stringify(liveData))
      
      return liveData
    } catch (error) {
      console.error('Error fetching live data:', error)
      throw new Error('Failed to fetch live data')
    }
  }
}
```

#### 12.2 Chat Service for AI Integration
```typescript
// backend/src/services/ChatService.ts
import { Pool } from 'pg'
import axios from 'axios'

export class ChatService {
  private db: Pool
  private aiServiceUrl: string

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001'
  }

  async processF1Question(
    userId: number,
    message: string,
    context: any = null,
    history: any[] = []
  ): Promise<string> {
    try {
      // Send request to AI service
      const response = await axios.post(`${this.aiServiceUrl}/chat/f1-expert`, {
        message,
        context,
        history: history.slice(-5) // Last 5 messages for context
      })

      const aiResponse = response.data.response

      // Save chat history
      await this.saveChatHistory(userId, message, aiResponse, context)

      return aiResponse
    } catch (error) {
      console.error('Error processing F1 question:', error)
      return "I'm sorry, I'm having trouble processing your question right now. Please try again."
    }
  }

  private async saveChatHistory(
    userId: number,
    message: string,
    response: string,
    context: any
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO chat_history (user_id, message, response, context_data)
        VALUES ($1, $2, $3, $4)
      `
      await this.db.query(query, [userId, message, response, context])
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }

  async getChatHistory(userId: number, limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT message, response, created_at
        FROM chat_history
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `
      const result = await this.db.query(query, [userId, limit])
      return result.rows.reverse() // Return in chronological order
    } catch (error) {
      console.error('Error fetching chat history:', error)
      return []
    }
  }
}
```

### Step 13: AI Service Complete Implementation

#### 13.1 RAG Vector Store
```python
# ai-service/src/rag/vector_store.py
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import uuid
from typing import List, Dict, Optional
import os

class VectorStore:
    def __init__(self):
        self.client = QdrantClient(
            url=os.getenv('QDRANT_URL', 'http://localhost:6333'),
            api_key=os.getenv('QDRANT_API_KEY')
        )
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.collection_name = "f1_knowledge"
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Ensure the F1 knowledge collection exists"""
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # all-MiniLM-L6-v2 embedding size
                        distance=Distance.COSINE
                    )
                )
                print(f"Created collection: {self.collection_name}")
        except Exception as e:
            print(f"Error ensuring collection: {e}")
    
    async def add_documents(self, documents: List[Dict[str, str]]):
        """Add documents to the vector store"""
        try:
            points = []
            for doc in documents:
                # Generate embedding
                embedding = self.encoder.encode(doc['content']).tolist()
                
                # Create point
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        'content': doc['content'],
                        'source': doc.get('source', ''),
                        'category': doc.get('category', ''),
                        'metadata': doc.get('metadata', {})
                    }
                )
                points.append(point)
            
            # Upsert points
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            print(f"Added {len(points)} documents to vector store")
            
        except Exception as e:
            print(f"Error adding documents: {e}")
    
    async def search(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for relevant documents"""
        try:
            # Generate query embedding
            query_embedding = self.encoder.encode(query).tolist()
            
            # Search
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit
            )
            
            # Format results
            results = []
            for hit in search_result:
                results.append({
                    'content': hit.payload['content'],
                    'source': hit.payload.get('source', ''),
                    'category': hit.payload.get('category', ''),
                    'score': hit.score,
                    'metadata': hit.payload.get('metadata', {})
                })
            
            return results
            
        except Exception as e:
            print(f"Error searching: {e}")
            return []
    
    async def initialize_f1_knowledge(self):
        """Initialize the vector store with F1 knowledge base"""
        f1_documents = [
            {
                'content': 'DRS (Drag Reduction System) is a driver-adjustable bodywork feature that reduces aerodynamic drag to promote overtaking. It can only be used in designated DRS zones and when a driver is within one second of the car ahead.',
                'source': 'F1 Technical Regulations',
                'category': 'Technical',
                'metadata': {'topic': 'DRS', 'year': '2024'}
            },
            {
                'content': 'Formula 1 uses three types of dry weather tyres: Soft (red), Medium (yellow), and Hard (white). Each compound offers different levels of grip and durability.',
                'source': 'F1 Sporting Regulations',
                'category': 'Technical',
                'metadata': {'topic': 'Tyres', 'year': '2024'}
            },
            {
                'content': 'Points are awarded to the top 10 finishers: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1. An additional point is awarded for the fastest lap if the driver finishes in the top 10.',
                'source': 'F1 Sporting Regulations',
                'category': 'Scoring',
                'metadata': {'topic': 'Points System', 'year': '2024'}
            },
            {
                'content': 'Each driver must use at least two different tyre compounds during the race (unless it is a wet race). Drivers who reach Q3 must start the race on the tyres they used to set their fastest Q2 time.',
                'source': 'F1 Sporting Regulations', 
                'category': 'Strategy',
                'metadata': {'topic': 'Tyre Rules', 'year': '2024'}
            },
            {
                'content': 'The pit lane speed limit is 80 km/h (50 mph) for safety reasons. Exceeding this limit results in a time penalty.',
                'source': 'F1 Sporting Regulations',
                'category': 'Safety',
                'metadata': {'topic': 'Pit Lane', 'year': '2024'}
            },
            {
                'content': 'Track limits are defined by the white lines on the edge of the track. Drivers who consistently exceed track limits may receive warnings and eventual time penalties.',
                'source': 'F1 Sporting Regulations',
                'category': 'Rules',
                'metadata': {'topic': 'Track Limits', 'year': '2024'}
            },
            {
                'content': 'ERS (Energy Recovery System) allows drivers to deploy up to 160 kJ of electrical energy per lap for approximately 33 seconds of extra power.',
                'source': 'F1 Technical Regulations',
                'category': 'Technical',
                'metadata': {'topic': 'ERS', 'year': '2024'}
            }
        ]
        
        await self.add_documents(f1_documents)
```

#### 13.2 Complete AI Chat Endpoint
```python
# ai-service/src/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import os
from .chat.f1_expert import F1Expert
from .rag.vector_store import VectorStore

app = FastAPI(title="F1 AI Service", version="1.0.0")

# Initialize services
f1_expert = F1Expert()
vector_store = VectorStore()

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = None
    history: Optional[List[Dict]] = []

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Dict]] = []

@app.on_event("startup")
async def startup_event():
    """Initialize the knowledge base on startup"""
    await vector_store.initialize_f1_knowledge()
    print("F1 AI Service started successfully")

@app.post("/chat/f1-expert", response_model=ChatResponse)
async def chat_with_f1_expert(request: ChatRequest):
    """Chat with the F1 expert AI"""
    try:
        # Get relevant context from vector store
        relevant_docs = await vector_store.search(request.message, limit=3)
        
        # Process the question
        response = await f1_expert.answer_question(
            question=request.message,
            context=request.context,
            history=request.history,
            relevant_docs=relevant_docs
        )
        
        return ChatResponse(
            response=response,
            sources=relevant_docs
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/knowledge/add")
async def add_knowledge(documents: List[Dict[str, str]]):
    """Add new documents to the knowledge base"""
    try:
        await vector_store.add_documents(documents)
        return {"message": f"Added {len(documents)} documents successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "F1 AI Service"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=True
    )
```

#### 13.3 Enhanced F1 Expert with Context
```python
# ai-service/src/chat/f1_expert.py (Enhanced version)
from typing import List, Dict, Optional
from ..llm.groq_client import GroqClient
import json

class F1Expert:
    def __init__(self):
        self.llm = GroqClient()
        self.system_prompt = """
        You are an expert Formula 1 analyst with comprehensive knowledge of F1 history, 
        regulations, technical aspects, driver performance, team strategies, and race analysis.
        
        Your expertise includes:
        - F1 technical regulations and car specifications
        - Driver and team performance analysis  
        - Race strategy and pit stop tactics
        - Historical F1 statistics and records
        - Circuit characteristics and track analysis
        - Telemetry data interpretation
        - Weather impact on race performance
        - Tyre strategy and degradation analysis
        - Aerodynamics and car setup
        - Power unit regulations and ERS systems
        
        When answering questions:
        1. Provide accurate, detailed, and insightful responses
        2. Explain technical aspects in an accessible way
        3. Use specific data when available in the context
        4. Reference relevant F1 regulations or historical examples
        5. If analyzing current session data, provide specific insights based on the numbers
        6. Always acknowledge if you're uncertain about specific current data
        
        Current Context Information will be provided when available.
        """
    
    async def answer_question(
        self, 
        question: str, 
        context: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
        relevant_docs: Optional[List[Dict]] = None
    ) -> str:
        """Answer F1-related questions with comprehensive context"""
        try:
            # Build context string
            context_parts = []
            
            # Add relevant knowledge base documents
            if relevant_docs:
                context_parts.append("=== RELEVANT F1 KNOWLEDGE ===")
                for i, doc in enumerate(relevant_docs, 1):
                    context_parts.append(f"{i}. {doc['content']}")
                    if doc.get('source'):
                        context_parts.append(f"   Source: {doc['source']}")
                context_parts.append("")
            
            # Add current session context
            if context:
                context_parts.append("=== CURRENT SESSION DATA ===")
                
                # Session info
                if 'session_info' in context:
                    session = context['session_info']
                    context_parts.append(f"Event: {session.get('event_name', 'Unknown')}")
                    context_parts.append(f"Location: {session.get('location', 'Unknown')}")
                    context_parts.append(f"Session: {session.get('session_type', 'Unknown')}")
                    context_parts.append(f"Date: {session.get('date', 'Unknown')}")
                    context_parts.append("")
                
                # Driver data summary
                if 'drivers' in context and context['drivers']:
                    context_parts.append("DRIVER PERFORMANCE:")
                    drivers = list(context['drivers'].values())[:10]  # Top 10
                    for driver in drivers:
                        fastest = driver.get('fastest_lap')
                        fastest_str = f"{fastest:.3f}s" if fastest else "No time"
                        context_parts.append(
                            f"- {driver.get('abbreviation', 'UNK')} ({driver.get('team', 'Unknown')}): "
                            f"Fastest: {fastest_str}, Laps: {len(driver.get('laps', []))}"
                        )
                    context_parts.append("")
                
                # Weather data
                if 'weather' in context and context['weather']:
                    weather = context['weather'][0] if context['weather'] else {}
                    context_parts.append("WEATHER CONDITIONS:")
                    if weather.get('air_temp'):
                        context_parts.append(f"- Air Temperature: {weather['air_temp']}°C")
                    if weather.get('track_temp'):
                        context_parts.append(f"- Track Temperature: {weather['track_temp']}°C")
                    if weather.get('humidity'):
                        context_parts.append(f"- Humidity: {weather['humidity']}%")
                    context_parts.append("")
            
            # Build conversation history
            messages = []
            if history:
                for msg in history[-3:]:  # Last 3 messages for context
                    if msg.get('role') in ['user', 'assistant']:
                        messages.append({
                            "role": msg['role'],
                            "content": msg['content']
                        })
            
            # Add current question with context
            full_context = "\n".join(context_parts) if context_parts else ""
            user_message = f"{question}\n\n{full_context}" if full_context else question
            
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Get response from LLM
            response = await self.llm.chat_completion(
                messages=messages,
                system_prompt=self.system_prompt,
                temperature=0.7
            )
            
            return response
            
        except Exception as e:
            print(f"Error answering question: {e}")
            return "I'm having trouble processing your question. Please try again."
    
    async def analyze_driver_performance(self, driver_data: Dict, context: Dict) -> str:
        """Provide detailed driver performance analysis"""
        try:
            laps = driver_data.get('laps', [])
            if not laps:
                return f"No lap data available for {driver_data.get('name', 'this driver')}."
            
            # Calculate performance metrics
            valid_laps = [lap for lap in laps if lap.get('lap_time')]
            if not valid_laps:
                return f"No valid lap times for {driver_data.get('name', 'this driver')}."
            
            lap_times = [lap['lap_time'] for lap in valid_laps]
            fastest_lap = min(lap_times)
            average_lap = sum(lap_times) / len(lap_times)
            consistency = (max(lap_times) - min(lap_times)) / min(lap_times) * 100
            
            # Sector analysis
            sector_data = {
                'sector1': [lap.get('sector1_time') for lap in valid_laps if lap.get('sector1_time')],
                'sector2': [lap.get('sector2_time') for lap in valid_laps if lap.get('sector2_time')],
                'sector3': [lap.get('sector3_time') for lap in valid_laps if lap.get('sector3_time')]
            }
            
            analysis = f"""
**Performance Analysis for {driver_data.get('name', 'Driver')} ({driver_data.get('team', 'Unknown Team')})**

**Lap Time Performance:**
- Fastest Lap: {fastest_lap:.3f}s
- Average Lap: {average_lap:.3f}s
- Consistency: {consistency:.1f}% variation
- Total Valid Laps: {len(valid_laps)}

**Sector Performance:**
"""
            
            for sector, times in sector_data.items():
                if times:
                    best_sector = min(times)
                    avg_sector = sum(times) / len(times)
                    analysis += f"- {sector.title()}: Best {best_sector:.3f}s, Avg {avg_sector:.3f}s\n"
            
            # Tire strategy
            compounds_used = list(set(lap.get('compound') for lap in laps if lap.get('compound')))
            if compounds_used:
                analysis += f"\n**Tire Strategy:**\n- Compounds Used: {', '.join(compounds_used)}\n"
            
            return analysis.strip()
            
        except Exception as e:
            print(f"Error analyzing driver performance: {e}")
            return "Unable to analyze driver performance data."
```

### Step 14: Advanced Frontend Components

#### 14.1 Driver Comparison Component
```typescript
// frontend/src/components/analysis/DriverComparison.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
```

#### 14.2 Race Strategy Component
```typescript
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
```

#### 14.3 Interactive Track Map Component
```typescript
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
```

### Step 15: Deployment Configuration

#### 15.1 Docker Configuration
```dockerfile
# Frontend Dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# Backend Dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8000
CMD ["npm", "start"]
```

```dockerfile
# Python AI Service Dockerfile
# ai-service/Dockerfile
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

```dockerfile
# F1 Processor Dockerfile
# f1-processor/Dockerfile
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "src/main.py"]
```

#### 15.2 Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: f1_dashboard
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Vector Database
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    restart: unless-stopped

  # Backend API
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/f1_dashboard
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - AI_SERVICE_URL=http://ai-service:8001
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # AI Service
  ai-service:
    build: ./ai-service
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - QDRANT_URL=http://qdrant:6333
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/f1_dashboard
    ports:
      - "8001:8001"
    depends_on:
      - qdrant
      - postgres
    restart: unless-stopped

  # F1 Data Processor
  f1-processor:
    build: ./f1-processor
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/f1_dashboard
      - REDIS_URL=redis://redis:6379
      - FASTF1_CACHE_DIR=/app/cache
    volumes:
      - f1_cache:/app/cache
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Frontend
  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
  f1_cache:
```

#### 15.3 Nginx Configuration
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=chat:10m rate=5r/s;

    server {
        listen 80;
        server_name your-domain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

        # Gzip Compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # API Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Chat API with stricter rate limiting
        location /api/chat/ {
            limit_req zone=chat burst=10 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket Support
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Step 16: CI/CD Pipeline

#### 16.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy F1 Dashboard

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'
      
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      
      - name: Install backend dependencies
        run: cd backend && npm ci
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Python dependencies
        run: |
          cd ai-service
          pip install -r requirements.txt
      
      - name: Run Python tests
        run: |
          cd ai-service
          python -m pytest

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    strategy:
      matrix:
        service: [frontend, backend, ai-service, f1-processor]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/f1-dashboard
            git pull origin main
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

### Step 17: Monitoring and Logging

#### 17.1 Application Monitoring
```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  # Prometheus for metrics collection
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  # Loki for log aggregation
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki_data:/loki

  # Promtail for log collection
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - ./promtail.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

volumes:
  prometheus_data:
  grafana_data:
  loki_data:
```

### Step 18: Final Setup Instructions

#### 18.1 Complete Installation Guide
```bash
#!/bin/bash
# setup.sh - Complete F1 Dashboard Setup Script

echo "🏁 Setting up F1 Dashboard..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Aborting." >&2; exit 1; }

# Create project structure
echo "📁 Creating project structure..."
mkdir -p f1-dashboard/{frontend,backend,ai-service,f1-processor,database,nginx,monitoring}
cd f1-dashboard

# Clone or setup repositories
echo "📦 Setting up repositories..."

# Frontend setup
echo "⚛️ Setting up frontend..."
cd frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm
npm install @radix-ui/react-select @radix-ui/react-tabs recharts socket.io-client zustand @tanstack/react-query
cd ..

# Backend setup
echo "🔧 Setting up backend..."
cd backend
npm init -y
npm install express cors helmet morgan dotenv socket.io redis pg bcryptjs jsonwebtoken
npm install -D @types/node @types/express nodemon typescript ts-node
cd ..

# AI Service setup
echo "🤖 Setting up AI service..."
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn groq qdrant-client sentence-transformers psycopg2-binary redis
pip freeze > requirements.txt
cd ..

# F1 Processor setup
echo "🏎️ Setting up F1 processor..."
cd f1-processor
python3 -m venv venv
source venv/bin/activate
pip install fastf1 pandas numpy psycopg2-binary redis python-dotenv
pip freeze > requirements.txt
cd ..

# Environment setup
echo "⚙️ Setting up environment variables..."
cat > .env << EOF
# Database
POSTGRES_USER=f1_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=f1_dashboard

# JWT
JWT_SECRET=your_jwt_secret_here

# Groq API
GROQ_API_KEY=your_groq_api_key_here

# Qdrant
QDRANT_API_KEY=your_qdrant_api_key_here

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
AI_SERVICE_URL=http://localhost:8001
EOF

echo "🔑 Please update the .env file with your actual API keys and passwords!"

# Docker setup
echo "🐳 Setting up Docker..."
docker-compose up -d postgres redis qdrant

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Run database migrations
echo "📊 Setting up database..."
docker-compose exec postgres psql -U f1_user -d f1_dashboard -f /docker-entrypoint-initdb.d/schema.sql

echo "✅ F1 Dashboard setup complete!"
echo ""
echo "🚀 To start the development environment:"
echo "1. Update .env with your API keys"
echo "2. Run: docker-compose up -d"
echo "3. Frontend: cd frontend && npm run dev"
echo "4. Backend: cd backend && npm run dev"
echo "5. AI Service: cd ai-service && source venv/bin/activate && uvicorn src.main:app --reload --port 8001"
echo "6. F1 Processor: cd f1-processor && source venv/bin/activate && python src/main.py"
echo ""
echo "🌐 Access the dashboard at: http://localhost:3000"
echo "📊 API documentation at: http://localhost:8000/api/docs"
echo "🤖 AI service at: http://localhost:8001/docs"
```

## 🎯 Summary

This comprehensive plan provides everything needed to build a world-class F1 visualization platform:

### **Key Features Delivered:**
- **Real-time F1 Dashboard** with live timing, telemetry, and race analysis
- **AI-Powered F1 Expert Chatbot** using Groq LLM with RAG capabilities
- **Interactive Telemetry Analysis** with speed, throttle, brake, and gear data
- **Driver Performance Comparison** with detailed statistical analysis
- **Race Strategy Visualization** showing tire strategies and pit stops
- **Interactive Track Maps** with telemetry overlay and animations
- **Weather Impact Analysis** and track condition monitoring
- **Historical Data Access** from 2018 onwards using FastF1
- **User Authentication System** with registration/login
- **Responsive Modern UI** built with React, Next.js, and Tailwind CSS

### **Technology Stack:**
- **Frontend:** React 18, Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, PostgreSQL, Redis, Socket.io
- **AI/ML:** Groq API (Llama models), Qdrant vector database, LangChain
- **F1 Data:** FastF1 library, Python data processors
- **Deployment:** Docker, Nginx, CI/CD with GitHub Actions
- **Monitoring:** Prometheus, Grafana, Loki for comprehensive observability

### **Development Timeline:**
- **Week 1-2:** Foundation setup, authentication, basic UI
- **Week 3-4:** F1 data integration, core visualizations
- **Week 5-6:** Advanced telemetry features, real-time updates
- **Week 7-8:** AI chatbot integration, RAG implementation
- **Week 9-10:** Polish, testing, deployment, monitoring

### **Deployment Options:**
1. **Local Development:** Docker Compose setup for all services
2. **Cloud Deployment:** AWS/Azure with managed databases
3. **Vercel/Netlify:** Frontend with serverless backend functions
4. **Self-hosted:** Complete Docker stack on VPS

### **API Integrations:**
- **FastF1:** Comprehensive F1 data from 2018 onwards
- **Groq API:** Fast LLM inference for AI chatbot
- **Qdrant:** Vector database for F1 knowledge base
- **Real-time Data:** WebSocket connections for live updates

### **Key Components Built:**

#### **Frontend Components:**
- Live Timing Dashboard with real-time updates
- Interactive Telemetry Charts (speed, throttle, brake, gear)
- Driver Comparison with statistical analysis
- Race Strategy visualization with tire compound tracking
- Interactive Track Maps with telemetry overlay
- AI Chatbot interface with F1 expert knowledge
- Responsive navigation and modern UI design

#### **Backend Services:**
- RESTful API with comprehensive F1 data endpoints
- WebSocket server for real-time data streaming
- Authentication and user management
- Database models for F1 sessions, drivers, telemetry
- Caching layer with Redis for performance
- Integration with Python F1 data processors

#### **AI Services:**
- Groq LLM integration for F1 expert responses
- RAG system with F1 knowledge base
- Vector embeddings for context-aware responses
- Chat history and context management
- FastAPI service for AI endpoints

#### **Data Processing:**
- FastF1 integration for comprehensive race data
- Real-time telemetry processing and storage
- Session data collection and caching
- Weather and track status monitoring
- Historical data analysis and trends

### **Security Features:**
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- SQL injection prevention
- XSS protection headers

### **Performance Optimizations:**
- Redis caching for frequently accessed data
- Database indexing for fast queries
- Image optimization and lazy loading
- Code splitting and bundle optimization
- CDN integration for static assets
- WebSocket connections for real-time data

### **Monitoring & Observability:**
- Prometheus metrics collection
- Grafana dashboards for visualization
- Loki log aggregation
- Health check endpoints
- Error tracking and alerting
- Performance monitoring

### **Scalability Considerations:**
- Microservices architecture
- Container orchestration ready
- Database connection pooling
- Load balancing configuration
- Horizontal scaling capabilities
- CDN and caching strategies

### **Next Steps for Production:**

1. **API Keys Setup:**
   - Obtain Groq API key from console.groq.com
   - Set up Qdrant cloud instance (optional)
   - Configure environment variables

2. **Database Setup:**
   - Run PostgreSQL migrations
   - Seed initial F1 data
   - Set up backup procedures

3. **Domain & SSL:**
   - Configure domain name
   - Set up SSL certificates
   - Update CORS origins

4. **Monitoring Setup:**
   - Deploy Prometheus/Grafana stack
   - Configure alerting rules
   - Set up log retention policies

5. **Performance Testing:**
   - Load testing with realistic data
   - WebSocket connection limits
   - Database query optimization

### **Estimated Costs (Monthly):**
- **VPS Hosting:** $20-50/month
- **Groq API:** $10-30/month (based on usage)
- **Database:** $15-25/month (managed)
- **CDN:** $5-15/month
- **Monitoring:** $10-20/month
- **Total:** ~$60-140/month for production deployment

### **User Experience Features:**
- **Dark/Light Mode:** Automatic theme switching
- **Responsive Design:** Works on mobile, tablet, desktop
- **Keyboard Shortcuts:** Power user navigation
- **Data Export:** CSV/JSON download capabilities
- **Bookmarkable URLs:** Deep linking to specific sessions
- **Offline Capability:** Service worker for cached data

This comprehensive F1 dashboard provides everything needed to create a professional-grade F1 analysis platform that rivals commercial solutions. The modular architecture allows for easy feature additions and scaling as the user base grows.

### **Getting Started:**
1. Clone the repository structure
2. Run the setup script: `bash setup.sh`
3. Update environment variables with your API keys
4. Start development with: `docker-compose up -d`
5. Access the dashboard at `http://localhost:3000`

The platform is designed to be production-ready with proper security, monitoring, and scalability considerations built-in from day one.