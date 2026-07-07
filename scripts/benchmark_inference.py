import time
import os
import torch
import numpy as np
from PIL import Image
from backend.services.onnx_engine import get_onnx_predictor
from ultralytics import YOLO

def benchmark_production_pipeline():
    print("🚦 Starting ModAI V4 Performance Benchmark...")
    print("-" * 50)
    
    # Create mock image
    dummy_img = Image.fromarray(np.uint8(np.random.rand(640, 640, 3) * 255))
    dummy_path = "benchmark_temp.jpg"
    dummy_img.save(dummy_path)
    
    # 1. Benchmark Standard PyTorch (via Ultralytics)
    print("🧪 Testing [PATH A]: Standard PyTorch (Ultralytics)")
    pt_model_path = os.path.join("models", "yolov8n-seg.pt")
    if os.path.exists(pt_model_path):
        model = YOLO(pt_model_path)
        start = time.time()
        for _ in range(10):
            model.predict(dummy_path, verbose=False)
        pt_latency = (time.time() - start) / 10 * 1000
        print(f"   Avg Latency: {pt_latency:.2f} ms")
    else:
        print("   [SKIP] PyTorch weights not found at models/")

    # 2. Benchmark ONNX Runtime (New Production Engine)
    print("\n⚡ Testing [PATH B]: Production ONNX Runtime (Optimized)")
    onnx_predictor = get_onnx_predictor()
    with open(dummy_path, "rb") as f:
        img_bytes = f.read()
        
    start = time.time()
    for _ in range(10):
        onnx_predictor.predict(img_bytes)
    onnx_latency = (time.time() - start) / 10 * 1000
    print(f"   Avg Latency: {onnx_latency:.2f} ms")
    
    print("-" * 50)
    if 'pt_latency' in locals():
        gain = ((pt_latency - onnx_latency) / pt_latency) * 100
        print(f"✅ ONNX Speed Gain: {gain:.1f}%")
        
    os.remove(dummy_path)

if __name__ == "__main__":
    benchmark_production_pipeline()
