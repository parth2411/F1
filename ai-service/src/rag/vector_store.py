# ai-service/src/rag/vector_store.py
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import uuid
from typing import List, Dict, Optional
import os

class VectorStore:
    def __init__(self):
        self.client = QdrantClient(
            url=os.getenv('QDRANT_URL', 'http://localhost:6333'),
            api_key=os.getenv('QDRANT_API_KEY')
        )
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.collection_name = "f1_knowledge"
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Ensure the F1 knowledge collection exists"""
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # all-MiniLM-L6-v2 embedding size
                        distance=Distance.COSINE
                    )
                )
                print(f"Created collection: {self.collection_name}")
        except Exception as e:
            print(f"Error ensuring collection: {e}")
    
    async def add_documents(self, documents: List[Dict[str, str]]):
        """Add documents to the vector store"""
        try:
            points = []
            for doc in documents:
                # Generate embedding
                embedding = self.encoder.encode(doc['content']).tolist()
                
                # Create point
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        'content': doc['content'],
                        'source': doc.get('source', ''),
                        'category': doc.get('category', ''),
                        'metadata': doc.get('metadata', {})
                    }
                )
                points.append(point)
            
            # Upsert points
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            print(f"Added {len(points)} documents to vector store")
            
        except Exception as e:
            print(f"Error adding documents: {e}")
    
    async def search(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for relevant documents"""
        try:
            # Generate query embedding
            query_embedding = self.encoder.encode(query).tolist()
            
            # Search
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit
            )
            
            # Format results
            results = []
            for hit in search_result:
                results.append({
                    'content': hit.payload['content'],
                    'source': hit.payload.get('source', ''),
                    'category': hit.payload.get('category', ''),
                    'score': hit.score,
                    'metadata': hit.payload.get('metadata', {})
                })
            
            return results
            
        except Exception as e:
            print(f"Error searching: {e}")
            return []
    
    async def initialize_f1_knowledge(self):
        """Initialize the vector store with F1 knowledge base"""
        f1_documents = [
            {
                'content': 'DRS (Drag Reduction System) is a driver-adjustable bodywork feature that reduces aerodynamic drag to promote overtaking. It can only be used in designated DRS zones and when a driver is within one second of the car ahead.',
                'source': 'F1 Technical Regulations',
                'category': 'Technical',
                'metadata': {'topic': 'DRS', 'year': '2024'}
            },
            {
                'content': 'Formula 1 uses three types of dry weather tyres: Soft (red), Medium (yellow), and Hard (white). Each compound offers different levels of grip and durability.',
                'source': 'F1 Sporting Regulations',
                'category': 'Technical',
                'metadata': {'topic': 'Tyres', 'year': '2024'}
            },
            {
                'content': 'Points are awarded to the top 10 finishers: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1. An additional point is awarded for the fastest lap if the driver finishes in the top 10.',
                'source': 'F1 Sporting Regulations',
                'category': 'Scoring',
                'metadata': {'topic': 'Points System', 'year': '2024'}
            },
            {
                'content': 'Each driver must use at least two different tyre compounds during the race (unless it is a wet race). Drivers who reach Q3 must start the race on the tyres they used to set their fastest Q2 time.',
                'source': 'F1 Sporting Regulations', 
                'category': 'Strategy',
                'metadata': {'topic': 'Tyre Rules', 'year': '2024'}
            },
            {
                'content': 'The pit lane speed limit is 80 km/h (50 mph) for safety reasons. Exceeding this limit results in a time penalty.',
                'source': 'F1 Sporting Regulations',
                'category': 'Safety',
                'metadata': {'topic': 'Pit Lane', 'year': '2024'}
            },
            {
                'content': 'Track limits are defined by the white lines on the edge of the track. Drivers who consistently exceed track limits may receive warnings and eventual time penalties.',
                'source': 'F1 Sporting Regulations',
                'category': 'Rules',
                'metadata': {'topic': 'Track Limits', 'year': '2024'}
            },
            {
                'content': 'ERS (Energy Recovery System) allows drivers to deploy up to 160 kJ of electrical energy per lap for approximately 33 seconds of extra power.',
                'source': 'F1 Technical Regulations',
                'category': 'Technical',
                'metadata': {'topic': 'ERS', 'year': '2024'}
            }
        ]
        
        await self.add_documents(f1_documents)