import torch
import sys

def check_pth(path):
    print(f"Checking {path}...")
    try:
        # Load with weights_only=False to support all types
        checkpoint = torch.load(path, map_location='cpu', weights_only=False)
        
        # If it's a dict (state_dict)
        if isinstance(checkpoint, dict):
            # Look for fc.weight or similar
            found = False
            for key in checkpoint.keys():
                if 'fc.weight' in key or 'head.weight' in key or 'classifier.weight' in key:
                    shape = checkpoint[key].shape
                    print(f"Found layer {key} with shape {shape}")
                    print(f"Estimated num_classes: {shape[0]}")
                    found = True
                    break
            if not found:
                 print(f"Keys found: {list(checkpoint.keys())[:10]}")
        else:
            # Full model
            try:
                # Common linear layer names
                num_classes = -1
                if hasattr(checkpoint, 'fc'):
                    num_classes = checkpoint.fc.out_features
                elif hasattr(checkpoint, 'classifier'):
                    if isinstance(checkpoint.classifier, torch.nn.Linear):
                        num_classes = checkpoint.classifier.out_features
                    else:
                        num_classes = checkpoint.classifier[-1].out_features
                
                if num_classes != -1:
                    print(f"Full model detected with {num_classes} classes")
                else:
                    print(f"Full model detected: {type(checkpoint)}")
            except Exception as e:
                print(f"Could not determine classes from full model: {e}")
                
    except Exception as e:
        print(f"Error checking {path}: {e}")

if __name__ == "__main__":
    import os
    if os.path.exists('resnet50 (1).pth'):
        check_pth('resnet50 (1).pth')
    if os.path.exists('blackgram_resnet50 (1).pth'):
        check_pth('blackgram_resnet50 (1).pth')
