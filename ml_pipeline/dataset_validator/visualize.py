import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import cv2

def visualize_sample(image_path, bboxes, masks, class_names, output_path=None):
    """
    Visualizes an image with overlaid bounding boxes and segmentation masks.
    """
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not load image at {image_path}")
        return
        
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    fig, ax = plt.subplots(1, figsize=(10, 10))
    ax.imshow(img)
    
    # Generate distinct colors for each bounding box
    cmap = plt.get_cmap('hsv')
    colors = cmap(np.linspace(0, 1, len(bboxes)))
    
    for i, (bbox, mask, cls_name) in enumerate(zip(bboxes, masks, class_names)):
        color = colors[i]
        x, y, w, h = bbox
        
        # Draw bbox
        rect = patches.Rectangle((x, y), w, h, linewidth=2, edgecolor=color, facecolor='none')
        ax.add_patch(rect)
        
        # Add text
        ax.text(x, max(0, y - 5), cls_name, color='white', fontsize=12, bbox=dict(facecolor=color, alpha=0.5))
        
        # Draw mask
        if mask:
            for poly in mask:
                poly_arr = np.array(poly).reshape(-1, 2)
                poly_patch = patches.Polygon(poly_arr, closed=True, facecolor=color, alpha=0.4)
                ax.add_patch(poly_patch)
                
    plt.axis('off')
    if output_path:
        plt.savefig(output_path, bbox_inches='tight')
        plt.close()
    else:
        plt.show()
