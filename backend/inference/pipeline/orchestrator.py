import asyncio
import io
import concurrent.futures
from typing import List, Dict, Any
from PIL import Image

from ..onnx.engine import get_onnx_engine
from ..yolo.engine import get_yolo_engine
from ..ocr.engine import get_ocr_engine
from ..gradcam.engine import get_gradcam_engine
from ..explainer import generate_explanation

class InferenceOrchestrator:
    """
    Centralized pipeline for managing AI inference asynchronously.
    Supports memory optimization, batch predictions, and unified postprocessing.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(InferenceOrchestrator, cls).__new__(cls)
            # Thread pool for async processing of CPU-bound tasks
            cls._instance.executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)
        return cls._instance

    def validate_image(self, image_bytes: bytes) -> bool:
        """Ensures the image is valid and not corrupted."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            return True
        except Exception:
            return False

    def optimize_image(self, image_bytes: bytes, max_size: tuple = (1280, 1280)) -> bytes:
        """Memory optimization and resizing."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        out_io = io.BytesIO()
        img.save(out_io, format="JPEG", quality=85)
        return out_io.getvalue()

    def filter_confidence(self, detections: List[Dict], threshold: float) -> List[Dict]:
        return [det for det in detections if det["confidence"] >= threshold]

    async def predict_async(self, image_bytes: bytes, use_onnx: bool = True, conf_threshold: float = 0.4) -> Dict[str, Any]:
        """
        Orchestrates full inference pipeline asynchronously.
        """
        loop = asyncio.get_event_loop()
        
        # 1. Validation & Optimization
        if not self.validate_image(image_bytes):
            raise ValueError("Invalid image file")
            
        opt_bytes = await loop.run_in_executor(self.executor, self.optimize_image, image_bytes)
        
        # 2. Base Inference (YOLO or ONNX)
        if use_onnx:
            engine = get_onnx_engine()
            raw_detections, _ = await loop.run_in_executor(self.executor, engine.predict, opt_bytes, conf_threshold)
        else:
            engine = get_yolo_engine()
            raw_detections = await loop.run_in_executor(self.executor, engine.predict, opt_bytes, conf_threshold)

        # 3. Confidence Filtering
        filtered = self.filter_confidence(raw_detections, conf_threshold)
        
        # 4. OCR, GradCAM & Explanations
        results = []
        ocr = get_ocr_engine()
        gradcam = get_gradcam_engine()
        
        for det in filtered:
            det_result = det.copy()
            
            # XAI Explanation
            det_result["explanation"] = generate_explanation(det["component_name"], det["confidence"])
            
            # OCR logic
            if "plate" in det["component_name"].lower() or "font" in det["component_name"].lower():
                text = await loop.run_in_executor(self.executor, ocr.extract_text, opt_bytes, det["bounding_box"])
                det_result["ocr_text"] = text
            
            # GradCAM (if model is PyTorch)
            if not use_onnx and gradcam.model:
                try:
                    heatmap = await loop.run_in_executor(
                        self.executor, 
                        gradcam.generate_heatmap, 
                        opt_bytes, 
                        det["class_id"], 
                        det["bounding_box"]
                    )
                    det_result["heatmap"] = heatmap
                except Exception:
                    pass
                    
            results.append(det_result)
            
        return {
            "detections": results,
            "optimized": True
        }

    async def batch_predict_async(self, images_bytes: List[bytes], **kwargs) -> List[Dict]:
        """Batch prediction capability."""
        tasks = [self.predict_async(img, **kwargs) for img in images_bytes]
        return await asyncio.gather(*tasks)

def get_orchestrator() -> InferenceOrchestrator:
    return InferenceOrchestrator()
