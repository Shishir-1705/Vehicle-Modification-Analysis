import cv2
from ultralytics import YOLO

def run_inference(image_path, model_path="models/best.pt"):
    """
    Loads a trained YOLOv8 model and runs detection on a single image.
    Displays results using a bounding box visualization.
    """
    
    # Task 5: Loading the trained model
    model = YOLO(model_path) 
    
    # Task 5: Running detection
    results = model.predict(source=image_path, conf=0.25)
    
    # Task 5: Displaying results
    # Each result object contains boxes, masks, keypoints, and more.
    for result in results:
        # Save a visualized image with bounding boxes
        # This creates a 'result_name.jpg' in the current directory or 'runs/detect/predict'
        result.save(filename="inference_result.jpg") 
        
        # Access detection details
        boxes = result.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            
            print(f"Detected Class: {cls}, Confidence: {conf:.2f}, Box: {xyxy}")

    print(f"Inference results saved as: inference_result.jpg")

if __name__ == "__main__":
    # Update with your test image path
    run_inference("test_bike.jpg")
