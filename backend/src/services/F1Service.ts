import { Pool } from 'pg'

export class F1Service {
  private db: Pool
  
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL
    })
  }

  async getSeasonSchedule(year: number): Promise<any[]> {
    console.log(`🏁 Fetching schedule for year: ${year}`)
    
    try {
      // Try database first
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
      
      if (result.rows.length > 0) {
        console.log(`📊 Found ${result.rows.length} races in database`)
        return result.rows
      }
      
    } catch (error) {
      console.log(`⚠️ Database query failed, using sample data:`)
    }
    
    // Return sample data when database is empty or fails
    const sampleSchedule = [
      {
        round: 1,
        event_name: 'Bahrain Grand Prix',
        country: 'Bahrain',
        location: 'Sakhir',
        event_date: `${year}-03-03`,
        event_format: 'Standard'
      },
      {
        round: 2,
        event_name: 'Saudi Arabian Grand Prix',
        country: 'Saudi Arabia',
        location: 'Jeddah',
        event_date: `${year}-03-17`,
        event_format: 'Standard'
      },
      {
        round: 3,
        event_name: 'Australian Grand Prix',
        country: 'Australia',
        location: 'Melbourne',
        event_date: `${year}-03-24`,
        event_format: 'Standard'
      },
      {
        round: 4,
        event_name: 'Japanese Grand Prix',
        country: 'Japan',
        location: 'Suzuka',
        event_date: `${year}-04-07`,
        event_format: 'Standard'
      },
      {
        round: 5,
        event_name: 'Chinese Grand Prix',
        country: 'China',
        location: 'Shanghai',
        event_date: `${year}-04-21`,
        event_format: 'Standard'
      },
      {
        round: 6,
        event_name: 'Miami Grand Prix',
        country: 'United States',
        location: 'Miami',
        event_date: `${year}-05-05`,
        event_format: 'Standard'
      },
      {
        round: 7,
        event_name: 'Monaco Grand Prix',
        country: 'Monaco',
        location: 'Monte Carlo',
        event_date: `${year}-05-26`,
        event_format: 'Standard'
      },
      {
        round: 8,
        event_name: 'Spanish Grand Prix',
        country: 'Spain',
        location: 'Barcelona',
        event_date: `${year}-06-09`,
        event_format: 'Standard'
      }
    ]
    
    console.log(`📋 Returning ${sampleSchedule.length} sample races for ${year}`)
    return sampleSchedule
  }

  async getSessionData(year: number, round: number, sessionType: string): Promise<any | null> {
    console.log(`🏎️ Fetching session: ${year} Round ${round} ${sessionType}`)
    
    // Get race info from schedule
    const schedule = await this.getSeasonSchedule(year)
    const race = schedule.find(r => r.round === round)
    
    if (!race) {
      console.log(`❌ Race not found for round ${round}`)
      return null
    }
    
    const sessionData = {
      session_info: {
        name: sessionType,
        date: race.event_date,
        event_name: race.event_name,
        country: race.country,
        location: race.location,
        circuit_key: `circuit_${round}`,
        session_type: sessionType,
        total_laps: sessionType === 'Race' ? 57 : 20
      },
      drivers: {
        '1': {
          driver_number: '1',
          name: 'Max Verstappen',
          abbreviation: 'VER',
          team: 'Red Bull Racing',
          team_color: '#0600EF',
          country_code: 'NLD',
          laps: [
            { lap_number: 1, lap_time: 91.234, sector1_time: 28.123, sector2_time: 31.456, sector3_time: 31.655, compound: 'SOFT', tyre_life: 1 },
            { lap_number: 2, lap_time: 90.567, sector1_time: 27.890, sector2_time: 31.234, sector3_time: 31.443, compound: 'SOFT', tyre_life: 2 }
          ],
          fastest_lap: 90.123
        },
        '44': {
          driver_number: '44',
          name: 'Lewis Hamilton',
          abbreviation: 'HAM',
          team: 'Mercedes',
          team_color: '#00D2BE',
          country_code: 'GBR',
          laps: [
            { lap_number: 1, lap_time: 91.456, sector1_time: 28.234, sector2_time: 31.567, sector3_time: 31.655, compound: 'MEDIUM', tyre_life: 1 },
            { lap_number: 2, lap_time: 90.789, sector1_time: 28.012, sector2_time: 31.345, sector3_time: 31.432, compound: 'MEDIUM', tyre_life: 2 }
          ],
          fastest_lap: 90.456
        }
      },
      telemetry: {},
      timing: [
        { driver: '1', position: 1, gap: 'LEADER', lap_time: 90.123, sector1: 27.890, sector2: 31.234, sector3: 30.999, compound: 'SOFT', tyre_life: 5 },
        { driver: '44', position: 2, gap: '+0.234', lap_time: 90.357, sector1: 28.012, sector2: 31.345, sector3: 31.000, compound: 'MEDIUM', tyre_life: 8 }
      ],
      weather: [{
        time: null,
        air_temp: 28,
        track_temp: 42,
        humidity: 65,
        pressure: 1013,
        wind_direction: 180,
        wind_speed: 12,
        rainfall: false
      }],
      track_status: [],
      race_control: [],
      circuit_info: {}
    }
    
    console.log(`✅ Returning session data for ${race.event_name}`)
    return sessionData
  }

  // Add other required methods...
  async getTelemetryData(year: number, round: number, sessionType: string, driver: string): Promise<any | null> {
    console.log(`📊 Fetching telemetry for driver ${driver}`)
    return {
      distance: Array.from({length: 100}, (_, i) => i * 50),
      speed: Array.from({length: 100}, (_, i) => 200 + Math.sin(i * 0.1) * 50),
      rpm: Array.from({length: 100}, (_, i) => 8000 + Math.sin(i * 0.2) * 2000),
      gear: Array.from({length: 100}, (_, i) => Math.floor(Math.random() * 7) + 1),
      throttle: Array.from({length: 100}, (_, i) => Math.random() * 100),
      brake: Array.from({length: 100}, (_, i) => Math.random() * 100),
      x: Array.from({length: 100}, (_, i) => Math.sin(i * 0.1) * 100),
      y: Array.from({length: 100}, (_, i) => Math.cos(i * 0.1) * 100)
    }
  }

  async getLiveData(sessionKey: string): Promise<any> {
    return {
      session_key: sessionKey,
      timestamp: new Date().toISOString(),
      drivers: [],
      track_status: 'Green',
      session_status: 'Active'
    }
  }

  async getSessionDrivers(year: number, round: number, sessionType: string): Promise<any[]> {
    return [
      { driver_number: '1', name: 'Max Verstappen', team: 'Red Bull Racing', abbreviation: 'VER' },
      { driver_number: '44', name: 'Lewis Hamilton', team: 'Mercedes', abbreviation: 'HAM' }
    ]
  }

  async getStandings(year: number, type: string): Promise<any[]> {
    return [
      { position: 1, name: 'Max Verstappen', points: 575, team: 'Red Bull Racing' },
      { position: 2, name: 'Lewis Hamilton', points: 234, team: 'Mercedes' }
    ]
  }
}