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