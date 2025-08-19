alert("This is the NEW main.js file!");
// Global variables
let currentSession = null;
let currentDrivers = [];
let socket = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadAvailableYears();
    
    // Initialize WebSocket if available
    if (typeof io !== 'undefined') {
        initializeWebSocket();
    }
});

// Initialize WebSocket connection
function initializeWebSocket() {
    socket = io();
    
    socket.on('connected', function(data) {
        console.log('WebSocket connected:', data);
        updateConnectionStatus(true);
    });
    
    socket.on('disconnect', function() {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);
    });
    
    socket.on('session_update', function(data) {
        if (currentSession) {
            updateLiveData(data);
        }
    });
    
    socket.on('error', function(data) {
        showError(data.message);
    });
}

// Initialize app components
function initializeApp() {
    // Set up navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            switchView(this.dataset.view);
        });
    });
    
    // Set up tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // Set up race control panel
    const toggleRaceControl = document.getElementById('toggle-race-control');
    toggleRaceControl.addEventListener('click', function() {
        toggleRaceControlPanel();
    });
}

// Setup event listeners
function setupEventListeners() {
    // Year selector
    document.getElementById('year-select').addEventListener('change', function() {
        loadEventSchedule(this.value);
    });
    
    // Event selector
    document.getElementById('event-select').addEventListener('change', function() {
        enableSessionSelect();
    });
    
    // Session selector
    document.getElementById('session-select').addEventListener('change', function() {
        enableLoadButton();
    });
    
    // Load session button
    document.getElementById('load-session-btn').addEventListener('click', function() {
        loadSession();
    });
    
    // Export data button
    document.getElementById('export-data-btn').addEventListener('click', function() {
        exportSessionData();
    });
    
    // Driver selectors
    document.getElementById('driver-select').addEventListener('change', function() {
        loadDriverData(this.value);
    });
    
    document.getElementById('compare-btn').addEventListener('click', function() {
        compareDrivers();
    });
    
    // Telemetry controls
    document.getElementById('load-telemetry-btn').addEventListener('click', function() {
        loadTelemetryData();
    });
    
    // Lap slider
    document.getElementById('lap-slider').addEventListener('input', function() {
        updateLapDisplay(this.value);
    });
    
    // Close comparison
    document.getElementById('close-comparison').addEventListener('click', function() {
        closeComparison();
    });
    
    // Degradation driver select
    document.getElementById('degradation-driver-select').addEventListener('change', function() {
        loadDegradationData(this.value);
    });
}

// Load available years
async function loadAvailableYears() {
    try {
        const response = await fetch('/api/years');
        const data = await response.json();
        
        if (data.status === 'success') {
            const yearSelect = document.getElementById('year-select');
            yearSelect.innerHTML = '<option value="">Select a year</option>';
            
            data.data.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
            
            // Select current year by default
            const currentYear = new Date().getFullYear();
            if (data.data.includes(currentYear)) {
                yearSelect.value = currentYear;
                loadEventSchedule(currentYear);
            }
        }
    } catch (error) {
        showError('Failed to load years: ' + error.message);
    }
}

// Load event schedule
async function loadEventSchedule(year) {
    if (!year) return;
    
    showLoading();
    try {
        const response = await fetch(`/api/schedule/${year}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const eventSelect = document.getElementById('event-select');
            eventSelect.innerHTML = '<option value="">Select a Grand Prix</option>';
            
            data.data.forEach(event => {
                const option = document.createElement('option');
                option.value = event.round;
                option.textContent = `Round ${event.round}: ${event.event_name}`;
                option.dataset.eventName = event.event_name;
                eventSelect.appendChild(option);
            });
            
            eventSelect.disabled = false;
        }
    } catch (error) {
        showError('Failed to load schedule: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Enable session select
function enableSessionSelect() {
    const eventSelect = document.getElementById('event-select');
    const sessionSelect = document.getElementById('session-select');
    
    if (eventSelect.value) {
        sessionSelect.disabled = false;
    }
}

// Enable load button
function enableLoadButton() {
    const sessionSelect = document.getElementById('session-select');
    const loadButton = document.getElementById('load-session-btn');
    
    if (sessionSelect.value) {
        loadButton.disabled = false;
    }
}

// Load session data
// Replace your existing loadSession function with this one
async function loadSession() {
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    if (!year || !gp || !sessionType) return;
    
    console.log(`--- STARTING SESSION LOAD: ${year}, ${gp}, ${sessionType} ---`);
    showLoading();
    try {
        console.log("Step 1: Fetching data from API...");
        const response = await fetch(`/api/session/${year}/${gp}/${sessionType}`);
        console.log("Step 2: API response received.", response);

        if (!response.ok) {
            throw new Error(`API returned a bad status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Step 3: JSON data parsed successfully.");

        if (data.status === 'success') {
            currentSession = data.data;
            console.log("Step 4: session data is set. About to update UI...");

            updateSessionInfo();
            console.log("Step 5: updateSessionInfo() finished.");

            loadDriversList();
            console.log("Step 6: loadDriversList() finished.");

            loadOverviewCharts();
            console.log("Step 7: loadOverviewCharts() finished.");

            loadRaceControlMessages();
            console.log("Step 8: loadRaceControlMessages() finished.");

        } else {
             throw new Error(`API reported an error: ${data.message}`);
        }
    } catch (error) {
        console.error("!!! ERROR DURING LOAD SESSION !!!", error);
        showError('Failed to load session: ' + error.message);
    } finally {
        console.log("--- FINISHED SESSION LOAD ---");
        hideLoading();
    }
}

// Update session info
function updateSessionInfo() {
    if (!currentSession || !currentSession.session_info) return;
    
    const info = currentSession.session_info;
    const content = document.getElementById('session-info-content');
    
    content.innerHTML = `
        <div class="info-item">
            <span class="info-label">Grand Prix</span>
            <span class="info-value">${info.grand_prix || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Location</span>
            <span class="info-value">${info.location || 'N/A'}, ${info.country || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Date</span>
            <span class="info-value">${formatDate(info.date)}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Session Type</span>
            <span class="info-value">${info.session_type || 'N/A'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Total Laps</span>
            <span class="info-value">${info.total_laps || 'N/A'}</span>
        </div>
    `;
}

// Load drivers list
function loadDriversList() {
    if (!currentSession || !currentSession.drivers) return;
    
    currentDrivers = Object.keys(currentSession.drivers);
    
    // Update driver selects
    const driverSelects = [
        'driver-select',
        'compare-driver-select',
        'telemetry-driver-select',
        'degradation-driver-select'
    ];
    
    driverSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select a driver</option>';
            
            currentDrivers.forEach(driverNum => {
                const driver = currentSession.drivers[driverNum];
                const option = document.createElement('option');
                option.value = driverNum;
                option.textContent = `${driver.Abbreviation} - ${driver.FullName}`;
                select.appendChild(option);
            });
            
            // Restore previous selection if still valid
            if (currentDrivers.includes(currentValue)) {
                select.value = currentValue;
            }
        }
    });
    
    // Update results table
    updateResultsTable();
}

// Update results table
function updateResultsTable() {
    if (!currentSession || !currentSession.session_results) return;
    
    const tbody = document.querySelector('#results-table tbody');
    tbody.innerHTML = '';
    
    currentSession.session_results.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.Position || 'DNF'}</td>
            <td>${result.Abbreviation} - ${result.FullName}</td>
            <td>${result.TeamName}</td>
            <td>${formatTime(result.Time) || 'N/A'}</td>
            <td>${result.Points || 0}</td>
            <td class="status-${result.Status.toLowerCase()}">${result.Status}</td>
            <td>
                <button class="btn btn-sm" onclick="viewDriver('${result.DriverNumber}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load overview charts
async function loadOverviewCharts() {
    await Promise.all([
        loadLapTimesChart(),
        loadPositionsChart()
    ]);
}

// Load lap times chart
async function loadLapTimesChart() {
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    try {
        const response = await fetch(`/api/plot/lap_times/${year}/${gp}/${sessionType}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const plotData = JSON.parse(data.data);
            Plotly.newPlot('laptimes-chart', plotData.data, plotData.layout, {responsive: true});
        }
    } catch (error) {
        console.error('Failed to load lap times chart:', error);
    }
}

// Load positions chart
async function loadPositionsChart() {
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    try {
        const response = await fetch(`/api/plot/positions/${year}/${gp}/${sessionType}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const plotData = JSON.parse(data.data);
            Plotly.newPlot('positions-chart', plotData.data, plotData.layout, {responsive: true});
        }
    } catch (error) {
        console.error('Failed to load positions chart:', error);
    }
}

// Load race control messages
function loadRaceControlMessages() {
    if (!currentSession || !currentSession.race_control_messages) return;
    
    const messagesContainer = document.getElementById('race-messages');
    messagesContainer.innerHTML = '';
    
    currentSession.race_control_messages.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = 'race-message';
        
        if (message.Message.toLowerCase().includes('penalty')) {
            messageEl.classList.add('penalty');
        } else if (message.Message.toLowerCase().includes('safety car')) {
            messageEl.classList.add('safety-car');
        }
        
        messageEl.innerHTML = `
            <div class="message-time">${formatTime(message.Time)}</div>
            <div class="message-content">${message.Message}</div>
        `;
        
        messagesContainer.appendChild(messageEl);
    });
}

// Load driver data
async function loadDriverData(driverNumber) {
    if (!driverNumber) return;
    
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    showLoading();
    try {
        const response = await fetch(`/api/driver/${year}/${gp}/${sessionType}/${driverNumber}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            updateDriverSummary(data.data.summary);
            updateSectorAnalysis(data.data.sectors);
            updateSpeedAnalysis(data.data.speed);
            updateLapSlider(driverNumber);
        }
    } catch (error) {
        showError('Failed to load driver data: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Update driver summary
function updateDriverSummary(summary) {
    if (!summary) return;
    
    const container = document.getElementById('driver-summary');
    container.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Driver</div>
            <div class="stat-value">${summary.driver_info.name}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Team</div>
            <div class="stat-value">${summary.driver_info.team}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Fastest Lap</div>
            <div class="stat-value">${formatLapTime(summary.lap_times.fastest)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Average Lap</div>
            <div class="stat-value">${formatLapTime(summary.lap_times.average)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Consistency</div>
            <div class="stat-value">${summary.lap_times.consistency?.toFixed(2)}%</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Total Laps</div>
            <div class="stat-value">${summary.total_laps}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Max Speed</div>
            <div class="stat-value">${summary.speed_trap.max_speed?.toFixed(1)} km/h</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Pit Stops</div>
            <div class="stat-value">${summary.pit_stops}</div>
        </div>
    `;
}

// Update sector analysis
function updateSectorAnalysis(sectors) {
    if (!sectors) return;
    
    const container = document.getElementById('sector-analysis');
    container.innerHTML = `
        <div class="sector-item">
            <h4>Sector 1</h4>
            <div class="sector-time">${formatSectorTime(sectors.sector1.best)}</div>
            <div class="sector-delta ${sectors.sector1.gap_to_best > 0 ? 'positive' : ''}"">
                ${sectors.sector1.gap_to_best ? '+' + sectors.sector1.gap_to_best.toFixed(3) : ''}
            </div>
        </div>
        <div class="sector-item">
            <h4>Sector 2</h4>
            <div class="sector-time">${formatSectorTime(sectors.sector2.best)}</div>
            <div class="sector-delta ${sectors.sector2.gap_to_best > 0 ? 'positive' : ''}"">
                ${sectors.sector2.gap_to_best ? '+' + sectors.sector2.gap_to_best.toFixed(3) : ''}
            </div>
        </div>
        <div class="sector-item">
            <h4>Sector 3</h4>
            <div class="sector-time">${formatSectorTime(sectors.sector3.best)}</div>
            <div class="sector-delta ${sectors.sector3.gap_to_best > 0 ? 'positive' : ''}"">
                ${sectors.sector3.gap_to_best ? '+' + sectors.sector3.gap_to_best.toFixed(3) : ''}
            </div>
        </div>
    `;
}

// Update speed analysis
function updateSpeedAnalysis(speed) {
    if (!speed) return;
    
    // Create speed zone chart
    const data = [{
        labels: ['<100', '100-150', '150-200', '200-250', '250-300', '>300'],
        values: [
            speed.speed_zones_percentage.below_100,
            speed.speed_zones_percentage['100_150'],
            speed.speed_zones_percentage['150_200'],
            speed.speed_zones_percentage['200_250'],
            speed.speed_zones_percentage['250_300'],
            speed.speed_zones_percentage.above_300
        ],
        type: 'pie',
        marker: {
            colors: ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6']
        }
    }];
    
    const layout = {
        title: 'Speed Distribution (%)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#ffffff' }
    };
    
    Plotly.newPlot('speed-analysis-chart', data, layout, {responsive: true});
}

// Update lap slider
function updateLapSlider(driverNumber) {
    if (!currentSession || !currentSession.drivers[driverNumber]) return;
    
    const driver = currentSession.drivers[driverNumber];
    const slider = document.getElementById('lap-slider');
    const display = document.getElementById('lap-display');
    
    slider.max = driver.TotalLaps;
    slider.value = 1;
    display.textContent = 'Lap: 1';
    
    updateLapDetails(driverNumber, 1);
}

// Update lap display
function updateLapDisplay(lapNumber) {
    const display = document.getElementById('lap-display');
    display.textContent = `Lap: ${lapNumber}`;
    
    const driverSelect = document.getElementById('driver-select');
    if (driverSelect.value) {
        updateLapDetails(driverSelect.value, lapNumber);
    }
}

// Update lap details
function updateLapDetails(driverNumber, lapNumber) {
    if (!currentSession || !currentSession.drivers[driverNumber]) return;
    
    const driver = currentSession.drivers[driverNumber];
    const lap = driver.Laps[lapNumber - 1];
    
    if (!lap) return;
    
    const container = document.getElementById('lap-details');
    container.innerHTML = `
        <div class="lap-info-item">
            <div class="info-label">Lap Time</div>
            <div class="info-value">${formatLapTime(lap.LapTime)}</div>
        </div>
        <div class="lap-info-item">
            <div class="info-label">Sector 1</div>
            <div class="info-value">${formatSectorTime(lap.Sector1Time)}</div>
        </div>
        <div class="lap-info-item">
            <div class="info-label">Sector 2</div>
            <div class="info-value">${formatSectorTime(lap.Sector2Time)}</div>
        </div>
        <div class="lap-info-item">
            <div class="info-label">Sector 3</div>
            <div class="info-value">${formatSectorTime(lap.Sector3Time)}</div>
        </div>
        <div class="lap-info-item">
            <div class="info-label">Compound</div>
            <div class="info-value compound-${lap.Compound?.toLowerCase()}">${lap.Compound || 'N/A'}</div>
        </div>
        <div class="lap-info-item">
            <div class="info-label">Tyre Life</div>
            <div class="info-value">${lap.TyreLife || 0} laps</div>
        </div>
        <div class="lap-info-item">
            <div class="info-label">Speed Trap</div>
            <div class="info-value">${lap.SpeedST?.toFixed(1) || 'N/A'} km/h</div>
        </div>
        <div class="lap-info-item">
            <div class="info-label">Personal Best</div>
            <div class="info-value">${lap.IsPersonalBest ? 'Yes' : 'No'}</div>
        </div>
    `;
}

// Compare drivers
async function compareDrivers() {
    const driver1 = document.getElementById('driver-select').value;
    const driver2 = document.getElementById('compare-driver-select').value;
    
    if (!driver1 || !driver2) {
        showError('Please select two drivers to compare');
        return;
    }
    
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    showLoading();
    try {
        const response = await fetch(`/api/compare/${year}/${gp}/${sessionType}/${driver1}/${driver2}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            displayComparison(data.data);
        }
    } catch (error) {
        showError('Failed to compare drivers: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Display comparison
function displayComparison(data) {
    const container = document.getElementById('comparison-container');
    const content = document.getElementById('comparison-content');
    
    content.innerHTML = `
        <div class="comparison-driver driver1">
            <h4>${data.driver1_summary.driver_info.name}</h4>
            <div class="stat-item">
                <div class="stat-label">Fastest Lap</div>
                <div class="stat-value">${formatLapTime(data.driver1_summary.lap_times.fastest)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Average Lap</div>
                <div class="stat-value">${formatLapTime(data.driver1_summary.lap_times.average)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Consistency</div>
                <div class="stat-value">${data.driver1_summary.lap_times.consistency?.toFixed(2)}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Max Speed</div>
                <div class="stat-value">${data.driver1_summary.speed_trap.max_speed?.toFixed(1)} km/h</div>
            </div>
        </div>
        
        <div class="comparison-driver driver2">
            <h4>${data.driver2_summary.driver_info.name}</h4>
            <div class="stat-item">
                <div class="stat-label">Fastest Lap</div>
                <div class="stat-value">${formatLapTime(data.driver2_summary.lap_times.fastest)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Average Lap</div>
                <div class="stat-value">${formatLapTime(data.driver2_summary.lap_times.average)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Consistency</div>
                <div class="stat-value">${data.driver2_summary.lap_times.consistency?.toFixed(2)}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Max Speed</div>
                <div class="stat-value">${data.driver2_summary.speed_trap.max_speed?.toFixed(1)} km/h</div>
            </div>
        </div>
    `;
    
    container.classList.remove('hidden');
}

// Close comparison
function closeComparison() {
    document.getElementById('comparison-container').classList.add('hidden');
}

// Load telemetry data
async function loadTelemetryData() {
    const driverNumber = document.getElementById('telemetry-driver-select').value;
    const lapNumber = document.getElementById('telemetry-lap-select').value;
    
    if (!driverNumber) {
        showError('Please select a driver');
        return;
    }
    
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    showLoading();
    try {
        // Load telemetry chart
        const telemetryResponse = await fetch(`/api/plot/telemetry/${year}/${gp}/${sessionType}/${driverNumber}`);
        const telemetryData = await telemetryResponse.json();
        
        if (telemetryData.status === 'success') {
            const plotData = JSON.parse(telemetryData.data);
            Plotly.newPlot('telemetry-chart', plotData.data, plotData.layout, {responsive: true});
        }
        
        // Load track map
        const trackResponse = await fetch(`/api/plot/track/${year}/${gp}/${sessionType}/${driverNumber}`);
        const trackData = await trackResponse.json();
        
        if (trackData.status === 'success') {
            const plotData = JSON.parse(trackData.data);
            Plotly.newPlot('track-map', plotData.data, plotData.layout, {responsive: true});
        }
        
        // Load corner analysis
        if (lapNumber) {
            const cornerResponse = await fetch(`/api/lap/${year}/${gp}/${sessionType}/${driverNumber}/${lapNumber}`);
            const cornerData = await cornerResponse.json();
            
            if (cornerData.status === 'success') {
                updateCornerAnalysis(cornerData.data.corners);
            }
        }
    } catch (error) {
        showError('Failed to load telemetry: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Update corner analysis
function updateCornerAnalysis(cornerData) {
    if (!cornerData || !cornerData.corners) return;
    
    const container = document.getElementById('corner-analysis');
    container.innerHTML = '';
    
    cornerData.corners.forEach(corner => {
        const cornerEl = document.createElement('div');
        cornerEl.className = 'corner-item';
        cornerEl.innerHTML = `
            <strong>T${corner.corner_number}</strong>
            <div>Min: ${corner.min_speed?.toFixed(1)} km/h</div>
            <div>Gear: ${corner.min_gear}</div>
        `;
        container.appendChild(cornerEl);
    });
}

// Load strategy data
async function loadStrategyData() {
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    showLoading();
    try {
        // Load strategy chart
        const strategyResponse = await fetch(`/api/plot/strategy/${year}/${gp}/${sessionType}`);
        const strategyData = await strategyResponse.json();
        
        if (strategyData.status === 'success') {
            const plotData = JSON.parse(strategyData.data);
            Plotly.newPlot('strategy-chart', plotData.data, plotData.layout, {responsive: true});
        }
        
        // Load tyre data
        const tyreResponse = await fetch(`/api/tyres/${year}/${gp}/${sessionType}`);
        const tyreData = await tyreResponse.json();
        
        if (tyreData.status === 'success') {
            updateTyreAnalysis(tyreData.data);
        }
    } catch (error) {
        showError('Failed to load strategy data: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Update tyre analysis
// Update tyre analysis
function updateTyreAnalysis(tyreData) {
    const container = document.getElementById('tyre-analysis');
    container.innerHTML = '';
    
    Object.entries(tyreData).forEach(([driver, stints]) => {
        const driverInfo = currentSession.drivers[driver];
        if (!driverInfo) return;
        
        const driverEl = document.createElement('div');
        driverEl.className = 'tyre-stint';
        driverEl.innerHTML = `<strong>${driverInfo.Abbreviation}</strong>`;
        
        stints.forEach(stint => {
            const stintEl = document.createElement('div');
            stintEl.className = `tyre-indicator tyre-${stint.compound.toLowerCase()}`;
            stintEl.textContent = stint.compound.charAt(0);
            stintEl.title = `${stint.compound} - ${stint.total_laps} laps`;
            driverEl.appendChild(stintEl);
        });
        
        container.appendChild(driverEl);
    });
}

// Load degradation data
async function loadDegradationData(driverNumber) {
    if (!driverNumber) return;
    
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    try {
        const response = await fetch(`/api/plot/degradation/${year}/${gp}/${sessionType}/${driverNumber}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const plotData = JSON.parse(data.data);
            Plotly.newPlot('degradation-chart', plotData.data, plotData.layout, {responsive: true});
        }
    } catch (error) {
        console.error('Failed to load degradation data:', error);
    }
}

// Switch view
function switchView(viewName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    
    // Update view containers
    document.querySelectorAll('.view-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Only load view-specific data if a session is loaded
    if (currentSession) {
        switch(viewName) {
            case 'strategy':
                loadStrategyData();
                break;
            case 'analysis':
                loadAnalysisData();
                break;
        }
    }
}
// Switch tab
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load tab-specific data
    loadTabData(tabName);
}

// Load analysis data
async function loadAnalysisData() {
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    if (!year || !gp || !sessionType) return;
    
    try {
        const response = await fetch(`/api/comprehensive/${year}/${gp}/${sessionType}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            updateAnalysisViews(data.data);
        }
    } catch (error) {
        console.error('Failed to load analysis data:', error);
    }
}

// Update analysis views
function updateAnalysisViews(data) {
    // Update race pace
    if (data.race_pace) {
        updateRacePaceAnalysis(data.race_pace);
    }
    
    // Update team comparison
    if (data.team_comparison) {
        updateTeamComparison(data.team_comparison);
    }
    
    // Update weather data
    if (data.weather) {
        updateWeatherData(data.weather);
    }
}

// Toggle race control panel
function toggleRaceControlPanel() {
    const panel = document.getElementById('race-control');
    const button = document.getElementById('toggle-race-control');
    
    panel.classList.toggle('collapsed');
    
    if (panel.classList.contains('collapsed')) {
        button.innerHTML = '<i class="fas fa-chevron-left"></i>';
    } else {
        button.innerHTML = '<i class="fas fa-chevron-right"></i>';
    }
}

// Update connection status
function updateConnectionStatus(connected) {
    const status = document.getElementById('connection-status');
    if (connected) {
        status.innerHTML = '<i class="fas fa-circle"></i> Connected';
        status.style.color = 'var(--success-color)';
    } else {
        status.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
        status.style.color = 'var(--error-color)';
    }
}

// View driver
function viewDriver(driverNumber) {
    switchView('drivers');
    document.getElementById('driver-select').value = driverNumber;
    loadDriverData(driverNumber);
}

// Export session data
async function exportSessionData() {
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    if (!year || !gp || !sessionType) {
        showError('Please load a session first');
        return;
    }
    
    try {
        window.location.href = `/api/export/${year}/${gp}/${sessionType}`;
    } catch (error) {
        showError('Failed to export data: ' + error.message);
    }
}

function formatDate(dateString) {
    if (!dateString || dateString.trim() === '') {
        return 'N/A';
    }

    // Add 'Z' to the end to specify UTC, making parsing reliable.
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');

    // Check if the date object is valid.
    if (isNaN(date.getTime())) {
        console.error("Could not parse date:", dateString);
        return 'Invalid Date';
    }

    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC' // Display the date as it was, without local timezone shifts
    };

    return new Intl.DateTimeFormat('en-GB', options).format(date);
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    // Handle different time formats
    if (typeof timeString === 'number') {
        return formatLapTime(timeString);
    }
    return timeString;
}

function formatLapTime(seconds) {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${minutes}:${secs.padStart(6, '0')}`;
}

function formatSectorTime(seconds) {
    if (!seconds) return 'N/A';
    return seconds.toFixed(3);
}

function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.add('active');
}

function closeErrorModal() {
    document.getElementById('error-modal').classList.remove('active');
}

// Update live data (for WebSocket updates)
function updateLiveData(data) {
    if (!data || !data.laps) return;
    
    // Update lap times if on overview view
    if (document.getElementById('overview-view').classList.contains('active')) {
        // Refresh lap times chart with new data
        loadLapTimesChart();
    }
    
    // Update race control messages
    if (data.messages) {
        const messagesContainer = document.getElementById('race-messages');
        data.messages.forEach(message => {
            const messageEl = document.createElement('div');
            messageEl.className = 'race-message new';
            messageEl.innerHTML = `
                <div class="message-time">${formatTime(message.Time)}</div>
                <div class="message-content">${message.Message}</div>
            `;
            messagesContainer.insertBefore(messageEl, messagesContainer.firstChild);
        });
    }
}

// Load tab data
async function loadTabData(tabName) {
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    if (!year || !gp || !sessionType) return;
    
    switch(tabName) {
        case 'race-pace':
            loadRacePaceData();
            break;
        case 'fuel-corrected':
            loadFuelCorrectedData();
            break;
        case 'team-comparison':
            loadTeamComparisonData();
            break;
        case 'weather':
            loadWeatherData();
            break;
    }
}

// Load race pace data
async function loadRacePaceData() {
    // Implementation for race pace analysis
    const content = document.getElementById('race-pace-content');
    content.innerHTML = '<p>Race pace analysis loading...</p>';
    
    // Add implementation based on your specific requirements
}

// Load fuel corrected data
async function loadFuelCorrectedData() {
    // Implementation for fuel corrected pace
    const content = document.getElementById('fuel-corrected-content');
    content.innerHTML = '<p>Fuel corrected pace analysis loading...</p>';
    
    // Add implementation based on your specific requirements
}

// Load team comparison data
async function loadTeamComparisonData() {
    // Implementation for team comparison
    const content = document.getElementById('team-comparison-content');
    content.innerHTML = '<p>Team comparison loading...</p>';
    
    // Add implementation based on your specific requirements
}

// Load weather data
async function loadWeatherData() {
    const year = document.getElementById('year-select').value;
    const gp = document.getElementById('event-select').value;
    const sessionType = document.getElementById('session-select').value;
    
    try {
        const response = await fetch(`/api/weather/${year}/${gp}/${sessionType}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            updateWeatherDisplay(data.data);
        }
    } catch (error) {
        console.error('Failed to load weather data:', error);
    }
}

// Update weather display
function updateWeatherDisplay(weatherData) {
    const container = document.getElementById('weather-content');
    container.innerHTML = '';
    
    if (!weatherData || weatherData.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No weather data available</p>';
        return;
    }
    
    weatherData.forEach(weather => {
        const weatherEl = document.createElement('div');
        weatherEl.className = 'weather-item';
        weatherEl.innerHTML = `
            <div class="weather-icon">
                <i class="fas fa-${getWeatherIcon(weather.Weather)}"></i>
            </div>
            <div>
                <div class="info-label">Air Temp</div>
                <div class="info-value">${weather.AirTemp}°C</div>
            </div>
            <div>
                <div class="info-label">Track Temp</div>
                <div class="info-value">${weather.TrackTemp}°C</div>
            </div>
            <div>
                <div class="info-label">Humidity</div>
                <div class="info-value">${weather.Humidity}%</div>
            </div>
        `;
        container.appendChild(weatherEl);
    });
}

// Get weather icon based on conditions
function getWeatherIcon(weather) {
    if (!weather) return 'question';
    weather = weather.toLowerCase();
    
    if (weather.includes('rain')) return 'cloud-rain';
    if (weather.includes('cloud')) return 'cloud';
    if (weather.includes('sun') || weather.includes('clear')) return 'sun';
    if (weather.includes('wind')) return 'wind';
    return 'cloud-sun';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + E: Export data
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportSessionData();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
        closeErrorModal();
        closeComparison();
    }
    
    // Arrow keys: Navigate laps (when in driver view)
    if (document.getElementById('drivers-view').classList.contains('active')) {
        const slider = document.getElementById('lap-slider');
        if (e.key === 'ArrowLeft' && slider.value > slider.min) {
            slider.value = parseInt(slider.value) - 1;
            updateLapDisplay(slider.value);
        } else if (e.key === 'ArrowRight' && slider.value < slider.max) {
            slider.value = parseInt(slider.value) + 1;
            updateLapDisplay(slider.value);
        }
    }
});

// Window resize handler
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // Resize all Plotly charts
        const charts = [
            'laptimes-chart',
            'positions-chart',
            'speed-analysis-chart',
            'telemetry-chart',
            'track-map',
            'strategy-chart',
            'degradation-chart'
        ];
        
        charts.forEach(chartId => {
            const chart = document.getElementById(chartId);
            if (chart && chart.data) {
                Plotly.Plots.resize(chart);
            }
        });
    }, 250);
});

// Initialize on load
console.log('F1 Analytics Dashboard initialized');