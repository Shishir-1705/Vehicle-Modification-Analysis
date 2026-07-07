import numpy as np
from shapely.geometry import Polygon

def clean_and_validate_bbox(bbox, img_w, img_h, min_area=32):
    """
    Validates and cleans COCO format bbox [x, y, w, h].
    Returns cleaned bbox or None if invalid.
    """
    if len(bbox) != 4:
        return None
    
    x, y, w, h = bbox
    
    # Ensure w and h are positive
    if w <= 0 or h <= 0:
        return None
        
    x_min, y_min = max(0, x), max(0, y)
    x_max, y_max = min(img_w, x + w), min(img_h, y + h)
    
    new_w = x_max - x_min
    new_h = y_max - y_min
    
    # Must lie within boundaries (handled by min/max clipping above)
    # Check for area constraint
    if new_w <= 0 or new_h <= 0 or (new_w * new_h) < min_area:
        return None
        
    return [float(x_min), float(y_min), float(new_w), float(new_h)]

def validate_polygon(segmentation, bbox):
    """
    Validates a list of polygons [[x1, y1, x2, y2...], ...]
    Returns cleaned segmentation list or None if totally broken.
    """
    if not isinstance(segmentation, list) or len(segmentation) == 0:
        return None
        
    bx, by, bw, bh = bbox
    bx_max, by_max = bx + bw, by + bh
    
    valid_segs = []
    
    for poly in segmentation:
        if len(poly) < 6 or len(poly) % 2 != 0:
            continue
            
        points = [(poly[i], poly[i+1]) for i in range(0, len(poly), 2)]
        polygon = Polygon(points)
        
        if not polygon.is_valid:
            # Try to fix self-intersecting
            polygon = polygon.buffer(0)
            
        if polygon.is_empty:
            continue
            
        # Extract coordinates back. Buffer(0) might return MultiPolygon.
        if polygon.geom_type == 'Polygon':
            polys = [polygon]
        elif polygon.geom_type == 'MultiPolygon':
            polys = list(polygon.geoms)
        else:
            continue
            
        for p in polys:
            coords = list(p.exterior.coords)[:-1] # Remove the closing duplicate point
            if len(coords) < 3:
                continue
            
            # Optionally, we can check if polygon aligns with BBox. 
            # (i.e. is within the bounding box bounds loosely, but we'll accept some margin)
            
            flat_poly = []
            for (cx, cy) in coords:
                flat_poly.extend([float(cx), float(cy)])
            valid_segs.append(flat_poly)
            
    if len(valid_segs) == 0:
        return None
        
    return valid_segs

def normalize_class_label(cat_name, valid_classes, mapping=None):
    """
    Normalizes class labels using a valid list or a mapping dict for misspellings.
    """
    name = cat_name.lower().strip()
    if mapping and name in mapping:
        name = mapping[name]
        
    if name in valid_classes:
        return name
    return None
