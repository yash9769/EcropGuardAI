import torch
import torch.nn as nn
from torchvision import models

def convert_model():
    val_path = 'bg_resnet50.pth'
    onnx_path = 'public/models/blackgram.onnx'
    
    # Load ResNet50
    model = models.resnet50()
    
    # For bg_resnet50.pth, we need 6 classes with Sequential
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(model.fc.in_features, 6)
    )
    
    # Load weights
    try:
        model.load_state_dict(torch.load(val_path, map_location='cpu', weights_only=False))
        print("Weights loaded successfully.")
    except Exception as e:
        print(f"Error loading state dict: {e}")
        return

    model.eval()

    # Create dummy input (Batch, Channel, Height, Width)
    dummy_input = torch.randn(1, 3, 224, 224)

    # Export to ONNX
    import os
    os.makedirs(os.path.dirname(onnx_path), exist_ok=True)
    
    torch.onnx.export(
        model, 
        dummy_input, 
        onnx_path, 
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"Model converted and saved to {onnx_path}")

if __name__ == "__main__":
    convert_model()
