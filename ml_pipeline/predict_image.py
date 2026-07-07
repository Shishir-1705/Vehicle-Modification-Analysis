import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

# ---------------- CONFIG ----------------
MODEL_PATH = "D:\Vehicle Mod\models\bike_stock_vs_modified.pth"
IMAGE_PATH = "test_image.jpg"  # CHANGE THIS
IMAGE_SIZE = 224

class_names = ["modified", "stock"]

# ---------------- DEVICE ----------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------- TRANSFORM ----------------
transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# ---------------- LOAD MODEL ----------------
model = models.efficientnet_b0(weights=None)
num_features = model.classifier[1].in_features
model.classifier[1] = nn.Linear(num_features, 2)

model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model = model.to(device)
model.eval()

# ---------------- LOAD IMAGE ----------------
image = Image.open(IMAGE_PATH).convert("RGB")
image = transform(image).unsqueeze(0).to(device)

# ---------------- PREDICTION ----------------
with torch.no_grad():
    outputs = model(image)
    probs = torch.softmax(outputs, dim=1)
    confidence, pred = torch.max(probs, 1)

label = class_names[pred.item()]
confidence = confidence.item() * 100

print(f"Prediction: {label}")
print(f"Confidence: {confidence:.2f}%")
