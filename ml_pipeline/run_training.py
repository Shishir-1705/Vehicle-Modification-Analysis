import argparse
import sys
from ml_pipeline.production_trainer import IllegalModTrainer
from ml_pipeline.training_utils import visualize_training_batch

def main():
    parser = argparse.ArgumentParser(description="Motorcycle Compliance Production Training CLI")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=8, help="Batch size")
    parser.add_argument("--type", type=str, choices=["detect", "segment"], default="segment", 
                        help="Model type: detect or segment")
    parser.add_argument("--skip-vis", action="store_true", help="Skip dataset visualization check")
    
    args = parser.parse_args()
    
    print(f"--- 🛠️  Starting Production Training Pipeline [{args.type.upper()}] ---")
    
    # 1. Visualization Check
    if not args.skip_vis:
        print("\nStep 1: Visualizing Dataset Setup...")
        visualize_training_batch("dataset")
        
    # 2. Run Training
    print("\nStep 2: Training Cycle...")
    trainer = IllegalModTrainer(data_root="dataset")
    results = trainer.run_training_cycle(epochs=args.epochs, batch=args.batch, model_type=args.type)
    
    if results:
        print("\n✅ Training Pipeline Completed Successfully!")
    else:
        print("\n❌ Training Pipeline Failed. Check logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
