import cv2
import numpy as np
import os

def check_image_quality(image_path, blur_threshold=100.0, low_light_threshold=40.0):
    """
    Evaluates image quality.
    Returns: (is_okay, reason)
    """
    if not os.path.exists(image_path):
        return False, "missing"
        
    img = cv2.imread(image_path)
    if img is None:
        return False, "corrupted"

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Blur detection
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < blur_threshold:
        return False, f"blurry (var: {laplacian_var:.2f})"
        
    # Darkness check
    mean_brightness = np.mean(gray)
    if mean_brightness < low_light_threshold:
        return False, f"dark (mean: {mean_brightness:.2f})"
        
    return True, "ok"
