# ai-service/src/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import os
from .chat.f1_expert import F1Expert
from .rag.vector_store import VectorStore

app = FastAPI(title="F1 AI Service", version="1.0.0")

# Initialize services
f1_expert = F1Expert()
vector_store = VectorStore()

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = None
    history: Optional[List[Dict]] = []

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Dict]] = []

@app.on_event("startup")
async def startup_event():
    """Initialize the knowledge base on startup"""
    await vector_store.initialize_f1_knowledge()
    print("F1 AI Service started successfully")

@app.post("/chat/f1-expert", response_model=ChatResponse)
async def chat_with_f1_expert(request: ChatRequest):
    """Chat with the F1 expert AI"""
    try:
        # Get relevant context from vector store
        relevant_docs = await vector_store.search(request.message, limit=3)
        
        # Process the question
        response = await f1_expert.answer_question(
            question=request.message,
            context=request.context,
            history=request.history,
            relevant_docs=relevant_docs
        )
        
        return ChatResponse(
            response=response,
            sources=relevant_docs
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/knowledge/add")
async def add_knowledge(documents: List[Dict[str, str]]):
    """Add new documents to the knowledge base"""
    try:
        await vector_store.add_documents(documents)
        return {"message": f"Added {len(documents)} documents successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "F1 AI Service"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=True
    )