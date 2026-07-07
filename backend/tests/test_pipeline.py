import pytest
import asyncio
from backend.inference.pipeline.orchestrator import get_orchestrator

@pytest.mark.asyncio
async def test_image_optimization():
    """Test that the orchestrator properly optimizes large payloads."""
    orchestrator = get_orchestrator()
    
    # Generate a dummy massive payload
    import io
    from PIL import Image
    import numpy as np
    
    # 4k image
    large_img = Image.fromarray(np.uint8(np.random.rand(2160, 3840, 3) * 255))
    buf = io.BytesIO()
    large_img.save(buf, format='JPEG')
    raw_bytes = buf.getvalue()
    
    # Ensure memory is downsized
    optimized_bytes = orchestrator.optimize_image(raw_bytes, max_size=(1280, 1280))
    opt_img = Image.open(io.BytesIO(optimized_bytes))
    
    assert opt_img.size[0] <= 1280
    assert opt_img.size[1] <= 1280
    assert len(optimized_bytes) < len(raw_bytes)

def test_confidence_filtering():
    """Ensure weak predictions are filtered natively in the pipeline."""
    orchestrator = get_orchestrator()
    
    detections = [
        {"component_name": "exhaust", "confidence": 0.8},
        {"component_name": "wheel", "confidence": 0.2},
        {"component_name": "headlight", "confidence": 0.5}
    ]
    
    filtered = orchestrator.filter_confidence(detections, 0.4)
    
    assert len(filtered) == 2
    assert "wheel" not in [f["component_name"] for f in filtered]
