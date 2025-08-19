# ai-service/src/chat/f1_expert.py (Enhanced version)
from typing import List, Dict, Optional
from ..llm.groq_client import GroqClient
import json

class F1Expert:
    def __init__(self):
        self.llm = GroqClient()
        self.system_prompt = """
        You are an expert Formula 1 analyst with comprehensive knowledge of F1 history, 
        regulations, technical aspects, driver performance, team strategies, and race analysis.
        
        Your expertise includes:
        - F1 technical regulations and car specifications
        - Driver and team performance analysis  
        - Race strategy and pit stop tactics
        - Historical F1 statistics and records
        - Circuit characteristics and track analysis
        - Telemetry data interpretation
        - Weather impact on race performance
        - Tyre strategy and degradation analysis
        - Aerodynamics and car setup
        - Power unit regulations and ERS systems
        
        When answering questions:
        1. Provide accurate, detailed, and insightful responses
        2. Explain technical aspects in an accessible way
        3. Use specific data when available in the context
        4. Reference relevant F1 regulations or historical examples
        5. If analyzing current session data, provide specific insights based on the numbers
        6. Always acknowledge if you're uncertain about specific current data
        
        Current Context Information will be provided when available.
        """
    
    async def answer_question(
        self, 
        question: str, 
        context: Optional[Dict] = None,
        history: Optional[List[Dict]] = None,
        relevant_docs: Optional[List[Dict]] = None
    ) -> str:
        """Answer F1-related questions with comprehensive context"""
        try:
            # Build context string
            context_parts = []
            
            # Add relevant knowledge base documents
            if relevant_docs:
                context_parts.append("=== RELEVANT F1 KNOWLEDGE ===")
                for i, doc in enumerate(relevant_docs, 1):
                    context_parts.append(f"{i}. {doc['content']}")
                    if doc.get('source'):
                        context_parts.append(f"   Source: {doc['source']}")
                context_parts.append("")
            
            # Add current session context
            if context:
                context_parts.append("=== CURRENT SESSION DATA ===")
                
                # Session info
                if 'session_info' in context:
                    session = context['session_info']
                    context_parts.append(f"Event: {session.get('event_name', 'Unknown')}")
                    context_parts.append(f"Location: {session.get('location', 'Unknown')}")
                    context_parts.append(f"Session: {session.get('session_type', 'Unknown')}")
                    context_parts.append(f"Date: {session.get('date', 'Unknown')}")
                    context_parts.append("")
                
                # Driver data summary
                if 'drivers' in context and context['drivers']:
                    context_parts.append("DRIVER PERFORMANCE:")
                    drivers = list(context['drivers'].values())[:10]  # Top 10
                    for driver in drivers:
                        fastest = driver.get('fastest_lap')
                        fastest_str = f"{fastest:.3f}s" if fastest else "No time"
                        context_parts.append(
                            f"- {driver.get('abbreviation', 'UNK')} ({driver.get('team', 'Unknown')}): "
                            f"Fastest: {fastest_str}, Laps: {len(driver.get('laps', []))}"
                        )
                    context_parts.append("")
                
                # Weather data
                if 'weather' in context and context['weather']:
                    weather = context['weather'][0] if context['weather'] else {}
                    context_parts.append("WEATHER CONDITIONS:")
                    if weather.get('air_temp'):
                        context_parts.append(f"- Air Temperature: {weather['air_temp']}°C")
                    if weather.get('track_temp'):
                        context_parts.append(f"- Track Temperature: {weather['track_temp']}°C")
                    if weather.get('humidity'):
                        context_parts.append(f"- Humidity: {weather['humidity']}%")
                    context_parts.append("")
            
            # Build conversation history
            messages = []
            if history:
                for msg in history[-3:]:  # Last 3 messages for context
                    if msg.get('role') in ['user', 'assistant']:
                        messages.append({
                            "role": msg['role'],
                            "content": msg['content']
                        })
            
            # Add current question with context
            full_context = "\n".join(context_parts) if context_parts else ""
            user_message = f"{question}\n\n{full_context}" if full_context else question
            
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Get response from LLM
            response = await self.llm.chat_completion(
                messages=messages,
                system_prompt=self.system_prompt,
                temperature=0.7
            )
            
            return response
            
        except Exception as e:
            print(f"Error answering question: {e}")
            return "I'm having trouble processing your question. Please try again."
    
    async def analyze_driver_performance(self, driver_data: Dict, context: Dict) -> str:
        """Provide detailed driver performance analysis"""
        try:
            laps = driver_data.get('laps', [])
            if not laps:
                return f"No lap data available for {driver_data.get('name', 'this driver')}."
            
            # Calculate performance metrics
            valid_laps = [lap for lap in laps if lap.get('lap_time')]
            if not valid_laps:
                return f"No valid lap times for {driver_data.get('name', 'this driver')}."
            
            lap_times = [lap['lap_time'] for lap in valid_laps]
            fastest_lap = min(lap_times)
            average_lap = sum(lap_times) / len(lap_times)
            consistency = (max(lap_times) - min(lap_times)) / min(lap_times) * 100
            
            # Sector analysis
            sector_data = {
                'sector1': [lap.get('sector1_time') for lap in valid_laps if lap.get('sector1_time')],
                'sector2': [lap.get('sector2_time') for lap in valid_laps if lap.get('sector2_time')],
                'sector3': [lap.get('sector3_time') for lap in valid_laps if lap.get('sector3_time')]
            }
            
            analysis = f"""
**Performance Analysis for {driver_data.get('name', 'Driver')} ({driver_data.get('team', 'Unknown Team')})**

**Lap Time Performance:**
- Fastest Lap: {fastest_lap:.3f}s
- Average Lap: {average_lap:.3f}s
- Consistency: {consistency:.1f}% variation
- Total Valid Laps: {len(valid_laps)}

**Sector Performance:**
"""
            
            for sector, times in sector_data.items():
                if times:
                    best_sector = min(times)
                    avg_sector = sum(times) / len(times)
                    analysis += f"- {sector.title()}: Best {best_sector:.3f}s, Avg {avg_sector:.3f}s\n"
            
            # Tire strategy
            compounds_used = list(set(lap.get('compound') for lap in laps if lap.get('compound')))
            if compounds_used:
                analysis += f"\n**Tire Strategy:**\n- Compounds Used: {', '.join(compounds_used)}\n"
            
            return analysis.strip()
            
        except Exception as e:
            print(f"Error analyzing driver performance: {e}")
            return "Unable to analyze driver performance data."
