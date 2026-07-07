import os
import sys
import requests
from pathlib import Path

def check_health():
    print("🚀 ModAI V4 Production Health Check")
    print("-" * 40)
    
    root = Path(__file__).parent.parent
    
    # 1. Check AI Models
    print("🔍 Checking AI Assets...")
    models_to_check = [
        root / "models" / "yolov8n-seg.pt",
        root / "models" / "bike_model_v3.pth",
        root / "models" / "bike_model_multi_label_v1.pth",
        root / "models" / "yolov8n-seg.onnx"
    ]
    
    all_models_found = True
    for model in models_to_check:
        if model.exists():
            print(f"  [OK] Found {model.name} ({model.stat().st_size / 1024 / 1024:.1f} MB)")
        else:
            print(f"  [ERROR] Missing {model.name}!")
            all_models_found = False
            
    # 2. Check Directories
    print("\n📁 Checking Crucial Directories...")
    dirs = ["backend", "frontend", "models", "static", "static/uploads", "static/cache"]
    for d in dirs:
        if (root / d).exists():
            print(f"  [OK] Directory '{d}' present")
        else:
            print(f"  [ERROR] Directory '{d}' missing!")

    # 3. Check Backend Connectivity
    print("\n🌐 Checking Backend API...")
    try:
        # Check fallback to localhost if no ENV var
        url = os.environ.get("API_URL", "http://localhost:8000")
        resp = requests.get(f"{url}/health", timeout=5)
        if resp.status_code == 200:
            print(f"  [OK] Gateway Operational: {resp.json().get('status')}")
            print(f"  [OK] Engine version: {resp.json().get('version')}")
        else:
            print(f"  [ERROR] Gateway responded with {resp.status_code}")
    except Exception as e:
        print(f"  [SKIP] API not reachable (normal if backend isn't running).")

    print("-" * 40)
    if all_models_found:
        print("✅ SYSTEM READY FOR DEPLOYMENT")
    else:
        print("❌ SYSTEM INCOMPLETE - CHECK MODELS PATHS")

if __name__ == "__main__":
    check_health()
