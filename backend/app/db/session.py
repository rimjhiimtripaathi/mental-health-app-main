# backend/app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# SQLite database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./mental_health.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a single Base for all models
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Import models after Base is defined to create tables
def create_tables():
    # Import models here to avoid circular imports
    from app.models.user import User
    from app.models.assessment import Assessment
    from app.models.text_emotion_models import TextEmotionResult


    Base.metadata.create_all(bind=engine)

# Create tables
create_tables()