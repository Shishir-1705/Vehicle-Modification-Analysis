import os
import shutil
from pathlib import Path

def cleanup():
    root = Path(".")
    
    # 1. Remove Unused/Legacy Directories
    dirs_to_remove = ["frontend-legacy", "streamlit_app", "app", "templates", "static", "scratch", "docs", "runs"]
    for d in dirs_to_remove:
        path = root / d
        if path.exists():
            print(f"Removing directory: {d}")
            shutil.rmtree(path, ignore_errors=True)
            
    # 2. Archive and Remove Mobile App
    mobile_path = root / "mobile"
    if mobile_path.exists():
        print("Archiving mobile directory...")
        shutil.make_archive("mobile_archive", "zip", "mobile")
        print("Removing mobile directory...")
        shutil.rmtree(mobile_path, ignore_errors=True)
        
    # 3. Remove Temporary / Generated Files
    # Caches
    for p in root.rglob("__pycache__"):
        if p.exists():
            shutil.rmtree(p, ignore_errors=True)
    for p in root.rglob("*.pyc"):
        if p.exists():
            p.unlink()
    next_cache = root / "frontend" / ".next" / "cache"
    if next_cache.exists():
        shutil.rmtree(next_cache, ignore_errors=True)
        
    # Root artifacts
    artifacts = [
        "all_jpgs.csv", "all_pngs.csv", 
        "yolov8n.pt", "yolov8s-seg.pt", "yolov8n-seg.torchscript"
    ]
    for art in artifacts:
        p = root / art
        if p.exists():
            print(f"Removing artifact: {art}")
            p.unlink()
            
    # 4. Clean Root Directory
    root_files = [
        "FIX_FRONTEND.bat", "REPAIR_3D_ENGINE.bat", "RUN_MANUALLY.bat",
        "LAUNCH_MODAI.bat", "runtime.txt", "package-lock.json", "wsgi.py"
    ]
    for rf in root_files:
        p = root / rf
        if p.exists():
            print(f"Removing root file: {rf}")
            p.unlink()
            
    # Move flatten_dataset.py
    flatten = root / "flatten_dataset.py"
    scripts_dir = root / "scripts"
    scripts_dir.mkdir(exist_ok=True)
    if flatten.exists():
        print("Moving flatten_dataset.py to scripts/")
        shutil.move(str(flatten), str(scripts_dir / "flatten_dataset.py"))
        
    # 5. Consolidate Datasets
    # Target: dataset/raw, dataset/processed, dataset/yolo
    dataset_dir = root / "dataset"
    raw_dir = dataset_dir / "raw"
    processed_dir = dataset_dir / "processed"
    yolo_dir = dataset_dir / "yolo"
    
    for d in [raw_dir, processed_dir, yolo_dir]:
        d.mkdir(parents=True, exist_ok=True)
        
    # Move vehicle_dataset contents to raw/
    vehicle_dataset = root / "vehicle_dataset"
    if vehicle_dataset.exists():
        for item in vehicle_dataset.iterdir():
            print(f"Moving {item} to dataset/raw/")
            shutil.move(str(item), str(raw_dir / item.name))
        vehicle_dataset.rmdir()
        
    # Move yolo_dataset contents to yolo/
    yolo_dataset_orig = root / "yolo_dataset"
    if yolo_dataset_orig.exists():
        for item in yolo_dataset_orig.iterdir():
            print(f"Moving {item} to dataset/yolo/")
            shutil.move(str(item), str(yolo_dir / item.name))
        yolo_dataset_orig.rmdir()
        
    # 6. Consolidate ML Pipeline
    src_dir = root / "src"
    ml_pipeline_dir = root / "ml_pipeline"
    ml_pipeline_dir.mkdir(exist_ok=True)
    if src_dir.exists():
        for item in src_dir.iterdir():
            dest = ml_pipeline_dir / item.name
            if not dest.exists(): # avoid overwriting if exists
                print(f"Moving {item} to ml_pipeline/")
                shutil.move(str(item), str(dest))
            else:
                print(f"Removing duplicate {item}")
                if item.is_dir():
                    shutil.rmtree(item, ignore_errors=True)
                else:
                    item.unlink()
        src_dir.rmdir()

    print("Cleanup completed successfully!")

if __name__ == "__main__":
    cleanup()
