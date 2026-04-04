import torch
import torchvision
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import os

def main():
    model_path = '/Users/yashodhanrajapkar/Documents/ecropguard/bg_resnet50.pth'
    data_dir = '/Users/yashodhanrajapkar/Documents/ecropguard/BPLD'
    
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Define transformations for validation data
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load dataset
    dataset = datasets.ImageFolder(root=data_dir, transform=transform)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=False, num_workers=2)
    classes = dataset.classes
    classes.append('Unknown')
    print(f"Classes found ({len(classes)} with Unknown): {classes}")
    
    # Load model
    print("Loading model...")
    model = torchvision.models.resnet50(pretrained=False)
    # Modify final layer to match the number of classes
    num_ftrs = model.fc.in_features
    model.fc = torch.nn.Sequential(
        torch.nn.Dropout(0.5),
        torch.nn.Linear(num_ftrs, 6)
    )
    
    try:
        # try loading weights
        state_dict = torch.load(model_path, map_location=device, weights_only=False)
        # Check if it's a full model or just weights
        if not isinstance(state_dict, dict):
             print("Loaded full model object")
             model = state_dict
        else:
             # handle missing keys if they used dataparallel
             if list(state_dict.keys())[0].startswith('module.'):
                 state_dict = {k.replace('module.', ''): v for k, v in state_dict.items()}
             model.load_state_dict(state_dict)
    except Exception as e:
        print(f"Error loading model: {e}")
        # let's try reading the checkpoint structure
        try:
           state_dict = torch.load(model_path, map_location=device, weights_only=False)
           for k, v in state_dict.items():
               if 'fc' in k or 'classifier' in k:
                   print(f"{k} shape: {v.shape}")
        except:
           pass
        return
        
    model = model.to(device)
    model.eval()
    
    all_preds = []
    all_labels = []
    
    print("Starting evaluation...")
    with torch.no_grad():
        for inputs, labels in dataloader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    print("\nAccuracy:", sum(1 for x, y in zip(all_preds, all_labels) if x == y) / len(all_labels))
    
    # Manual confusion matrix
    n_classes = len(classes)
    conf_matrix = [[0 for _ in range(n_classes)] for _ in range(n_classes)]
    for p, l in zip(all_preds, all_labels):
        conf_matrix[l][p] += 1
        
    print("\nConfusion Matrix:")
    # print headers
    print("   True \ Pred  " + " ".join([f"{c[:8]:>8}" for c in classes]))
    for i in range(n_classes):
        row = f"{classes[i][:15]:>15} " + " ".join([f"{conf_matrix[i][j]:>8}" for j in range(n_classes)])
        print(row)
        
    # precision and recall
    print("\nMetrics:")
    for i in range(n_classes):
        tp = conf_matrix[i][i]
        fp = sum(conf_matrix[j][i] for j in range(n_classes)) - tp
        fn = sum(conf_matrix[i][j] for j in range(n_classes)) - tp
        
        precision = tp / (tp + fp) if tp + fp > 0 else 0
        recall = tp / (tp + fn) if tp + fn > 0 else 0
        print(f"{classes[i][:15]:>15} | Precision: {precision:.4f} | Recall: {recall:.4f}")

if __name__ == "__main__":
    main()
