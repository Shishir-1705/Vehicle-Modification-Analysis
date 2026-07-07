"""
augmentations.py — Albumentations augmentation pipeline for motorcycle modification detection.

Implements:
  - Random lighting conditions  (day / night / dusk)
  - Motion blur simulation
  - Rain & fog overlays
  - Partial occlusion masks
  - Camera-angle perspective transforms (top-down, side, 45°)

Usage:
  from ml_pipeline.augmentations import build_train_transform, build_val_transform

  transform = build_train_transform(mode="random")  # or "night" / "dusk" / "rain" / "fog"
  augmented  = transform(image=np_image)["image"]   # RGB uint8 → RGB uint8
"""

import random
import numpy as np
import cv2
import albumentations as A
from albumentations.pytorch import ToTensorV2

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD  = (0.229, 0.224, 0.225)

MOD_CLASSES = [
    "exhaust", "paint", "wheels", "handlebar", "lighting", "engine"
]

# ──────────────────────────────────────────────────────────────────────────────
# Helper: custom occlusion transform (Albumentations-compatible)
# ──────────────────────────────────────────────────────────────────────────────
class PartialOcclusion(A.ImageOnlyTransform):
    """
    Randomly draws 1-4 black rectangles of varying sizes on the image to
    simulate partial occlusion by other vehicles, poles, or roadside objects.
    """
    def __init__(
        self,
        max_holes: int = 4,
        max_h_fraction: float = 0.25,
        max_w_fraction: float = 0.25,
        fill_value: int = 0,
        always_apply: bool = False,
        p: float = 0.5,
    ):
        super().__init__(always_apply=always_apply, p=p)
        self.max_holes      = max_holes
        self.max_h_fraction = max_h_fraction
        self.max_w_fraction = max_w_fraction
        self.fill_value     = fill_value

    def apply(self, img, **params):
        img = img.copy()
        h, w = img.shape[:2]
        n_holes = random.randint(1, self.max_holes)
        for _ in range(n_holes):
            bh = random.randint(int(h * 0.05), int(h * self.max_h_fraction))
            bw = random.randint(int(w * 0.05), int(w * self.max_w_fraction))
            y1 = random.randint(0, h - bh)
            x1 = random.randint(0, w - bw)
            img[y1:y1+bh, x1:x1+bw] = self.fill_value
        return img

    def get_transform_init_args_names(self):
        return ("max_holes", "max_h_fraction", "max_w_fraction", "fill_value")


# ──────────────────────────────────────────────────────────────────────────────
# Helper: camera-angle perspective warp
# ──────────────────────────────────────────────────────────────────────────────
class CameraAngleWarp(A.DualTransform):
    """
    Applies a perspective warp that simulates three common dashcam/CCTV angles:
      'top_down'  – looking slightly down on the bike
      'side'      – lateral camera mounted lower
      '45deg'     – typical angled intersection camera
    The mode is chosen randomly among those supplied.
    """
    def __init__(
        self,
        modes=("top_down", "side", "45deg"),
        strength: float = 0.08,
        always_apply: bool = False,
        p: float = 0.5,
    ):
        super().__init__(always_apply=always_apply, p=p)
        self.modes    = modes
        self.strength = strength  # fraction of image dimension for warp offset

    def apply(self, img, mode="45deg", **params):
        h, w = img.shape[:2]
        s = self.strength
        src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])

        if mode == "top_down":
            # Compress top, expand bottom → bird's eye tilt
            dst = np.float32([
                [w * s,      0],
                [w * (1-s),  0],
                [w,          h],
                [0,          h],
            ])
        elif mode == "side":
            # Shear horizontally → lateral camera
            dst = np.float32([
                [0,          h * s],
                [w,          0],
                [w,          h],
                [0,          h * (1-s)],
            ])
        else:  # "45deg"
            dst = np.float32([
                [w * s,      h * s],
                [w * (1-s),  h * s],
                [w,          h],
                [0,          h],
            ])

        M   = cv2.getPerspectiveTransform(src, dst)
        out = cv2.warpPerspective(img, M, (w, h), borderMode=cv2.BORDER_REFLECT_101)
        return out

    def apply_to_mask(self, mask, mode="45deg", **params):
        return self.apply(mask, mode=mode, **params)

    def get_params(self):
        return {"mode": random.choice(self.modes)}

    def get_transform_init_args_names(self):
        return ("modes", "strength")


# ──────────────────────────────────────────────────────────────────────────────
# Lighting sub-pipelines
# ──────────────────────────────────────────────────────────────────────────────
def _daylight_aug():
    return A.Compose([
        A.RandomBrightnessContrast(brightness_limit=0.25, contrast_limit=0.25, p=0.8),
        A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=15, p=0.5),
        A.CLAHE(clip_limit=3.0, tile_grid_size=(8, 8), p=0.3),
    ])

def _night_aug():
    """Simulate low-light / night conditions."""
    return A.Compose([
        A.RandomBrightnessContrast(brightness_limit=(-0.6, -0.3), contrast_limit=(-0.2, 0.1), p=1.0),
        A.HueSaturationValue(sat_shift_limit=(-40, -20), val_shift_limit=(-30, -10), p=0.9),
        A.GaussNoise(var_limit=(30, 80), p=0.7),
        A.RandomGamma(gamma_limit=(40, 80), p=0.6),  # darken gamma
    ])

def _dusk_aug():
    """Simulate dusk / golden-hour warm cast."""
    return A.Compose([
        A.RandomBrightnessContrast(brightness_limit=(-0.15, 0.05), contrast_limit=(-0.1, 0.15), p=0.9),
        A.HueSaturationValue(hue_shift_limit=(-5, 15), sat_shift_limit=(10, 30), val_shift_limit=(-20, 5), p=0.8),
        A.RGBShift(r_shift_limit=20, g_shift_limit=5, b_shift_limit=-15, p=0.7),  # warm orange tint
    ])

_LIGHTING_MODES = {
    "day":   _daylight_aug,
    "night": _night_aug,
    "dusk":  _dusk_aug,
}

# ──────────────────────────────────────────────────────────────────────────────
# Weather sub-pipelines
# ──────────────────────────────────────────────────────────────────────────────
def _rain_aug():
    return A.Compose([
        A.RandomRain(
            slant_lower=-10, slant_upper=10,
            drop_length=20, drop_width=1,
            drop_color=(200, 200, 200),
            blur_value=3,
            brightness_coefficient=0.8,
            rain_type="drizzle",
            p=1.0,
        ),
        A.RandomBrightnessContrast(brightness_limit=(-0.2, 0.0), p=0.5),
    ])

def _fog_aug():
    return A.Compose([
        A.RandomFog(fog_coef_lower=0.2, fog_coef_upper=0.5, alpha_coef=0.1, p=1.0),
    ])


# ──────────────────────────────────────────────────────────────────────────────
# Motion blur (forward driving, panning)
# ──────────────────────────────────────────────────────────────────────────────
def _motion_blur_aug():
    return A.Compose([
        A.OneOf([
            A.MotionBlur(blur_limit=(7, 21), p=1.0),
            A.Blur(blur_limit=(3, 7), p=1.0),
        ], p=1.0),
    ])


# ──────────────────────────────────────────────────────────────────────────────
# Build full training transform
# ──────────────────────────────────────────────────────────────────────────────
def build_train_transform(
    image_size: int = 224,
    mode: str = "random",         # "random" | "day" | "night" | "dusk" | "rain" | "fog"
    p_weather: float = 0.35,
    p_motion_blur: float = 0.40,
    p_occlusion: float = 0.35,
    p_camera_warp: float = 0.30,
) -> A.Compose:
    """
    Returns a full Albumentations training transform.

    Args:
        image_size:    Target H×W after resize.
        mode:          Lighting preset or "random" to pick per-image.
        p_weather:     Probability of applying rain or fog overlay.
        p_motion_blur: Probability of motion blur.
        p_occlusion:   Probability of partial occlusion mask.
        p_camera_warp: Probability of perspective warp.

    Returns:
        albumentations.Compose
    """
    # ── Lighting block ───────────────────────────────────────────────────────
    if mode == "random":
        lighting_block = A.OneOf([
            _daylight_aug(),
            _night_aug(),
            _dusk_aug(),
        ], p=0.90)
    elif mode in _LIGHTING_MODES:
        lighting_block = _LIGHTING_MODES[mode]()
    else:
        raise ValueError(f"Unknown mode '{mode}'. Choose from: random, day, night, dusk, rain, fog")

    # ── Weather block ─────────────────────────────────────────────────────────
    weather_block = A.OneOf([
        _rain_aug(),
        _fog_aug(),
    ], p=p_weather)

    return A.Compose([
        # 1. Geometry / camera angle first (before pixel ops)
        CameraAngleWarp(modes=("top_down", "side", "45deg"), strength=0.08, p=p_camera_warp),
        A.HorizontalFlip(p=0.5),
        A.ShiftScaleRotate(
            shift_limit=0.08,
            scale_limit=0.15,
            rotate_limit=15,
            border_mode=cv2.BORDER_REFLECT_101,
            p=0.6,
        ),

        # 2. Resize to target (after geometry for best quality)
        A.Resize(image_size, image_size),

        # 3. Lighting conditions
        lighting_block,

        # 4. Weather overlays
        weather_block,

        # 5. Motion blur (simulates moving vehicle)
        A.SomeOf([
            _motion_blur_aug(),
        ], n=1, p=p_motion_blur),

        # 6. Partial occlusion (other vehicles, poles, etc.)
        PartialOcclusion(max_holes=3, max_h_fraction=0.25, max_w_fraction=0.25, p=p_occlusion),

        # 7. Fine-grained pixel noise / artefacts
        A.OneOf([
            A.GaussNoise(var_limit=(10, 50), p=1.0),
            A.ISONoise(color_shift=(0.01, 0.05), intensity=(0.05, 0.3), p=1.0),
            A.ImageCompression(quality_lower=50, quality_upper=90, p=1.0),
        ], p=0.4),

        # 8. Normalise → tensor
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ToTensorV2(),
    ])


# ──────────────────────────────────────────────────────────────────────────────
# Validation transform (no augmentation)
# ──────────────────────────────────────────────────────────────────────────────
def build_val_transform(image_size: int = 224) -> A.Compose:
    return A.Compose([
        A.Resize(image_size, image_size),
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ToTensorV2(),
    ])


# ──────────────────────────────────────────────────────────────────────────────
# Dataset-generation helper: produce N synthetic variants of one source image
# ──────────────────────────────────────────────────────────────────────────────
def augment_and_save(
    src_image_path: str,
    output_dir: str,
    n_variants: int = 20,
    image_size: int = 224,
    mode: str = "random",
) -> list[str]:
    """
    Generate `n_variants` augmented versions of a single source image and save
    them to `output_dir`.

    Returns:
        List of saved file paths.
    """
    import os
    from pathlib import Path

    os.makedirs(output_dir, exist_ok=True)
    img_bgr = cv2.imread(src_image_path)
    if img_bgr is None:
        raise FileNotFoundError(f"Cannot read image: {src_image_path}")
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    stem    = Path(src_image_path).stem
    transform = build_train_transform(image_size=image_size, mode=mode)
    saved = []

    for i in range(n_variants):
        aug_tensor = transform(image=img_rgb)["image"]  # C×H×W float tensor
        # Convert back to uint8 for saving
        aug_np = (aug_tensor.permute(1, 2, 0).numpy() * np.array(IMAGENET_STD) + np.array(IMAGENET_MEAN))
        aug_np = np.clip(aug_np * 255, 0, 255).astype(np.uint8)
        out_path = os.path.join(output_dir, f"{stem}_aug_{i:04d}.jpg")
        cv2.imwrite(out_path, cv2.cvtColor(aug_np, cv2.COLOR_RGB2BGR))
        saved.append(out_path)

    return saved


# ──────────────────────────────────────────────────────────────────────────────
# Bulk pipeline: augment entire class folder to reach target count
# ──────────────────────────────────────────────────────────────────────────────
def expand_class_to_target(
    class_dir: str,
    output_dir: str,
    target_count: int = 10_000,
    image_size: int = 224,
    mode: str = "random",
    extensions: tuple = (".jpg", ".jpeg", ".png"),
) -> int:
    """
    Augment all images in `class_dir` until `output_dir` contains at least
    `target_count` images.

    Returns:
        Total image count in output_dir after augmentation.
    """
    import os
    import shutil
    from pathlib import Path

    os.makedirs(output_dir, exist_ok=True)

    source_files = [
        str(p) for p in Path(class_dir).rglob("*")
        if p.suffix.lower() in extensions
    ]
    if not source_files:
        raise FileNotFoundError(f"No source images found in {class_dir}")

    # Copy originals first
    for src in source_files:
        dst = os.path.join(output_dir, Path(src).name)
        if not os.path.exists(dst):
            shutil.copy2(src, dst)

    existing = len([f for f in os.listdir(output_dir) if f.lower().endswith(extensions)])
    needed   = max(0, target_count - existing)

    if needed == 0:
        print(f"[augment] '{output_dir}' already has {existing} images — target met.")
        return existing

    print(f"[augment] Need {needed} more images for '{output_dir}' (have {existing}).")

    variants_per_image = max(1, (needed // len(source_files)) + 1)
    generated = 0
    transform = build_train_transform(image_size=image_size, mode=mode)

    for src in source_files:
        if generated >= needed:
            break
        img_bgr = cv2.imread(src)
        if img_bgr is None:
            continue
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        stem    = Path(src).stem

        for i in range(variants_per_image):
            if generated >= needed:
                break
            try:
                aug_tensor = transform(image=img_rgb)["image"]
                aug_np = (aug_tensor.permute(1, 2, 0).numpy() * np.array(IMAGENET_STD) + np.array(IMAGENET_MEAN))
                aug_np = np.clip(aug_np * 255, 0, 255).astype(np.uint8)
                out_path = os.path.join(output_dir, f"{stem}_aug_{generated:05d}.jpg")
                cv2.imwrite(out_path, cv2.cvtColor(aug_np, cv2.COLOR_RGB2BGR))
                generated += 1
            except Exception as e:
                print(f"[augment] Warning: failed on {src} variant {i}: {e}")

    total = existing + generated
    print(f"[augment] Done — generated {generated} images. Total: {total}")
    return total


# ──────────────────────────────────────────────────────────────────────────────
# CLI entry-point
# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse, sys

    parser = argparse.ArgumentParser(description="Dataset augmentation pipeline for bike mod detection")
    parser.add_argument("--class_dir",  required=True,  help="Source image folder for ONE class")
    parser.add_argument("--output_dir", required=True,  help="Output folder for augmented images")
    parser.add_argument("--target",     type=int, default=10_000, help="Target image count (default 10000)")
    parser.add_argument("--size",       type=int, default=224,    help="Output image size (default 224)")
    parser.add_argument("--mode",       default="random",
                        choices=["random", "day", "night", "dusk"],
                        help="Lighting mode")
    args = parser.parse_args()

    total = expand_class_to_target(
        class_dir=args.class_dir,
        output_dir=args.output_dir,
        target_count=args.target,
        image_size=args.size,
        mode=args.mode,
    )
    print(f"Final image count: {total}")
    sys.exit(0 if total >= args.target else 1)
