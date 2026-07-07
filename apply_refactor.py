import os
import shutil
import subprocess

def refactor_project():
    print("🚀 Starting Project Refactoring...")

    # Create directories
    os.makedirs("archive", exist_ok=True)
    os.makedirs("models", exist_ok=True)

    # Files to move
    moves = [
        ("mobile_archive.zip", "archive/mobile_archive.zip"),
        ("yolov8n-seg.pt", "models/yolov8n-seg.pt"),
        ("yolov8n-seg.onnx", "models/yolov8n-seg.onnx")
    ]

    for src, dst in moves:
        if os.path.exists(src):
            shutil.move(src, dst)
            print(f"✅ Moved {src} -> {dst}")
        elif os.path.exists(dst):
            print(f"⏭️  Already moved {dst}")
        else:
            print(f"⚠️ Source file {src} not found.")

    # Pip freeze
    try:
        with open("requirements-lock.txt", "w") as f:
            subprocess.run(["pip", "freeze"], stdout=f, check=True)
        print("✅ Created requirements-lock.txt")
    except Exception as e:
        print(f"⚠️ Failed to create requirements-lock.txt: {e}")

    print("🎉 Refactoring script complete!")

if __name__ == "__main__":
    refactor_project()
