import os
import shutil
import re
import argparse
from pathlib import Path

# --- CONFIGURATION (Safe Lists) ---
ESSENTIAL_MODELS = ["yolov8n-seg.pt", "bike_model_v3.pth", "bike_model_multi_label_v1.pth", "yolov8n-seg.onnx"]
ESSENTIAL_DATASETS = ["dataset"]
CORE_APP_FOLDERS = ["backend", "frontend", "ml_pipeline", "models", "scripts", "static", "templates"]

def cleanup_project(dry_run=True):
    print(f"{' [DRY RUN MODE] ' if dry_run else ' [LIVE CLEANUP] '}")
    print("-" * 50)
    
    total_freed = 0
    root = Path(".")
    
    # 1. Consolidate Models (Simulation/Reference)
    # We expect yolov8n-seg.pt to move into models/
    models_dir = root / "models"
    if not dry_run and not models_dir.exists():
        models_dir.mkdir(exist_ok=True)
        print(f"Created {models_dir}")

    # 2. Cleanup Legacy/Redundant Folders
    folders_to_remove = [
        "frontend-legacy", 
        "streamlit_app", 
        "scratch", 
        "vehicle_dataset", 
        "yolo_dataset"
    ]
    
    for folder in folders_to_remove:
        path = root / folder
        if path.exists():
            size = sum(f.stat().st_size for f in path.glob('**/*') if f.is_file())
            print(f"🗑️ Removing legacy folder: {folder} ({size / 1024 / 1024:.2f} MB)")
            if not dry_run:
                shutil.rmtree(path)
            total_freed += size

    # 3. Cleanup Root Artifacts
    files_to_remove = [
        "yolov8n.pt", 
        "yolov8s-seg.pt", 
        "yolov8n-seg.torchscript", 
        "all_jpgs.csv", 
        "all_pngs.csv"
    ]
    
    for filename in files_to_remove:
        path = root / filename
        if path.exists():
            print(f"🗑️ Removing root artifact: {filename} ({path.stat().st_size / 1024 / 1024:.2f} MB)")
            if not dry_run:
                os.remove(path)
            total_freed += path.stat().st_size

    # 4. Handle YOLO Runs (runs/ folder)
    runs_dir = root / "runs"
    if runs_dir.exists():
        for run_path in runs_dir.glob("**/*"):
            if run_path.is_dir() and (run_path / "weights").exists():
                # Keep best/last, remove others
                weights_dir = run_path / "weights"
                for weight_file in weights_dir.glob("*.pt"):
                    if weight_file.name not in ["best.pt", "last.pt"]:
                        print(f"🗑️ Removing intermediate weight: {weight_file}")
                        if not dry_run:
                            os.remove(weight_file)
                
                # Keep plots and args, remove other noise
                for junk in run_path.glob("*"):
                    if junk.is_file() and junk.suffix not in [".png", ".yaml", ".pt", ".csv"]:
                        print(f"🗑️ Removing run artifact: {junk.name}")
                        if not dry_run:
                            os.remove(junk)

    # 5. Recursive Cache Cleanup
    for cache_path in root.glob("**/__pycache__"):
        print(f"🗑️ Clearing Python cache: {cache_path}")
        if not dry_run:
            shutil.rmtree(cache_path)

    for next_cache in root.glob("**/frontend/.next/cache"):
        print(f"🗑️ Clearing Next.js cache: {next_cache}")
        if not dry_run:
            shutil.rmtree(next_cache)

    print("-" * 50)
    print(f"✅ Cleanup {'simulation' if dry_run else 'live'} complete.")
    print(f"📈 Total Space to be Freed: {total_freed / 1024 / 1024:.2f} MB")
    
    if dry_run:
        print("\n👉 Run with '--live' to execute these deletions.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Expert Project Cleanup Tool")
    parser.add_argument("--live", action="store_true", help="Execute live cleanup")
    args = parser.parse_args()
    
    cleanup_project(dry_run=not args.live)
