from ultralytics import YOLO

def train_yolo_model():
    """Trains a YOLOv8 model for bike part detection."""
    
    # Configuration details:
    # classes: ['exhaust', 'wheel', 'headlight']
    
    # Load a pretrained YOLOv8n (nano) model
    model = YOLO("yolov8n.pt") 
    
    # Training parameters as per Task 4:
    # - data: path to your data.yaml file
    # - epochs: 100
    # - imgsz: 640
    # - batch: 16
    
    results = model.train(
        data="dataset/data.yaml", 
        epochs=100, 
        imgsz=640, 
        batch=16,
        name="bike_detection_v1"
    )
    
    print(f"Training completed. Results saved in: {results.save_dir}")

if __name__ == "__main__":
    train_yolo_model()
