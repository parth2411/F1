import express from 'express'
import { F1Service } from '../services/F1Service'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()
const f1Service = new F1Service()

// Get current season schedule
router.get('/schedule/:year?', async (req, res) => {
  try {
    const yearParam = req.params.year
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
    
    if (isNaN(year)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid year parameter' 
      })
    }
    
    const schedule = await f1Service.getSeasonSchedule(year)
    res.json({ success: true, data: schedule })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch season schedule' 
    })
  }
})

// Get session data
router.get('/session/:year/:round/:session', async (req, res) => {
  try {
    const { year: yearParam, round: roundParam, session } = req.params
    
    if (!yearParam || !roundParam || !session) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      })
    }
    
    const year = parseInt(yearParam, 10)
    const round = parseInt(roundParam, 10)
    
    if (isNaN(year) || isNaN(round)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid year or round parameter' 
      })
    }
    
    const sessionData = await f1Service.getSessionData(year, round, session)
    
    if (!sessionData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      })
    }

    res.json({ success: true, data: sessionData })
  } catch (error) {
    console.error('Error fetching session data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch session data' 
    })
  }
})

// Get telemetry data
router.get('/telemetry/:year/:round/:session/:driver', async (req, res) => {
  try {
    const { year: yearParam, round: roundParam, session, driver } = req.params
    
    if (!yearParam || !roundParam || !session || !driver) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      })
    }
    
    const year = parseInt(yearParam, 10)
    const round = parseInt(roundParam, 10)
    
    if (isNaN(year) || isNaN(round)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid year or round parameter' 
      })
    }
    
    const telemetryData = await f1Service.getTelemetryData(year, round, session, driver)

    if (!telemetryData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Telemetry data not found' 
      })
    }

    res.json({ success: true, data: telemetryData })
  } catch (error) {
    console.error('Error fetching telemetry data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch telemetry data' 
    })
  }
})

// Get live timing data
router.get('/live/:sessionKey', async (req, res) => {
  try {
    const { sessionKey } = req.params
    
    if (!sessionKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session key is required' 
      })
    }
    
    const liveData = await f1Service.getLiveData(sessionKey)
    res.json({ success: true, data: liveData })
  } catch (error) {
    console.error('Error fetching live data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch live data' 
    })
  }
})

// Get drivers for a session
router.get('/drivers/:year/:round/:session', async (req, res) => {
  try {
    const { year: yearParam, round: roundParam, session } = req.params
    
    if (!yearParam || !roundParam || !session) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      })
    }
    
    const year = parseInt(yearParam, 10)
    const round = parseInt(roundParam, 10)
    
    if (isNaN(year) || isNaN(round)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid year or round parameter' 
      })
    }
    
    const drivers = await f1Service.getSessionDrivers(year, round, session)
    res.json({ success: true, data: drivers })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch drivers data' 
    })
  }
})

// Get current standings
router.get('/standings/:year/:type?', async (req, res) => {
  try {
    const { year: yearParam, type } = req.params
    
    if (!yearParam) {
      return res.status(400).json({ 
        success: false, 
        error: 'Year parameter is required' 
      })
    }
    
    const year = parseInt(yearParam, 10)
    
    if (isNaN(year)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid year parameter' 
      })
    }
    
    const standingsType = type || 'drivers' // 'drivers' or 'constructors'
    const standings = await f1Service.getStandings(year, standingsType)
    res.json({ success: true, data: standings })
  } catch (error) {
    console.error('Error fetching standings:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch standings' 
    })
  }
})

module.exports = router