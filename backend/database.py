import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

# Global database instance
db = Database()

async def connect_to_mongo():
    """Create database connection"""
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise ValueError("MONGODB_URI environment variable is required")
    
    print(f"Connecting to MongoDB...")
    db.client = AsyncIOMotorClient(mongodb_uri)
    db.database = db.client.nuudle
    
    # Test the connection
    try:
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    return db.database