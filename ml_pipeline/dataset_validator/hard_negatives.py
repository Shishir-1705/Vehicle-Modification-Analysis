import os
import shutil
import cv2

def inject_hard_negatives(coco_dict, hard_negatives_dir, image_source_dir):
    """
    Takes a directory of images known to be legal bikes or background frames.
    Injects them into the COCO dataset as images with empty annotations.
    Helps the model learn to not false-positive on background/legal items.
    """
    if not os.path.exists(hard_negatives_dir):
        return coco_dict, 0
        
    start_img_id = max([img['id'] for img in coco_dict.get('images', [{'id': 0}])]) + 1
    added_count = 0
    
    for filename in os.listdir(hard_negatives_dir):
        if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            continue
            
        src_path = os.path.join(hard_negatives_dir, filename)
        tgt_path = os.path.join(image_source_dir, filename)
        
        # Copy file if it doesn't exist
        if not os.path.exists(tgt_path):
            shutil.copy(src_path, tgt_path)
            
        img = cv2.imread(tgt_path)
        if img is None:
            continue
            
        h, w = img.shape[:2]
        
        coco_dict['images'].append({
            "id": start_img_id,
            "file_name": filename,
            "width": w,
            "height": h
        })
        
        start_img_id += 1
        added_count += 1
        
    return coco_dict, added_count
