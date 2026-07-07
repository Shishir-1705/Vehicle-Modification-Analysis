import os
import shutil

def setup_yolo_dataset():
    """Initializes the YOLOv8 dataset hierarchy and moves existing images."""
    
    # Paths
    base_dir = "yolo_dataset"
    src_images_dir = os.path.join("vehicle_dataset", "images")
    
    # Create subdirectories
    subdirs = [
        os.path.join(base_dir, "images", "train"),
        os.path.join(base_dir, "images", "val"),
        os.path.join(base_dir, "labels", "train"),
        os.path.join(base_dir, "labels", "val")
    ]
    
    for subdir in subdirs:
        os.makedirs(subdir, exist_ok=True)
        print(f"Created directory: {subdir}")

    # Move images to train folder
    if os.path.exists(src_images_dir):
        image_files = [f for f in os.listdir(src_images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        for img_file in image_files:
            src_path = os.path.join(src_images_dir, img_file)
            dst_path = os.path.join(base_dir, "images", "train", img_file)
            shutil.copy2(src_path, dst_path)
            print(f"Copied {img_file} to {dst_path}")
    else:
        print(f"Warning: Source directory {src_images_dir} not found.")

    # Create data.yaml content
    # Note: Using absolute path for current workspace to avoid ambiguity
    abs_base_path = os.path.abspath(base_dir)
    data_yaml_content = f"""
path: {abs_base_path}
train: images/train
val: images/val

names:
  0: exhaust
  1: wheel
  2: headlight
"""
    
    yaml_path = os.path.join(base_dir, "data.yaml")
    with open(yaml_path, "w") as f:
        f.write(data_yaml_content.strip())
    
    print(f"\n[INFO] Created YOLO config at: {yaml_path}")
    print("\nNext step: Open LabelImg or Roboflow and point to this directory for annotation.")

if __name__ == "__main__":
    setup_yolo_dataset()
