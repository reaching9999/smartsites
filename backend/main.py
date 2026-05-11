from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

assets_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend_assets_v1")
app.mount("/data_assets", StaticFiles(directory=assets_dir), name="data_assets")

@app.get("/sites")
def get_sites():
    sites = []
    for site_folder in os.listdir(assets_dir):
        # Filter out requested sites
        if site_folder in ["1_Bricks_Unloading", "2_Mulch_Pile"]:
            continue
            
        site_path = os.path.join(assets_dir, site_folder)
        if os.path.isdir(site_path):
            payload_path = os.path.join(site_path, "API_Payload.json")
            if os.path.exists(payload_path):
                with open(payload_path, "r") as f:
                    data = json.load(f)
                    data["site_id"] = site_folder
                    sites.append(data)
    return sites

# Serve the static React frontend from the /dist folder
frontend_dir = "/app/frontend/dist"
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    # Fallback for local development
    local_frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
    if os.path.exists(local_frontend_dir):
        app.mount("/", StaticFiles(directory=local_frontend_dir, html=True), name="frontend")
