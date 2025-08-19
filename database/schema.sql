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