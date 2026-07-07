import os
import shutil
import pandas as pd
from pathlib import Path

def sync_dataset():
    base_dir = Path(r"D:\Vehicle Mod\vehicle_dataset\content\dataset")
    target_img_dir = Path(r"D:\Vehicle Mod\vehicle_dataset\images")
    output_csv = Path(r"D:\Vehicle Mod\vehicle_dataset\multi_label_annotations.csv")
    
    target_img_dir.mkdir(parents=True, exist_ok=True)
    
    data = []
    
    # Process Stock
    stock_dir = base_dir / "stock"
    for img in stock_dir.glob("*.jpg"):
        shutil.copy2(img, target_img_dir / img.name)
        # image_name, exhaust_modified, paint_modified, wheels_changed
        # Note: I'll use 0,0,0 for stock
        data.append({
            "image_name": img.name,
            "exhaust_modified": 0,
            "paint_modified": 0,
            "wheels_changed": 0
        })
        
    # Process Modified
    mod_dir = base_dir / "modified"
    for img in mod_dir.glob("*.jpg"):
        shutil.copy2(img, target_img_dir / img.name)
        # Our synthetic script applied exhaust, plate (paint), and mudguard (wheels) mods
        # I'll map them 1,1,1 to represent 'Highly Modified'
        data.append({
            "image_name": img.name,
            "exhaust_modified": 1,
            "paint_modified": 1,
            "wheels_changed": 1
        })
        
    df = pd.DataFrame(data)
    df.to_csv(output_csv, index=False)
    print(f"✅ Synchronized {len(df)} images. CSV saved to {output_csv}")

if __name__ == "__main__":
    sync_dataset()
