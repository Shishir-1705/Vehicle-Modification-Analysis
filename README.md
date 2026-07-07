# 🏍️ Bike ModAI V5 Platform

![Status](https://img.shields.io/badge/Status-Production%20Ready-success) ![Stack](https://img.shields.io/badge/Stack-Next.js%20%2F%20FastAPI-blue) ![AI](https://img.shields.io/badge/AI-YOLOv8%20%2B%20ONNX-orange)

A professional, data-driven AI platform designed for real-time motorcycle modification detection and strategic compliance monitoring.

## 🚀 Standard Developer Quickstart

This project uses standard Next.js and FastAPI CLI workflows. No external automation scripts are required.

### 🧠 Backend Configuration
The backend is powered by FastAPI and optimized ONNX Runtime inference.
```bash
# 1. Install Dependencies
pip install -r requirements.txt

# 2. Launch AI Engine
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs available at: http://localhost:8000/docs*

### 🌐 Frontend Configuration
The frontend is a high-performance Next.js dashboard.
```bash
# 1. Enter Directory
cd frontend

# 2. Sync Modules
npm install

# 3. Launch UI
npm run dev
```
*Dashboard available at: http://localhost:3000*

## 🏗️ Architecture Overview

- **Frontend**: Next.js 15+ with Framer Motion, Tailwind CSS, and Lucide icons.
- **Backend**: FastAPI with asynchronous endpoints.
- **AI Core**: YOLOv8-segmentation exported to **ONNX Runtime** for high-concurrency production serving.
- **XAI**: Integrated Grad-CAM heatmaps for visual violation justification.
- **Database**: PostgreSQL for historical scan tracking and compliance analytics.
- **Cache**: Redis for real-time event buffering and rate limiting.

## 🐳 Docker Production
To run the full stack in an orchestrated production environment:
```bash
docker-compose up --build
```

## 📝 Compliance Reporting
The system automatically generates professional PDF inspection reports including:
- Annotated violation images.
- AI-generated legal reasonings (CMVR/RTO).
- Verified plate recognition (OCR).

---
© 2026 Bike ModAI Engineering Team. Strictly confidential.
