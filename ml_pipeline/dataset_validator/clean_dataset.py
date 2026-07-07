import argparse
import sys
import json
import os
from .core import COCODatasetValidator
from .hard_negatives import inject_hard_negatives
from .exporter import export_to_yolo

def main():
    parser = argparse.ArgumentParser(description="Motorcycle Dataset Validator and Cleaner")
    parser.add_argument("--coco_json", required=True, help="Path to original COCO json")
    parser.add_argument("--image_dir", required=True, help="Path to images directory")
    parser.add_argument("--valid_classes", nargs='+', required=True, help="List of valid classes")
    parser.add_argument("--output_coco", help="Output path for cleaned COCO json")
    parser.add_argument("--export_yolo_dir", help="Output directory for YOLO format")
    parser.add_argument("--hard_negatives_dir", help="Directory with negative samples")
    
    args = parser.parse_args()
    
    print(f"Loading COCO dataset from {args.coco_json}")
    validator = COCODatasetValidator(
        coco_path=args.coco_json,
        image_dir=args.image_dir,
        valid_classes=args.valid_classes
    )
    
    print("Running validation pipeline...")
    validator.run_pipeline()
    
    if args.hard_negatives_dir:
        print(f"Injecting hard negatives from {args.hard_negatives_dir}")
        cleaned_coco, count = inject_hard_negatives(
            validator.cleaned_coco, 
            args.hard_negatives_dir, 
            args.image_dir
        )
        validator.cleaned_coco = cleaned_coco
        print(f"Added {count} hard negative background images.")
        
    print("\n--- VALIDATION REPORT ---")
    report = validator.get_report()
    print(json.dumps(report, indent=4))
    
    if args.output_coco:
        print(f"Saving cleaned COCO to {args.output_coco}")
        validator.save_coco(args.output_coco)
        
    if args.export_yolo_dir:
        print(f"Exporting to YOLO format in {args.export_yolo_dir}")
        export_to_yolo(validator.cleaned_coco, args.export_yolo_dir, args.image_dir, is_seg=True)
        
    print("Pipeline execution complete.")

if __name__ == "__main__":
    main()
