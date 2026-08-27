import cv2
import numpy as np
import onnxruntime as ort
import os
from PIL import Image
import io
from pathlib import Path

class ONNXEngine:
    """
    Expert implementation of a YOLOv8-segmentation inference engine using ONNX Runtime.
    Handles singleton loading, GPU/CPU fallback, and inference.
    """
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ONNXEngine, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
        
    def _initialize(self):
        root_dir = Path(__file__).resolve().parent.parent.parent.parent
        model_path = root_dir / "models" / "yolov8n-seg.onnx"
        
        if not model_path.exists():
            model_path = root_dir / "yolov8n-seg.onnx"
            
        if not os.path.exists(model_path):
            print(f"⚙️ ONNX model not found at {model_path}. Attempting to auto-export from PyTorch model...")
            try:
                from ultralytics import YOLO
                import shutil
                pt_path = root_dir / "models" / "yolov8n-seg.pt"
                if not pt_path.exists():
                    pt_path = root_dir / "yolov8n-seg.pt"
                
                if pt_path.exists():
                    model = YOLO(str(pt_path))
                else:
                    model = YOLO("yolov8n-seg.pt")
                    
                exported_path = model.export(format="onnx")
                if os.path.exists(exported_path) and os.path.abspath(exported_path) != os.path.abspath(model_path):
                    os.makedirs(os.path.dirname(model_path), exist_ok=True)
                    shutil.copy(exported_path, model_path)
                    
                root_onnx = root_dir / "yolov8n-seg.onnx"
                if not root_onnx.exists() and os.path.exists(model_path):
                    shutil.copy(model_path, root_onnx)
                print(f"✅ ONNX model successfully exported and saved to {model_path}")
            except Exception as e:
                print(f"⚠️ Failed to auto-export ONNX: {e}")
                self.session = None
                return

            
        # GPU Fallback Logic for ONNX Runtime
        providers = ['CPUExecutionProvider']
        if 'CUDAExecutionProvider' in ort.get_available_providers():
            providers = ['CUDAExecutionProvider'] + providers
            
        self.session = ort.InferenceSession(str(model_path), providers=providers)
        
        # Metadata extraction
        model_inputs = self.session.get_inputs()
        self.input_name = model_inputs[0].name
        self.input_shape = model_inputs[0].shape
        self.input_width = self.input_shape[2]
        self.input_height = self.input_shape[3]
        
        self.classes = ['exhaust_modified', 'paint_modified', 'wheels_changed', 'exhaust', 'wheel', 'headlight']

    def preprocess(self, img_bytes: bytes):
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        orig_w, orig_h = img.size
        img = img.resize((self.input_width, self.input_height))
        
        img_array = np.array(img).astype(np.float32) / 255.0
        img_array = img_array.transpose(2, 0, 1)
        img_array = img_array[np.newaxis, :, :, :]
        return img_array, (orig_w, orig_h)

    def postprocess(self, outputs, orig_size, conf_threshold=0.4):
        predictions = np.squeeze(outputs[0])
        predictions = predictions.T
        boxes, scores, class_ids = [], [], []
        
        for pred in predictions:
            score = pred[4:].max()
            if score > conf_threshold:
                class_id = np.argmax(pred[4:])
                scaling_x = orig_size[0] / self.input_width
                scaling_y = orig_size[1] / self.input_height
                
                x, y, w, h = pred[:4]
                boxes.append([
                    (x - w/2) * scaling_x, 
                    (y - h/2) * scaling_y, 
                    w * scaling_x, 
                    h * scaling_y
                ])
                scores.append(float(score))
                class_ids.append(int(class_id))

        indices = cv2.dnn.NMSBoxes(
            [ [int(b[0]), int(b[1]), int(b[2]), int(b[3])] for b in boxes], 
            scores, conf_threshold, 0.45
        )
        
        detections = []
        if len(indices) > 0:
            for i in indices.flatten():
                detections.append({
                    "class_id": class_ids[i],
                    "component_name": self.classes[class_ids[i]] if class_ids[i] < len(self.classes) else f"Object_{class_ids[i]}",
                    "confidence": round(scores[i], 3),
                    "bounding_box": {
                        "x": round(boxes[i][0] + boxes[i][2]/2),
                        "y": round(boxes[i][1] + boxes[i][3]/2),
                        "w": round(boxes[i][2]),
                        "h": round(boxes[i][3])
                    }
                })
        return detections

    def predict(self, image_bytes: bytes, conf_threshold: float = 0.4):
        if not self.session: return [], (0, 0)
        input_tensor, orig_size = self.preprocess(image_bytes)
        outputs = self.session.run(None, {self.input_name: input_tensor})
        return self.postprocess(outputs, orig_size, conf_threshold), orig_size

def get_onnx_engine():
    return ONNXEngine()
