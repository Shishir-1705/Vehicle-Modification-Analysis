"""
train_multi_label.py — Multi-label training for motorcycle modification detection.

Model  : MultiHeadBikeClassifier (EfficientNet-B0 backbone, 6 independent heads)
Loss   : BCEWithLogitsLoss  (no shared softmax)
Data   : MultiLabelBikeDataset  (Albumentations augmentation pipeline)

Usage (quick dev run):
  python ml_pipeline/train_multi_label.py --epochs 5 --mock

Usage (real data):
  python ml_pipeline/train_multi_label.py \\
      --csv   "D:/Vehicle Mod/augmented_dataset/annotations.csv" \\
      --epochs 30 \\
      --batch  32
"""

import os
import sys
import argparse
import glob

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import pandas as pd

# ── Make sure project root is importable ──────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_pipeline.dataset import MultiLabelBikeDataset, MOD_CLASSES

# ──────────────────────────────────────────────────────────────────────────────
# Default paths
# ──────────────────────────────────────────────────────────────────────────────
DEFAULT_CSV        = "D:/Vehicle Mod/augmented_dataset/annotations.csv"
LEGACY_CSV         = "D:/Vehicle Mod/dataset/multi_label_annotations.csv"
LEGACY_IMG_DIR     = "D:/Vehicle Mod/dataset/images/train/"
MODEL_SAVE_PATH    = "D:/Vehicle Mod/models/bike_model_multi_label_v1.pth"

DEVICE      = torch.device("cuda" if torch.cuda.is_available() else "cpu")
VAL_SPLIT   = 0.15

# ──────────────────────────────────────────────────────────────────────────────
# Mock CSV generator (for smoke-testing without real images)
# ──────────────────────────────────────────────────────────────────────────────
def _generate_mock_csv(csv_path: str, img_dir: str):
    """Create dummy placeholder images + one-hot CSV for smoke-testing."""
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    os.makedirs(img_dir, exist_ok=True)

    MINIMAL_JPEG = (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00'
        b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t'
        b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
        b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82'
        b'<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff'
        b'\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00'
        b'\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n'
        b'\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
    )

    existing = (
        glob.glob(os.path.join(img_dir, "*.jpg")) +
        glob.glob(os.path.join(img_dir, "*.png"))
    )
    if not existing:
        for i in range(1, 15):
            p = os.path.join(img_dir, f"bike_{i:03d}.jpg")
            with open(p, "wb") as f:
                f.write(MINIMAL_JPEG)
        existing = glob.glob(os.path.join(img_dir, "*.jpg"))

    rows = []
    for path in existing:
        name = os.path.basename(path)
        h    = hash(name)
        rows.append({
            "image_name":             name,
            "exhaust_modifications":  int(h % 3 == 0),
            "paint_changes":          int(h % 5 == 0),
            "wheel_swaps":            int(h % 7 == 0),
            "handlebar_alterations":  int(h % 11 == 0),
            "lighting_modifications": int(h % 13 == 0),
            "engine_tampering":       int(h % 17 == 0),
        })

    df = pd.DataFrame(rows)
    df.to_csv(csv_path, index=False)
    print(f"[mock] Generated {len(rows)}-row CSV at {csv_path}")
    return csv_path, img_dir


# ──────────────────────────────────────────────────────────────────────────────
# Model
# ──────────────────────────────────────────────────────────────────────────────
class MultiHeadBikeClassifier(nn.Module):
    """
    EfficientNet-B0 backbone with 6 independent binary classification heads.
    Each head outputs a raw logit (sigmoid applied by BCEWithLogitsLoss).
    """

    def __init__(self):
        super().__init__()
        from torchvision import models
        backbone = models.efficientnet_b0(weights=None)
        self.features = backbone.features
        self.pool     = nn.AdaptiveAvgPool2d(1)
        self.flatten  = nn.Flatten(1)

        in_features = backbone.classifier[1].in_features  # 1280 for B0

        def _head():
            return nn.Sequential(
                nn.Linear(in_features, 256),
                nn.ReLU(inplace=True),
                nn.Dropout(0.3),
                nn.Linear(256, 1),
            )

        self.exhaust_head   = _head()
        self.paint_head     = _head()
        self.wheels_head    = _head()
        self.handlebar_head = _head()
        self.lighting_head  = _head()
        self.engine_head    = _head()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.pool(x)
        x = self.flatten(x)
        return torch.cat([
            self.exhaust_head(x),
            self.paint_head(x),
            self.wheels_head(x),
            self.handlebar_head(x),
            self.lighting_head(x),
            self.engine_head(x),
        ], dim=1)   # shape: (B, 6)


def load_multi_label_model(path: str | None = None) -> MultiHeadBikeClassifier:
    """Load or initialise the multi-head classifier, handling weight mismatches."""
    model = MultiHeadBikeClassifier().to(DEVICE)

    if path and os.path.exists(path):
        try:
            state = torch.load(path, map_location=DEVICE, weights_only=True)
            model.load_state_dict(state)
            print(f"[model] Loaded weights from {path}")
        except (RuntimeError, Exception) as e:
            print(f"[model] Weight mismatch ({e}) — re-initialising fresh weights.")
            torch.save(model.state_dict(), path)
            print(f"[model] Saved fresh weights to {path}")
    else:
        os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
        torch.save(model.state_dict(), MODEL_SAVE_PATH)
        print("[model] Initialised fresh weights (no checkpoint found).")

    return model


# ──────────────────────────────────────────────────────────────────────────────
# Training loop
# ──────────────────────────────────────────────────────────────────────────────
def train_model(
    csv_file: str,
    img_dir: str | None,
    epochs: int,
    batch_size: int,
    aug_mode: str,
    lr: float,
):
    # ── Build dataset ──────────────────────────────────────────────────────
    full_dataset = MultiLabelBikeDataset(
        csv_file=csv_file,
        img_dir=img_dir,
        is_train=True,
        aug_mode=aug_mode,
        image_size=224,
    )

    n_val   = max(1, int(len(full_dataset) * VAL_SPLIT))
    n_train = len(full_dataset) - n_val
    train_ds, val_ds = random_split(full_dataset, [n_train, n_val])

    # Val split should use the val transform — swap it in
    val_ds.dataset = MultiLabelBikeDataset(
        csv_file=csv_file,
        img_dir=img_dir,
        is_train=False,
        image_size=224,
    )

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,
                              num_workers=0, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False,
                              num_workers=0, pin_memory=True)

    print(f"[data] Train: {n_train} samples  |  Val: {n_val} samples")

    # ── Model / optimiser / loss ──────────────────────────────────────────
    model     = load_multi_label_model(MODEL_SAVE_PATH)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_loss = float("inf")

    print(f"\n🚀 Training on {DEVICE}  |  {epochs} epochs  |  batch={batch_size}")
    print(f"   Augmentation mode : {aug_mode}")
    print(f"   Classes           : {', '.join(MOD_CLASSES)}\n")

    for epoch in range(1, epochs + 1):
        # ── Train ────────────────────────────────────────────────────────
        model.train()
        train_loss = 0.0
        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            loss = criterion(model(images), labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        train_loss /= len(train_loader)

        # ── Validate ──────────────────────────────────────────────────────
        model.eval()
        val_loss = 0.0
        correct  = torch.zeros(6, device=DEVICE)
        total    = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                val_loss += criterion(outputs, labels).item()
                preds    = (torch.sigmoid(outputs) > 0.5).float()
                correct  += (preds == labels).float().sum(dim=0)
                total    += labels.size(0)

        val_loss /= len(val_loader)
        per_class_acc = (correct / total * 100).cpu().tolist()
        mean_acc      = sum(per_class_acc) / len(per_class_acc)

        scheduler.step()

        print(
            f"Epoch [{epoch:>3}/{epochs}]  "
            f"train={train_loss:.4f}  val={val_loss:.4f}  "
            f"mAcc={mean_acc:.1f}%"
        )
        if epoch % 5 == 0 or epoch == epochs:
            class_str = "  ".join(
                f"{c[:3]}={a:.0f}%" for c, a in zip(MOD_CLASSES, per_class_acc)
            )
            print(f"            per-class: {class_str}")

        # ── Checkpoint ────────────────────────────────────────────────────
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"            ✅ Saved best model (val={val_loss:.4f})")

    print(f"\n✅ Training complete — best val loss: {best_val_loss:.4f}")
    print(f"   Model saved to: {MODEL_SAVE_PATH}")


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Multi-label bike modification trainer")
    parser.add_argument("--csv",    default=None,       help="Annotations CSV path")
    parser.add_argument("--imgdir", default=None,       help="Image base directory (if CSV uses filenames)")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch",  type=int, default=32)
    parser.add_argument("--lr",     type=float, default=1e-4)
    parser.add_argument("--mode",   default="random",
                        choices=["random", "day", "night", "dusk"],
                        help="Augmentation lighting mode")
    parser.add_argument("--mock",   action="store_true",
                        help="Generate mock data and run a short sanity-check train")
    args = parser.parse_args()

    csv_path = args.csv
    img_dir  = args.imgdir

    if args.mock:
        print("[mode] Running with MOCK data (smoke test)")
        csv_path, img_dir = _generate_mock_csv(LEGACY_CSV, LEGACY_IMG_DIR)
        args.epochs = max(args.epochs, 2)
    elif csv_path is None:
        # Auto-discover: prefer augmented dataset, fall back to legacy
        if os.path.exists(DEFAULT_CSV):
            csv_path = DEFAULT_CSV
            img_dir  = None
            print(f"[auto] Using augmented dataset CSV: {csv_path}")
        elif os.path.exists(LEGACY_CSV):
            csv_path = LEGACY_CSV
            img_dir  = LEGACY_IMG_DIR
            print(f"[auto] Using legacy dataset CSV: {csv_path}")
        else:
            print("[auto] No CSV found — generating mock data for smoke test.")
            csv_path, img_dir = _generate_mock_csv(LEGACY_CSV, LEGACY_IMG_DIR)
            args.epochs = 2

    train_model(
        csv_file=csv_path,
        img_dir=img_dir,
        epochs=args.epochs,
        batch_size=args.batch,
        aug_mode=args.mode,
        lr=args.lr,
    )
