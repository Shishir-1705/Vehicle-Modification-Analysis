import easyocr
import numpy as np
from PIL import Image
import io
import torch
import cv2
import re

class OCREngine:
    """
    Expert OCR recognition service utilizing Singleton pattern and GPU hardware acceleration.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(OCREngine, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self._reader = None

    def _get_reader(self):
        if self._reader is None:
            gpu_enabled = torch.cuda.is_available()
            print(f"📖 Lazy Initializing EasyOCR Engine... (GPU: {gpu_enabled})")
            self._reader = easyocr.Reader(['en'], gpu=gpu_enabled)
        return self._reader


    def preprocess_for_ocr(self, img_np: np.ndarray) -> np.ndarray:
        # Convert to grayscale
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        
        # Resize image to improve OCR accuracy
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        
        # Apply bilateral filter to remove noise while keeping edges sharp
        blur = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Adaptive Thresholding to handle varying lighting
        thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        return thresh

    def extract_text(self, image_bytes: bytes, bbox: dict = None) -> str:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(img)
        
        if bbox:
            h_orig, w_orig = img_np.shape[:2]
            if isinstance(bbox, dict):
                x = int(bbox.get('x', 0))
                y = int(bbox.get('y', 0))
                w = int(bbox.get('w', w_orig))
                h = int(bbox.get('h', h_orig))
                img_np = img_np[max(0, y):min(h_orig, y + h), max(0, x):min(w_orig, x + w)]
            elif isinstance(bbox, (list, tuple)) and len(bbox) == 4:
                x1, y1, x2, y2 = [int(v) for v in bbox]
                img_np = img_np[max(0, y1):min(h_orig, y2), max(0, x1):min(w_orig, x2)]


        if img_np.size == 0: return ""

        # Preprocess
        processed_img = self.preprocess_for_ocr(img_np)

        reader = self._get_reader()
        with torch.inference_mode():
            results = reader.readtext(processed_img)


        
        # Raw extracted string
        full_text = "".join([res[1].replace(" ", "").upper() for res in results if res[2] > 0.3])
        
        # Regex for Indian License Plates
        # Formats: 
        # KA01AB1234
        # MH121234
        # DL1CAB1234
        plate_regex = r"([A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4})"
        matches = re.findall(plate_regex, full_text)
        
        if matches:
            return matches[0]
            
        return full_text

def get_ocr_engine():
    return OCREngine()
