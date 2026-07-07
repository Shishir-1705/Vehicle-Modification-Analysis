import os
import cv2
import imagehash
from PIL import Image

def get_image_blur_score(image_path):
    # Laplacian variance as a blur metric
    image = cv2.imread(image_path)
    if image is None:
        return 0
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()

def find_duplicates_and_blurry(dataset_dir, blur_threshold=100.0):
    hashes = {}
    duplicates = []
    blurry = []
    
    print(f"Scanning dataset in {dataset_dir}...")
    for root, _, files in os.walk(dataset_dir):
        for filename in files:
            if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
                
            file_path = os.path.join(root, filename)
            
            # Blur detection
            blur_score = get_image_blur_score(file_path)
            if blur_score < blur_threshold:
                blurry.append((file_path, blur_score))
                
            # Duplicate detection (Perceptual Hash)
            try:
                img = Image.open(file_path)
                img_hash = str(imagehash.phash(img))
                if img_hash in hashes:
                    duplicates.append((file_path, hashes[img_hash]))
                else:
                    hashes[img_hash] = file_path
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
                
    print(f"\n--- Data Quality Report ---")
    print(f"Total Images Scanned: {len(hashes) + len(duplicates)}")
    print(f"Found {len(blurry)} blurry images (threshold: {blur_threshold})")
    print(f"Found {len(duplicates)} duplicate/near-duplicate images.")
    
    return duplicates, blurry

if __name__ == "__main__":
    dataset_path = "D:/Vehicle Mod/vehicle_dataset/content/dataset"
    if os.path.exists(dataset_path):
        duplicates, blurry = find_duplicates_and_blurry(dataset_path)
        # Suggesting augmentations
        print("\nSuggestions:")
        print("1. Review blurry images and consider removing them.")
        print("2. Remove exact duplicates to prevent data leakage between train/val splits.")
        print("3. Add more edge-case transformations (like CLAHE) if classes are too similar.")
    else:
        print("Dataset path not found. Please run this script where the dataset is located.")
