import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True, index=True)  # Supabase auth user UUID
    name = Column(String, nullable=False)
    commitment_hash = Column(String, nullable=False)
    crop_type = Column(String, nullable=False)
    sowing_date = Column(Date, nullable=False)
    policy_id = Column(String, nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    area_hectares = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="registered")
