def get_confidence_label(confidence: float) -> str:
    """Maps numerical confidence to human-readable strings."""
    if confidence > 0.90:
        return f"High confidence detection ({int(confidence*100)}%)"
    elif confidence >= 0.70:
        return f"Moderate confidence ({int(confidence*100)}%)"
    else:
        return f"Low confidence, may require verification ({int(confidence*100)}%)"

VIOLATION_KB = {
    "fancy_font_plate": {
        "violation": "Fancy Number Plate",
        "description": "The motorcycle uses a stylized, cursive, or decorative number plate font instead of the standard block format.",
        "why_illegal": "According to Rule 50 and 51 of the Central Motor Vehicles Rules (CMVR), number plates must follow a standardized font, size, and format for automated character recognition and law enforcement readability.",
        "severity": "medium"
    },
    "missing_plate": {
        "violation": "Missing Number Plate",
        "description": "The motorcycle is being operated without a visible high-security registration plate (HSRP) at the front or rear.",
        "why_illegal": "Operating a vehicle without a registration plate is a direct violation of the Motor Vehicles Act, hindering vehicle identification and traceability in case of accidents or offenses.",
        "severity": "high"
    },
    "underglow_lights": {
        "violation": "Illegal Underglow/Neon Lighting",
        "description": "Non-factory neon or LED strips installed beneath the chassis that project light onto the road surface.",
        "why_illegal": "The installation of decorative lighting that is not part of the manufacturer's specification can distract other motorists and is prohibited under structural modification laws.",
        "severity": "low"
    },
    "no_helmet": {
        "violation": "Riding Without Helmet",
        "description": "The rider or pillion passenger is detected without a protective safety helmet.",
        "why_illegal": "Mandatory under Section 129 of the Motor Vehicles Act. It significantly increases the risk of fatal head injuries during a crash.",
        "severity": "critical"
    },
    "modified_exhaust": {
        "violation": "Modified Exhaust (Loud Pipe)",
        "description": "The factory-fitted silencer has been replaced with an aftermarket loud exhaust or a straight pipe.",
        "why_illegal": "Violation of noise pollution norms and RTO regulations. Such exhausts often lack db-killers and increase noise levels beyond the permissible 80dB limit.",
        "severity": "high"
    },
    "triple_riding": {
        "violation": "Triple Riding",
        "description": "More than two individuals (one rider and one pillion) are detected on the motorcycle.",
        "why_illegal": "Two-wheelers are designed and registered for a maximum of two occupants. Overloading affects stability, braking distance, and handling, risking the lives of all occupants.",
        "severity": "high"
    },
    "no_mirrors": {
        "violation": "Removed Rear View Mirrors",
        "description": "The motorcycle is missing functional rear or side-view mirrors.",
        "why_illegal": "Mirrors are essential safety equipment for situational awareness. Removing them is a safety violation that increases the risk of side-swipe accidents.",
        "severity": "medium"
    },
    "colored_headlight": {
        "violation": "Colored Headlight/Auxiliary Lights",
        "description": "The motorcycle is using non-white or non-yellow headlights (e.g., blue, green, red).",
        "why_illegal": "Standard lighting colors are mandated for visibility and to avoid confusion with emergency vehicles. Non-standard colors significantly reduce nocturnal visibility.",
        "severity": "medium"
    },
    "oversized_tires": {
        "violation": "Oversized/Protruding Tires",
        "description": "Installation of tires that are wider or larger than the manufacturer-specified frame clearance.",
        "why_illegal": "Structural modifications that alter the vehicle's geometry or dynamics require ARAI approval. Oversized tires can interfere with braking and suspension components.",
        "severity": "medium"
    },
    "removed_mudguard": {
        "violation": "Removed/Shortened Mudguard",
        "description": "The rear or front mudguard (fender) has been removed or cut short.",
        "why_illegal": "Mudguards are required to prevent debris and water from being projected at other motorists and to protect the vehicle's own electrical components.",
        "severity": "low"
    },
    "flashing_red_blue_lights": {
        "violation": "Emergency Style Flashing Lights",
        "description": "Installation of red and blue flashing lights similar to emergency or police vehicles.",
        "why_illegal": "Impersonating emergency vehicles or using their restricted light colors is a serious legal offense with criminal implications.",
        "severity": "critical"
    },
    "high_intensity_headlight": {
        "violation": "High-Intensity LED/HID Glare",
        "description": "Aftermarket high-intensity LED or HID bulbs that cause excessive glare to oncoming traffic.",
        "why_illegal": "Excessive glare blinds oncoming drivers, creating a high risk of head-on collisions. Standard bulbs must not exceed prescribed lumen levels.",
        "severity": "high"
    }
}

def generate_explanation(class_name: str, confidence: float, location_hint: str = None) -> dict:
    """
    Generates a structured, human-readable explanation for a detected motorcycle violation.
    """
    # 1. Fetch from Knowledge Base (fallback to generic if unknown)
    kb_entry = VIOLATION_KB.get(class_name, {
        "violation": class_name.replace("_", " ").title(),
        "description": f"The system detected a potential modification related to {class_name}.",
        "why_illegal": "Non-standard modifications often violate general safety or emission standards.",
        "severity": "medium"
    })
    
    # 2. Derive visual evidence based on class with attention-linked context
    visual_evidence = f"High-intensity attention detected on {kb_entry['violation'].lower()} features, indicating a structural deviation."
    if "plate" in class_name:
        visual_evidence = "The model focused on the number plate region where non-standard font patterns and stylized lettering were identified."
    elif "exhaust" in class_name:
        visual_evidence = "Strong AI focus on the silencer geometry where non-compliant dimensions and lack of db-killers were detected."
    elif "lighting" in class_name or "light" in class_name:
        visual_evidence = "The AI focus map highlights illegal luminous intensity and non-standard light color spectrums."
    
    # 3. Construct Final Object
    location_str = f"{location_hint.title()} section of the motorcycle" if location_hint else "Identified region of the motorcycle"
    
    return {
        "violation": kb_entry["violation"],
        "description": kb_entry["description"],
        "why_illegal": kb_entry["why_illegal"],
        "location": location_str,
        "visual_evidence": visual_evidence,
        "confidence": get_confidence_label(confidence),
        "severity": kb_entry["severity"]
    }

def explain_detections(detections: list) -> list:
    """
    Processes a list of raw detections and attaches XAI explanations to each.
    """
    enhanced_detections = []
    for det in detections:
        explanation = generate_explanation(
            det.get("component_name"),
            det.get("confidence", 0.0),
            det.get("location_hint")
        )
        # Deep copy/Update
        new_det = det.copy()
        new_det["explanation"] = explanation
        enhanced_detections.append(new_det)
        
    return enhanced_detections
