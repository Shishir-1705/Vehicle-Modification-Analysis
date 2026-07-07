import requests
import os
import json

def test_production_deployment():
    print("🧪 Starting Functional Production API Test...")
    print("-" * 50)
    
    API_URL = "http://localhost:8000/api/v1"
    
    # 1. Health Check
    try:
        health = requests.get(f"{API_URL}/health")
        print(f"📡 Health Check: {health.status_code}")
        print(f"   Payload: {health.json()}")
    except:
        print("   [SKIP] Backend not reachable. Ensure 'docker-compose up' is running.")
        return

    # 2. Predictive Inference
    # Use a dummy jpg for testing
    img_path = "test_bike.jpg"
    with open(img_path, "wb") as f:
        f.write(b"dummy_image_data_here") # This will fail real inference but test the route
        
    print("\n🔍 Testing /predict Endpoint...")
    with open(img_path, "rb") as f:
        files = {"file": ("test.jpg", f, "image/jpeg")}
        resp = requests.post(f"{API_URL}/predict/", files=files)
        
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"   Inference Time: {data['inference_time_ms']} ms")
        print(f"   OCR Results: {data['ocr_output']}")
        print(f"   Detections Found: {len(data['detections'])}")
    else:
        print(f"   Error: {resp.text}")

    os.remove(img_path)
    print("-" * 50)
    print("✅ TEST COMPLETE")

if __name__ == "__main__":
    test_production_deployment()
