import cv2
import numpy as np
from ultralytics import YOLO

class ProductionInference:
    """
    Production-ready Deployment engine handling ultra-low latency model prediction, 
    OpenCV Alpha Blending for transparent masks, and Exporting.
    """
    
    def __init__(self, model_weights="runs/segment/prod_compliance_seg/weights/best.pt"):
        try:
            # Fallback to base model for initialization if training hasn't dumped best.pt yet
            print(f"Loading weights: {model_weights}")
            self.model = YOLO(model_weights)
        except Exception:
            print("Production weights missing (not trained yet). Booting base yolo seg model.")
            self.model = YOLO("yolov8l-seg.pt")
            
        # Hardcode specific alert colors for classes (BGR Format for OpenCV)
        self.colors = {
            "missing_plate": (0, 0, 255),       # Red
            "exhaust": (0, 165, 255),           # Orange
            "lighting": (255, 0, 255),          # Magenta
            "safety": (255, 255, 0),            # Cyan
            "structural": (128, 0, 128),        # Purple
        }

    def predict(self, image_path_or_matrix):
        """
        Runs the exact inference and returns rigorously structured arrays:
        - Bounding Boxes
        - Class Labels
        - Confidence Scores
        - Segmentation Masks (Raw poly coordinates)
        """
        results = self.model(image_path_or_matrix, conf=0.4)[0]
        
        detections = []
        
        # Guard clause if nothing detected
        if len(results.boxes) == 0:
            return detections
            
        boxes = results.boxes.xyxy.cpu().numpy()
        confs = results.boxes.conf.cpu().numpy()
        classes = results.boxes.cls.cpu().numpy()
        
        # Extract masks if available (YOLOv8 returns normalized or pixel segments depending on call)
        masks = None
        if results.masks is not None:
            # Get explicit polygon point arrays
            masks = results.masks.xy 
            
        for i in range(len(boxes)):
            class_name = self.model.names[int(classes[i])]
            det_data = {
                "label": class_name,
                "confidence": float(confs[i]),
                "bbox": boxes[i].tolist(), # [x1, y1, x2, y2]
                "segmentation_mask": masks[i].tolist() if masks and i < len(masks) else None
            }
            detections.append(det_data)
            
        return detections, results

    def visualize(self, image_path_or_matrix, output_path="inference_output.jpg"):
        """
        Generates the production HUD overlap: Transparent segmentation maps + strict bounding boxes.
        """
        # Read image to numpy matrix
        img = image_path_or_matrix
        if isinstance(image_path_or_matrix, str):
            img = cv2.imread(image_path_or_matrix)
            
        if img is None:
            raise ValueError("Invalid image")
            
        detections, raw_results = self.predict(img)
        
        # Create an overlay for alpha blending (Transparency)
        overlay = img.copy()
        
        for det in detections:
            label = det["label"]
            conf = det["confidence"]
            bbox = [int(v) for v in det["bbox"]]
            poly = det["segmentation_mask"]
            
            # Default to red if specific class color not found
            color = self.colors.get(label, (0, 0, 255))
            
            # 1. Overlay Segmentation Polygon (Transparent Fill)
            if poly:
                pts = np.array(poly, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(overlay, [pts], color)
            
            # 2. Draw Bounding Box (Solid Lines)
            cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
            
            # 3. Label & Confidence Text Background
            text = f"{label.upper()} {conf:.2f}"
            (w, h), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(img, (bbox[0], bbox[1] - 25), (bbox[0] + w, bbox[1]), color, -1)
            
            # 4. Text Draw
            cv2.putText(img, text, (bbox[0], bbox[1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
        # Calculate Alpha Blending for transparent inner mask, solid outer boxes
        alpha = 0.4
        cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)
        
        if output_path:
            cv2.imwrite(output_path, img)
            print(f"Visualized annotated output saved to {output_path}")
            
        return img, detections

    def export_for_deployment(self):
        """
        Exports the optimized model engine into standard edge-serving formats.
        """
        print("⚙️ Exporting Model to ONNX and TorchScript...")
        try:
            # ONNX - Standard universal graph (Open Neural Network Exchange)
            self.model.export(format="onnx", half=True, simplify=True, optimize=True)
            print("✅ Exported to ONNX (.onnx) for generic high-speed production APIs.")
            
            # TorchScript - For C++ / LibTorch mobile and tight loops
            self.model.export(format="torchscript", optimize=True)
            print("✅ Exported to TorchScript (.torchscript) for edge deployments.")
        except Exception as e:
            print(f"Export Error: {e}")

if __name__ == "__main__":
    engine = ProductionInference()
    engine.export_for_deployment()
    # Mocking visualization since we don't have images yet
    print("Inference Engine API initialized successfully.")
