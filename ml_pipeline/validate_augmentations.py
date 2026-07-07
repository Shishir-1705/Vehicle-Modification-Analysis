"""
validate_augmentations.py
Quick smoke-test that verifies the entire augmentation pipeline
can be imported and run without errors.

Run from project root:
    python ml_pipeline/validate_augmentations.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def _banner(msg):
    print(f"\n{'='*55}\n  {msg}\n{'='*55}")

# ── 1. Import check ────────────────────────────────────────
_banner("1 / 5  Import checks")
try:
    import albumentations as A
    print(f"  ✓ albumentations {A.__version__}")
except ImportError as e:
    print(f"  ✗ albumentations not installed: {e}")
    print("    → Run: pip install albumentations")
    sys.exit(1)

try:
    import torch, torchvision, cv2, numpy as np
    print(f"  ✓ torch {torch.__version__}")
    print(f"  ✓ torchvision {torchvision.__version__}")
    print(f"  ✓ opencv-python {cv2.__version__}")
except ImportError as e:
    print(f"  ✗ Missing dependency: {e}")
    sys.exit(1)

from ml_pipeline.augmentations import (
    build_train_transform,
    build_val_transform,
    PartialOcclusion,
    CameraAngleWarp,
    expand_class_to_target,
    MOD_CLASSES,
)
print(f"  ✓ ml_pipeline.augmentations  (classes: {MOD_CLASSES})")

from ml_pipeline.dataset import MultiLabelBikeDataset, BikeDualStreamDataset
print(f"  ✓ ml_pipeline.dataset")

# ── 2. Synthetic image round-trip ─────────────────────────
_banner("2 / 5  Transform round-trips (synthetic 480×640 image)")

rng = np.random.default_rng(42)
fake_img = (rng.integers(0, 255, (480, 640, 3), dtype=np.uint8))

for mode in ("random", "day", "night", "dusk"):
    t   = build_train_transform(image_size=224, mode=mode)
    out = t(image=fake_img)["image"]
    assert out.shape == (3, 224, 224), f"Unexpected shape: {out.shape}"
    print(f"  ✓ mode='{mode}'  → tensor {tuple(out.shape)}  dtype={out.dtype}")

val_t = build_val_transform(image_size=224)
out   = val_t(image=fake_img)["image"]
assert out.shape == (3, 224, 224)
print(f"  ✓ val transform  → tensor {tuple(out.shape)}")

# ── 3. Custom transforms ────────────────────────────────────
_banner("3 / 5  Custom transform sanity checks")

occ  = PartialOcclusion(p=1.0)
warp = CameraAngleWarp(p=1.0)

# Albumentations custom transforms need __call__ with keyword arg
out_occ  = occ(image=fake_img)["image"]
out_warp = warp(image=fake_img)["image"]

assert out_occ.shape  == fake_img.shape, "PartialOcclusion changed shape"
assert out_warp.shape == fake_img.shape, "CameraAngleWarp changed shape"
print(f"  ✓ PartialOcclusion  output shape: {out_occ.shape}")
print(f"  ✓ CameraAngleWarp   output shape: {out_warp.shape}")

# ── 4. Dataset with temp CSV ────────────────────────────────
_banner("4 / 5  MultiLabelBikeDataset with synthetic data")

import tempfile, csv
from pathlib import Path

with tempfile.TemporaryDirectory() as tmpdir:
    img_dir = os.path.join(tmpdir, "images")
    os.makedirs(img_dir)

    # Write minimal valid JPEG bytes
    MINI_JPEG = (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00'
        b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t'
        b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
        b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82'
        b'<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff'
        b'\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00'
        b'\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n'
        b'\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
    )
    img_files = []
    for i in range(6):
        p = os.path.join(img_dir, f"test_{i}.jpg")
        with open(p, "wb") as f:
            f.write(MINI_JPEG)
        img_files.append(p)

    # Write absolute-path CSV
    csv_path = os.path.join(tmpdir, "annotations.csv")
    fieldnames = ["image_path"] + MOD_CLASSES
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for i, p in enumerate(img_files):
            row = {"image_path": p}
            for j, cls in enumerate(MOD_CLASSES):
                row[cls] = 1 if j == i % 6 else 0
            w.writerow(row)

    ds_train = MultiLabelBikeDataset(csv_path, is_train=True,  image_size=224)
    ds_val   = MultiLabelBikeDataset(csv_path, is_train=False, image_size=224)
    print(f"  ✓ Train dataset: {len(ds_train)} samples")
    print(f"  ✓ Val   dataset: {len(ds_val)} samples")

    img_t, lbl_t = ds_train[0]
    print(f"  ✓ Sample: image {tuple(img_t.shape)}  label {tuple(lbl_t.shape)}  dtype={lbl_t.dtype}")
    assert img_t.shape == (3, 224, 224)
    assert lbl_t.shape == (6,)

# ── 5. DataLoader batch ────────────────────────────────────
_banner("5 / 5  DataLoader batch test")

from torch.utils.data import DataLoader

# Re-create dataset in a new temp dir since previous was cleaned up
with tempfile.TemporaryDirectory() as tmpdir:
    img_dir = os.path.join(tmpdir, "images")
    os.makedirs(img_dir)
    for i in range(8):
        with open(os.path.join(img_dir, f"bike_{i}.jpg"), "wb") as f:
            f.write(MINI_JPEG)

    csv_path = os.path.join(tmpdir, "annotations.csv")
    fieldnames = ["image_path"] + MOD_CLASSES
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for i in range(8):
            row = {"image_path": os.path.join(img_dir, f"bike_{i}.jpg")}
            for j, cls in enumerate(MOD_CLASSES):
                row[cls] = 1 if j == i % 6 else 0
            w.writerow(row)

    ds  = MultiLabelBikeDataset(csv_path, is_train=False, image_size=224)
    dl  = DataLoader(ds, batch_size=4, shuffle=False, num_workers=0)
    imgs, lbls = next(iter(dl))
    print(f"  ✓ Batch images: {tuple(imgs.shape)}")
    print(f"  ✓ Batch labels: {tuple(lbls.shape)}")
    assert imgs.shape == (4, 3, 224, 224)
    assert lbls.shape == (4, 6)

# ── Done ─────────────────────────────────────────────────
_banner("ALL CHECKS PASSED ✅")
print("""
  The augmentation pipeline is fully operational.

  Next steps:
  ┌──────────────────────────────────────────────────────┐
  │  1. Place raw images under:                          │
  │       D:/Vehicle Mod/raw_data/<class>/               │
  │     (one sub-folder per class name in MOD_CLASSES)   │
  │                                                      │
  │  2. Run the dataset generator:                       │
  │       python ml_pipeline/generate_dataset.py \\       │
  │         --raw_dir  "D:/Vehicle Mod/raw_data" \\       │
  │         --out_dir  "D:/Vehicle Mod/augmented_dataset"│
  │         --target   10000                             │
  │                                                      │
  │  3. Train the multi-head classifier:                 │
  │       python ml_pipeline/train_multi_label.py        │
  │         --epochs 30 --batch 32                       │
  │                                                      │
  │  Smoke-test with mock data:                          │
  │       python ml_pipeline/train_multi_label.py --mock │
  └──────────────────────────────────────────────────────┘
""")
