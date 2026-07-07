import torch
import torch.optim as optim
from torch.utils.data import DataLoader
from .advanced_model import AdvancedBikeClassifier, FocalLoss
from .dataset import BikeDualStreamDataset
import time

def train_advanced_model(image_paths, labels, device='cuda'):
    """
    Final training pipeline implementing Task 4 (Hard Sample Learning) 
    and Task 1-3 (Dual Stream + Attention).
    """
    model = AdvancedBikeClassifier(num_classes=2).to(device)
    
    # 1. Dataset & Loader
    dataset = BikeDualStreamDataset(image_paths, labels, is_train=True)
    loader = DataLoader(dataset, batch_size=16, shuffle=True)
    
    # 2. Optimized Setup
    optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-3)
    criterion = FocalLoss(gamma=2.0) # Task 4: Focal Loss for hard negatives
    
    scaler = torch.cuda.amp.GradScaler() # Mixed-precision for speed
    
    print("🎬 Starting Advanced ROI-Focused Training...")
    
    for epoch in range(50):
        model.train()
        total_loss = 0
        hard_samples = []

        for g_imgs, l_imgs, targets in loader:
            g_imgs, l_imgs, targets = g_imgs.to(device), l_imgs.to(device), targets.to(device)
            
            optimizer.zero_grad()
            
            with torch.cuda.amp.autocast():
                outputs = model(g_imgs, l_imgs)
                
                # Compute individual losses to identify "Hard" samples
                # Note: This is an OHEM-style approach for the "Left out tasks"
                loss = criterion(outputs, targets)
            
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            total_loss += loss.item()
            
            # Identify hard samples (Loss threshold e.g. > 1.0)
            if loss.item() > 1.0:
                hard_samples.append((g_imgs, l_imgs, targets))

        # ==========================================
        # HARD SAMPLE REPLAY PHASE (Task 4)
        # ==========================================
        if len(hard_samples) > 2:
            print(f"🔥 Replaying {len(hard_samples)} hard samples to force model learning...")
            for gh, lh, th in hard_samples[:5]: # Cap replay to prevent overfitting
                optimizer.zero_grad()
                out_h = model(gh, lh)
                loss_h = FocalLoss(gamma=3.0)(out_h, th) # Aggressive loss for replay
                loss_h.backward()
                optimizer.step()

        print(f"Epoch [{epoch+1}/50] - Loss: {total_loss/len(loader):.4f}")

    # Save best weights
    torch.save(model.state_dict(), "weights/advanced_bike_roi_v4.pt")
    print("✅ Training complete. Advanced weights saved.")

if __name__ == "__main__":
    # Mock paths for structure documentation
    # In a real run, you'd provide paths to your stock/modified dataset
    print("⚙️ Advanced Training script ready. Run with valid dataset paths.")
