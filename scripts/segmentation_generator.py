import json
import random
import os
import uuid

class SegmentationDatasetGenerator:
    """
    Advanced framework for Generating synthetic datasets containing Object Detection (BBoxes) 
    and Instance Segmentation (Polygon Masks) for illegal motorcycle modifications.
    """

    CATEGORIES = {
        "number_plate": ["missing_plate", "fancy_font_plate", "hidden_plate", "wrong_size_plate", "colored_plate"],
        "exhaust": ["modified_exhaust", "short_exhaust", "no_muffler"],
        "lighting": ["underglow_lights", "flashing_red_blue_lights", "high_intensity_headlight", "colored_headlight"],
        "safety": ["no_mirrors", "no_helmet", "triple_riding", "missing_indicators"],
        "structural": ["oversized_tires", "extended_handlebar", "removed_mudguard", "frame_modification"]
    }

    LOCATIONS = ["urban", "highway", "rural"]
    LIGHTING = ["day", "night"]
    WEATHER = ["clear", "rain", "fog"]
    ANGLES = ["front", "rear", "side"]

    def __init__(self, output_dir="dataset"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.metadata = []

    def _generate_mock_box_and_mask(self):
        """
        Creates synthetic bounding boxes and polygon masks. 
        In a real pipeline, this would be replaced by outputs from SAM (Segment Anything) and GroundingDINO.
        """
        x_min = random.randint(50, 400)
        y_min = random.randint(50, 400)
        x_max = x_min + random.randint(20, 150)
        y_max = y_min + random.randint(20, 150)
        
        # Simple triangular or quad polygon acting as the mask boundary
        segmentation = [
            [x_min, y_min],
            [x_max, y_min],
            [x_max, y_max],
            [x_min, y_max],
            [x_min + 10, y_min + 10]
        ]
        
        return {
            "x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max
        }, segmentation

    def create_instance(self, v_type, subtype):
        """Generates a single violation instance mapping."""
        bbox, seg_mask = self._generate_mock_box_and_mask()
        
        # Edge cases logic
        visibility_options = ["clear", "partial"]
        visibility = random.choices(visibility_options, weights=[0.8, 0.2])[0]
        
        return {
            "class": subtype,
            "bounding_box": bbox,
            "segmentation": seg_mask,
            "mask_type": "polygon",
            "visibility": visibility,
            "confidence": round(random.uniform(0.85, 0.99), 2)
        }

    def create_sample(self, forced_category=None):
        """Creates a full image annotation sample."""
        image_id = f"img_{uuid.uuid4().hex[:8]}"
        
        # Distribution: 70-80% Single, 20-30% Multiple
        is_multi = random.random() < 0.25 
        num_violations = random.randint(2, 3) if is_multi else 1
        
        instances = []
        # Ensure we use the forced category for the primary violation to guarantee distribution
        primary_category = forced_category if forced_category else random.choice(list(self.CATEGORIES.keys()))
        chosen_types = [primary_category]
        
        if num_violations > 1:
            other_cats = [c for c in self.CATEGORIES.keys() if c != primary_category]
            chosen_types.extend(random.sample(other_cats, num_violations - 1))
        
        for v_type in chosen_types:
            subtype = random.choice(self.CATEGORIES[v_type])
            instances.append(self.create_instance(v_type, subtype))
            
        env = {
            "lighting": random.choice(self.LIGHTING),
            "weather": random.choice(self.WEATHER),
            "angle": random.choice(self.ANGLES),
            "location": random.choice(self.LOCATIONS)
        }

        annotation = {
            "image_id": image_id,
            "label": "illegal_mod",
            "instances": instances,
            "image_conditions": env
        }

        # Prompt generation for the Image Engine
        subtype_str = " and ".join([inst["class"].replace("_", " ") for inst in instances])
        prompt = f"A photorealistic shot of a motorcycle in a {env['location']} area during {env['lighting']} with {env['weather']} weather. Camera angle is {env['angle']}. The motorcycle features clearly visible illegal modifications: {subtype_str}. Indian road context. Extremely high definition, sharp focus on the modified parts."
        
        return annotation, prompt

    def generate_batch(self, count=10000):
        import math
        batch_samples = []
        prompts = []
        
        # Ensure extremely even distribution across the 5 primary categories (20% each)
        target_per_class = math.ceil(count / len(self.CATEGORIES))
        
        cats = list(self.CATEGORIES.keys())
        created = 0
        
        for cat in cats:
            for _ in range(target_per_class):
                if created >= count:
                    break
                ann, prompt = self.create_sample(forced_category=cat)
                batch_samples.append(ann)
                prompts.append({"image_id": ann["image_id"], "prompt": prompt})
                created += 1
                
        random.shuffle(batch_samples)
            
        metadata_path = os.path.join(self.output_dir, "segmentation_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump({"images": batch_samples[:count]}, f, indent=2)
            
        print(f"Generated {count} advanced samples. Data saved to {metadata_path}")
        return batch_samples[:count]

if __name__ == "__main__":
    generator = SegmentationDatasetGenerator()
    batch = generator.generate_batch(10000)
    print("Generation complete! Check dataset/segmentation_metadata.json for the 10,000 samples.")
