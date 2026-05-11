# Stage 1: Build the React Frontend
FROM node:20 as build-stage
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve Backend & Frontend
FROM python:3.11-slim
WORKDIR /app

# Copy backend requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code and assets
COPY backend/ ./backend/
COPY backend_assets_v1/ ./backend_assets_v1/

# Copy built frontend from Stage 1
COPY --from=build-stage /app/frontend/dist /app/frontend/dist

# Expose the port (Render sets the PORT env variable)
EXPOSE 8000

# Command to run uvicorn
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
