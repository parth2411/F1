from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="F1 AI Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = None
    history: Optional[List[Dict]] = []

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Dict]] = []

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "F1 AI Service",
        "port": os.getenv("PORT", 8002),
        "groq_configured": bool(os.getenv("GROQ_API_KEY"))
    }

@app.post("/chat/f1-expert", response_model=ChatResponse)
async def chat_with_f1_expert(request: ChatRequest):
    """Chat with the F1 expert AI (placeholder)"""
    try:
        # Placeholder response until full implementation
        response = f"Thank you for your question: '{request.message}'. The F1 AI expert is currently being set up. This is a placeholder response."
        
        return ChatResponse(
            response=response,
            sources=[]
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8002)),
        reload=True
    )