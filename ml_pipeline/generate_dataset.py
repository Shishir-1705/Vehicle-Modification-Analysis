"""
generate_dataset.py — Bulk augmentation runner.

Expands raw class images to ≥10,000 annotated images per modification class,
then writes a unified annotations CSV ready for train_multi_label.py.

Directory layout expected:
  raw_data/
    exhaust/     *.jpg  (any count)
    paint/
    wheels/
    handlebar/
    lighting/
    engine/

Usage:
  python ml_pipeline/generate_dataset.py \\
      --raw_dir   "D:/Vehicle Mod/raw_data" \\
      --out_dir   "D:/Vehicle Mod/augmented_dataset" \\
      --target    10000 \\
      --csv_out   "D:/Vehicle Mod/augmented_dataset/annotations.csv"
"""

import os
import sys
import argparse
import csv
import time
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml_pipeline.augmentations import expand_class_to_target, MOD_CLASSES

# ──────────────────────────────────────────────────────────────────────────────
# Build per-class one-hot label rows
# ──────────────────────────────────────────────────────────────────────────────
def _write_annotations_csv(out_dir: str, csv_path: str):
    """
    Walk augmented_dataset/<class>/ folders and write a CSV with columns:
      image_path, exhaust, paint, wheels, handlebar, lighting, engine
    Each folder name maps to a one-hot positive label for that class.
    Multi-class images can be added manually later.
    """
    extensions = {".jpg", ".jpeg", ".png"}
    rows = []

    for cls in MOD_CLASSES:
        cls_dir = os.path.join(out_dir, cls)
        if not os.path.isdir(cls_dir):
            print(f"  [csv] Warning: class folder not found: {cls_dir}")
            continue
        for fname in os.listdir(cls_dir):
            if Path(fname).suffix.lower() not in extensions:
                continue
            full_path = os.path.join(cls_dir, fname)
            label_row = {c: 1 if c == cls else 0 for c in MOD_CLASSES}
            label_row["image_path"] = full_path
            rows.append(label_row)

    os.makedirs(Path(csv_path).parent, exist_ok=True)
    fieldnames = ["image_path"] + MOD_CLASSES

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n[csv] Wrote {len(rows)} rows → {csv_path}")
    return len(rows)


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Expand raw images to target count per class using augmentation"
    )
    parser.add_argument("--raw_dir",  required=True,  help="Root folder with one sub-dir per class")
    parser.add_argument("--out_dir",  required=True,  help="Output root for augmented images")
    parser.add_argument("--target",   type=int, default=10_000, help="Images per class (default 10000)")
    parser.add_argument("--size",     type=int, default=224,    help="Output image size (default 224)")
    parser.add_argument("--mode",     default="random",
                        choices=["random", "day", "night", "dusk"],
                        help="Lighting mode")
    parser.add_argument("--csv_out",  default=None,
                        help="Path to write annotations CSV (default: <out_dir>/annotations.csv)")
    args = parser.parse_args()

    csv_path = args.csv_out or os.path.join(args.out_dir, "annotations.csv")

    print("=" * 60)
    print("  Motorcycle Modification — Dataset Augmentation Pipeline")
    print("=" * 60)
    print(f"  Raw data  : {args.raw_dir}")
    print(f"  Output    : {args.out_dir}")
    print(f"  Target    : {args.target:,} images / class")
    print(f"  Mode      : {args.mode}")
    print(f"  CSV output: {csv_path}")
    print()

    totals = {}
    t0 = time.time()

    for cls in MOD_CLASSES:
        class_src = os.path.join(args.raw_dir, cls)
        class_dst = os.path.join(args.out_dir, cls)

        if not os.path.isdir(class_src):
            print(f"[SKIP] '{cls}' — raw source not found at {class_src}")
            totals[cls] = 0
            continue

        print(f"\n── Processing class: {cls.upper()} ──")
        try:
            n = expand_class_to_target(
                class_dir=class_src,
                output_dir=class_dst,
                target_count=args.target,
                image_size=args.size,
                mode=args.mode,
            )
            totals[cls] = n
        except Exception as e:
            print(f"  ERROR on class '{cls}': {e}")
            totals[cls] = -1

    elapsed = time.time() - t0

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  Augmentation Summary")
    print("=" * 60)
    all_ok = True
    for cls, n in totals.items():
        status = "✓" if n >= args.target else ("SKIP" if n == 0 else "✗")
        print(f"  [{status}]  {cls:<12}  {n:>7,} images")
        if n > 0 and n < args.target:
            all_ok = False
    print(f"\n  Total time : {elapsed:.1f}s")

    # ── Write CSV ─────────────────────────────────────────────────────────────
    total_rows = _write_annotations_csv(args.out_dir, csv_path)
    print(f"  CSV rows   : {total_rows:,}")
    print("=" * 60)

    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
