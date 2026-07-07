"""
dataset.py — Dataset classes for motorcycle modification detection.

Provides:
  - SmartROICropper     : YOLO-based ROI crop for dual-stream input
  - BikeDualStreamDataset : Dual-stream (full + ROI) dataset with Albumentations
  - MultiLabelBikeDataset : Flat single-stream multi-label dataset (CSV-based)
"""

import os
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset
from PIL import Image
from pathlib import Path

try:
    from ultralytics import YOLO
    _HAS_YOLO = True
except ImportError:
    _HAS_YOLO = False

from ml_pipeline.augmentations import (
    build_train_transform,
    build_val_transform,
)

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────
MOD_CLASSES = [
    "exhaust_modifications",
    "paint_changes",
    "wheel_swaps",
    "handlebar_alterations",
    "lighting_modifications",
    "engine_tampering",
]

_IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)


# ──────────────────────────────────────────────────────────────────────────────
# Helper: load an image as RGB uint8 numpy array
# ──────────────────────────────────────────────────────────────────────────────
def _load_rgb(path: str) -> np.ndarray:
    img_bgr = cv2.imread(path)
    if img_bgr is None:
        # Fallback: try via PIL (handles unusual formats)
        img_bgr = np.array(Image.open(path).convert("RGB"))
        return img_bgr
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


# ──────────────────────────────────────────────────────────────────────────────
# SmartROICropper
# ──────────────────────────────────────────────────────────────────────────────
class SmartROICropper:
    """
    Uses a YOLO detector to locate bike parts and return an ROI crop.
    Falls back to the bottom-40% region if no part is detected.
    """

    def __init__(self, yolo_weights: str = "yolov8n.pt"):
        self.detector = None
        if _HAS_YOLO:
            try:
                self.detector = YOLO(yolo_weights)
            except Exception:
                try:
                    self.detector = YOLO("yolov8n.pt")
                except Exception:
                    self.detector = None

    def get_crops(self, image_path: str) -> tuple[np.ndarray, np.ndarray]:
        """
        Returns (full_rgb, roi_rgb) as uint8 numpy arrays.
        """
        full_rgb = _load_rgb(image_path)
        roi_rgb  = self._extract_roi(full_rgb)
        return full_rgb, roi_rgb

    def _extract_roi(self, img_rgb: np.ndarray) -> np.ndarray:
        if self.detector is not None:
            try:
                results = self.detector(img_rgb, verbose=False)[0]
                for box in results.boxes:
                    cls = int(box.cls[0])
                    if cls in [1, 2, 4]:          # exhaust / wheels / custom parts
                        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                        h, w = img_rgb.shape[:2]
                        y1 = max(0, y1 - 15);  y2 = min(h, y2 + 15)
                        x1 = max(0, x1 - 15);  x2 = min(w, x2 + 15)
                        return img_rgb[y1:y2, x1:x2]
            except Exception:
                pass

        # Fallback: bottom 40% (most bike mods live here)
        h = img_rgb.shape[0]
        return img_rgb[int(h * 0.6):, :]


# ──────────────────────────────────────────────────────────────────────────────
# BikeDualStreamDataset  (global view + ROI view, with Albumentations)
# ──────────────────────────────────────────────────────────────────────────────
class BikeDualStreamDataset(Dataset):
    """
    Dual-stream dataset returning (global_tensor, roi_tensor, label_tensor).

    Args:
        image_paths : list of absolute image file paths
        labels      : list of int class indices  OR  list of float32 arrays
                      for multi-label (shape [6])
        yolo_weights: YOLO checkpoint for ROI cropping
        is_train    : if True, applies heavy Albumentations augmentation;
                      otherwise applies only resize + normalize
        aug_mode    : lighting preset passed to build_train_transform
                      ("random" | "day" | "night" | "dusk")
        image_size  : spatial size for both streams
    """

    def __init__(
        self,
        image_paths: list,
        labels: list,
        yolo_weights: str = "yolov8n.pt",
        is_train: bool = True,
        aug_mode: str = "random",
        image_size: int = 224,
    ):
        self.image_paths = image_paths
        self.labels      = labels
        self.cropper     = SmartROICropper(yolo_weights)
        self.is_train    = is_train

        if is_train:
            self.transform = build_train_transform(image_size=image_size, mode=aug_mode)
        else:
            self.transform = build_val_transform(image_size=image_size)

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int):
        path  = self.image_paths[idx]
        label = self.labels[idx]

        full_rgb, roi_rgb = self.cropper.get_crops(path)

        # Albumentations expects uint8 HWC RGB
        global_t = self.transform(image=full_rgb)["image"]   # C×H×W float
        local_t  = self.transform(image=roi_rgb)["image"]    # C×H×W float

        if isinstance(label, (int, np.integer)):
            label_t = torch.tensor(label, dtype=torch.long)
        else:
            label_t = torch.tensor(np.asarray(label, dtype=np.float32))

        return global_t, local_t, label_t


# ──────────────────────────────────────────────────────────────────────────────
# MultiLabelBikeDataset  (single-stream, CSV-based)
# ──────────────────────────────────────────────────────────────────────────────
class MultiLabelBikeDataset(Dataset):
    """
    Single-stream multi-label dataset driven by an annotations CSV.

    CSV format (produced by generate_dataset.py):
      image_path, exhaust, paint, wheels, handlebar, lighting, engine

    or legacy format:
      image_name, exhaust_modifications, paint_changes, ...
      (in which case img_dir must be provided)

    Args:
        csv_file  : path to annotations CSV
        img_dir   : optional base directory; if None, csv must contain absolute paths
        is_train  : toggles augmentation
        aug_mode  : lighting preset
        image_size: spatial size
        class_columns: column names for the 6 modification heads
    """

    def __init__(
        self,
        csv_file: str,
        img_dir: str | None = None,
        is_train: bool = True,
        aug_mode: str = "random",
        image_size: int = 224,
        class_columns: list | None = None,
    ):
        import pandas as pd
        self.df        = pd.read_csv(csv_file)
        self.img_dir   = img_dir
        self.class_cols = class_columns or MOD_CLASSES

        # Detect whether CSV uses absolute paths or bare filenames
        first_val = str(self.df.iloc[0, 0])
        self._abs_paths = os.path.isabs(first_val) or os.path.exists(first_val)

        if is_train:
            self.transform = build_train_transform(image_size=image_size, mode=aug_mode)
        else:
            self.transform = build_val_transform(image_size=image_size)

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int):
        row = self.df.iloc[idx]

        if self._abs_paths:
            img_path = str(row.iloc[0])
        else:
            img_path = os.path.join(self.img_dir, str(row.iloc[0]))

        img_rgb = _load_rgb(img_path)
        tensor  = self.transform(image=img_rgb)["image"]

        labels  = row[self.class_cols].values.astype("float32")
        return tensor, torch.tensor(labels)
