import torch
import torch.nn as nn
from torchvision import models

def convert_model(pth_path, onnx_path, num_classes=None):
    # Load ResNet50
    model = models.resnet50()
    
    # Adjust last layer if num_classes is provided
    if num_classes:
        model.fc = nn.Linear(model.fc.in_features, num_classes)
    
    # Load weights
    try:
        model.load_state_dict(torch.load(pth_path, map_location='cpu'))
    except Exception as e:
        print(f"Error loading state dict: {e}")
        print("Trying to load as full model weights...")
        checkpoint = torch.load(pth_path, map_location='cpu')
        if isinstance(checkpoint, dict):
             model.load_state_dict(checkpoint, strict=False)
        else:
             model = checkpoint

    model.eval()

    # Create dummy input (Batch, Channel, Height, Width)
    dummy_input = torch.randn(1, 3, 224, 224)

    # Export to ONNX
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
    # You might need to change num_classes to match your trained models!
    # Common for blackgram models: 4 or 5 classes? 
    # If it fails, try without num_classes or check your training code.
    convert_model('resnet50 (1).pth', 'public/models/resnet50.onnx', num_classes=4)
    convert_model('blackgram_resnet50 (1).pth', 'public/models/blackgram.onnx', num_classes=5)
