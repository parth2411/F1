import { Pool, PoolClient } from 'pg';

// Types
interface F1Session {
  id: number;
  year: number;
  round_number: number;
  session_type: string;
  event_name: string;
  circuit_key?: string;
  country?: string;
  location?: string;
  session_date?: Date;
  weather_data?: any;
  circuit_info?: any;
  is_processed: boolean;
  created_at: Date;
}

interface Driver {
  driver_number: string;
  driver_code?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  nationality?: string;
  team_id?: number;
  is_active: boolean;
  created_at: Date;
}

interface LapTime {
  id: number;
  session_id: number;
  driver_number: string;
  lap_number: number;
  lap_time?: number;
  sector1_time?: number;
  sector2_time?: number;
  sector3_time?: number;
  compound?: string;
  tyre_life?: number;
  position?: number;
  created_at: Date;
}

interface SessionFilters {
  year?: number;
  session_type?: string;
  limit?: number;
}

interface LapTimeFilters {
  driver_number?: string;
  limit?: number;
}

interface DashboardStats {
  total_sessions: number;
  active_drivers: number;
  current_year_sessions: number;
  latest_session: F1Session | null;
}

interface ScheduleRound {
  round: number;
  event_name: string;
  country: string;
  location: string;
  sessions: Array<{
    session_type: string;
    session_date: Date;
    is_processed: boolean;
  }>;
}

export class F1Service {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://f1_user:f1_password@localhost:5433/f1_dashboard',
    });
  }

  async getAllSessions(filters: SessionFilters = {}): Promise<F1Session[]> {
    try {
      const { year, session_type, limit = 50 } = filters;
      
      let query = `
        SELECT 
          id, year, round_number, session_type, event_name,
          circuit_key, country, location, session_date,
          weather_data, is_processed, created_at
        FROM f1_sessions
        WHERE is_processed = true
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (year) {
        query += ` AND year = $${paramIndex}`;
        params.push(year);
        paramIndex++;
      }
      
      if (session_type) {
        query += ` AND session_type = $${paramIndex}`;
        params.push(session_type);
        paramIndex++;
      }
      
      query += ` ORDER BY year DESC, round_number DESC, session_date DESC LIMIT $${paramIndex}`;
      params.push(limit);
      
      const result = await this.pool.query(query, params);
      return result.rows as F1Session[];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  async getSessionById(sessionId: number): Promise<{ session: F1Session; drivers: any[] } | null> {
    try {
      const sessionQuery = `
        SELECT 
          id, year, round_number, session_type, event_name,
          circuit_key, country, location, session_date,
          weather_data, circuit_info, is_processed
        FROM f1_sessions 
        WHERE id = $1
      `;
      
      const sessionResult = await this.pool.query(sessionQuery, [sessionId]);
      
      if (sessionResult.rows.length === 0) {
        return null;
      }
      
      const session = sessionResult.rows[0] as F1Session;
      
      // Get drivers for this session
      const driversQuery = `
        SELECT DISTINCT
          lt.driver_number,
          d.driver_code,
          d.full_name,
          COUNT(lt.lap_number) as total_laps,
          MIN(lt.lap_time) as fastest_lap,
          AVG(lt.lap_time) as average_lap
        FROM lap_times lt
        LEFT JOIN drivers d ON lt.driver_number = d.driver_number
        WHERE lt.session_id = $1
        GROUP BY lt.driver_number, d.driver_code, d.full_name
        ORDER BY fastest_lap ASC NULLS LAST
      `;
      
      const driversResult = await this.pool.query(driversQuery, [sessionId]);
      
      return {
        session,
        drivers: driversResult.rows
      };
    } catch (error) {
      console.error('Error fetching session by ID:', error);
      throw error;
    }
  }

  async getLatestSession(): Promise<F1Session | null> {
    try {
      const query = `
        SELECT 
          s.*,
          COUNT(DISTINCT lt.driver_number) as driver_count
        FROM f1_sessions s
        LEFT JOIN lap_times lt ON s.id = lt.session_id
        WHERE s.is_processed = true
        GROUP BY s.id
        ORDER BY s.year DESC, s.round_number DESC, s.session_date DESC
        LIMIT 1
      `;
      
      const result = await this.pool.query(query);
      return result.rows[0] as F1Session || null;
    } catch (error) {
      console.error('Error fetching latest session:', error);
      throw error;
    }
  }

  async getDrivers(activeOnly: boolean = true): Promise<Driver[]> {
    try {
      let query = `
        SELECT 
          driver_number, driver_code, full_name, first_name, last_name,
          nationality, team_id, is_active, created_at
        FROM drivers
      `;
      
      if (activeOnly) {
        query += ' WHERE is_active = true';
      }
      
      query += ' ORDER BY full_name';
      
      const result = await this.pool.query(query);
      return result.rows as Driver[];
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  }

  async getLapTimes(sessionId: number, filters: LapTimeFilters = {}): Promise<LapTime[]> {
    try {
      const { driver_number, limit = 100 } = filters;
      
      let query = `
        SELECT 
          lt.*,
          d.full_name as driver_name,
          d.driver_code
        FROM lap_times lt
        LEFT JOIN drivers d ON lt.driver_number = d.driver_number
        WHERE lt.session_id = $1
      `;
      
      const params: any[] = [sessionId];
      let paramIndex = 2;
      
      if (driver_number) {
        query += ` AND lt.driver_number = $${paramIndex}`;
        params.push(driver_number);
        paramIndex++;
      }
      
      query += ` ORDER BY lt.lap_number ASC LIMIT $${paramIndex}`;
      params.push(limit);
      
      const result = await this.pool.query(query, params);
      return result.rows as LapTime[];
    } catch (error) {
      console.error('Error fetching lap times:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get total sessions
      const sessionsResult = await this.pool.query(
        'SELECT COUNT(*) as total FROM f1_sessions WHERE is_processed = true'
      );
      
      // Get active drivers
      const driversResult = await this.pool.query(
        'SELECT COUNT(*) as total FROM drivers WHERE is_active = true'
      );
      
      // Get latest session info
      const latestSession = await this.getLatestSession();
      
      // Get this year's sessions
      const currentYear = new Date().getFullYear();
      const yearSessionsResult = await this.pool.query(
        'SELECT COUNT(*) as total FROM f1_sessions WHERE year = $1 AND is_processed = true',
        [currentYear]
      );
      
      return {
        total_sessions: parseInt(sessionsResult.rows[0].total),
        active_drivers: parseInt(driversResult.rows[0].total),
        current_year_sessions: parseInt(yearSessionsResult.rows[0].total),
        latest_session: latestSession
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getSeasonSchedule(year: number): Promise<ScheduleRound[]> {
    try {
      const query = `
        SELECT 
          round_number,
          event_name,
          country,
          location,
          session_date,
          session_type,
          is_processed
        FROM f1_sessions
        WHERE year = $1
        ORDER BY round_number ASC, session_date ASC
      `;
      
      const result = await this.pool.query(query, [year]);
      
      // Group by round
      const schedule: Record<number, ScheduleRound> = {};
      result.rows.forEach((session: any) => {
        const roundKey = session.round_number;
        if (!schedule[roundKey]) {
          schedule[roundKey] = {
            round: roundKey,
            event_name: session.event_name,
            country: session.country,
            location: session.location,
            sessions: []
          };
        }
        
        schedule[roundKey].sessions.push({
          session_type: session.session_type,
          session_date: session.session_date,
          is_processed: session.is_processed
        });
      });
      
      return Object.values(schedule);
    } catch (error) {
      console.error('Error fetching season schedule:', error);
      throw error;
    }
  }

  async searchSessions(searchTerm: string): Promise<F1Session[]> {
    try {
      const query = `
        SELECT 
          id, year, round_number, session_type, event_name,
          country, location, session_date, is_processed
        FROM f1_sessions
        WHERE is_processed = true
        AND (
          event_name ILIKE $1 OR
          country ILIKE $1 OR
          location ILIKE $1
        )
        ORDER BY year DESC, round_number DESC
        LIMIT 20
      `;
      
      const result = await this.pool.query(query, [`%${searchTerm}%`]);
      return result.rows as F1Session[];
    } catch (error) {
      console.error('Error searching sessions:', error);
      throw error;
    }
  }

  async getTelemetryData(year: number, round: number, sessionType: string, driver: string): Promise<any | null> {
    try {
      console.log(`📊 Fetching telemetry for driver ${driver} in ${year} round ${round} ${sessionType}`);
      
      // First, find the session
      const sessionQuery = `
        SELECT id FROM f1_sessions 
        WHERE year = $1 AND round_number = $2 AND session_type = $3
        LIMIT 1
      `;
      
      const sessionResult = await this.pool.query(sessionQuery, [year, round, sessionType]);
      
      if (sessionResult.rows.length === 0) {
        return null;
      }
      
      const sessionId = sessionResult.rows[0].id;
      
      // Get telemetry data for this driver
      const telemetryQuery = `
        SELECT data FROM telemetry_data 
        WHERE session_id = $1 AND driver_number = $2
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const telemetryResult = await this.pool.query(telemetryQuery, [sessionId, driver]);
      
      if (telemetryResult.rows.length > 0) {
        return telemetryResult.rows[0].data;
      }
      
      // Return mock data if no telemetry available
      return {
        distance: Array.from({length: 100}, (_, i) => i * 50),
        speed: Array.from({length: 100}, (_, i) => 200 + Math.sin(i * 0.1) * 50),
        rpm: Array.from({length: 100}, (_, i) => 8000 + Math.sin(i * 0.2) * 2000),
        gear: Array.from({length: 100}, (_, i) => Math.floor(Math.random() * 7) + 1),
        throttle: Array.from({length: 100}, (_, i) => Math.random() * 100),
        brake: Array.from({length: 100}, (_, i) => Math.random() * 100)
      };
    } catch (error) {
      console.error('Error fetching telemetry data:', error);
      throw error;
    }
  }

  async getLiveData(sessionKey: string): Promise<any> {
    try {
      // This would integrate with live timing data
      return {
        session_key: sessionKey,
        timestamp: new Date().toISOString(),
        drivers: [],
        track_status: 'Green',
        session_status: 'Active'
      };
    } catch (error) {
      console.error('Error fetching live data:', error);
      throw error;
    }
  }

  async getSessionDrivers(year: number, round: number, sessionType: string): Promise<any[]> {
    try {
      // Find session first
      const sessionQuery = `
        SELECT id FROM f1_sessions 
        WHERE year = $1 AND round_number = $2 AND session_type = $3
        LIMIT 1
      `;
      
      const sessionResult = await this.pool.query(sessionQuery, [year, round, sessionType]);
      
      if (sessionResult.rows.length === 0) {
        return [];
      }
      
      const sessionId = sessionResult.rows[0].id;
      
      // Get drivers for this session
      const driversQuery = `
        SELECT DISTINCT
          d.driver_number,
          d.full_name as name,
          d.driver_code as abbreviation,
          'Unknown' as team
        FROM drivers d
        JOIN lap_times lt ON d.driver_number = lt.driver_number
        WHERE lt.session_id = $1
        ORDER BY d.full_name
      `;
      
      const result = await this.pool.query(driversQuery, [sessionId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching session drivers:', error);
      throw error;
    }
  }

  async getStandings(year: number, type: string = 'drivers'): Promise<any[]> {
    try {
      // This would calculate standings from race results
      // For now, return mock data
      if (type === 'drivers') {
        return [
          { position: 1, name: 'Max Verstappen', points: 575, team: 'Red Bull Racing' },
          { position: 2, name: 'Lewis Hamilton', points: 234, team: 'Mercedes' }
        ];
      } else {
        return [
          { position: 1, name: 'Red Bull Racing', points: 860 },
          { position: 2, name: 'Mercedes', points: 409 }
        ];
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
      throw error;
    }
  }

  // Close database connection
  async close(): Promise<void> {
    await this.pool.end();
  }
}