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