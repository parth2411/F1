# ai-service/src/llm/groq_client.py
from groq import Groq
import os
from typing import List, Dict, Optional
import asyncio

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.model = "llama-3.3-70b-versatile"
    
    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Generate chat completion using Groq"""
        try:
            if system_prompt:
                messages.insert(0, {"role": "system", "content": system_prompt})
            
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=temperature,
                max_tokens=1024,
                stream=False
            )
            
            return chat_completion.choices[0].message.content
            
        except Exception as e:
            print(f"Error in chat completion: {e}")
            return "I apologize, but I'm experiencing technical difficulties. Please try again."