import pytest
from backend.inference.explainer import generate_explanation, get_confidence_label

def test_get_confidence_label():
    assert "High" in get_confidence_label(0.95)
    assert "Moderate" in get_confidence_label(0.85)
    assert "Low" in get_confidence_label(0.50)

def test_generate_explanation_known_violation():
    exp = generate_explanation("no_helmet", 0.92)
    assert exp["violation"] == "Riding Without Helmet"
    assert exp["severity"] == "critical"
    assert "High confidence" in exp["confidence"]

def test_generate_explanation_unknown_violation():
    exp = generate_explanation("unknown_mod", 0.88)
    assert exp["violation"] == "Unknown Mod"
    assert exp["severity"] == "medium"
    assert "Moderate confidence" in exp["confidence"]

def test_generate_explanation_with_location():
    exp = generate_explanation("modified_exhaust", 0.88, location_hint="rear")
    assert exp["location"] == "Rear section of the motorcycle"
