import fastf1
import pandas as pd
import numpy as np
from datetime import datetime
import json
import os
from typing import Dict, List, Optional, Union, Tuple
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
# Add this helper function near the top of data_collector.py
def _td_to_seconds(td):
    """Safely convert a pandas Timedelta to seconds, handling NaT."""
    if pd.isna(td):
        return None
    return td.total_seconds()
# Suppress warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)

# Configure FastF1
fastf1.Cache.enable_cache('cache')

class F1DataCollector:
    def __init__(self, cache_dir: str = 'cache'):
        """
        Initialize the F1 Data Collector
        
        Args:
            cache_dir: Directory for caching FastF1 data
        """
        self.logger = logging.getLogger(__name__)
        self.cache_dir = cache_dir
        
        # Enable FastF1 cache
        os.makedirs(cache_dir, exist_ok=True)
        fastf1.Cache.enable_cache(cache_dir)
        
        # Configure plotting
        # Fixed code
        try:
            from fastf1 import plotting
            plotting.setup_mpl()
        except (ImportError, AttributeError):
            # Plotting module not available or changed in this version
            pass
    
           
    def get_available_years(self) -> List[int]:
        """Get all available years of F1 data including current year"""
        current_year = datetime.now().year
        # FastF1 has data from 2018 onwards
        return list(range(2018, current_year + 1))
    
    def get_event_schedule(self, year: int, include_testing: bool = False) -> pd.DataFrame:
        """
        Get the event schedule for a specific year
        
        Args:
            year: Year to fetch schedule for
            include_testing: Include testing sessions
            
        Returns:
            DataFrame with event schedule, returned directly from fastf1.
        """
        try:
            # Get the schedule and return it directly. The API layer will format it.
            schedule = fastf1.get_event_schedule(year, include_testing=include_testing)
            return schedule
        except Exception as e:
            self.logger.error(f"Error fetching schedule for {year}: {e}")
            return pd.DataFrame()
    
    def get_event(self, year: int, gp: Union[str, int]) -> fastf1.events.Event:
        """
        Get a specific event
        
        Args:
            year: Year of the event
            gp: Grand Prix name or round number
            
        Returns:
            Event object
        """
        try:
            return fastf1.get_event(year, gp)
        except Exception as e:
            self.logger.error(f"Error fetching event {year} {gp}: {e}")
            return None
    
    def get_session(self, year: int, gp: Union[str, int], 
                   session: str = 'Race', load_laps: bool = True,
                   load_telemetry: bool = True) -> fastf1.core.Session:
        """
        Get session data for a specific Grand Prix
        
        Args:
            year: Year of the session
            gp: Grand Prix name or round number
            session: Session type (FP1, FP2, FP3, Q, S, R)
            load_laps: Load lap data
            load_telemetry: Load telemetry data
            
        Returns:
            Session object with loaded data
        """
        try:
            session_obj = fastf1.get_session(year, gp, session)
            session_obj.load(laps=load_laps, telemetry=load_telemetry)
            return session_obj
        except Exception as e:
            self.logger.error(f"Error loading session {year} {gp} {session}: {e}")
            return None
    
    # In data_collector.py, inside the F1DataCollector class

    def get_all_driver_data(self, session: fastf1.core.Session) -> Dict[str, Dict]:
        """
        Get comprehensive data for all drivers in a session, ensuring all data types
        (Timedelta, NaT, NaN) are converted to be JSON serializable.
        """
        if not session or session.results is None:
            return {}

        drivers_data = {}
        results = session.results.copy()
        
        # Replace all pandas NaN values with None, which serializes to null in JSON
        results.replace({np.nan: None}, inplace=True)

        for _, row in results.iterrows():
            driver_number = str(row['DriverNumber'])

            try:
                driver_laps = session.laps.pick_driver(driver_number)
                
                lap_data = []
                if not driver_laps.empty:
                    # Make a copy and replace NaN before iterating
                    laps_copy = driver_laps.copy().replace({np.nan: None})
                    for _, lap in laps_copy.iterrows():
                        lap_info = {
                            'LapNumber': lap.get('LapNumber'),
                            'LapTime': _td_to_seconds(lap.get('LapTime')),
                            'Sector1Time': _td_to_seconds(lap.get('Sector1Time')),
                            'Sector2Time': _td_to_seconds(lap.get('Sector2Time')),
                            'Sector3Time': _td_to_seconds(lap.get('Sector3Time')),
                            'SpeedI1': lap.get('SpeedI1'),
                            'SpeedI2': lap.get('SpeedI2'),
                            'SpeedFL': lap.get('SpeedFL'),
                            'SpeedST': lap.get('SpeedST'),
                            'Compound': lap.get('Compound'),
                            'TyreLife': lap.get('TyreLife'),
                            'FreshTyre': lap.get('FreshTyre'),
                            'LapStartTime': _td_to_seconds(lap.get('LapStartTime')),
                            'PitInTime': _td_to_seconds(lap.get('PitInTime')),
                            'PitOutTime': _td_to_seconds(lap.get('PitOutTime')),
                            'IsPersonalBest': lap.get('IsPersonalBest'),
                            'IsAccurate': lap.get('IsAccurate'),
                        }
                        lap_data.append(lap_info)

                drivers_data[driver_number] = {
                    'DriverNumber': driver_number,
                    'BroadcastName': row.get('BroadcastName'),
                    'Abbreviation': row.get('Abbreviation'),
                    'FullName': row.get('FullName'),
                    'TeamName': row.get('TeamName'),
                    'TeamColor': row.get('TeamColor'),
                    'Position': row.get('Position'),
                    'GridPosition': row.get('GridPosition'),
                    'Q1': _td_to_seconds(row.get('Q1')),
                    'Q2': _td_to_seconds(row.get('Q2')),
                    'Q3': _td_to_seconds(row.get('Q3')),
                    'Time': _td_to_seconds(row.get('Time')),
                    'Status': row.get('Status'),
                    'Points': row.get('Points'),
                    'Laps': lap_data,
                    'TotalLaps': len(lap_data),
                    'FastestLap': min([l['LapTime'] for l in lap_data if l['LapTime'] is not None], default=None)
                }
            except Exception as e:
                self.logger.error(f"Error processing driver {driver_number}: {e}")

        return drivers_data
    
    def get_telemetry_data(self, session: fastf1.core.Session, 
                          driver: Union[str, int], 
                          lap: int = None) -> pd.DataFrame:
        """
        Get telemetry data for a specific driver
        
        Args:
            session: Loaded session object
            driver: Driver number or abbreviation
            lap: Specific lap number (None for all laps)
            
        Returns:
            DataFrame with telemetry data
        """
        try:
            driver_laps = session.laps.pick_driver(driver)
            
            if driver_laps.empty:
                return pd.DataFrame()
            
            if lap is not None:
                # Get specific lap
                lap_data = driver_laps[driver_laps['LapNumber'] == lap]
                if not lap_data.empty:
                    return lap_data.iloc[0].get_telemetry()
            else:
                # Get telemetry for fastest lap
                fastest_lap = driver_laps.pick_fastest()
                if fastest_lap is not None:
                    return fastest_lap.get_telemetry()
                    
            return pd.DataFrame()
            
        except Exception as e:
            self.logger.error(f"Error getting telemetry for driver {driver}: {e}")
            return pd.DataFrame()
    
    def get_car_data(self, session: fastf1.core.Session, 
                     driver: Union[str, int]) -> pd.DataFrame:
        """
        Get car data for a specific driver
        
        Args:
            session: Loaded session object
            driver: Driver number or abbreviation
            
        Returns:
            DataFrame with car data
        """
        try:
            car_data = session.car_data[driver]
            return car_data
        except Exception as e:
            self.logger.error(f"Error getting car data for driver {driver}: {e}")
            return pd.DataFrame()
    
    def get_position_data(self, session: fastf1.core.Session) -> pd.DataFrame:
        """
        Get position data for all drivers throughout the session
        
        Args:
            session: Loaded session object
            
        Returns:
            DataFrame with position data
        """
        try:
            return session.pos_data
        except Exception as e:
            self.logger.error(f"Error getting position data: {e}")
            return pd.DataFrame()
    
    def get_track_status(self, session: fastf1.core.Session) -> pd.DataFrame:
        """
        Get track status information (flags, safety car, etc.)
        
        Args:
            session: Loaded session object
            
        Returns:
            DataFrame with track status
        """
        try:
            return session.track_status
        except Exception as e:
            self.logger.error(f"Error getting track status: {e}")
            return pd.DataFrame()
    
    def get_session_status(self, session: fastf1.core.Session) -> pd.DataFrame:
        """
        Get session status information
        
        Args:
            session: Loaded session object
            
        Returns:
            DataFrame with session status
        """
        try:
            return session.session_status
        except Exception as e:
            self.logger.error(f"Error getting session status: {e}")
            return pd.DataFrame()
    
    def get_race_control_messages(self, session: fastf1.core.Session) -> pd.DataFrame:
        """
        Get race control messages
        
        Args:
            session: Loaded session object
            
        Returns:
            DataFrame with race control messages
        """
        try:
            return session.race_control_messages
        except Exception as e:
            self.logger.error(f"Error getting race control messages: {e}")
            return pd.DataFrame()
    
    def get_circuit_info(self, session: fastf1.core.Session) -> Dict:
        """
        Get circuit information including corners and sectors
        
        Args:
            session: Loaded session object
            
        Returns:
            Dictionary with circuit information
        """
        try:
            circuit_info = session.get_circuit_info()
            
            if circuit_info is None:
                return {}
            
            return {
                'corners': circuit_info.corners.to_dict('records') if hasattr(circuit_info, 'corners') else [],
                'marshal_lights': circuit_info.marshal_lights.to_dict('records') if hasattr(circuit_info, 'marshal_lights') else [],
                'marshal_sectors': circuit_info.marshal_sectors.to_dict('records') if hasattr(circuit_info, 'marshal_sectors') else [],
                'rotation': circuit_info.rotation if hasattr(circuit_info, 'rotation') else 0
            }
        except Exception as e:
            self.logger.error(f"Error getting circuit info: {e}")
            return {}
    
    def compare_driver_laps(self, session: fastf1.core.Session, 
                           driver1: Union[str, int], 
                           driver2: Union[str, int], 
                           lap_number: int = None) -> Dict:
        """
        Compare lap data between two drivers
        
        Args:
            session: Loaded session object
            driver1: First driver number or abbreviation
            driver2: Second driver number or abbreviation
            lap_number: Specific lap to compare (None for fastest laps)
            
        Returns:
            Dictionary with comparison data
        """
        try:
            driver1_laps = session.laps.pick_driver(driver1)
            driver2_laps = session.laps.pick_driver(driver2)
            
            if driver1_laps.empty or driver2_laps.empty:
                return {}
            
            if lap_number is not None:
                # Compare specific lap
                lap1 = driver1_laps[driver1_laps['LapNumber'] == lap_number]
                lap2 = driver2_laps[driver2_laps['LapNumber'] == lap_number]
                
                if lap1.empty or lap2.empty:
                    return {}
                    
                lap1 = lap1.iloc[0]
                lap2 = lap2.iloc[0]
            else:
                # Compare fastest laps
                lap1 = driver1_laps.pick_fastest()
                lap2 = driver2_laps.pick_fastest()
                
                if lap1 is None or lap2 is None:
                    return {}
            
            # Get telemetry for comparison
            tel1 = lap1.get_telemetry()
            tel2 = lap2.get_telemetry()
            
            # Calculate delta
            delta_time, ref_tel, comp_tel = fastf1.utils.delta_time(lap1, lap2)
            
            return {
                'driver1': {
                    'number': driver1,
                    'lap_time': lap1['LapTime'].total_seconds() if pd.notna(lap1['LapTime']) else None,
                    'telemetry': tel1.to_dict('records') if not tel1.empty else []
                },
                'driver2': {
                    'number': driver2,
                    'lap_time': lap2['LapTime'].total_seconds() if pd.notna(lap2['LapTime']) else None,
                    'telemetry': tel2.to_dict('records') if not tel2.empty else []
                },
                'delta': {
                    'time_diff': delta_time,
                    'reference_telemetry': ref_tel.to_dict('records') if ref_tel is not None else [],
                    'compare_telemetry': comp_tel.to_dict('records') if comp_tel is not None else []
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error comparing drivers {driver1} and {driver2}: {e}")
            return {}
    
    def get_weather_data(self, session: fastf1.core.Session) -> pd.DataFrame:
        """
        Get weather data for the session
        
        Args:
            session: Loaded session object
            
        Returns:
            DataFrame with weather data
        """
        try:
            return session.weather_data
        except Exception as e:
            self.logger.error(f"Error getting weather data: {e}")
            return pd.DataFrame()
    
    def get_tyre_data(self, session: fastf1.core.Session) -> Dict:
        """
        Get comprehensive tyre data for all drivers
        
        Args:
            session: Loaded session object
            
        Returns:
            Dictionary with tyre data
        """
        try:
            tyre_data = {}
            
            for driver in session.drivers:
                driver_laps = session.laps.pick_driver(driver)
                
                if driver_laps.empty:
                    continue
                
                # Group by stint
                stints = []
                current_stint = []
                last_compound = None
                
                for idx, lap in driver_laps.iterrows():
                    if lap['Compound'] != last_compound and last_compound is not None:
                        if current_stint:
                            stints.append({
                                'compound': last_compound,
                                'laps': current_stint,
                                'total_laps': len(current_stint),
                                'average_time': np.mean([l['LapTime'].total_seconds() 
                                                       for l in current_stint 
                                                       if pd.notna(l['LapTime'])])
                            })
                        current_stint = []
                    
                    current_stint.append({
                        'lap_number': lap['LapNumber'],
                        'lap_time': lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None,
                        'tyre_life': lap['TyreLife'],
                        'fresh_tyre': lap['FreshTyre']
                    })
                    last_compound = lap['Compound']
                
                # Add last stint
                if current_stint and last_compound:
                    stints.append({
                        'compound': last_compound,
                        'laps': current_stint,
                        'total_laps': len(current_stint),
                        'average_time': np.mean([l['lap_time'] 
                                               for l in current_stint 
                                               if l['lap_time'] is not None])
                    })
                
                tyre_data[driver] = stints
                
            return tyre_data
            
        except Exception as e:
            self.logger.error(f"Error getting tyre data: {e}")
            return {}
    
    def get_driver_performance_summary(self, session: fastf1.core.Session, 
                                     driver: Union[str, int]) -> Dict:
        """
        Get comprehensive performance summary for a driver
        
        Args:
            session: Loaded session object
            driver: Driver number or abbreviation
            
        Returns:
            Dictionary with performance summary
        """
        try:
            driver_laps = session.laps.pick_driver(driver)
            
            if driver_laps.empty:
                return {}
            
            # Calculate statistics
            lap_times = [lap['LapTime'].total_seconds() 
                        for _, lap in driver_laps.iterrows() 
                        if pd.notna(lap['LapTime'])]
            
            sector1_times = [lap['Sector1Time'].total_seconds() 
                           for _, lap in driver_laps.iterrows() 
                           if pd.notna(lap['Sector1Time'])]
            
            sector2_times = [lap['Sector2Time'].total_seconds() 
                           for _, lap in driver_laps.iterrows() 
                           if pd.notna(lap['Sector2Time'])]
            
            sector3_times = [lap['Sector3Time'].total_seconds() 
                           for _, lap in driver_laps.iterrows() 
                           if pd.notna(lap['Sector3Time'])]
            
            # Get driver info
            driver_info = session.get_driver(driver)
            
            return {
                'driver_info': {
                    'number': driver,
                    'name': driver_info['FullName'] if driver_info else f"Driver {driver}",
                    'team': driver_info['TeamName'] if driver_info else "Unknown",
                    'abbreviation': driver_info['Abbreviation'] if driver_info else str(driver)
                },
                'lap_times': {
                    'fastest': min(lap_times) if lap_times else None,
                    'average': np.mean(lap_times) if lap_times else None,
                    'std_dev': np.std(lap_times) if lap_times else None,
                    'consistency': (np.std(lap_times) / np.mean(lap_times) * 100) if lap_times else None
                },
                'sector_times': {
                    'sector1': {
                        'fastest': min(sector1_times) if sector1_times else None,
                        'average': np.mean(sector1_times) if sector1_times else None
                    },
                    'sector2': {
                        'fastest': min(sector2_times) if sector2_times else None,
                        'average': np.mean(sector2_times) if sector2_times else None
                    },
                    'sector3': {
                        'fastest': min(sector3_times) if sector3_times else None,
                        'average': np.mean(sector3_times) if sector3_times else None
                    }
                },
                                'speed_trap': {
                    'max_speed': driver_laps['SpeedST'].max(),
                    'avg_speed': driver_laps['SpeedST'].mean()
                },
                'total_laps': len(driver_laps),
                'pit_stops': len(driver_laps[driver_laps['PitOutTime'].notna()])
            }
            
        except Exception as e:
            self.logger.error(f"Error getting driver performance summary: {e}")
            return {}
    
    def get_live_timing_data(self, session_key: str) -> Dict:
        """
        Get live timing data using FastF1's live timing client
        
        Args:
            session_key: Session key for live timing
            
        Returns:
            Dictionary with live timing data
        """
        try:
            from fastf1.livetiming import SignalRClient
            
            client = SignalRClient(session_key)
            data = client.get_data()
            return data
            
        except Exception as e:
            self.logger.error(f"Error getting live timing data: {e}")
            return {}
    
    def get_session_data_json(self, year: int, gp: Union[str, int],
                              session: str = 'Race') -> Dict:
        """
        Get all session data in a fully JSON-serializable format.
        """
        try:
            session_obj = self.get_session(year, gp, session)
            if not session_obj:
                return {}

            drivers_data = self.get_all_driver_data(session_obj)

            # --- Process all dataframes to ensure they are JSON serializable ---

            # 1. Process session_results
            session_results_data = []
            if hasattr(session_obj, 'results') and not session_obj.results.empty:
                results_df = session_obj.results.copy()
                timedelta_cols = [c for c in ['Q1', 'Q2', 'Q3', 'Time', 'Interval', 'GapToLeader'] if c in results_df.columns]
                for col in timedelta_cols:
                    results_df[col] = results_df[col].apply(_td_to_seconds)
                # Replace any remaining NaN values with None
                session_results_data = results_df.replace({np.nan: None}).to_dict('records')

            # 2. Process weather_data
            weather_data = []
            if hasattr(session_obj, 'weather_data') and not session_obj.weather_data.empty:
                weather_df = session_obj.weather_data.copy()
                if 'Time' in weather_df.columns:
                    weather_df['Time'] = weather_df['Time'].apply(_td_to_seconds)
                weather_data = weather_df.replace({np.nan: None}).to_dict('records')

            # 3. Process track_status
            track_status = []
            if hasattr(session_obj, 'track_status') and not session_obj.track_status.empty:
                track_df = session_obj.track_status.copy()
                if 'Time' in track_df.columns:
                    track_df['Time'] = track_df['Time'].apply(_td_to_seconds)
                track_status = track_df.replace({np.nan: None}).to_dict('records')
            
            # 4. Process race_control_messages
            race_messages = []
            if hasattr(session_obj, 'race_control_messages') and not session_obj.race_control_messages.empty:
                messages_df = session_obj.race_control_messages.copy()
                if 'Time' in messages_df.columns:
                    messages_df['Time'] = messages_df['Time'].apply(lambda x: x.isoformat() if pd.notna(x) else None)
                race_messages = messages_df.replace({np.nan: None}).to_dict('records')

            # 5. Process session_status
            session_status = []
            if hasattr(session_obj, 'session_status') and not session_obj.session_status.empty:
                status_df = session_obj.session_status.copy()
                if 'Time' in status_df.columns:
                    status_df['Time'] = status_df['Time'].apply(_td_to_seconds)
                session_status = status_df.replace({np.nan: None}).to_dict('records')

            circuit_info = self.get_circuit_info(session_obj)

            return {
                'session_info': {
                    'year': year,
                    'grand_prix': session_obj.event['EventName'],
                    'country': session_obj.event['Country'],
                    'location': session_obj.event['Location'],
                    'session_type': session,
                    'date': session_obj.date.isoformat() if session_obj.date and pd.notna(session_obj.date) else None,
                    'status': session_status
                },
                'drivers': drivers_data,
                'circuit': circuit_info,
                'weather': weather_data,
                'track_status': track_status,
                'race_control_messages': race_messages,
                'session_results': session_results_data
            }

        except Exception as e:
            self.logger.error(f"Error getting session data: {e}")
            return {}
    
    def get_strategy_analysis(self, session: fastf1.core.Session) -> Dict:
        """
        Analyze pit stop strategies for all drivers using accurate stint information.
        """
        try:
            strategies = {}
            # Ensure laps data is available
            if session.laps is None or session.laps.empty:
                self.logger.warning("Laps data is not available for strategy analysis.")
                return {}
            
            # We need StintNumber to be present to group laps correctly
            laps = session.laps.dropna(subset=['StintNumber'])
            
            for driver_number in session.drivers:
                driver_laps = laps[laps['DriverNumber'] == str(driver_number)]
                if driver_laps.empty:
                    continue
                
                driver_info = session.get_driver(driver_number)
                stints_data = []
                
                # Group by StintNumber for accurate analysis
                for stint_num, stint_laps in driver_laps.groupby('StintNumber'):
                    stint_laps_with_time = stint_laps.dropna(subset=['LapTime'])
                    if stint_laps_with_time.empty:
                        continue

                    stint_info = {
                        'stint_number': int(stint_num),
                        'compound': stint_laps_with_time['Compound'].iloc[0],
                        'start_lap': int(stint_laps_with_time['LapNumber'].min()),
                        'end_lap': int(stint_laps_with_time['LapNumber'].max()),
                        'stint_length': len(stint_laps_with_time),
                        'average_lap_time': stint_laps_with_time['LapTime'].mean().total_seconds()
                    }
                    stints_data.append(stint_info)
                
                if stints_data:
                    strategies[driver_number] = {
                        'driver_name': driver_info['FullName'] if driver_info else f"Driver {driver_number}",
                        'abbreviation': driver_info['Abbreviation'] if driver_info else str(driver_number),
                        'team_color': driver_info['TeamColor'] if driver_info else '#000000',
                        'total_pit_stops': len(stints_data) - 1,
                        'stints': stints_data
                    }
            
            return strategies
        except Exception as e:
            self.logger.error(f"Error analyzing strategies: {e}")
            return {}
    
    def get_lap_time_evolution(self, session: fastf1.core.Session) -> Dict:
        """
        Get lap time evolution for all drivers throughout the session
        
        Args:
            session: Loaded session object
            
        Returns:
            Dictionary with lap time evolution data
        """
        try:
            evolution_data = {}
            
            for driver in session.drivers:
                driver_laps = session.laps.pick_driver(driver)
                
                if driver_laps.empty:
                    continue
                
                lap_times = []
                for _, lap in driver_laps.iterrows():
                    if pd.notna(lap['LapTime']):
                        lap_times.append({
                            'lap': lap['LapNumber'],
                            'time': lap['LapTime'].total_seconds(),
                            'compound': lap['Compound'],
                            'tyre_life': lap['TyreLife']
                        })
                
                driver_info = session.get_driver(driver)
                evolution_data[driver] = {
                    'driver_name': driver_info['FullName'] if driver_info else f"Driver {driver}",
                    'abbreviation': driver_info['Abbreviation'] if driver_info else str(driver),
                    'team_color': driver_info['TeamColor'] if driver_info else '#000000',
                    'lap_times': lap_times
                }
            
            return evolution_data
            
        except Exception as e:
            self.logger.error(f"Error getting lap time evolution: {e}")
            return {}
    
    def get_speed_analysis(self, session: fastf1.core.Session, 
                          driver: Union[str, int]) -> Dict:
        """
        Get detailed speed analysis for a driver
        
        Args:
            session: Loaded session object
            driver: Driver number or abbreviation
            
        Returns:
            Dictionary with speed analysis
        """
        try:
            driver_laps = session.laps.pick_driver(driver)
            
            if driver_laps.empty:
                return {}
            
            # Get fastest lap for detailed analysis
            fastest_lap = driver_laps.pick_fastest()
            
            if fastest_lap is None:
                return {}
            
            telemetry = fastest_lap.get_telemetry()
            
            if telemetry.empty:
                return {}
            
            # Speed zones analysis
            speed_zones = {
                'below_100': len(telemetry[telemetry['Speed'] < 100]),
                '100_150': len(telemetry[(telemetry['Speed'] >= 100) & (telemetry['Speed'] < 150)]),
                '150_200': len(telemetry[(telemetry['Speed'] >= 150) & (telemetry['Speed'] < 200)]),
                '200_250': len(telemetry[(telemetry['Speed'] >= 200) & (telemetry['Speed'] < 250)]),
                '250_300': len(telemetry[(telemetry['Speed'] >= 250) & (telemetry['Speed'] < 300)]),
                'above_300': len(telemetry[telemetry['Speed'] >= 300])
            }
            
            # Calculate percentages
            total_points = len(telemetry)
            speed_zones_pct = {k: (v/total_points)*100 for k, v in speed_zones.items()}
            
            return {
                'driver': driver,
                'lap_number': fastest_lap['LapNumber'],
                'lap_time': fastest_lap['LapTime'].total_seconds() if pd.notna(fastest_lap['LapTime']) else None,
                'max_speed': telemetry['Speed'].max(),
                'min_speed': telemetry['Speed'].min(),
                'avg_speed': telemetry['Speed'].mean(),
                'speed_zones': speed_zones,
                'speed_zones_percentage': speed_zones_pct,
                'speed_trap': {
                    'speed_i1': fastest_lap['SpeedI1'],
                    'speed_i2': fastest_lap['SpeedI2'],
                    'speed_fl': fastest_lap['SpeedFL'],
                    'speed_st': fastest_lap['SpeedST']
                },
                'gear_usage': {
                    f'gear_{i}': len(telemetry[telemetry['nGear'] == i]) for i in range(1, 9)
                },
                'throttle_stats': {
                    'full_throttle_pct': (len(telemetry[telemetry['Throttle'] > 99]) / total_points) * 100 if 'Throttle' in telemetry.columns else None,
                    'avg_throttle': telemetry['Throttle'].mean() if 'Throttle' in telemetry.columns else None
                },
                'brake_stats': {
                    'brake_points': len(telemetry[telemetry['Brake'] > 0]) if 'Brake' in telemetry.columns else None,
                    'heavy_brake_pct': (len(telemetry[telemetry['Brake'] > 50]) / total_points) * 100 if 'Brake' in telemetry.columns else None
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing speed for driver {driver}: {e}")
            return {}
    
    def get_overtaking_analysis(self, session: fastf1.core.Session) -> List[Dict]:
        """
        Analyze overtaking events during the session
        
        Args:
            session: Loaded session object
            
        Returns:
            List of overtaking events
        """
        try:
            overtakes = []
            
            # Get position data for all drivers
            for lap in range(1, session.laps['LapNumber'].max() + 1):
                lap_data = session.laps[session.laps['LapNumber'] == lap]
                
                if lap > 1:
                    prev_lap_data = session.laps[session.laps['LapNumber'] == lap - 1]
                    
                    for driver in session.drivers:
                        current_pos = lap_data[lap_data['DriverNumber'] == driver]['Position'].values
                        prev_pos = prev_lap_data[prev_lap_data['DriverNumber'] == driver]['Position'].values
                        
                        if len(current_pos) > 0 and len(prev_pos) > 0:
                            if current_pos[0] < prev_pos[0]:
                                # Driver improved position
                                driver_info = session.get_driver(driver)
                                overtakes.append({
                                    'lap': lap,
                                    'driver': driver,
                                    'driver_name': driver_info['FullName'] if driver_info else f"Driver {driver}",
                                    'position_before': int(prev_pos[0]),
                                    'position_after': int(current_pos[0]),
                                    'positions_gained': int(prev_pos[0] - current_pos[0])
                                })
            
            return overtakes
            
        except Exception as e:
            self.logger.error(f"Error analyzing overtakes: {e}")
            return []
    
    def get_qualifying_comparison(self, session: fastf1.core.Session) -> Dict:
        """
        Get qualifying session comparison data
        
        Args:
            session: Loaded qualifying session
            
        Returns:
            Dictionary with qualifying comparison
        """
        try:
            if session.name not in ['Q', 'Qualifying']:
                self.logger.warning("This method is designed for qualifying sessions")
                return {}
            
            qualifying_data = {}
            results = session.results
            
            # Get pole time for comparison
            pole_time = None
            if not results.empty and pd.notna(results.iloc[0]['Q3']):
                pole_time = results.iloc[0]['Q3'].total_seconds()
            
            for _, driver_result in results.iterrows():
                driver = driver_result['DriverNumber']
                
                # Get best times from each session
                q1_time = driver_result['Q1'].total_seconds() if pd.notna(driver_result['Q1']) else None
                q2_time = driver_result['Q2'].total_seconds() if pd.notna(driver_result['Q2']) else None
                q3_time = driver_result['Q3'].total_seconds() if pd.notna(driver_result['Q3']) else None
                
                best_time = next((t for t in [q3_time, q2_time, q1_time] if t is not None), None)
                
                qualifying_data[driver] = {
                    'driver_name': driver_result['FullName'],
                    'team': driver_result['TeamName'],
                    'position': driver_result['Position'],
                    'q1_time': q1_time,
                    'q2_time': q2_time,
                    'q3_time': q3_time,
                    'best_time': best_time,
                    'gap_to_pole': (best_time - pole_time) if best_time and pole_time else None,
                    'eliminated_in': 'Q1' if q2_time is None else ('Q2' if q3_time is None else 'Q3')
                }
            
            return qualifying_data
            
        except Exception as e:
            self.logger.error(f"Error analyzing qualifying: {e}")
            return {}
    
    def get_fuel_corrected_pace(self, session: fastf1.core.Session, 
                               fuel_effect: float = 0.03) -> Dict:
        """
        Calculate fuel-corrected pace for all drivers
        
        Args:
            session: Loaded session object
            fuel_effect: Seconds per lap per kg of fuel (default 0.03)
            
        Returns:
            Dictionary with fuel-corrected pace
        """
        try:
            if session.name not in ['R', 'Race']:
                self.logger.warning("Fuel correction is most relevant for race sessions")
            
            pace_data = {}
            total_laps = session.laps['LapNumber'].max()
            
            for driver in session.drivers:
                driver_laps = session.laps.pick_driver(driver)
                
                if driver_laps.empty:
                    continue
                
                corrected_times = []
                
                for _, lap in driver_laps.iterrows():
                    if pd.notna(lap['LapTime']):
                        # Estimate fuel load (linear decrease)
                        fuel_factor = (total_laps - lap['LapNumber']) / total_laps
                        fuel_correction = fuel_factor * fuel_effect * 110  # ~110kg starting fuel
                        
                        corrected_time = lap['LapTime'].total_seconds() - fuel_correction
                        corrected_times.append({
                            'lap': lap['LapNumber'],
                            'actual_time': lap['LapTime'].total_seconds(),
                            'corrected_time': corrected_time,
                            'fuel_correction': fuel_correction,
                            'compound': lap['Compound']
                        })
                
                if corrected_times:
                    driver_info = session.get_driver(driver)
                    pace_data[driver] = {
                        'driver_name': driver_info['FullName'] if driver_info else f"Driver {driver}",
                        'team': driver_info['TeamName'] if driver_info else "Unknown",
                        'average_actual_pace': np.mean([t['actual_time'] for t in corrected_times]),
                        'average_corrected_pace': np.mean([t['corrected_time'] for t in corrected_times]),
                        'best_actual_time': min([t['actual_time'] for t in corrected_times]),
                        'best_corrected_time': min([t['corrected_time'] for t in corrected_times]),
                        'lap_times': corrected_times
                    }
            
            return pace_data
            
        except Exception as e:
            self.logger.error(f"Error calculating fuel-corrected pace: {e}")
            return {}
    
    def export_session_to_json(self, session_data: Dict, filename: str):
        """
        Export session data to JSON file
        
        Args:
            session_data: Dictionary with session data
            filename: Output filename
        """
        try:
            # Convert any remaining pandas timestamps to strings
            def convert_timestamps(obj):
                if isinstance(obj, pd.Timestamp):
                    return obj.isoformat()
                elif isinstance(obj, pd.Timedelta):
                    return obj.total_seconds()
                elif isinstance(obj, dict):
                    return {k: convert_timestamps(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_timestamps(i) for i in obj]
                return obj
            
            cleaned_data = convert_timestamps(session_data)
            
            with open(filename, 'w') as f:
                json.dump(cleaned_data, f, indent=2, default=str)
                
            self.logger.info(f"Session data exported to {filename}")
            
        except Exception as e:
            self.logger.error(f"Error exporting to JSON: {e}")
    
    def get_team_comparison(self, session: fastf1.core.Session) -> Dict:
        """
        Compare performance between teams
        
        Args:
            session: Loaded session object
            
        Returns:
            Dictionary with team comparison data
        """
        try:
            team_data = {}
            results = session.results
            
            # Group by team
            for team in results['TeamName'].unique():
                team_drivers = results[results['TeamName'] == team]
                
                team_laps = []
                for _, driver in team_drivers.iterrows():
                    driver_laps = session.laps.pick_driver(driver['DriverNumber'])
                    team_laps.extend([lap['LapTime'].total_seconds() 
                                    for _, lap in driver_laps.iterrows() 
                                    if pd.notna(lap['LapTime'])])
                
                if team_laps:
                    team_data[team] = {
                        'drivers': team_drivers[['DriverNumber', 'Abbreviation', 'FullName']].to_dict('records'),
                        'average_lap_time': np.mean(team_laps),
                        'best_lap_time': min(team_laps),
                        'total_laps': len(team_laps),
                        'consistency': np.std(team_laps),
                        'points': team_drivers['Points'].sum() if 'Points' in team_drivers.columns else 0
                    }
            
            return team_data
            
        except Exception as e:
            self.logger.error(f"Error comparing teams: {e}")
            return {}
    
    def get_degradation_analysis(self, session: fastf1.core.Session,
                             driver: Union[str, int]) -> Dict:
        """
        Analyze tyre degradation for a driver based on accurate stints.
        """
        try:
            if session.laps is None or session.laps.empty:
                return {}
                
            driver_laps = session.laps.pick_driver(driver).dropna(subset=['StintNumber', 'LapTime', 'Compound'])
            if driver_laps.empty:
                return {}
                
            degradation_data = {}
            
            # Group by stint number
            for stint_num, stint_laps in driver_laps.groupby('StintNumber'):
                # Need at least 4 laps for a meaningful trend line
                if len(stint_laps) < 4:
                    continue
                
                lap_times_sec = stint_laps['LapTime'].dt.total_seconds().values
                
                # Simple outlier removal (e.g., laps 105% slower than the median)
                median_time = np.median(lap_times_sec)
                valid_indices = lap_times_sec < (median_time * 1.05)
                
                if np.sum(valid_indices) < 4: # Check again after filtering
                    continue

                laps_in_stint = np.arange(len(lap_times_sec))[valid_indices]
                valid_lap_times = lap_times_sec[valid_indices]
                
                slope, intercept = np.polyfit(laps_in_stint, valid_lap_times, 1)

                stint_id = f"stint_{int(stint_num)}"
                degradation_data[stint_id] = {
                    'compound': stint_laps['Compound'].iloc[0],
                    'start_lap': int(stint_laps['LapNumber'].min()),
                    'stint_length': len(valid_lap_times),
                    'starting_pace': intercept,
                    'degradation_per_lap': slope,
                    'lap_times': valid_lap_times.tolist()
                }
                
            return degradation_data
            
        except Exception as e:
            self.logger.error(f"Error analyzing degradation for driver {driver}: {e}")
            return {}
    
    def get_drs_analysis(self, session: fastf1.core.Session, 
                        driver: Union[str, int]) -> Dict:
        """
        Analyze DRS usage and effectiveness
        
        Args:
            session: Loaded session object
            driver: Driver number or abbreviation
            
        Returns:
            Dictionary with DRS analysis
        """
        try:
            driver_laps = session.laps.pick_driver(driver)
            
            if driver_laps.empty:
                return {}
            
            drs_data = []
            
            for _, lap in driver_laps.iterrows():
                telemetry = lap.get_telemetry()
                
                if telemetry.empty or 'DRS' not in telemetry.columns:
                    continue
                
                # Find DRS activation zones
                drs_zones = []
                drs_active = False
                zone_start = None
                
                for idx, row in telemetry.iterrows():
                    if row['DRS'] > 0 and not drs_active:
                        drs_active = True
                        zone_start = idx
                    elif row['DRS'] == 0 and drs_active:
                        drs_active = False
                        if zone_start is not None:
                            zone_data = telemetry.iloc[zone_start:idx]
                            drs_zones.append({
                                'start_distance': zone_data.iloc[0]['Distance'],
                                'end_distance': zone_data.iloc[-1]['Distance'],
                                'length': zone_data.iloc[-1]['Distance'] - zone_data.iloc[0]['Distance'],
                                'max_speed': zone_data['Speed'].max(),
                                'speed_gain': zone_data['Speed'].iloc[-1] - zone_data['Speed'].iloc[0]
                            })
                
                if drs_zones:
                    drs_data.append({
                        'lap': lap['LapNumber'],
                        'lap_time': lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None,
                        'drs_zones': drs_zones,
                        'total_drs_distance': sum(z['length'] for z in drs_zones)
                    })
            
            return {
                'driver': driver,
                'drs_usage': drs_data,
                'average_drs_distance': np.mean([d['total_drs_distance'] for d in drs_data]) if drs_data else 0,
                'total_drs_activations': sum(len(d['drs_zones']) for d in drs_data)
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing DRS for driver {driver}: {e}")
            return {}
    
    def get_comprehensive_analysis(self, year: int, gp: Union[str, int], 
                                 session_type: str = 'Race') -> Dict:
        """
        Get comprehensive analysis of a session including all available data
        
        Args:
            year: Year of the session
            gp: Grand Prix name or round number
            session_type: Type of session
            
        Returns:
            Dictionary with comprehensive analysis
        """
        try:
            # Load session
            session = self.get_session(year, gp, session_type)
            
            if not session:
                return {}
            
            self.logger.info(f"Generating comprehensive analysis for {year} {gp} {session_type}")
            
            # Collect all data
            analysis = {
                'session_info': {
                    'year': year,
                    'grand_prix': session.event['EventName'],
                    'country': session.event['Country'],
                    'location': session.event['Location'],
                    'session_type': session_type,
                    'date': session.date.isoformat() if session.date else None,
                    'total_laps': session.laps['LapNumber'].max() if not session.laps.empty else 0
                },
                'drivers': self.get_all_driver_data(session),
                'circuit': self.get_circuit_info(session),
                'weather': session.weather_data.to_dict('records') if hasattr(session, 'weather_data') and not session.weather_data.empty else [],
                'track_status': session.track_status.to_dict('records') if hasattr(session, 'track_status') and not session.track_status.empty else [],
                'race_control_messages': session.race_control_messages.to_dict('records') if hasattr(session, 'race_control_messages') and not session.race_control_messages.empty else [],
                'strategies': self.get_strategy_analysis(session),
                'lap_time_evolution': self.get_lap_time_evolution(session),
                'team_comparison': self.get_team_comparison(session),
                'overtaking': self.get_overtaking_analysis(session) if session_type == 'Race' else [],
                'tyre_data': self.get_tyre_data(session)
            }
            
            # Add qualifying-specific data if applicable
            if session_type in ['Q', 'Qualifying']:
                analysis['qualifying_comparison'] = self.get_qualifying_comparison(session)
            
            # Add race-specific data if applicable
            if session_type in ['R', 'Race']:
                analysis['fuel_corrected_pace'] = self.get_fuel_corrected_pace(session)
            
            return analysis
            
        except Exception as e:
            self.logger.error(f"Error generating comprehensive analysis: {e}")
            return {}
    
    def batch_download_season_data(self, year: int, sessions: List[str] = ['Race']):
        """
        Download and cache all data for a complete season
        
        Args:
            year: Season year
            sessions: List of session types to download
        """
        try:
            schedule = self.get_event_schedule(year)
            
            self.logger.info(f"Downloading {year} season data...")
            
            with ThreadPoolExecutor(max_workers=3) as executor:
                futures = []
                
                for _, event in schedule.iterrows():
                    for session_type in sessions:
                        future = executor.submit(
                            self.get_session,
                            year,
                            event['RoundNumber'],
                            session_type
                        )
                        futures.append((future, event['EventName'], session_type))
                
                # Wait for all downloads to complete
                for future, event_name, session_type in futures:
                    try:
                        result = future.result(timeout=300)  # 5 minute timeout
                        if result:
                            self.logger.info(f"Downloaded {event_name} - {session_type}")
                        else:
                            self.logger.warning(f"Failed to download {event_name} - {session_type}")
                    except Exception as e:
                        self.logger.error(f"Error downloading {event_name} - {session_type}: {e}")
            
            self.logger.info(f"Season {year} download complete")
            
        except Exception as e:
            self.logger.error(f"Error downloading season {year}: {e}")
    
    def get_sector_analysis(self, session: fastf1.core.Session, 
                           driver: Union[str, int]) -> Dict:
        """
        Analyze sector performance for a driver
        
        Args:
            session: Loaded session object
            driver: Driver number or abbreviation
            
        Returns:
            Dictionary with sector analysis
        """
        try:
            driver_laps = session.laps.pick_driver(driver)
            
            if driver_laps.empty:
                return {}
            
            # Get all valid sector times
            sector1_times = []
            sector2_times = []
            sector3_times = []
            
            for _, lap in driver_laps.iterrows():
                if pd.notna(lap['Sector1Time']):
                    sector1_times.append(lap['Sector1Time'].total_seconds())
                if pd.notna(lap['Sector2Time']):
                    sector2_times.append(lap['Sector2Time'].total_seconds())
                if pd.notna(lap['Sector3Time']):
                    sector3_times.append(lap['Sector3Time'].total_seconds())
            
            # Get best sectors from all drivers for comparison
            all_best_s1 = session.laps['Sector1Time'].min().total_seconds() if pd.notna(session.laps['Sector1Time'].min()) else None
            all_best_s2 = session.laps['Sector2Time'].min().total_seconds() if pd.notna(session.laps['Sector2Time'].min()) else None
            all_best_s3 = session.laps['Sector3Time'].min().total_seconds() if pd.notna(session.laps['Sector3Time'].min()) else None
            
            driver_info = session.get_driver(driver)
            
            return {
                'driver': driver,
                'driver_name': driver_info['FullName'] if driver_info else f"Driver {driver}",
                'sector1': {
                    'best': min(sector1_times) if sector1_times else None,
                    'average': np.mean(sector1_times) if sector1_times else None,
                    'consistency': np.std(sector1_times) if sector1_times else None,
                    'gap_to_best': (min(sector1_times) - all_best_s1) if sector1_times and all_best_s1 else None
                },
                'sector2': {
                    'best': min(sector2_times) if sector2_times else None,
                    'average': np.mean(sector2_times) if sector2_times else None,
                    'consistency': np.std(sector2_times) if sector2_times else None,
                    'gap_to_best': (min(sector2_times) - all_best_s2) if sector2_times and all_best_s2 else None
                },
                'sector3': {
                    'best': min(sector3_times) if sector3_times else None,
                    'average': np.mean(sector3_times) if sector3_times else None,
                    'consistency': np.std(sector3_times) if sector3_times else None,
                    'gap_to_best': (min(sector3_times) - all_best_s3) if sector3_times and all_best_s3 else None
                },
                'theoretical_best': (
                    (min(sector1_times) if sector1_times else 0) +
                    (min(sector2_times) if sector2_times else 0) +
                    (min(sector3_times) if sector3_times else 0)
                ) if sector1_times and sector2_times and sector3_times else None
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing sectors for driver {driver}: {e}")
            return {}
    
    def get_mini_sectors_analysis(self, session: fastf1.core.Session, 
                                 driver: Union[str, int], 
                                 lap: int = None) -> Dict:
        """
        Analyze mini sectors (speed trap) data
        
        Args:
            session: Loaded session object
            driver: Driver number or abbreviation
            lap: Specific lap number (None for all laps)
            
        Returns:
            Dictionary with mini sectors analysis
        """
        try:
            driver_laps = session.laps.pick_driver(driver)
            
            if driver_laps.empty:
                return {}
            
            if lap:
                driver_laps = driver_laps[driver_laps['LapNumber'] == lap]
            
            mini_sectors = {
                'speed_i1': {
                    'max': driver_laps['SpeedI1'].max(),
                    'min': driver_laps['SpeedI1'].min(),
                    'average': driver_laps['SpeedI1'].mean()
                },
                'speed_i2': {
                    'max': driver_laps['SpeedI2'].max(),
                    'min': driver_laps['SpeedI2'].min(),
                    'average': driver_laps['SpeedI2'].mean()
                },
                'speed_fl': {
                    'max': driver_laps['SpeedFL'].max(),
                    'min': driver_laps['SpeedFL'].min(),
                    'average': driver_laps['SpeedFL'].mean()
                },
                'speed_st': {
                    'max': driver_laps['SpeedST'].max(),
                    'min': driver_laps['SpeedST'].min(),
                    'average': driver_laps['SpeedST'].mean()
                }
            }
            
            return {
                'driver': driver,
                'lap': lap if lap else 'all',
                'mini_sectors': mini_sectors
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing mini sectors for driver {driver}: {e}")
            return {}
    
    def get_race_pace_analysis(self, session: fastf1.core.Session) -> Dict:
        """
        Analyze race pace for all drivers excluding in/out laps
        
        Args:
            session: Loaded session object
            
        Returns:
            Dictionary with race pace analysis
        """
        try:
            if session.name not in ['R', 'Race']:
                self.logger.warning("Race pace analysis is designed for race sessions")
                return {}
            
            pace_analysis = {}
            
            for driver in session.drivers:
                driver_laps = session.laps.pick_driver(driver)
                
                if driver_laps.empty:
                    continue
                
                # Filter out in/out laps and safety car laps
                valid_laps = driver_laps[
                    (driver_laps['PitOutTime'].isna()) & 
                    (driver_laps['PitInTime'].isna()) &
                    (driver_laps['IsAccurate'] == True)
                ]
                
                if valid_laps.empty:
                    continue
                
                # Group by compound
                compound_pace = {}
                for compound in valid_laps['Compound'].unique():
                    if pd.isna(compound):
                        continue
                        
                    compound_laps = valid_laps[valid_laps['Compound'] == compound]
                    lap_times = [lap['LapTime'].total_seconds() 
                               for _, lap in compound_laps.iterrows() 
                               if pd.notna(lap['LapTime'])]
                    
                    if lap_times:
                        # Remove outliers (laps > 107% of average)
                        avg_time = np.mean(lap_times)
                        filtered_times = [t for t in lap_times if t < avg_time * 1.07]
                        
                        if filtered_times:
                            compound_pace[compound] = {
                                'average': np.mean(filtered_times),
                                'best': min(filtered_times),
                                'consistency': np.std(filtered_times),
                                'lap_count': len(filtered_times)
                            }
                
                driver_info = session.get_driver(driver)
                pace_analysis[driver] = {
                    'driver_name': driver_info['FullName'] if driver_info else f"Driver {driver}",
                    'team': driver_info['TeamName'] if driver_info else "Unknown",
                    'compound_pace': compound_pace,
                    'overall_pace': np.mean([p['average'] for p in compound_pace.values()]) if compound_pace else None
                }
            
            return pace_analysis
            
        except Exception as e:
            self.logger.error(f"Error analyzing race pace: {e}")
            return {}
    
    def get_gap_to_leader_evolution(self, session: fastf1.core.Session) -> Dict:
        """
        Track gap to leader evolution throughout the race
        
        Args:
            session: Loaded session object
            
        Returns:
            Dictionary with gap evolution data
        """
        try:
            if session.name not in ['R', 'Race']:
                self.logger.warning("Gap analysis is designed for race sessions")
                return {}
            
            gap_data = {}
            
            # Find leader for each lap
            for lap_num in range(1, session.laps['LapNumber'].max() + 1):
                lap_data = session.laps[session.laps['LapNumber'] == lap_num]
                
                if lap_data.empty:
                    continue
                
                # Get leader
                leader_data = lap_data[lap_data['Position'] == 1.0]
                if leader_data.empty:
                    continue
                    
                leader_time = leader_data.iloc[0]['Time']
                
                # Calculate gaps for all drivers
                for _, driver_lap in lap_data.iterrows():
                    driver = driver_lap['DriverNumber']
                    
                    if driver not in gap_data:
                        driver_info = session.get_driver(driver)
                        gap_data[driver] = {
                            'driver_name': driver_info['FullName'] if driver_info else f"Driver {driver}",
                            'gaps': []
                        }
                    
                    if pd.notna(driver_lap['Time']) and pd.notna(leader_time):
                        gap = (driver_lap['Time'] - leader_time).total_seconds()
                        gap_data[driver]['gaps'].append({
                            'lap': lap_num,
                            'gap': gap if gap >= 0 else 0,  # Leader has 0 gap
                            'position': int(driver_lap['Position'])
                        })
            
            return gap_data
            
        except Exception as e:
            self.logger.error(f"Error calculating gap evolution: {e}")
            return {}
    
    def analyze_practice_runs(self, session: fastf1.core.Session) -> Dict:
        """
        Analyze practice session runs (quali sims, race sims)
        
        Args:
            session: Loaded practice session
            
        Returns:
            Dictionary with practice run analysis
        """
        try:
            if session.name not in ['FP1', 'FP2', 'FP3', 'Practice 1', 'Practice 2', 'Practice 3']:
                self.logger.warning("This analysis is designed for practice sessions")
                return {}
            
            run_analysis = {}
            
            for driver in session.drivers:
                driver_laps = session.laps.pick_driver(driver)
                
                if driver_laps.empty:
                    continue
                
                # Identify runs (consecutive laps on same compound)
                runs = []
                current_run = []
                last_compound = None
                
                for idx, lap in driver_laps.iterrows():
                    if pd.isna(lap['LapTime']):
                        # End run on invalid lap
                        if current_run and last_compound:
                            runs.append({
                                'compound': last_compound,
                                'laps': current_run,
                                'start_lap': current_run[0]['lap']
                            })
                        current_run = []
                        continue
                    
                    if lap['Compound'] != last_compound and last_compound is not None:
                        # End run on compound change
                        if current_run:
                            runs.append({
                                'compound': last_compound,
                                'laps': current_run,
                                'start_lap': current_run[0]['lap']
                            })
                        current_run = []
                    
                    current_run.append({
                        'lap': lap['LapNumber'],
                        'time': lap['LapTime'].total_seconds(),
                        'fuel_corrected': lap['LapTime'].total_seconds() - (0.03 * (60 - idx) / 60 * 110)
                    })
                    last_compound = lap['Compound']
                
                # Add final run
                if current_run and last_compound:
                    runs.append({
                        'compound': last_compound,
                        'laps': current_run,
                        'start_lap': current_run[0]['lap']
                    })
                
                # Classify runs
                classified_runs = {
                    'quali_runs': [],
                    'race_runs': []
                }
                
                for run in runs:
                    if len(run['laps']) <= 3:
                        # Likely quali simulation
                        classified_runs['quali_runs'].append({
                            'compound': run['compound'],
                            'best_time': min([l['time'] for l in run['laps']]),
                            'laps': run['laps']
                        })
                    else:
                        # Likely race simulation
                        times = [l['fuel_corrected'] for l in run['laps']]
                        classified_runs['race_runs'].append({
                            'compound': run['compound'],
                            'stint_length': len(run['laps']),
                            'average_pace': np.mean(times),
                            'degradation': times[-1] - times[0] if len(times) > 1 else 0,
                            'consistency': np.std(times),
                            'laps': run['laps']
                        })
                
                driver_info = session.get_driver(driver)
                run_analysis[driver] = {
                    'driver_name': driver_info['FullName'] if driver_info else f"Driver {driver}",
                    'team': driver_info['TeamName'] if driver_info else "Unknown",
                    'runs': classified_runs
                }
            
            return run_analysis
            
        except Exception as e:
            self.logger.error(f"Error analyzing practice runs: {e}")
            return {}
    
    def get_energy_management_analysis(self, session: fastf1.core.Session, 
                                     driver: Union[str, int]) -> Dict:
        """
        Analyze energy deployment and harvesting (ERS)
        
        Args:
            session: Loaded session object
            driver: Driver number or abbreviation
            
        Returns:
            Dictionary with energy management analysis
        """
        try:
            driver_laps = session.laps.pick_driver(driver)
            
            if driver_laps.empty:
                return {}
            
            energy_data = []
            
            for _, lap in driver_laps.iterrows():
                telemetry = lap.get_telemetry()
                
                if telemetry.empty:
                    continue
                
                # Analyze throttle and brake patterns for energy deployment
                if 'Throttle' in telemetry.columns and 'Brake' in telemetry.columns:
                    # Identify lift and coast sections
                    lift_coast = telemetry[
                        (telemetry['Throttle'] < 95) & 
                        (telemetry['Brake'] == 0) &
                        (telemetry['Speed'] > 100)
                    ]
                    
                    # Identify heavy braking zones (energy harvesting)
                    heavy_braking = telemetry[telemetry['Brake'] > 50]
                    
                    energy_data.append({
                        'lap': lap['LapNumber'],
                        'lift_coast_percentage': (len(lift_coast) / len(telemetry)) * 100,
                        'heavy_braking_percentage': (len(heavy_braking) / len(telemetry)) * 100,
                        'average_throttle': telemetry['Throttle'].mean(),
                        'lap_time': lap['LapTime'].total_seconds() if pd.notna(lap['LapTime']) else None
                    })
            
            if energy_data:
                return {
                    'driver': driver,
                    'energy_management': energy_data,
                    'average_lift_coast': np.mean([d['lift_coast_percentage'] for d in energy_data]),
                    'average_heavy_braking': np.mean([d['heavy_braking_percentage'] for d in energy_data])
                }
            
            return {}
            
        except Exception as e:
            self.logger.error(f"Error analyzing energy management for driver {driver}: {e}")
            return {}
    
    def generate_html_report(self, analysis_data: Dict, output_file: str = 'f1_analysis_report.html'):
        """
        Generate an HTML report from analysis data
        
        Args:
            analysis_data: Dictionary with analysis results
            output_file: Output HTML filename
        """
        try:
            html_template = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>F1 Session Analysis Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1, h2, h3 { color: #e10600; }
                    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .section { margin: 30px 0; }
                </style>
            </head>
            <body>
                <h1>F1 Session Analysis Report</h1>
                <div class="section">
                    <h2>Session Information</h2>
                    <p><strong>Grand Prix:</strong> {grand_prix}</p>
                    <p><strong>Location:</strong> {location}</p>
                    <p><strong>Date:</strong> {date}</p>
                    <p><strong>Session Type:</strong> {session_type}</p>
                </div>
            </body>
            </html>
            """
            
            # Fill in the template with actual data
            if 'session_info' in analysis_data:
                info = analysis_data['session_info']
                html_content = html_template.format(
                    grand_prix=info.get('grand_prix', 'N/A'),
                    location=info.get('location', 'N/A'),
                    date=info.get('date', 'N/A'),
                    session_type=info.get('session_type', 'N/A')
                )
                
                with open(output_file, 'w') as f:
                    f.write(html_content)
                    
                self.logger.info(f"HTML report generated: {output_file}")
            
        except Exception as e:
            self.logger.error(f"Error generating HTML report: {e}")
    
    def __repr__(self):
        return f"F1DataCollector(cache_dir='{self.cache_dir}')"


# Example usage and utility functions
def main():
    """Example usage of the F1DataCollector"""
    
    # Initialize collector
    collector = F1DataCollector()
    
    # Example: Get 2024 season schedule
    schedule_2024 = collector.get_event_schedule(2024)
    print(f"2024 F1 Calendar: {len(schedule_2024)} races")
    
    # Example: Get comprehensive race analysis
    # analysis = collector.get_comprehensive_analysis(2024, 'Monaco', 'Race')
    
    # Example: Compare two drivers
    # session = collector.get_session(2024, 'Monaco', 'Race')
    # comparison = collector.compare_driver_laps(session, 'VER', 'HAM')
    
    # Example: Export data to JSON
    # collector.export_session_to_json(analysis, 'monaco_2024_analysis.json')
    
    print("F1 Data Collector ready for use!")


if __name__ == "__main__":
    main()