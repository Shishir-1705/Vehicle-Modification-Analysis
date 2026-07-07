from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from .env import settings

# Patch AsyncIOMotorClient to prevent the "MotorDatabase object is not callable" bug.
# This happens because Beanie checks hasattr(client, "append_metadata"). Since AsyncIOMotorClient
# dynamically delegates unknown attribute access via __getattr__ to return a MotorDatabase object,
# hasattr returns True. Beanie then tries to call this MotorDatabase object as a function, raising a TypeError.
def dummy_append_metadata(*args, **kwargs):
    pass
AsyncIOMotorClient.append_metadata = dummy_append_metadata

# This will hold the Motor client
client: AsyncIOMotorClient = None

async def init_db():
    """
    Initialize the MongoDB connection and Beanie ODM.
    """
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
    database = client[settings.MONGODB_NAME]
    
    # We will import our models here to avoid circular imports
    from ..models import User, Scan, Detection, Recommendation, RCData
    
    await init_beanie(
        database=database,
        document_models=[
            User,
            Scan,
            Detection,
            Recommendation,
            RCData
        ]
    )

async def close_db():
    global client
    if client:
        client.close()
