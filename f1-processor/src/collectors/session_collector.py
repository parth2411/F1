# f1-processor/src/collectors/session_collector.py
import fastf1
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import asyncio
import aioredis
import json
from datetime import datetime

class SessionCollector:
    def __init__(self, cache_dir: str = 'cache'):
        self.cache_dir = cache_dir
        fastf1.Cache.enable_cache(cache_dir)
        
    async def collect_session_data(self, year: int, round_num: int, session: str) -> Dict:
        """Collect comprehensive session data"""
        try:
            # Load session
            session_obj = fastf1.get_session(year, round_num, session)
            session_obj.load()
            
            # Collect all data
            data = {
                'session_info': self._get_session_info(session_obj),
                'drivers': self._get_drivers_data(session_obj),
                'telemetry': self._get_telemetry_data(session_obj),
                'timing': self._get_timing_data(session_obj),
                'weather': self._get_weather_data(session_obj),
                'track_status': self._get_track_status(session_obj),
                'race_control': self._get_race_control_messages(session_obj),
                'circuit_info': self._get_circuit_info(session_obj)
            }
            
            return data
            
        except Exception as e:
            print(f"Error collecting session data: {e}")
            return {}
    
    def _get_session_info(self, session) -> Dict:
        """Extract session information"""
        return {
            'name': session.name,
            'date': session.date.isoformat() if session.date else None,
            'event_name': session.event['EventName'],
            'country': session.event['Country'],
            'location': session.event['Location'],
            'circuit_key': session.event['CircuitKey'],
            'session_type': session.name,
            'total_laps': len(session.laps) if hasattr(session, 'laps') else 0
        }
    
    def _get_drivers_data(self, session) -> Dict:
        """Extract driver data with results and lap times"""
        drivers_data = {}
        
        for driver_num in session.drivers:
            try:
                driver_info = session.get_driver(driver_num)
                driver_laps = session.laps.pick_driver(driver_num)
                
                # Process lap data
                laps_list = []
                for _, lap in driver_laps.iterrows():
                    lap_data = {
                        'lap_number': int(lap['LapNumber']),
                        'lap_time': lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None,
                        'sector1_time': lap['Sector1Time'].total_seconds() if pd.notna(lap['Sector1Time']) else None,
                        'sector2_time': lap['Sector2Time'].total_seconds() if pd.notna(lap['Sector2Time']) else None,
                        'sector3_time': lap['Sector3Time'].total_seconds() if pd.notna(lap['Sector3Time']) else None,
                        'speed_i1': lap.get('SpeedI1'),
                        'speed_i2': lap.get('SpeedI2'),
                        'speed_fl': lap.get('SpeedFL'),
                        'speed_st': lap.get('SpeedST'),
                        'compound': lap.get('Compound'),
                        'tyre_life': lap.get('TyreLife'),
                        'stint': lap.get('Stint'),
                        'pit_out_time': lap['PitOutTime'].total_seconds() if pd.notna(lap['PitOutTime']) else None,
                        'pit_in_time': lap['PitInTime'].total_seconds() if pd.notna(lap['PitInTime']) else None,
                        'is_personal_best': lap.get('IsPersonalBest', False)
                    }
                    laps_list.append(lap_data)
                
                drivers_data[str(driver_num)] = {
                    'driver_number': str(driver_num),
                    'name': driver_info.get('FullName', f'Driver {driver_num}'),
                    'abbreviation': driver_info.get('Abbreviation', str(driver_num)),
                    'team': driver_info.get('TeamName', 'Unknown'),
                    'team_color': driver_info.get('TeamColor', '#000000'),
                    'country_code': driver_info.get('CountryCode', ''),
                    'laps': laps_list,
                    'fastest_lap': min([l['lap_time'] for l in laps_list if l['lap_time']], default=None)
                }
                
            except Exception as e:
                print(f"Error processing driver {driver_num}: {e}")
                continue
        
        return drivers_data
    
    def _get_telemetry_data(self, session) -> Dict:
        """Extract telemetry data for fastest laps"""
        telemetry_data = {}
        
        for driver_num in session.drivers:
            try:
                driver_laps = session.laps.pick_driver(driver_num)
                if not driver_laps.empty:
                    fastest_lap = driver_laps.pick_fastest()
                    if fastest_lap is not None:
                        telemetry = fastest_lap.get_telemetry()
                        if not telemetry.empty:
                            telemetry_data[str(driver_num)] = {
                                'distance': telemetry['Distance'].tolist(),
                                'speed': telemetry['Speed'].tolist(),
                                'rpm': telemetry.get('RPM', []).tolist() if 'RPM' in telemetry.columns else [],
                                'gear': telemetry.get('nGear', []).tolist() if 'nGear' in telemetry.columns else [],
                                'throttle': telemetry.get('Throttle', []).tolist() if 'Throttle' in telemetry.columns else [],
                                'brake': telemetry.get('Brake', []).tolist() if 'Brake' in telemetry.columns else [],
                                'x': telemetry.get('X', []).tolist() if 'X' in telemetry.columns else [],
                                'y': telemetry.get('Y', []).tolist() if 'Y' in telemetry.columns else []
                            }
            except Exception as e:
                print(f"Error processing telemetry for driver {driver_num}: {e}")
                continue
        
        return telemetry_data
    
    def _get_timing_data(self, session) -> List[Dict]:
        """Extract timing data"""
        if not hasattr(session, 'laps') or session.laps.empty:
            return []
        
        timing_data = []
        for _, lap in session.laps.iterrows():
            timing_data.append({
                'driver': str(lap['DriverNumber']),
                'lap_number': int(lap['LapNumber']),
                'time': lap['Time'].total_seconds() if pd.notna(lap['Time']) else None,
                'lap_time': lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None,
                'position': lap.get('Position')
            })
        
        return timing_data
    
    def _get_weather_data(self, session) -> List[Dict]:
        """Extract weather data"""
        if not hasattr(session, 'weather_data') or session.weather_data.empty:
            return []
        
        weather_list = []
        for _, weather in session.weather_data.iterrows():
            weather_list.append({
                'time': weather['Time'].total_seconds() if pd.notna(weather['Time']) else None,
                'air_temp': weather.get('AirTemp'),
                'track_temp': weather.get('TrackTemp'),
                'humidity': weather.get('Humidity'),
                'pressure': weather.get('Pressure'),
                'wind_direction': weather.get('WindDirection'),
                'wind_speed': weather.get('WindSpeed'),
                'rainfall': weather.get('Rainfall')
            })
        
        return weather_list
    
    def _get_track_status(self, session) -> List[Dict]:
        """Extract track status information"""
        if not hasattr(session, 'track_status') or session.track_status.empty:
            return []
        
        status_list = []
        for _, status in session.track_status.iterrows():
            status_list.append({
                'time': status['Time'].total_seconds() if pd.notna(status['Time']) else None,
                'status': status.get('Status'),
                'message': status.get('Message', '')
            })
        
        return status_list
    
    def _get_race_control_messages(self, session) -> List[Dict]:
        """Extract race control messages"""
        if not hasattr(session, 'race_control_messages') or session.race_control_messages.empty:
            return []
        
        messages_list = []
        for _, message in session.race_control_messages.iterrows():
            messages_list.append({
                'time': message['Time'].isoformat() if pd.notna(message['Time']) else None,
                'category': message.get('Category', ''),
                'message': message.get('Message', ''),
                'status': message.get('Status', ''),
                'flag': message.get('Flag', ''),
                'scope': message.get('Scope', '')
            })
        
        return messages_list
    
    def _get_circuit_info(self, session) -> Dict:
        """Extract circuit information"""
        try:
            circuit_info = session.get_circuit_info()
            if circuit_info is None:
                return {}
            
            return {
                'corners': circuit_info.corners.to_dict('records') if hasattr(circuit_info, 'corners') else [],
                'marshal_lights': circuit_info.marshal_lights.to_dict('records') if hasattr(circuit_info, 'marshal_lights') else [],
                'marshal_sectors': circuit_info.marshal_sectors.to_dict('records') if hasattr(circuit_info, 'marshal_sectors') else [],
                'rotation': getattr(circuit_info, 'rotation', 0)
            }
        except Exception as e:
            print(f"Error getting circuit info: {e}")
            return {}