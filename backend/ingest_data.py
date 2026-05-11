import json
import os
import glob
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

DATA_DIR = "../dashboard_materials_v5"

# Mock costs per kg to give financial flavor to the dashboard
COST_LOOKUP = {
    "stack of red bricks": 0.15,
    "pile of dark mulch": 0.05,
    "mound of brown dirt": 0.02,
    "cardboard box": 0.01,
    "stacks of bricks": 0.15
}

def ingest():
    db: Session = SessionLocal()
    json_files = glob.glob(os.path.join(DATA_DIR, "*.json"))
    
    for file_path in json_files:
        with open(file_path, "r") as f:
            data = json.load(f)
            
            mat_id = data.get("material_id")
            
            # Check if exists
            existing = db.query(models.Material).filter(models.Material.material_id == mat_id).first()
            
            cost_per_kg = COST_LOOKUP.get(data.get("material_type", ""), 0.1)
            estimated_cost = data.get("current_mass_kg", 0) * cost_per_kg
            
            if existing:
                # update
                for key, value in data.items():
                    setattr(existing, key, value)
                existing.financial_cost_estimate = estimated_cost
            else:
                new_mat = models.Material(
                    material_id=mat_id,
                    material_type=data.get("material_type"),
                    current_status=data.get("current_status"),
                    current_volume_m3=data.get("current_volume_m3"),
                    current_mass_kg=data.get("current_mass_kg"),
                    net_change_kg=data.get("net_change_kg"),
                    daily_burn_rate_kg=data.get("daily_burn_rate_kg"),
                    estimated_depletion_date=data.get("estimated_depletion_date"),
                    last_updated=data.get("last_updated"),
                    financial_cost_estimate=estimated_cost
                )
                db.add(new_mat)
    
    db.commit()
    db.close()
    print("Ingestion complete.")

if __name__ == "__main__":
    ingest()
