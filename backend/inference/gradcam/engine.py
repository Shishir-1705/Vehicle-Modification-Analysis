import torch
import cv2
import numpy as np
import base64
from PIL import Image
import io
from ..yolo.engine import get_yolo_engine

class GradCAMEngine:
    """
    Expert implementation of Grad-CAM for PyTorch Models.
    Utilizes singleton pattern and abstracts away hook management.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(GradCAMEngine, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        yolo = get_yolo_engine()
        if yolo.model:
            self.model = yolo.model.model
            self.model.eval()
            self.target_layer = self.model.model[-2]
        else:
            self.model = None
            
        self.activations = None
        self.gradients = None
        self.hooks = []

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def _register_hooks(self):
        if self.model:
            self.hooks.append(self.target_layer.register_forward_hook(self._save_activations))
            self.hooks.append(self.target_layer.register_full_backward_hook(self._save_gradients))

    def _unregister_hooks(self):
        for hook in self.hooks:
            hook.remove()
        self.hooks = []

    def generate_heatmap(self, image_bytes: bytes, class_id: int, bbox: dict = None) -> str:
        if not self.model: return None
        
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        original_size = img.size
        
        img_resized = img.resize((640, 640))
        img_tensor = torch.from_numpy(np.array(img_resized)).permute(2, 0, 1).float() / 255.0
        img_tensor = img_tensor.unsqueeze(0)
        
        # Ensure tensor is on the same device as the model
        device = next(self.model.parameters()).device
        img_tensor = img_tensor.to(device)
        img_tensor.requires_grad = True

        self._register_hooks()
        
        self.model.zero_grad()
        outputs = self.model(img_tensor)
        
        preds = outputs[0]
        score = preds[0, 4 + class_id, :].max()
        score.backward()
        
        gradients = self.gradients
        activations = self.activations
        
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * activations, dim=1).squeeze(0)
        
        cam = torch.relu(cam)
        cam_min, cam_max = cam.min(), cam.max()
        cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
        
        self._unregister_hooks()
        
        heatmap = cam.detach().cpu().numpy()
        heatmap = cv2.resize(heatmap, original_size)
        
        if bbox:
            mask = np.zeros(original_size[::-1], dtype=np.float32)
            x, y, w, h = int(bbox['x'] - bbox['w']/2), int(bbox['y'] - bbox['h']/2), int(bbox['w']), int(bbox['h'])
            pad_w, pad_h = int(w * 0.2), int(h * 0.2)
            cv2.rectangle(mask, 
                         (max(0, x - pad_w), max(0, y - pad_h)), 
                         (min(original_size[0], x + w + pad_w), min(original_size[1], y + h + pad_h)), 
                         1.0, -1)
            mask = cv2.GaussianBlur(mask, (51, 51), 0)
            heatmap = heatmap * mask

        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
        heatmap_bgra = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2BGRA)
        heatmap_bgra[:, :, 3] = np.uint8(255 * heatmap * 0.7)
        
        _, buffer = cv2.imencode('.png', heatmap_bgra)
        base64_str = base64.b64encode(buffer).decode('utf-8')
        
        return f"data:image/png;base64,{base64_str}"

def get_gradcam_engine():
    return GradCAMEngine()
