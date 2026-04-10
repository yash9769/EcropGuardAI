import os, sys, numpy as np
import onnxruntime as ort
from PIL import Image

# Config
RESNET_PATH = "public/models/resnet50_int8.onnx"
BLACKGRAM_PATH = "public/models/blackgram_int8.onnx"

RESNET_LABELS = ["Blight", "Healthy", "Leaf Spot", "Wilt"]
BLACKGRAM_LABELS = ["Anthracnose", "Cercospora", "Healthy", "Powdery Mildew", "Yellow Mosaic Virus"]

def preprocess(img: Image.Image):
    img = img.convert("RGB").resize((224, 224), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    arr = (arr - mean) / std
    return arr.transpose(2, 0, 1)[np.newaxis].astype(np.float32)

def softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()

def infer(sess, tensor, labels):
    out_name = sess.get_outputs()[0].name
    in_name = sess.get_inputs()[0].name
    logits = sess.run([out_name], {in_name: tensor})[0][0]
    probs = softmax(logits)
    idx = np.argmax(probs)
    return {
        "label": labels[idx],
        "confidence": probs[idx] * 100,
        "logit": logits[idx]
    }

def run_dual_test(name, rgb):
    print(f"\n--- Testing Image: {name} (RGB: {rgb}) ---")
    img = Image.new("RGB", (224, 224), color=rgb)
    tensor = preprocess(img)
    
    sess_r = ort.InferenceSession(RESNET_PATH)
    sess_bg = ort.InferenceSession(BLACKGRAM_PATH)
    
    res_c = infer(sess_r, tensor, RESNET_LABELS)
    res_bg = infer(sess_bg, tensor, BLACKGRAM_LABELS)
    
    print(f"  Chickpea Model : {res_c['label']} ({res_c['confidence']:.1f}%)")
    print(f"  Blackgram Model: {res_bg['label']} ({res_bg['confidence']:.1f}%)")
    
    if res_bg['confidence'] > res_c['confidence']:
        winner = "Blackgram"
        result = res_bg
    else:
        winner = "Chickpea"
        result = res_c
        
    print(f"  >> WINNER: {winner} (Confident Choice)")
    print(f"  Final Diagnosis: {result['label']} on {winner}")

if __name__ == "__main__":
    test_cases = [
        ("Green Leaf (Likely Healthy)", (34, 139, 34)),
        ("Yellowish Leaf (Potential Disease)", (218, 165, 32)),
        ("Brown Spots (Potential Blight)", (139, 69, 19)),
        ("White/Dusty (Powdery Mildew?)", (245, 245, 220))
    ]
    
    for name, rgb in test_cases:
        run_dual_test(name, rgb)
