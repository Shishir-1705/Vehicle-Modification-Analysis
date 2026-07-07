import cv2
import numpy as np
import os
import random
from pathlib import Path

def synthesize_modification(image_path, target_path):
    """
    Applies synthetic 'illegal modifications' to a motorcycle image.
    """
    img = cv2.imread(str(image_path))
    if img is None:
        print(f"Warning: Could not read {image_path}")
        return

    h, w = img.shape[:2]
    
    # 1. Simulate Illegal Exhaust (Add a darker aftermarket-style overlay)
    # Roughly where an exhaust would be (lower right for side profile)
    ex_x1, ex_y1 = int(w * 0.6), int(h * 0.6)
    ex_x2, ex_y2 = int(w * 0.95), int(h * 0.9)
    
    exhaust_overlay = img.copy()
    cv2.rectangle(exhaust_overlay, (ex_x1, ex_y1), (ex_x2, ex_y2), (30, 30, 30), -1)
    # Add some 'shine' to look like chrome
    cv2.line(exhaust_overlay, (ex_x1, ex_y1+10), (ex_x2, ex_y1+20), (100, 100, 100), 2)
    
    alpha = 0.6
    img = cv2.addWeighted(exhaust_overlay, alpha, img, 1 - alpha, 0)

    # 2. Simulate Fancy Number Plate (Plate obfuscation/blur)
    # Often located at rear center-bottom or front center
    np_x1, np_y1 = int(w * 0.4), int(h * 0.7)
    np_x2, np_y2 = int(w * 0.6), int(h * 0.85)
    
    plate_roi = img[np_y1:np_y2, np_x1:np_x2]
    if plate_roi.size > 0:
        # Blur the plate significantly
        plate_roi = cv2.GaussianBlur(plate_roi, (25, 25), 0)
        # Add 'fancy' text simulation
        cv2.putText(plate_roi, "KING", (5, 20), cv2.FONT_HERSHEY_SCRIPT_COMPLEX, 0.5, (0, 0, 255), 1)
        img[np_y1:np_y2, np_x1:np_x2] = plate_roi

    # 3. Simulate Structural Change (Remove/Mask Mudguard)
    # Usually rear-most part
    mg_x1, mg_y1 = int(w * 0.8), int(h * 0.5)
    mg_x2, mg_y2 = int(w * 1.0), int(h * 0.8)
    
    # Fill with background-like color (simple replacement)
    mask_color = img[0, 0].tolist() # Use top-left pixel as crude BG estimate
    cv2.rectangle(img, (mg_x1, mg_y1), (mg_x2, mg_y2), mask_color, -1)

    cv2.imwrite(str(target_path), img)

def main():
    source_dir = Path(r"D:\Vehicle Mod\vehicle_dataset\content\dataset\stock")
    target_base = Path(r"D:\Vehicle Mod\vehicle_dataset\content\dataset\modified")
    
    target_base.mkdir(parents=True, exist_ok=True)
    
    images = list(source_dir.glob("*.jpg"))
    print(f"Starting synthesis for {len(images)} images...")
    
    for i, img_path in enumerate(images):
        # The filename already includes the model name due to previous flattening
        # e.g., bajaj-pulsar-150_000008.jpg
        target_path = target_base / img_path.name
        
        synthesize_modification(img_path, target_path)
        
        if (i + 1) % 50 == 0:
            print(f"Processed {i + 1}/{len(images)} images...")

    print(f"✅ Synthesis complete. Modified dataset created at {target_base}")

if __name__ == "__main__":
    main()
