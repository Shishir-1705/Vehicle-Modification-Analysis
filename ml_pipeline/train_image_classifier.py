import os
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split
from torch.optim.lr_scheduler import CosineAnnealingLR
import numpy as np
import cv2
from PIL import Image

# ---------------- CONFIG ----------------
DATASET_PATH = "D:/Vehicle Mod/vehicle_dataset/content/dataset"
MODEL_SAVE_DIR = "D:/Vehicle Mod/models"
MODEL_VERSION = "v3"
MODEL_SAVE_PATH = os.path.join(MODEL_SAVE_DIR, f"bike_model_{MODEL_VERSION}.pth")
TORCHSCRIPT_SAVE_PATH = os.path.join(MODEL_SAVE_DIR, f"bike_model_{MODEL_VERSION}.pt")
METADATA_PATH = os.path.join(MODEL_SAVE_DIR, f"bike_model_{MODEL_VERSION}_meta.json")

IMAGE_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Using device: {device}")

# ---------------- CUSTOM PREPROCESSING (CLAHE + Edge Emphasis) ----------------
class EnhancedPreprocessingTransform:
    def __init__(self, clip_limit=2.0, tile_grid_size=(8, 8), add_edges=True):
        self.clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
        self.add_edges = add_edges
        
    def __call__(self, img):
        # Convert PIL to CV2
        cv_img = np.array(img)
        if len(cv_img.shape) == 3 and cv_img.shape[2] == 3:
            # 1. CLAHE Contrast Enhancement
            lab = cv2.cvtColor(cv_img, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            cl = self.clahe.apply(l)
            limg = cv2.merge((cl, a, b))
            enhanced_cv = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
            
            # 2. Edge Emphasis (Unsharp Masking style via Laplacian or Sobel blend)
            if self.add_edges:
                gray = cv2.cvtColor(enhanced_cv, cv2.COLOR_RGB2GRAY)
                # Apply slight Gaussian blur to remove noise before edge detection
                blur = cv2.GaussianBlur(gray, (3, 3), 0)
                laplacian = cv2.Laplacian(blur, cv2.CV_64F)
                laplacian = cv2.convertScaleAbs(laplacian)
                
                # Blend the edges back into the colored image
                laplacian_colored = cv2.cvtColor(laplacian, cv2.COLOR_GRAY2RGB)
                final_img = cv2.addWeighted(enhanced_cv, 0.8, laplacian_colored, 0.2, 0)
            else:
                final_img = enhanced_cv
                
            return Image.fromarray(final_img)
        return img

# ---------------- TRANSFORMS ----------------
# V3 implements strong structural augmentations for generalizability
train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop((IMAGE_SIZE, IMAGE_SIZE)),
    EnhancedPreprocessingTransform(add_edges=True),
    # RandAugment-style geometric twists
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(20),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3),
    transforms.ToTensor(),
    # Adding Random Erasing as regularization for small datasets (forces model to look at whole bike)
    transforms.RandomErasing(p=0.2, scale=(0.02, 0.1)),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop((IMAGE_SIZE, IMAGE_SIZE)),
    EnhancedPreprocessingTransform(add_edges=True),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ---------------- DATASET ----------------
try:
    dataset = datasets.ImageFolder(DATASET_PATH, transform=train_transform)
    class_names = dataset.classes
    num_samples = len(dataset)
    print("Classes:", class_names)
    
    # Class Balancing
    class_counts = [0, 0]
    for _, label in dataset.samples:
        class_counts[label] += 1
    
    # Simple split
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    
    # Apply raw validation transform to validation split
    val_dataset.dataset.transform = val_transform

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, pin_memory=True)
    
except Exception as e:
    print(f"Dataset block error: {e}")
    train_loader, val_loader = [], []
    class_names = ["Modified", "Stock"]
    num_samples = 0
    class_counts = [1, 1]

# ---------------- MODEL (V3 Transfer Learning) ----------------
# Base model
model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)

# Freeze ALL base layers initially to ensure classifier learns first (Transfer Learning best practice)
for param in model.features.parameters():
    param.requires_grad = False

# Unfreeze the very last block for fine-tuning
for name, param in model.features.named_parameters():
    if '8' in name: # Block 8 of EfficientNet B0
        param.requires_grad = True

# Replace Classifier
num_features = model.classifier[1].in_features
model.classifier = nn.Sequential(
    nn.Dropout(p=0.5, inplace=True), # Stronger Dropout to prevent memorization
    nn.Linear(num_features, len(class_names))
)

model = model.to(device)

# Feature Engineering: Label Smoothing & Class Weighting
class_weights = torch.FloatTensor([max(class_counts)/c if c > 0 else 1.0 for c in class_counts]).to(device)
# Increased label smoothing to combat high confidence incorrect predictions
criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=0.15) 

# Optimizer for the unfrozen parts
optimizer = optim.Adam([
    {'params': [p for n, p in model.features.named_parameters() if p.requires_grad], 'lr': 5e-5},
    {'params': model.classifier.parameters(), 'lr': 1e-3}
], weight_decay=1e-4)

# V3 uses CosineAnnealingLR for finding robust local minima over 50 epochs
scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)

# ---------------- MAIN ----------------
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=10)
    args = parser.parse_args()
    
    EPOCHS = args.epochs
    
    if not train_loader:
        print("Skipping training. Ensure dataset is placed efficiently.")
        exit(1)
        
    best_acc = 0.0
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    
    for epoch in range(EPOCHS):
        model.train()
        running_loss = 0.0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
        avg_loss = running_loss / len(train_loader)
        
        # Validation
        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, preds = torch.max(outputs, 1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)

        acc = 100 * correct / total
        print(f"Epoch [{epoch+1}/{EPOCHS}] | LR: {scheduler.get_last_lr()[0]:.2e} | Loss: {avg_loss:.4f} | Val Acc: {acc:.2f}%")
        
        scheduler.step()

        if acc >= best_acc:
            best_acc = acc
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            
            meta = {
                "version": MODEL_VERSION,
                "accuracy": round(best_acc, 2),
                "dataset_size": num_samples,
                "classes": class_names,
                "timestamp": time.time(),
                "epochs": epoch+1,
                "optimizations": ["CLAHE + Edge Emphasis", "Base Layer Freeze", "Cosine Annealing", "Label Smoothing 0.15", "RandAugment + Erasing"]
            }
            with open(METADATA_PATH, "w") as f:
                json.dump(meta, f, indent=4)
                
            print(f"🌟 Best model {MODEL_VERSION} saved with accuracy: {acc:.2f}%")

    print(f"✅ Training completed! Peak Validation Accuracy: {best_acc:.2f}%")