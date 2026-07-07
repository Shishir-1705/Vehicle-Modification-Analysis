import os
import shutil

BASE_DIR = "vehicle_dataset/content/dataset"

for cls in ["stock", "modified"]:
    class_path = os.path.join(BASE_DIR, cls)

    for bike_folder in os.listdir(class_path):
        bike_path = os.path.join(class_path, bike_folder)

        if os.path.isdir(bike_path):
            for img in os.listdir(bike_path):
                src = os.path.join(bike_path, img)
                dst = os.path.join(class_path, f"{bike_folder}_{img}")

                shutil.move(src, dst)

            os.rmdir(bike_path)

print("✅ Dataset flattened successfully!")