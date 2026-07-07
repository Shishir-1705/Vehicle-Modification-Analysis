import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

# ==========================================
# ATTENTION MECHANISM (CBAM)
# ==========================================
class ChannelAttention(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super(ChannelAttention, self).__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
           
        self.fc = nn.Sequential(
            nn.Conv2d(in_planes, in_planes // ratio, 1, bias=False),
            nn.ReLU(),
            nn.Conv2d(in_planes // ratio, in_planes, 1, bias=False)
        )
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = self.fc(self.avg_pool(x))
        max_out = self.fc(self.max_pool(x))
        out = avg_out + max_out
        return self.sigmoid(out)

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super(SpatialAttention, self).__init__()
        assert kernel_size in (3, 7), 'kernel size must be 3 or 7'
        padding = 3 if kernel_size == 7 else 1

        self.conv1 = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        x_cat = torch.cat([avg_out, max_out], dim=1)
        out = self.conv1(x_cat)
        return self.sigmoid(out)

class CBAM(nn.Module):
    """Convolutional Block Attention Module"""
    def __init__(self, in_planes, ratio=16, kernel_size=7):
        super(CBAM, self).__init__()
        self.ca = ChannelAttention(in_planes, ratio)
        self.sa = SpatialAttention(kernel_size)

    def forward(self, x):
        x = self.ca(x) * x
        x = self.sa(x) * x
        return x

# ==========================================
# DUAL STREAM ROI ARCHITECTURE
# ==========================================
class AdvancedBikeClassifier(nn.Module):
    """
    Dual-stream model that focuses on both the global bike profile 
    and specific localized regions (ROI) like exhaust or wheels.
    """
    def __init__(self, num_classes=2):
        super(AdvancedBikeClassifier, self).__init__()
        
        # Load pre-trained backbones
        weights = EfficientNet_B0_Weights.DEFAULT
        self.global_branch = efficientnet_b0(weights=weights).features
        self.local_branch = efficientnet_b0(weights=weights).features
        
        embed_dim = 1280
        
        # Add CBAM Attention to both branches
        self.global_attention = CBAM(embed_dim)
        self.local_attention = CBAM(embed_dim)
        
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.flatten = nn.Flatten(1)
        
        # Classifier Fusing both streams
        self.classifier = nn.Sequential(
            nn.Linear(embed_dim * 2, 512),
            nn.BatchNorm1d(512),
            nn.Hardswish(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )

    def forward(self, global_img, local_img):
        gf = self.global_attention(self.global_branch(global_img))
        gf = self.flatten(self.pool(gf))
        
        lf = self.local_attention(self.local_branch(local_img))
        lf = self.flatten(self.pool(lf))
        
        fused = torch.cat((gf, lf), dim=1)
        return self.classifier(fused)

# ==========================================
# HARD SAMPLE LOSS (FOCAL LOSS)
# ==========================================
class FocalLoss(nn.Module):
    def __init__(self, alpha=1, gamma=2):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, inputs, targets):
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt)**self.gamma * ce_loss
        return focal_loss.mean()
