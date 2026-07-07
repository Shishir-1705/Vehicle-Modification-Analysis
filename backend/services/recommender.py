PRODUCT_GRAPH = {
    "exhaust_modified": [
        {
            "product_name": "High-Flow Intake Filter", 
            "reason": "Since your exhaust breathes faster, upgrading the air intake will balance the A/F ratio and maximize HP.",
            "affiliate_link": "https://amazon.com/dp/high-flow-intake-partner"
        },
        {
            "product_name": "DynoECU Remap Software", 
            "reason": "Ensure the fuel map is matched to your aftermarket exhaust pipe.",
            "affiliate_link": "https://revzilla.com/dynotune-partner"
        }
    ],
    "wheels_modified": [
        {
            "product_name": "Performance Brake Rotors 320mm", 
            "reason": "Aftermarket wheels reduce unsprung mass; upgrading rotors provides extreme track stopping power.",
            "affiliate_link": "https://amazon.com/dp/brake-rotors-partner"
        }
    ],
    "body_kit": [
        {
            "product_name": "Aerodynamic Winglets", 
            "reason": "Complements the aggressive profile of your body kit while increasing high-speed downforce.",
            "affiliate_link": "https://revzilla.com/aero-winglets"
        }
    ]
}

def get_suggestions(detected_parts: list) -> list:
    """
    Parses detected YOLO components and triggers logic gates 
    to fetch curated affiliate products.
    """
    suggestions = []
    
    for part in detected_parts:
        mod_name = part.get("component_name")
        if mod_name in PRODUCT_GRAPH:
            # Attach the component name back so the frontend knows what triggered it
            for product in PRODUCT_GRAPH[mod_name]:
                suggestions.append({
                    "trigger_component": mod_name,
                    "product_name": product["product_name"],
                    "reason": product["reason"],
                    "affiliate_link": product["affiliate_link"]
                })
                
    return suggestions
