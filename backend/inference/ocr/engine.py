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
        gpu_enabled = torch.cuda.is_available()
        print(f"📖 Initializing OCR Engine... (GPU: {gpu_enabled})")
        self.reader = easyocr.Reader(['en'], gpu=gpu_enabled)

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
            x, y, w, h = int(bbox['x'] - bbox['w']/2), int(bbox['y'] - bbox['h']/2), int(bbox['w']), int(bbox['h'])
            h_orig, w_orig = img_np.shape[:2]
            y1, y2 = max(0, y), min(h_orig, y + h)
            x1, x2 = max(0, x), min(w_orig, x + w)
            img_np = img_np[y1:y2, x1:x2]

        if img_np.size == 0: return ""

        # Preprocess
        processed_img = self.preprocess_for_ocr(img_np)

        results = self.reader.readtext(processed_img)
        
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
