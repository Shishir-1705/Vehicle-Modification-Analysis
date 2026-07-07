import os
import shutil
from pathlib import Path
from ultralytics import YOLO

def main():
    root_dir = Path(__file__).resolve().parent.parent
    models_dir = root_dir / "models"
    os.makedirs(models_dir, exist_ok=True)
    
    pt_name = "yolov8l-seg.pt"
    onnx_name = "yolov8l-seg.onnx"
    
    print(f"📥 Loading/Downloading base model {pt_name}...")
    model = YOLO(pt_name)
    
    print(f"📦 Exporting {pt_name} to ONNX format...")
    # Exporting
    onnx_path = model.export(format="onnx")
    
    # Paths
    src_pt = root_dir / pt_name
    src_onnx = root_dir / onnx_name
    
    dest_pt = models_dir / pt_name
    dest_onnx = models_dir / onnx_name
    
    # Copy files
    print("🚚 Distributing files to workspace and models directories...")
    if src_pt.exists():
        shutil.copy(src_pt, dest_pt)
        print(f"✅ Copied {pt_name} to models folder.")
    elif dest_pt.exists():
        shutil.copy(dest_pt, src_pt)
        print(f"✅ Copied {pt_name} to root folder.")
        
    if src_onnx.exists():
        shutil.copy(src_onnx, dest_onnx)
        print(f"✅ Copied {onnx_name} to models folder.")
    elif dest_onnx.exists():
        shutil.copy(dest_onnx, src_onnx)
        print(f"✅ Copied {onnx_name} to root folder.")
        
    print("🎉 YOLOv8l-seg Download & ONNX Export completed successfully!")

if __name__ == "__main__":
    main()
