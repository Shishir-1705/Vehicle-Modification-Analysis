import os
import shutil
from tqdm import tqdm

def export_to_yolo(coco_dict, output_dir, image_source_dir=None, is_seg=True):
    labels_dir = os.path.join(output_dir, 'labels')
    images_tgt_dir = os.path.join(output_dir, 'images')
    os.makedirs(labels_dir, exist_ok=True)
    if image_source_dir:
        os.makedirs(images_tgt_dir, exist_ok=True)
        
    # Maps
    cat_id_to_yolo_idx = {}
    for i, cat in enumerate(coco_dict['categories']):
        cat_id_to_yolo_idx[cat['id']] = i
        
    # Save classes.txt
    with open(os.path.join(output_dir, 'classes.txt'), 'w') as f:
        for cat in coco_dict['categories']:
            f.write(cat['name'] + '\n')
            
    img_dict = {img['id']: img for img in coco_dict['images']}
    
    annotations_by_image = {}
    for ann in coco_dict['annotations']:
        img_id = ann['image_id']
        annotations_by_image.setdefault(img_id, []).append(ann)
        
    for img_id, img_info in tqdm(img_dict.items(), desc="Exporting YOLO"):
        w = img_info['width']
        h = img_info['height']
        
        txt_path = os.path.join(labels_dir, os.path.splitext(img_info['file_name'])[0] + '.txt')
        
        lines = []
        for ann in annotations_by_image.get(img_id, []):
            yolo_cls = cat_id_to_yolo_idx[ann['category_id']]
            
            if is_seg and 'segmentation' in ann and ann['segmentation']:
                for poly in ann['segmentation']:
                    norm_poly = []
                    for k in range(0, len(poly), 2):
                        nx = max(0, min(1, poly[k] / w))
                        ny = max(0, min(1, poly[k+1] / h))
                        norm_poly.extend([nx, ny])
                    
                    line = f"{yolo_cls} " + " ".join([f"{v:.6f}" for v in norm_poly])
                    lines.append(line)
            else:
                bx, by, bw, bh = ann['bbox']
                cx = max(0, min(1, (bx + bw/2.0) / w))
                cy = max(0, min(1, (by + bh/2.0) / h))
                nw = max(0, min(1, bw / w))
                nh = max(0, min(1, bh / h))
                lines.append(f"{yolo_cls} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}")
                
        with open(txt_path, 'w') as f:
            f.write("\n".join(lines) + "\n")
            
        if image_source_dir:
            src = os.path.join(image_source_dir, img_info['file_name'])
            tgt = os.path.join(images_tgt_dir, img_info['file_name'])
            try:
                if os.path.exists(src) and not os.path.exists(tgt):
                    shutil.copy(src, tgt)
            except Exception as e:
                print(f"File handling error: {e}")
