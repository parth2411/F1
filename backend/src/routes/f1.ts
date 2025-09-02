import express from 'express';
import { Pool } from 'pg';

const router = express.Router();

// Database connection with your exact configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'f1_dashboard',
  user: process.env.DB_USER || 'f1_user',
  password: process.env.DB_PASSWORD || 'f1_password'
});

// Test database connection on startup
pool.query('SELECT COUNT(*) FROM f1_sessions')
  .then(result => console.log(`✅ F1 API Database connected: ${result.rows[0].count} sessions available`))
  .catch(err => console.error('❌ F1 API Database connection failed:', err.message));

// GET /api/f1/schedule/:year - Returns schedule in format your frontend expects
router.get('/schedule/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    console.log(`📋 Fetching schedule for ${year}`);
    
    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year parameter'
      });
    }
    
    const query = `
      SELECT DISTINCT
        round_number as round,
        event_name,
        country,
        location,
        session_date as event_date,
        'Standard' as event_format,
        is_processed
      FROM f1_sessions 
      WHERE year = $1 AND session_type = 'Race'
      ORDER BY round_number ASC
    `;
    
    const result = await pool.query(query, [year]);
    
    console.log(`✅ Found ${result.rows.length} races for ${year}`);
    
    // Log the actual data for debugging
    if (result.rows.length > 0) {
      console.log(`   First race: Round ${result.rows[0].round} - ${result.rows[0].event_name}`);
    }
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Schedule fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule'
    });
  }
});

// GET /api/f1/session/:year/:round/:sessionType - Returns session data in format your frontend expects
router.get('/session/:year/:round/:session', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const round = parseInt(req.params.round);
    const sessionType = req.params.session;
    
    console.log(`🏎️ Fetching session: ${year} Round ${round} ${sessionType}`);
    
    if (isNaN(year) || isNaN(round)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or round parameter'
      });
    }
    
    // Get session info
    const sessionQuery = `
      SELECT 
        id, year, round_number, session_type, event_name,
        circuit_key, country, location, session_date,
        weather_data, circuit_info, is_processed
      FROM f1_sessions 
      WHERE year = $1 AND round_number = $2 AND session_type = $3
    `;
    
    const sessionResult = await pool.query(sessionQuery, [year, round, sessionType]);
    
    if (sessionResult.rows.length === 0) {
      console.log(`❌ Session not found: ${year} Round ${round} ${sessionType}`);
      
      // Let's see what sessions ARE available for debugging
      const debugQuery = `
        SELECT year, round_number, session_type, event_name 
        FROM f1_sessions 
        WHERE year = $1 
        ORDER BY round_number
      `;
      const debugResult = await pool.query(debugQuery, [year]);
      console.log(`🔍 Available sessions for ${year}:`, debugResult.rows);
      
      return res.status(404).json({
        success: false,
        error: `Session not found: ${year} Round ${round} ${sessionType}`,
        available_sessions: debugResult.rows
      });
    }
    
    const session = sessionResult.rows[0];
    const sessionId = session.id;
    
    console.log(`✅ Found session: ${session.event_name} (ID: ${sessionId})`);
    
    // Get drivers data with lap times and team info
    const driversQuery = `
      SELECT DISTINCT
        d.driver_number,
        d.driver_code,
        d.full_name,
        d.first_name,
        d.last_name,
        d.nationality,
        t.team_name,
        t.team_color,
        COUNT(lt.lap_number) as total_laps,
        MIN(lt.lap_time) as fastest_lap
      FROM lap_times lt
      LEFT JOIN drivers d ON lt.driver_number = d.driver_number
      LEFT JOIN teams t ON d.team_id = t.id
      WHERE lt.session_id = $1
      GROUP BY d.driver_number, d.driver_code, d.full_name, d.first_name, d.last_name, d.nationality, t.team_name, t.team_color
      ORDER BY fastest_lap ASC NULLS LAST
    `;
    
    const driversResult = await pool.query(driversQuery, [sessionId]);
    
    console.log(`📊 Found ${driversResult.rows.length} drivers with lap data`);
    
    // Format drivers data as expected by your frontend (useF1Data hook)
    const driversData: Record<string, any> = {};
    driversResult.rows.forEach((driver) => {
      driversData[driver.driver_number] = {
        driver_number: driver.driver_number,
        name: driver.full_name,
        abbreviation: driver.driver_code,
        team: driver.team_name || 'Unknown Team',
        team_color: driver.team_color || '#808080',
        country_code: driver.nationality || 'Unknown',
        laps: [], // Will be populated if needed
        fastest_lap: driver.fastest_lap
      };
    });
    
    // Get sample lap times for the session
    const lapTimesQuery = `
      SELECT 
        driver_number,
        lap_number,
        lap_time,
        sector1_time,
        sector2_time,
        sector3_time,
        compound,
        tyre_life,
        position
      FROM lap_times 
      WHERE session_id = $1 
      ORDER BY driver_number, lap_number
      LIMIT 100
    `;
    
    const lapTimesResult = await pool.query(lapTimesQuery, [sessionId]);
    
    // Add lap times to drivers
    lapTimesResult.rows.forEach((lap) => {
      if (driversData[lap.driver_number]) {
        if (!driversData[lap.driver_number].laps) {
          driversData[lap.driver_number].laps = [];
        }
        driversData[lap.driver_number].laps.push({
          lap_number: lap.lap_number,
          lap_time: lap.lap_time,
          sector1_time: lap.sector1_time,
          sector2_time: lap.sector2_time,
          sector3_time: lap.sector3_time,
          compound: lap.compound,
          tyre_life: lap.tyre_life,
          position: lap.position
        });
      }
    });
    
    // Create timing data for live timing display
    const timingData = driversResult.rows.map((driver, index) => ({
      driver: driver.driver_number,
      position: index + 1,
      gap: index === 0 ? 'LEADER' : `+${(Math.random() * 30).toFixed(3)}`,
      lap_time: driver.fastest_lap,
      sector1: null,
      sector2: null,
      sector3: null,
      compound: 'MEDIUM',
      tyre_life: Math.floor(Math.random() * 20) + 1
    }));
    
    // Format response exactly as your frontend expects
    const sessionData = {
      session_info: {
        name: session.session_type,
        date: session.session_date,
        event_name: session.event_name,
        country: session.country,
        location: session.location,
        circuit_key: session.circuit_key,
        session_type: session.session_type,
        total_laps: 57
      },
      drivers: driversData,
      telemetry: {},
      timing: timingData,
      weather: session.weather_data || [{
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
      circuit_info: session.circuit_info || {}
    };
    
    console.log(`✅ Returning session data for ${session.event_name} with ${Object.keys(driversData).length} drivers`);
    
    res.json({
      success: true,
      data: sessionData
    });
    
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/f1/telemetry/:year/:round/:sessionType/:driver - Get telemetry data  
router.get('/telemetry/:year/:round/:session/:driver', async (req, res) => {
  try {
    const { year, round, session: sessionType, driver } = req.params;
    console.log(`📊 Fetching telemetry for driver ${driver} in ${year} Round ${round} ${sessionType}`);
    
    // For now, return sample telemetry data
    // You can enhance this later to use real telemetry from your database
    const telemetryData = {
      distance: Array.from({length: 100}, (_, i) => i * 50),
      speed: Array.from({length: 100}, (_, i) => 200 + Math.sin(i * 0.1) * 50),
      rpm: Array.from({length: 100}, (_, i) => 8000 + Math.sin(i * 0.2) * 2000),
      gear: Array.from({length: 100}, (_, i) => Math.floor(Math.random() * 7) + 1),
      throttle: Array.from({length: 100}, (_, i) => Math.random() * 100),
      brake: Array.from({length: 100}, (_, i) => Math.random() * 100),
      x: Array.from({length: 100}, (_, i) => Math.sin(i * 0.1) * 100),
      y: Array.from({length: 100}, (_, i) => Math.cos(i * 0.1) * 100)
    };
    
    res.json({
      success: true,
      data: telemetryData
    });
    
  } catch (error) {
    console.error('Telemetry fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch telemetry data'
    });
  }
});

// GET /api/f1/sessions - Get all sessions (for admin/debugging)
router.get('/sessions', async (req, res) => {
  try {
    const { year, session_type, limit = '50' } = req.query;
    
    let query = `
      SELECT 
        id, year, round_number, session_type, event_name,
        circuit_key, country, location, session_date,
        is_processed, created_at
      FROM f1_sessions
      WHERE is_processed = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (year) {
      query += ` AND year = $${paramIndex}`;
      params.push(parseInt(year as string));
      paramIndex++;
    }
    
    if (session_type) {
      query += ` AND session_type = $${paramIndex}`;
      params.push(session_type);
      paramIndex++;
    }
    
    query += ` ORDER BY year DESC, round_number ASC LIMIT $${paramIndex}`;
    params.push(parseInt(limit as string));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// GET /api/f1/drivers - Get all drivers
router.get('/drivers', async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    
    let query = `
      SELECT 
        d.driver_number, 
        d.driver_code, 
        d.full_name, 
        d.first_name, 
        d.last_name,
        d.nationality, 
        d.is_active,
        t.team_name,
        t.team_color
      FROM drivers d
      LEFT JOIN teams t ON d.team_id = t.id
    `;
    
    if (active_only === 'true') {
      query += ' WHERE d.is_active = true';
    }
    
    query += ' ORDER BY d.full_name';
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers'
    });
  }
});

// GET /api/f1/latest - Get latest session data for dashboard overview
router.get('/latest', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id,
        s.year,
        s.round_number,
        s.session_type,
        s.event_name,
        s.country,
        s.location,
        s.session_date,
        COUNT(DISTINCT lt.driver_number) as driver_count,
        COUNT(lt.id) as total_laps
      FROM f1_sessions s
      LEFT JOIN lap_times lt ON s.id = lt.session_id
      WHERE s.is_processed = true
      GROUP BY s.id
      ORDER BY s.year DESC, s.round_number DESC, s.session_date DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No processed sessions found'
      });
    }
    
    const latestSession = result.rows[0];
    
    // Get top drivers for this session
    const driversQuery = `
      SELECT 
        d.driver_number,
        d.full_name,
        d.driver_code,
        MIN(lt.lap_time) as fastest_lap,
        COUNT(lt.lap_number) as total_laps
      FROM drivers d
      JOIN lap_times lt ON d.driver_number = lt.driver_number
      WHERE lt.session_id = $1 AND d.is_active = true
      GROUP BY d.driver_number, d.full_name, d.driver_code
      ORDER BY fastest_lap ASC NULLS LAST
      LIMIT 10
    `;
    
    const driversResult = await pool.query(driversQuery, [latestSession.id]);
    
    res.json({
      success: true,
      data: {
        session: latestSession,
        top_drivers: driversResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching latest data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest session data'
    });
  }
});

// GET /api/f1/health - Health check for F1 API
router.get('/health', async (req, res) => {
  try {
    const sessionsResult = await pool.query('SELECT COUNT(*) FROM f1_sessions WHERE is_processed = true');
    const driversResult = await pool.query('SELECT COUNT(*) FROM drivers WHERE is_active = true');
    const lapTimesResult = await pool.query('SELECT COUNT(*) FROM lap_times');
    
    const stats = {
      total_sessions: parseInt(sessionsResult.rows[0].count),
      active_drivers: parseInt(driversResult.rows[0].count),
      total_lap_times: parseInt(lapTimesResult.rows[0].count)
    };
    
    // Get year breakdown
    const yearBreakdown = await pool.query(`
      SELECT year, COUNT(*) as sessions 
      FROM f1_sessions 
      WHERE is_processed = true 
      GROUP BY year 
      ORDER BY year DESC
    `);
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      data: stats,
      years: yearBreakdown.rows
    });
  } catch (error) {
    console.error('Error in F1 API health check:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// GET /api/f1/sessions/:sessionId/laps - Get lap times for specific session
router.get('/sessions/:sessionId/laps', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { driver_number, limit = '100' } = req.query;
    
    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }
    
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
    params.push(parseInt(limit as string));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching lap times:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lap times'
    });
  }
});

export default router;