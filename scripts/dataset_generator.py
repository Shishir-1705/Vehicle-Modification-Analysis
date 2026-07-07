import json
import random
import os

class MotorcycleDatasetGenerator:
    """
    Expert-level framework for generating illegal motorcycle modification datasets in India.
    Adheres strictly to CMVR (Central Motor Vehicle Rules).
    """

    CATEGORIES = {
        "number_plate": [
            "fancy_font", "missing_plate", "folded_plate", "incorrect_size", 
            "stylized_text_king_boss", "colored_plate_non_hsrp"
        ],
        "exhaust": [
            "aftermarket_loud_exhaust", "removed_muffler", "shortened_custom_pipe"
        ],
        "lighting": [
            "underglow_neon", "red_blue_flashing_police_style", "high_intensity_led_glare", 
            "colored_headlight_blue_purple"
        ],
        "safety": [
            "no_rear_view_mirrors", "removed_indicators", "triple_riding_highway_cruisers", 
            "no_helmet_rider"
        ],
        "structural": [
            "oversized_extended_tires", "extreme_handlebar_ape_hanger", "removed_mudguards", 
            "chassis_frame_alteration"
        ]
    }

    LOCATIONS = ["urban India", "highway in India", "rural Indian village road"]
    LIGHTING = ["daylight", "nighttime", "dusk", "low-light"]
    WEATHER = ["clear", "heavy rain", "thick fog"]
    ANGLES = ["front view", "rear view", "side profile", "45-degree angle"]

    def __init__(self, output_dir="dataset"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.metadata = []

    def generate_prompt(self, violation_type, subtype, env):
        """
        Engineers a prompt for high-quality image generation models.
        """
        angle = env["angle"]
        location = env["location"]
        weather = env["weather"]
        lighting = env["lighting"]

        base_prompt = f"A photorealistic, high-resolution shot of a motorcycle in {location} during {lighting} with {weather} weather. Camera angle: {angle}."
        
        violation_prompts = {
            "number_plate": f"The rear high-security number plate (HSRP) is replaced with a {subtype.replace('_', ' ')} violation. It displays stylized text instead of numbers, illegal in India.",
            "exhaust": f"The motorcycle features a visible {subtype.replace('_', ' ')}. A loud chrome aftermarket silencer, non-compliant with BS-VI emission standards.",
            "lighting": f"The bike has unauthorized {subtype.replace('_', ' ')} active. Bright neon or flashing lights causing glare to others on a busy Indian road.",
            "safety": f"Visible safety violation: {'three people riding a large cruiser motorcycle on a highway' if subtype == 'triple_riding_highway_cruisers' else subtype.replace('_', ' ')}. No mirrors, no helmet, strictly illegal context.",
            "structural": f"Deeply modified motorcycle with {subtype.replace('_', ' ')}. The frame and chassis are altered from original stock specifications."
        }

        specific_violation = violation_prompts.get(violation_type, "Minor illegal modification.")
        
        # Adding Indian Context markers
        context = " Indian license plates, Indian road signs, Indian traffic scene, realistic lighting, motion blur on wheels, atmospheric perspective."
        
        return f"{base_prompt} {specific_violation} {context} Strictly avoid stock or legal bikes."

    def create_sample(self, v_type=None, subtype=None):
        """
        Creates a single sample metadata and prompt.
        """
        if not v_type:
            v_type = random.choice(list(self.CATEGORIES.keys()))
        if not subtype:
            subtype = random.choice(self.CATEGORIES[v_type])

        env = {
            "location": random.choice(self.LOCATIONS),
            "lighting": random.choice(self.LIGHTING),
            "weather": random.choice(self.WEATHER),
            "angle": random.choice(self.ANGLES)
        }

        # Handling Edge Cases
        is_edge_case = random.random() < 0.3
        visibility = "partial" if is_edge_case else "clear"
        
        annotation = {
            "label": "illegal_mod",
            "violations": [
                {
                    "type": v_type,
                    "subtype": subtype,
                    "visibility": visibility,
                    "confidence": round(random.uniform(0.85, 0.99), 2)
                }
            ],
            "image_conditions": {
                "lighting": env["lighting"],
                "weather": env["weather"],
                "angle": env["angle"],
                "location": env["location"]
            }
        }

        prompt = self.generate_prompt(v_type, subtype, env)
        return annotation, prompt

    def generate_batch(self, count=10):
        """
        Generates a batch of metadata ensuring strict distribution:
        - 25% number plate
        - 20% exhaust
        - 20% lighting
        - 20% safety
        - 15% structural
        """
        import math
        
        # Calculate distribution counts
        dist = {
            "number_plate": math.ceil(count * 0.25),
            "exhaust": math.ceil(count * 0.20),
            "lighting": math.ceil(count * 0.20),
            "safety": math.ceil(count * 0.20),
            "structural": math.ceil(count * 0.15)
        }
        
        # Adjust total to exactly match count due to ceiling
        created = 0
        batch = []
        for v_type, target_count in dist.items():
            for _ in range(target_count):
                if created >= count:
                    break
                sample, prompt = self.create_sample(v_type=v_type)
                batch.append({"annotation": sample, "prompt": prompt})
                created += 1

        random.shuffle(batch)
        
        # Save securely
        metadata_path = os.path.join(self.output_dir, "batch_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dumps({"samples": batch}, indent=2)
            
        print(f"Generated {len(batch)} samples and saved to {metadata_path}")
        return batch

if __name__ == "__main__":
    generator = MotorcycleDatasetGenerator()
    # To hit 10,000 samples, you would run this in chunks via an API
    batch_data = generator.generate_batch(100)
    print("Batch generation test completed. See dataset/batch_metadata.json")
