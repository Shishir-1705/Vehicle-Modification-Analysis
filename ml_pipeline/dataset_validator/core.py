import json
import os
from .validators import clean_and_validate_bbox, validate_polygon, normalize_class_label
from .quality_flag import check_image_quality
from tqdm import tqdm
from PIL import Image
import imagehash

class COCODatasetValidator:
    def __init__(self, coco_path, image_dir, valid_classes, class_mapping=None):
        self.coco_path = coco_path
        self.image_dir = image_dir
        self.valid_classes = set(valid_classes)
        self.class_mapping = class_mapping or {}
        
        with open(coco_path, 'r') as f:
            self.coco = json.load(f)
            
        self.report = {
            "total_images_original": len(self.coco.get('images', [])),
            "total_annotations_original": len(self.coco.get('annotations', [])),
            "invalid_boxes_removed": 0,
            "invalid_masks_removed": 0,
            "duplicates_removed": 0,
            "images_removed_quality": 0,
            "images_removed_no_annotations": 0,
            "annotations_removed_no_image": 0,
            "class_distribution": {},
            "flagged_samples_low_quality": 0
        }
        
    def run_pipeline(self):
        # 1. Deduplicate & quality check images
        valid_images = {}
        image_hashes = set()
        
        # Build category map
        cat_dict = {c['id']: c for c in self.coco.get('categories', [])}
        new_categories = []
        name_to_new_id = {}
        
        print("Processing images...")
        for img in tqdm(self.coco.get('images', [])):
            img_path = os.path.join(self.image_dir, img['file_name'])
            is_ok, reason = check_image_quality(img_path)
            if not is_ok:
                self.report['flagged_samples_low_quality'] += 1
                self.report['images_removed_quality'] += 1
                continue
                
            try:
                img_obj = Image.open(img_path)
                h = imagehash.phash(img_obj)
                if h in image_hashes:
                    self.report['duplicates_removed'] += 1
                    continue
                image_hashes.add(h)
            except Exception as e:
                continue
                
            valid_images[img['id']] = img
            
        # 2. Validate annotations
        print("Processing annotations...")
        valid_annotations = []
        images_with_annotations = set()
        seen_ann_hashes = set()
        
        for ann in tqdm(self.coco.get('annotations', [])):
            img_id = ann.get('image_id')
            if img_id not in valid_images:
                self.report['annotations_removed_no_image'] += 1
                continue
                
            orig_cat = cat_dict.get(ann.get('category_id'))
            if not orig_cat:
                continue
                
            cat_name = orig_cat['name']
            norm_name = normalize_class_label(cat_name, self.valid_classes, self.class_mapping)
            if not norm_name:
                self.report['invalid_boxes_removed'] += 1
                continue
                
            if norm_name not in name_to_new_id:
                new_id = len(name_to_new_id) + 1
                name_to_new_id[norm_name] = new_id
                new_categories.append({"id": new_id, "name": norm_name})
            new_cat_id = name_to_new_id[norm_name]
            
            img_info = valid_images[img_id]
            clean_bbox = clean_and_validate_bbox(ann['bbox'], img_info['width'], img_info['height'])
            if not clean_bbox:
                self.report['invalid_boxes_removed'] += 1
                continue
                
            clean_seg = None
            if 'segmentation' in ann and ann['segmentation']:
                clean_seg = validate_polygon(ann['segmentation'], clean_bbox)
                if not clean_seg:
                    self.report['invalid_masks_removed'] += 1
                    continue
            
            # Ann hashing for duplicate detection (same label and roughly same bbox inside same image)
            ann_hash = f"{img_id}_{new_cat_id}_{int(clean_bbox[0])}_{int(clean_bbox[1])}_{int(clean_bbox[2])}_{int(clean_bbox[3])}"
            if ann_hash in seen_ann_hashes:
                self.report['duplicates_removed'] += 1
                continue
            seen_ann_hashes.add(ann_hash)
            
            ann['bbox'] = clean_bbox
            if clean_seg:
                ann['segmentation'] = clean_seg
            ann['category_id'] = new_cat_id
            ann['area'] = clean_bbox[2] * clean_bbox[3]
            
            valid_annotations.append(ann)
            images_with_annotations.add(img_id)
            
            self.report['class_distribution'][norm_name] = self.report['class_distribution'].get(norm_name, 0) + 1
            
        # 3. Remove images with no annotations
        final_images = []
        for img_id, img in valid_images.items():
            if img_id in images_with_annotations:
                final_images.append(img)
            else:
                self.report['images_removed_no_annotations'] += 1
                
        self.cleaned_coco = {
            "info": self.coco.get('info', {}),
            "licenses": self.coco.get('licenses', []),
            "images": final_images,
            "annotations": valid_annotations,
            "categories": new_categories
        }
        
    def get_report(self):
        self.report['total_images_final'] = len(self.cleaned_coco['images'])
        self.report['total_annotations_final'] = len(self.cleaned_coco['annotations'])
        return self.report
        
    def save_coco(self, output_path):
        with open(output_path, 'w') as f:
            json.dump(self.cleaned_coco, f)
