import matplotlib.pyplot as plt
import cv2
import os
import glob
import numpy as np

def visualize_training_batch(data_dir, num_samples=4):
    """
    Plots a sample of images and labels from the training directory 
    to verify that the dataset setup is correct.
    """
    image_paths = glob.glob(os.path.join(data_dir, "images", "train", "*.jpg"))[:num_samples]
    
    if not image_paths:
        print("No training images found for visualization.")
        return

    plt.figure(figsize=(15, 10))
    for i, img_path in enumerate(image_paths):
        img = cv2.imread(img_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Look for matching label
        label_path = img_path.replace("images", "labels").replace(".jpg", ".txt")
        
        if os.path.exists(label_path):
            with open(label_path, 'r') as f:
                lines = f.readlines()
                for line in lines:
                    parts = line.split()
                    if len(parts) >= 5:
                        cls = int(parts[0])
                        # Draw center point for smoke test labels
                        h, w, _ = img.shape
                        cx, cy = float(parts[1]) * w, float(parts[2]) * h
                        cv2.circle(img, (int(cx), int(cy)), 10, (255, 0, 0), -1)
                        cv2.putText(img, str(cls), (int(cx), int(cy)-10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

        plt.subplot(1, num_samples, i + 1)
        plt.imshow(img)
        plt.title(os.path.basename(img_path))
        plt.axis('off')
    
    vis_path = os.path.join(data_dir, "training_setup_check.png")
    plt.savefig(vis_path)
    print(f"📈 Dataset visualization saved to {vis_path}")

if __name__ == "__main__":
    visualize_training_batch("dataset")
