from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(String, unique=True, index=True)
    material_type = Column(String)
    current_status = Column(String)
    current_volume_m3 = Column(Float)
    current_mass_kg = Column(Float)
    net_change_kg = Column(Float)
    daily_burn_rate_kg = Column(Float)
    estimated_depletion_date = Column(String)
    last_updated = Column(String)
    financial_cost_estimate = Column(Float, default=0.0) # We will derive this
