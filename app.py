from flask import Flask, render_template, jsonify, request, send_file
from flask_cors import CORS
import json
import pandas as pd
import plotly.graph_objs as go
import plotly.utils
from datetime import datetime
import os
import threading
import time
from functools import lru_cache
import logging
import click

from data_collector import F1DataCollector

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize F1 data collector
collector = F1DataCollector(cache_dir='cache')

# Cache for frequently accessed data
data_cache = {}
cache_lock = threading.Lock()

# Background data refresh
def refresh_cache():
    """Periodically refresh cached data"""
    while True:
        try:
            current_year = datetime.now().year
            # Refresh current year schedule
            with cache_lock:
                data_cache['current_schedule'] = collector.get_event_schedule(current_year)
            logger.info(f"Cache refreshed for {current_year}")
        except Exception as e:
            logger.error(f"Error refreshing cache: {e}")
        time.sleep(3600)  # Refresh every hour

# Start background thread
refresh_thread = threading.Thread(target=refresh_cache, daemon=True)
refresh_thread.start()

# Routes
@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/years')
def get_years():
    """Get available years"""
    try:
        years = collector.get_available_years()
        return jsonify({
            'status': 'success',
            'data': years
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/schedule/<int:year>')
def get_schedule(year):
    """Get event schedule for a specific year"""
    try:
        schedule = collector.get_event_schedule(year)
        
        # Convert to JSON-serializable format
        schedule_data = []
        for _, event in schedule.iterrows():
            schedule_data.append({
                'round': int(event['RoundNumber']),
                'country': event['Country'],
                'location': event['Location'],
                'event_name': event['EventName'],
                'event_date': event['EventDate'].isoformat() if pd.notna(event['EventDate']) else None,
                'event_format': event['EventFormat'],
                'session1_date': event['Session1Date'].isoformat() if pd.notna(event['Session1Date']) else None,
                'session2_date': event['Session2Date'].isoformat() if pd.notna(event['Session2Date']) else None,
                'session3_date': event['Session3Date'].isoformat() if pd.notna(event['Session3Date']) else None,
                'session4_date': event['Session4Date'].isoformat() if pd.notna(event['Session4Date']) else None,
                'session5_date': event['Session5Date'].isoformat() if pd.notna(event['Session5Date']) else None,
            })
        
        return jsonify({
            'status': 'success',
            'data': schedule_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/session/<int:year>/<gp>/<session_type>')
def get_session_data(year, gp, session_type):
    """Get comprehensive session data"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        # Get session data
        data = collector.get_session_data_json(year, gp, session_type)
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Session data not available'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': data
        })
    except Exception as e:
        logger.error(f"Error getting session data: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/drivers/<int:year>/<gp>/<session_type>')
def get_drivers(year, gp, session_type):
    """Get list of drivers for a session"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        drivers_data = []
        for _, driver in session.results.iterrows():
            drivers_data.append({
                'number': driver['DriverNumber'],
                'abbreviation': driver['Abbreviation'],
                'full_name': driver['FullName'],
                'team': driver['TeamName'],
                'team_color': driver['TeamColor']
            })
        
        return jsonify({
            'status': 'success',
            'data': drivers_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/driver/<int:year>/<gp>/<session_type>/<driver>')
def get_driver_data(year, gp, session_type, driver):
    """Get detailed data for a specific driver"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        # Get comprehensive driver data
        driver_summary = collector.get_driver_performance_summary(session, driver)
        sector_analysis = collector.get_sector_analysis(session, driver)
        speed_analysis = collector.get_speed_analysis(session, driver)
        
        # Get telemetry for fastest lap
        telemetry_data = collector.get_telemetry_data(session, driver)
        telemetry_records = telemetry_data.to_dict('records') if not telemetry_data.empty else []
        
        return jsonify({
            'status': 'success',
            'data': {
                'summary': driver_summary,
                'sectors': sector_analysis,
                'speed': speed_analysis,
                'telemetry': telemetry_records
            }
        })
    except Exception as e:
        logger.error(f"Error getting driver data: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/compare/<int:year>/<gp>/<session_type>/<driver1>/<driver2>')
def compare_drivers(year, gp, session_type, driver1, driver2):
    """Compare two drivers"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        # Get comparison data
        comparison = collector.compare_driver_laps(session, driver1, driver2)
        
        # Get individual driver summaries
        driver1_summary = collector.get_driver_performance_summary(session, driver1)
        driver2_summary = collector.get_driver_performance_summary(session, driver2)
        
        return jsonify({
            'status': 'success',
            'data': {
                'comparison': comparison,
                'driver1_summary': driver1_summary,
                'driver2_summary': driver2_summary
            }
        })
    except Exception as e:
        logger.error(f"Error comparing drivers: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/lap/<int:year>/<gp>/<session_type>/<driver>/<int:lap>')
def get_lap_data(year, gp, session_type, driver, lap):
    """Get data for a specific lap"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        # Get telemetry for specific lap
        telemetry = collector.get_telemetry_data(session, driver, lap)
        telemetry_records = telemetry.to_dict('records') if not telemetry.empty else []
        
        # Get corner performance
        corner_perf = collector.analyze_corner_performance(session, driver, lap)
        
        return jsonify({
            'status': 'success',
            'data': {
                'telemetry': telemetry_records,
                'corners': corner_perf
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/strategy/<int:year>/<gp>/<session_type>')
def get_strategy_analysis(year, gp, session_type):
    """Get strategy analysis for all drivers"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        strategies = collector.get_strategy_analysis(session)
        
        return jsonify({
            'status': 'success',
            'data': strategies
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/tyres/<int:year>/<gp>/<session_type>')
def get_tyre_data(year, gp, session_type):
    """Get tyre data analysis"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        tyre_data = collector.get_tyre_data(session)
        
        return jsonify({
            'status': 'success',
            'data': tyre_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/plot/lap_times/<int:year>/<gp>/<session_type>')
def plot_lap_times(year, gp, session_type):
    """Generate lap time evolution plot"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        lap_evolution = collector.get_lap_time_evolution(session)
        
        # Create Plotly figure
        fig = go.Figure()
        
        for driver_num, driver_data in lap_evolution.items():
            if driver_data['lap_times']:
                laps = [lt['lap'] for lt in driver_data['lap_times']]
                times = [lt['time'] for lt in driver_data['lap_times']]
                
                fig.add_trace(go.Scatter(
                    x=laps,
                    y=times,
                    mode='lines+markers',
                    name=driver_data['abbreviation'],
                    line=dict(color=driver_data['team_color']),
                    hovertemplate='%{text}<br>Lap: %{x}<br>Time: %{y:.3f}s<extra></extra>',
                    text=[f"{driver_data['driver_name']}<br>Compound: {lt['compound']}" 
                          for lt in driver_data['lap_times']]
                ))
        
        fig.update_layout(
            title='Lap Time Evolution',
            xaxis_title='Lap Number',
            yaxis_title='Lap Time (seconds)',
            hovermode='x unified',
            height=600
        )
        
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'status': 'success',
            'data': graphJSON
        })
    except Exception as e:
        logger.error(f"Error plotting lap times: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/plot/telemetry/<int:year>/<gp>/<session_type>/<driver>')
def plot_telemetry(year, gp, session_type, driver):
    """Generate telemetry plots"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        # Get telemetry for fastest lap
        telemetry_df = collector.get_telemetry_data(session, driver)
        
        if telemetry_df.empty:
            return jsonify({
                'status': 'error',
                'message': 'No telemetry data available'
            }), 404
        
        # Create subplots
        from plotly.subplots import make_subplots
        
        fig = make_subplots(
            rows=4, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            subplot_titles=('Speed', 'Throttle/Brake', 'Gear', 'RPM')
        )
        
        # Speed trace
        fig.add_trace(
            go.Scatter(
                x=telemetry_df['Distance'],
                y=telemetry_df['Speed'],
                mode='lines',
                name='Speed',
                line=dict(color='purple')
            ),
            row=1, col=1
        )
        
        # Throttle and Brake
        if 'Throttle' in telemetry_df.columns:
            fig.add_trace(
                go.Scatter(
                    x=telemetry_df['Distance'],
                    y=telemetry_df['Throttle'],
                    mode='lines',
                    name='Throttle',
                    line=dict(color='green')
                ),
                row=2, col=1
            )
        
        if 'Brake' in telemetry_df.columns:
            fig.add_trace(
                go.Scatter(
                    x=telemetry_df['Distance'],
                    y=telemetry_df['Brake'],
                    mode='lines',
                    name='Brake',
                    line=dict(color='red')
                ),
                row=2, col=1
            )
        
        # Gear
        if 'nGear' in telemetry_df.columns:
            fig.add_trace(
                go.Scatter(
                    x=telemetry_df['Distance'],
                    y=telemetry_df['nGear'],
                    mode='lines',
                    name='Gear',
                    line=dict(color='blue')
                ),
                row=3, col=1
            )
        
        # RPM
        if 'RPM' in telemetry_df.columns:
            fig.add_trace(
                go.Scatter(
                    x=telemetry_df['Distance'],
                    y=telemetry_df['RPM'],
                    mode='lines',
                    name='RPM',
                    line=dict(color='orange')
                ),
                row=4, col=1
            )
        
        fig.update_xaxes(title_text="Distance (m)", row=4, col=1)
        fig.update_yaxes(title_text="Speed (km/h)", row=1, col=1)
        fig.update_yaxes(title_text="Percentage", row=2, col=1)
        fig.update_yaxes(title_text="Gear", row=3, col=1)
        fig.update_yaxes(title_text="RPM", row=4, col=1)
        
        fig.update_layout(
            title=f'Telemetry - {driver}',
            height=1000,
            showlegend=True
        )
        
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'status': 'success',
            'data': graphJSON
        })
    except Exception as e:
        logger.error(f"Error plotting telemetry: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/plot/track/<int:year>/<gp>/<session_type>/<driver>')
def plot_track_map(year, gp, session_type, driver):
    """Generate track map with telemetry"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        # Get telemetry
        telemetry_df = collector.get_telemetry_data(session, driver)
        
        if telemetry_df.empty:
            return jsonify({
                'status': 'error',
                'message': 'No telemetry data available'
            }), 404
        
        # Create track map colored by speed
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=telemetry_df['X'],
            y=telemetry_df['Y'],
            mode='markers',
            marker=dict(
                color=telemetry_df['Speed'],
                colorscale='Viridis',
                size=5,
                colorbar=dict(title="Speed (km/h)")
            ),
            text=[f"Speed: {speed:.1f} km/h<br>Gear: {gear}<br>Throttle: {throttle:.1f}%" 
                  for speed, gear, throttle in zip(
                      telemetry_df['Speed'], 
                      telemetry_df.get('nGear', [0]*len(telemetry_df)), 
                      telemetry_df.get('Throttle', [0]*len(telemetry_df))
                  )],
            hoverinfo='text',
            name='Track Position'
        ))
        
        # Add circuit info if available
        circuit_info = collector.get_circuit_info(session)
        if circuit_info and 'corners' in circuit_info:
            for corner in circuit_info['corners']:
                fig.add_annotation(
                    x=corner.get('X', 0),
                    y=corner.get('Y', 0),
                    text=f"T{corner.get('Number', '')}",
                    showarrow=False,
                    font=dict(size=12, color='red')
                )
        
        fig.update_layout(
            title=f'Track Map - {driver}',
            xaxis=dict(scaleanchor='y', scaleratio=1, showgrid=False),
            yaxis=dict(showgrid=False),
            showlegend=False,
            height=800
        )
        
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'status': 'success',
            'data': graphJSON
        })
    except Exception as e:
        logger.error(f"Error plotting track map: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/plot/strategy/<int:year>/<gp>/<session_type>')
def plot_strategy(year, gp, session_type):
    """Generate strategy visualization"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        strategies = collector.get_strategy_analysis(session)
        
        # Create strategy plot
        fig = go.Figure()
        
        # Define compound colors
        compound_colors = {
            'SOFT': '#ff1e00',
            'MEDIUM': '#ffd700',
            'HARD': '#ffffff',
            'INTERMEDIATE': '#00ff00',
            'WET': '#0080ff'
        }
        
        y_position = 0
        for driver_num, strategy in strategies.items():
            for stint in strategy['stints']:
                fig.add_trace(go.Scatter(
                    x=[stint['start_lap'], stint['end_lap']],
                    y=[y_position, y_position],
                    mode='lines',
                    line=dict(
                        color=compound_colors.get(stint['compound'], '#gray'),
                        width=20
                    ),
                    name=f"{strategy['driver_name']} - {stint['compound']}",
                    hovertemplate=f"Driver: {strategy['driver_name']}<br>" +
                                  f"Compound: {stint['compound']}<br>" +
                                  f"Laps: {stint['start_lap']}-{stint['end_lap']}<br>" +
                                  f"Stint Length: {stint['stint_length']}<br>" +
                                  f"Avg Time: {stint['average_lap_time']:.3f}s<extra></extra>",
                    showlegend=False
                ))
            y_position += 1
        
        # Add driver labels
        fig.update_yaxis(
            tickmode='array',
            tickvals=list(range(len(strategies))),
            ticktext=[s['driver_name'] for s in strategies.values()]
        )
        
        fig.update_layout(
            title='Race Strategy Overview',
            xaxis_title='Lap Number',
            yaxis_title='Driver',
            height=max(400, len(strategies) * 30),
            showlegend=False
        )
        
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'status': 'success',
            'data': graphJSON
        })
    except Exception as e:
        logger.error(f"Error plotting strategy: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/plot/positions/<int:year>/<gp>/<session_type>')
def plot_position_changes(year, gp, session_type):
    """Generate position changes plot"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        # Get position data
        position_data = {}
        
        for driver in session.drivers:
            driver_laps = session.laps.pick_driver(driver)
            if not driver_laps.empty:
                driver_info = session.get_driver(driver)
                position_data[driver] = {
                    'name': driver_info['Abbreviation'] if driver_info else str(driver),
                    'color': driver_info['TeamColor'] if driver_info else '#000000',
                    'positions': [(lap['LapNumber'], lap['Position']) 
                                 for _, lap in driver_laps.iterrows() 
                                 if pd.notna(lap['Position'])]
                }
        
        # Create plot
        fig = go.Figure()
        
        for driver, data in position_data.items():
            if data['positions']:
                laps, positions = zip(*data['positions'])
                fig.add_trace(go.Scatter(
                    x=laps,
                    y=positions,
                    mode='lines',
                    name=data['name'],
                    line=dict(color=data['color'], width=2),
                    hovertemplate='%{text}<br>Lap: %{x}<br>Position: %{y}<extra></extra>',
                    text=[data['name']] * len(laps)
                ))
        
        fig.update_yaxis(
            autorange='reversed',
            tickmode='linear',
            tick0=1,
            dtick=1,
            title='Position'
        )
        
        fig.update_xaxis(title='Lap Number')
        
        fig.update_layout(
            title='Position Changes Throughout Race',
            height=600,
            hovermode='x unified'
        )
        
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'status': 'success',
            'data': graphJSON
        })
    except Exception as e:
        logger.error(f"Error plotting positions: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/plot/degradation/<int:year>/<gp>/<session_type>/<driver>')
def plot_tyre_degradation(year, gp, session_type, driver):
    """Plot tyre degradation analysis"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        degradation = collector.get_degradation_analysis(session, driver)
        
        if not degradation:
            return jsonify({
                'status': 'error',
                'message': 'No degradation data available'
            }), 404
        
        # Create subplots for each stint
        from plotly.subplots import make_subplots
        
        fig = make_subplots(
            rows=len(degradation), cols=1,
            shared_xaxes=True,
            vertical_spacing=0.1,
            subplot_titles=[f"{stint_data['compound']} - Stint starting lap {stint_data['start_lap']}" 
                           for stint_data in degradation.values()]
        )
        
        row = 1
        for stint_id, stint_data in degradation.items():
            laps = list(range(len(stint_data['lap_times'])))
            
            # Add actual lap times
            fig.add_trace(
                go.Scatter(
                    x=laps,
                    y=stint_data['lap_times'],
                    mode='lines+markers',
                    name=f"{stint_data['compound']} - Actual",
                    line=dict(color='blue'),
                    showlegend=(row == 1)
                ),
                row=row, col=1
            )
            
            # Add degradation trend line
            if len(laps) > 1:
                trend_x = [0, len(laps)-1]
                trend_y = [
                    stint_data['starting_pace'],
                    stint_data['starting_pace'] + stint_data['degradation_per_lap'] * (len(laps)-1)
                ]
                fig.add_trace(
                    go.Scatter(
                        x=trend_x,
                        y=trend_y,
                        mode='lines',
                        name='Degradation Trend',
                        line=dict(color='red', dash='dash'),
                        showlegend=(row == 1)
                    ),
                    row=row, col=1
                )
            
            row += 1
        
        fig.update_xaxes(title_text="Lap in Stint", row=len(degradation), col=1)
        fig.update_yaxes(title_text="Lap Time (s)")
        
        fig.update_layout(
            title=f'Tyre Degradation Analysis - {driver}',
            height=300 * len(degradation),
            showlegend=True
        )
        
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'status': 'success',
            'data': graphJSON
        })
    except Exception as e:
        logger.error(f"Error plotting degradation: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/plot/sector_comparison/<int:year>/<gp>/<session_type>')
def plot_sector_comparison(year, gp, session_type):
    """Plot sector time comparison for all drivers"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        # Get sector data for all drivers
        sector_data = {}
        for driver in session.drivers:
            analysis = collector.get_sector_analysis(session, driver)
            if analysis and analysis['sector1']['best'] is not None:
                driver_info = session.get_driver(driver)
                sector_data[driver] = {
                    'name': driver_info['Abbreviation'] if driver_info else str(driver),
                    'sectors': analysis
                }
        
        # Create grouped bar chart
        drivers = list(sector_data.keys())
        driver_names = [sector_data[d]['name'] for d in drivers]
        
        s1_times = [sector_data[d]['sectors']['sector1']['best'] for d in drivers]
        s2_times = [sector_data[d]['sectors']['sector2']['best'] for d in drivers]
        s3_times = [sector_data[d]['sectors']['sector3']['best'] for d in drivers]
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            name='Sector 1',
            x=driver_names,
            y=s1_times,
            marker_color='lightblue'
        ))
        
        fig.add_trace(go.Bar(
            name='Sector 2',
            x=driver_names,
            y=s2_times,
            marker_color='lightgreen'
        ))
        
        fig.add_trace(go.Bar(
            name='Sector 3',
            x=driver_names,
            y=s3_times,
            marker_color='lightcoral'
        ))
        
        fig.update_layout(
            title='Best Sector Times Comparison',
            xaxis_title='Driver',
            yaxis_title='Time (seconds)',
            barmode='group',
            height=500
        )
        
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'status': 'success',
            'data': graphJSON
        })
    except Exception as e:
        logger.error(f"Error plotting sector comparison: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/race_control/<int:year>/<gp>/<session_type>')
def get_race_control_messages(year, gp, session_type):
    """Get race control messages"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        messages = collector.get_race_control_messages(session)
        
        return jsonify({
            'status': 'success',
            'data': messages.to_dict('records') if hasattr(messages, 'to_dict') else messages
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/weather/<int:year>/<gp>/<session_type>')
def get_weather_data(year, gp, session_type):
    """Get weather data"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        weather = collector.get_weather_data(session)
        
        return jsonify({
            'status': 'success',
            'data': weather.to_dict('records') if hasattr(weather, 'to_dict') else []
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/comprehensive/<int:year>/<gp>/<session_type>')
def get_comprehensive_analysis(year, gp, session_type):
    """Get comprehensive analysis for a session"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        analysis = collector.get_comprehensive_analysis(year, gp, session_type)
        
        if not analysis:
            return jsonify({
                'status': 'error',
                'message': 'Analysis not available'
            }), 404
        
        return jsonify({
            'status': 'success',
            'data': analysis
        })
    except Exception as e:
        logger.error(f"Error getting comprehensive analysis: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/export/<int:year>/<gp>/<session_type>')
def export_session_data(year, gp, session_type):
    """Export session data as JSON file"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        data = collector.get_session_data_json(year, gp, session_type)
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Session data not available'
            }), 404
        
        # Generate filename
        filename = f"{year}_{gp}_{session_type}_analysis.json"
        filepath = os.path.join('exports', filename)
        
        # Ensure exports directory exists
        os.makedirs('exports', exist_ok=True)
        
        # Export data
        collector.export_session_to_json(data, filepath)
        
        return send_file(filepath, as_attachment=True, download_name=filename)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/live/<session_key>')
def get_live_timing(session_key):
    """Get live timing data"""
    try:
        live_data = collector.get_live_timing_data(session_key)
        
        return jsonify({
            'status': 'success',
            'data': live_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/plot/speed_map/<int:year>/<gp>/<session_type>')
def plot_speed_map_comparison(year, gp, session_type):
    """Generate speed map comparison for multiple drivers"""
    try:
        # Try to convert gp to int if it's a round number
        try:
            gp = int(gp)
        except ValueError:
            pass
        
        # Get drivers from query parameters
        drivers = request.args.get('drivers', '').split(',')
        
        if not drivers or drivers == ['']:
            return jsonify({
                'status': 'error',
                'message': 'No drivers specified'
            }), 400
        
        session = collector.get_session(year, gp, session_type)
        
        if not session:
            return jsonify({
                'status': 'error',
                'message': 'Session not found'
            }), 404
        
        from plotly.subplots import make_subplots
        
        # Create subplots for each driver
        fig = make_subplots(
            rows=1, cols=len(drivers),
            subplot_titles=[f"Driver {d}" for d in drivers],
            horizontal_spacing=0.05
        )
        
        for idx, driver in enumerate(drivers):
            telemetry = collector.get_telemetry_data(session, driver)
            
            if not telemetry.empty and 'X' in telemetry.columns and 'Y' in telemetry.columns:
                fig.add_trace(
                    go.Scatter(
                        x=telemetry['X'],
                        y=telemetry['Y'],
                        mode='markers',
                        marker=dict(
                            color=telemetry['Speed'],
                            colorscale='Viridis',
                            size=3,
                            colorbar=dict(title="Speed (km/h)") if idx == len(drivers)-1 else None
                        ),
                        showlegend=False
                    ),
                    row=1, col=idx+1
                )
        
        fig.update_xaxes(scaleanchor='y', scaleratio=1, showgrid=False)
        fig.update_yaxes(showgrid=False)
        
        fig.update_layout(
            title='Speed Map Comparison',
            height=600
        )
        
        graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
        
        return jsonify({
            'status': 'success',
            'data': graphJSON
        })
    except Exception as e:
        logger.error(f"Error plotting speed map comparison: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/download_season/<int:year>')
def download_season_data(year):
    """Trigger download of all season data"""
    try:
        # Start download in background
        thread = threading.Thread(
            target=collector.batch_download_season_data,
            args=(year, ['FP1', 'FP2', 'FP3', 'Q', 'R'])
        )
        thread.start()
        
        return jsonify({
            'status': 'success',
            'message': f'Started downloading {year} season data'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Internal server error'
    }), 500

# WebSocket support for real-time updates (optional)
try:
    from flask_socketio import SocketIO, emit
    
    socketio = SocketIO(app, cors_allowed_origins="*")
    
    @socketio.on('connect')
    def handle_connect():
        emit('connected', {'data': 'Connected to F1 Analytics'})
        logger.info('Client connected')
    
    @socketio.on('disconnect')
    def handle_disconnect():
        logger.info('Client disconnected')
    
    @socketio.on('subscribe_session')
    def handle_subscribe_session(data):
        """Subscribe to live session updates"""
        year = data.get('year')
        gp = data.get('gp')
        session_type = data.get('session_type')
        
        # Start periodic updates
        def send_updates():
            while True:
                try:
                    session = collector.get_session(year, gp, session_type)
                    if session:
                        # Get latest lap data
                        latest_laps = session.laps.tail(20).to_dict('records')
                        emit('session_update', {
                            'laps': latest_laps,
                            'timestamp': datetime.now().isoformat()
                        })
                except Exception as e:
                    logger.error(f"Error sending updates: {e}")
                
                time.sleep(5)  # Update every 5 seconds
        
        thread = threading.Thread(target=send_updates, daemon=True)
        thread.start()
        
        emit('subscribed', {'session': f"{year} {gp} {session_type}"})
    
    @socketio.on('request_telemetry')
    def handle_telemetry_request(data):
        """Send telemetry data via WebSocket"""
        try:
            year = data.get('year')
            gp = data.get('gp')
            session_type = data.get('session_type')
            driver = data.get('driver')
            lap = data.get('lap')
            
            session = collector.get_session(year, gp, session_type)
            if session:
                telemetry = collector.get_telemetry_data(session, driver, lap)
                telemetry_data = telemetry.to_dict('records') if not telemetry.empty else []
                
                emit('telemetry_data', {
                    'driver': driver,
                    'lap': lap,
                    'data': telemetry_data
                })
        except Exception as e:
            emit('error', {'message': str(e)})
    
    # Use SocketIO run instead of app.run
    USE_SOCKETIO = True
    
except ImportError:
    logger.warning("flask_socketio not installed. WebSocket features disabled.")
    socketio = None
    USE_SOCKETIO = False

# CLI Commands
@app.cli.command('init-cache')
def init_cache():
    """Initialize cache directory and download current year data"""
    current_year = datetime.now().year
    logger.info(f"Initializing cache for {current_year}")
    collector.batch_download_season_data(current_year, ['R'])
    logger.info("Cache initialization complete")

@app.cli.command('download-year')
@click.argument('year', type=int)
def download_year(year):
    """Download all data for a specific year"""
    logger.info(f"Downloading all data for {year}")
    collector.batch_download_season_data(year, ['FP1', 'FP2', 'FP3', 'Q', 'R'])
    logger.info(f"Download complete for {year}")

# Template context processors
@app.context_processor
def inject_current_year():
    return {'current_year': datetime.now().year}

# API Documentation endpoint
@app.route('/api/docs')
def api_documentation():
    """Return API documentation"""
    docs = {
        'version': '1.0.0',
        'title': 'F1 Analytics API',
        'description': 'API for accessing F1 telemetry and race data',
        'endpoints': {
            'general': {
                '/api/years': 'Get available years',
                '/api/schedule/<year>': 'Get season schedule',
                '/api/health': 'Health check'
            },
            'session': {
                '/api/session/<year>/<gp>/<session_type>': 'Get session data',
                '/api/drivers/<year>/<gp>/<session_type>': 'Get drivers list',
                '/api/comprehensive/<year>/<gp>/<session_type>': 'Get comprehensive analysis'
            },
            'driver': {
                '/api/driver/<year>/<gp>/<session_type>/<driver>': 'Get driver data',
                '/api/compare/<year>/<gp>/<session_type>/<driver1>/<driver2>': 'Compare drivers',
                '/api/lap/<year>/<gp>/<session_type>/<driver>/<lap>': 'Get lap data'
            },
            'analysis': {
                '/api/strategy/<year>/<gp>/<session_type>': 'Strategy analysis',
                '/api/tyres/<year>/<gp>/<session_type>': 'Tyre data',
                '/api/race_control/<year>/<gp>/<session_type>': 'Race control messages',
                '/api/weather/<year>/<gp>/<session_type>': 'Weather data'
            },
            'plots': {
                '/api/plot/lap_times/<year>/<gp>/<session_type>': 'Lap times plot',
                '/api/plot/telemetry/<year>/<gp>/<session_type>/<driver>': 'Telemetry plots',
                '/api/plot/track/<year>/<gp>/<session_type>/<driver>': 'Track map',
                '/api/plot/strategy/<year>/<gp>/<session_type>': 'Strategy visualization',
                '/api/plot/positions/<year>/<gp>/<session_type>': 'Position changes',
                '/api/plot/degradation/<year>/<gp>/<session_type>/<driver>': 'Tyre degradation',
                '/api/plot/sector_comparison/<year>/<gp>/<session_type>': 'Sector comparison',
                '/api/plot/speed_map/<year>/<gp>/<session_type>?drivers=': 'Speed map comparison'
            },
            'export': {
                '/api/export/<year>/<gp>/<session_type>': 'Export session data',
                '/api/download_season/<year>': 'Download season data'
            }
        }
    }
    
    return jsonify(docs)

# Error logging
@app.before_request
def log_request():
    logger.debug(f"Request: {request.method} {request.path}")

@app.after_request
def log_response(response):
    logger.debug(f"Response: {response.status}")
    return response

if __name__ == '__main__':
    # Ensure necessary directories exist
    os.makedirs('cache', exist_ok=True)
    os.makedirs('exports', exist_ok=True)
    os.makedirs('static/plots', exist_ok=True)
    
    # Load configuration
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    logger.info(f"Starting F1 Analytics Web App on port {port}")
    
    if USE_SOCKETIO and socketio:
        # Run with SocketIO support
        logger.info("Running with WebSocket support enabled")
        socketio.run(app, 
                    host='0.0.0.0', 
                    port=port, 
                    debug=debug,
                    allow_unsafe_werkzeug=True)
    else:
        # Run standard Flask app
        logger.info("Running without WebSocket support")
        app.run(host='0.0.0.0', 
                port=port, 
                debug=debug)