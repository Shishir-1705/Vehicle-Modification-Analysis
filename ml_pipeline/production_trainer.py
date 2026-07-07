import os
import json
import shutil
import glob
from ultralytics import YOLO

class IllegalModTrainer:
    """
    Industrial-grade ML Pipeline for Training Computer Vision models 
    to detect CMVR compliance violations on motorcycles.
    """
    
    CLASSES = [
        "missing_plate", "fancy_font_plate", "hidden_plate", "wrong_size_plate",
        "colored_plate", "modified_exhaust", "short_exhaust", "no_muffler",
        "underglow_lights", "flashing_red_blue_lights", "high_intensity_headlight", 
        "colored_headlight", "no_mirrors", "no_helmet", "triple_riding",
        "missing_indicators", "oversized_tires", "extended_handlebar", 
        "removed_mudguard", "frame_modification"
    ]
    
    def __init__(self, data_root="dataset"):
        self.data_root = data_root
        self.yaml_path = os.path.join(data_root, "prod_data.yaml")
        
    def write_yaml_config(self):
        """Generates the YOLO dataset configuration file."""
        # Use absolute paths for production reliability
        abs_data_root = os.path.abspath(self.data_root)
        
        yaml_content = {
            "path": abs_data_root,
            "train": "images/train",
            "val": "images/val",
            "names": {i: name for i, name in enumerate(self.CLASSES)}
        }
        
        import yaml
        with open(self.yaml_path, 'w') as f:
            yaml.dump(yaml_content, f, default_flow_style=False)
            
        print(f"✅ Generated production YAML at: {self.yaml_path}")
        return self.yaml_path

    def run_training_cycle(self, epochs=5, batch=8, model_type="segment"):
        """
        Executes a training cycle. 
        model_type: 'detect' for bbox, 'segment' for instance segmentation.
        """
        yaml_config = self.write_yaml_config()
        
        model_name = "yolov8l-seg.pt" if model_type == "segment" else "yolov8l.pt"
        print(f"🚀 Initializing {model_type.upper()} training with {model_name}...")
        
        model = YOLO(model_name)
        
        try:
            # High-performance training arguments
            results = model.train(
                data=yaml_config,
                epochs=epochs,
                batch=batch,
                imgsz=640,
                optimizer="AdamW",
                lr0=0.001,
                # Heavy Augmentations specialized for Indian road context
                fliplr=0.5,
                hsv_h=0.015,
                hsv_s=0.7,
                hsv_v=0.4,
                mixup=0.1,
                erasing=0.4,
                name=f"prod_compliance_{model_type}",
                device="cpu", # Defaulting to CPU as per plan
                plots=True
            )
            print(f"🎉 Training cycle complete. Weights saved to {results.save_dir}")
            return results
        except Exception as e:
            print(f"🛑 Training failed: {e}")
            return None

    def inject_hard_negatives(self, stock_images_dir="vehicle_dataset/stock"):
        """
        Implements the Hard Negative mining logic proposed in the plan.
        """
        print(f"⛏️ Looking for hard negatives in {stock_images_dir}...")
        # Placeholder for real inference logic once a base model exists
        pass

if __name__ == "__main__":
    trainer = IllegalModTrainer()
    # Smoke test: 2 epochs
    trainer.run_training_cycle(epochs=2, batch=4)
