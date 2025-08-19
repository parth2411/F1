// backend/src/services/F1Service.ts
import { Pool } from 'pg'
import Redis from 'ioredis'
import { SessionData, Schedule } from '../../../frontend/src/types/f1'

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