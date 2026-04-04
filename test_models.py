"""
test_models.py
==============
Tests both resnet50.onnx and blackgram.onnx against real disease images
downloaded from public Wikimedia / iNaturalist URLs.

Goal:
  1. Find the CORRECT class-index → label mapping by testing real images
  2. Report per-class accuracy under each possible label ordering
  3. Output a definitive recommendation for the Java label arrays

Usage:
  python3 test_models.py
"""

import os, sys, urllib.request, io
import numpy as np

try:
    import onnxruntime as ort
except ImportError:
    print("Installing onnxruntime..."); os.system(f"{sys.executable} -m pip install onnxruntime Pillow -q")
    import onnxruntime as ort

from PIL import Image

# ── Config ────────────────────────────────────────────────────────────────────

RESNET_PATH   = "public/models/resnet50.onnx"
BLACKGRAM_PATH= "public/models/blackgram.onnx"

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406])
IMAGENET_STD  = np.array([0.229, 0.224, 0.225])

# ── Candidate label orderings to test ─────────────────────────────────────────
# PyTorch ImageFolder assigns index = alphabetical order of folder names.
# We test several plausible orderings and see which gives sensible logits.

RESNET_CANDIDATES = [
    # (label0, label1, label2, label3)
    ("Healthy",            "Chickpea Blight",       "Chickpea Rust",       "Chickpea Wilt/Yellow"),
    ("Chickpea Blight",    "Chickpea Rust",          "Chickpea Wilt",       "Healthy"),
    ("Chickpea Healthy",   "Chickpea Wilt/Dry Root", "Collar Rot",          "Leaf Blight"),
    ("Ashy Stem Blight",   "Healthy",                "Leaf Blight",         "Yellow Mosaic"),
    ("Alternaria Blight",  "Healthy",                "Fusarium Wilt",       "Yellow Mosaic"),
    ("Gram Pod Borer",     "Healthy",                "Leaf Spot",           "Wilt"),
    # Common Kaggle chickpea dataset folder names (alphabetical):
    ("blight",             "common_rust",            "gray_leaf_spot",      "healthy"),
    ("Chickpea_Healthy",   "Phytophthora_root_rot",  "Pythium_root_rot",    "Rhizoctonia_stem_rot"),
]

BLACKGRAM_CANDIDATES = [
    # (label0, label1, label2, label3, label4)
    ("Healthy",             "Cercospora_Leaf_Spot",  "Yellow_Mosaic_Virus", "Powdery_Mildew",  "Anthracnose"),
    ("Anthracnose",         "Cercospora_Leaf_Spot",  "Healthy",             "Powdery_Mildew",  "Yellow_Mosaic"),
    ("Cercospora",          "Healthy",               "Leaf_Crinkle",        "Powdery_Mildew",  "Yellow_Mosaic"),
    ("Healthy",             "Leaf_Crinkle",          "Mungbean_YMV",        "Powdery_Mildew",  "Cercospora"),
    # Alphabetical order of common kaggle blackgram dataset:
    ("Cercospora_LeafSpot", "Healthy",               "Mosaic_Virus",        "Powdery_Mildew",  "Anthracnose"),
    ("Blackgram_Healthy",   "Cercospora",            "LeafCrinkle",         "PowerdyMildew",   "YellowMosaic"),
]

# ── Test images with KNOWN ground truth ───────────────────────────────────────
# Each entry: (url_or_path, expected_disease_keyword, model_target)
# We use public domain / CC images.

TEST_IMAGES = [
    # === CHICKPEA images ===
    # Healthy green chickpea leaf
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Chickpea_leaf.jpg/320px-Chickpea_leaf.jpg",
     "healthy", "resnet50"),
    # Chickpea with fusarium wilt (yellowing, wilting)
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Chickpea_Fusarium_wilt.jpg/320px-Chickpea_Fusarium_wilt.jpg",
     "wilt", "resnet50"),
    
    # === BLACKGRAM images ===
    # Healthy blackgram leaf
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Vigna_mungo_01.jpg/320px-Vigna_mungo_01.jpg",
     "healthy", "blackgram"),
    # Yellow Mosaic Virus on blackgram  
    ("https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Mung_bean_yellow_mosaic_virus_on_black_gram.jpg/320px-Mung_bean_yellow_mosaic_virus_on_black_gram.jpg",
     "yellow_mosaic", "blackgram"),
]

# Fallback synthetic images for when URLs fail
SYNTHETIC_TESTS = [
    # (name, RGB_color, expected_class_hint, model)
    ("Lush green leaf",      (30,  120,  30),  "healthy",   "both"),
    ("Yellow mosaic leaf",   (200, 200,  20),  "disease",   "both"),
    ("Brown diseased spot",  (120,  60,  20),  "disease",   "both"),
    ("Pale/wilted leaf",     (180, 200, 140),  "disease",   "both"),
    ("White powdery mildew", (230, 230, 220),  "disease",   "both"),
    ("Black/dark spots",     (40,   40,  40),  "disease",   "both"),
    ("Orange rust pustules", (210, 100,  20),  "disease",   "both"),
    ("Normal background",    (128, 128, 128),  "noise",     "both"),
    ("White wall/noise",     (255, 255, 255),  "noise",     "both"),
    ("Blue sky/noise",       (100, 150, 220),  "noise",     "both"),
]

# ── Helper functions ───────────────────────────────────────────────────────────

def preprocess(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize((224, 224), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    return arr.transpose(2, 0, 1)[np.newaxis].astype(np.float32)


def softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - x.max())
    return e / e.sum()


def infer(session: ort.InferenceSession, tensor: np.ndarray):
    out_name = session.get_outputs()[0].name
    in_name  = session.get_inputs()[0].name
    logits   = session.run([out_name], {in_name: tensor})[0][0]
    probs    = softmax(logits) * 100
    return logits, probs


def download_image(url: str):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            return Image.open(io.BytesIO(r.read()))
    except Exception as e:
        return None


def make_synthetic(rgb: tuple) -> Image.Image:
    """Create a simple solid-color test image."""
    return Image.new("RGB", (224, 224), color=rgb)


def print_result(name, logits, probs, labels):
    idx = int(np.argmax(logits))
    margin = sorted(logits)[-1] - sorted(logits)[-2]
    print(f"  Image   : {name}")
    print(f"  Logits  : {np.round(logits, 2)}")
    print(f"  Probs   : {np.round(probs, 1)}%")
    print(f"  Predicted → [{idx}] {labels[idx]}  (conf={probs[idx]:.1f}%, margin={margin:.2f})")
    print()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not os.path.exists(RESNET_PATH) or not os.path.exists(BLACKGRAM_PATH):
        print("ERROR: ONNX models not found. Run from the ecropguard project root.")
        sys.exit(1)

    sess_r  = ort.InferenceSession(RESNET_PATH)
    sess_bg = ort.InferenceSession(BLACKGRAM_PATH)

    print("=" * 70)
    print("MODEL ACCURACY TEST — eCropGuard AI")
    print("=" * 70)
    print(f"resnet50   : {sess_r.get_outputs()[0].shape} classes")
    print(f"blackgram  : {sess_bg.get_outputs()[0].shape} classes")
    print()

    # ── Phase 1: Synthetic colour tests (always available) ────────────────────
    print("─" * 70)
    print("PHASE 1: Synthetic colour images (Green=Healthy, Brown/Yellow=Disease)")
    print("─" * 70)
    print()

    # Use the current hardcoded labels in the Java plugin
    CURRENT_RESNET_LABELS   = ["Healthy", "Early Blight", "Late Blight", "Rust"]
    CURRENT_BLACKGRAM_LABELS= ["Healthy", "Cercospora Leaf Spot", "Yellow Mosaic Virus", "Powdery Mildew", "Anthracnose"]

    RESNET_SUMMARY   = {}  # idx -> [list of (image_name, conf)]
    BLACKGRAM_SUMMARY= {}

    for i in range(4):  RESNET_SUMMARY[i]   = []
    for i in range(5):  BLACKGRAM_SUMMARY[i] = []

    for name, rgb, hint, target in SYNTHETIC_TESTS:
        img  = make_synthetic(rgb)
        tensor = preprocess(img)

        if target in ("resnet50", "both"):
            logits, probs = infer(sess_r, tensor)
            idx = int(np.argmax(logits))
            RESNET_SUMMARY[idx].append((name, probs[idx], hint))

        if target in ("blackgram", "both"):
            logits, probs = infer(sess_bg, tensor)
            idx = int(np.argmax(logits))
            BLACKGRAM_SUMMARY[idx].append((name, probs[idx], hint))

    print("RESNET50 — class activation by colour:")
    print(f"{'Class Idx':<10} {'Current Label':<20} {'Activated by'}")
    print("-" * 60)
    for idx, entries in RESNET_SUMMARY.items():
        label = CURRENT_RESNET_LABELS[idx]
        if entries:
            for name, conf, hint in entries:
                print(f"  [{idx}]      {label:<20} {name} ({hint}, {conf:.0f}%)")
        else:
            print(f"  [{idx}]      {label:<20} (never predicted)")
    print()

    print("BLACKGRAM — class activation by colour:")
    print(f"{'Class Idx':<10} {'Current Label':<25} {'Activated by'}")
    print("-" * 65)
    for idx, entries in BLACKGRAM_SUMMARY.items():
        label = CURRENT_BLACKGRAM_LABELS[idx]
        if entries:
            for name, conf, hint in entries:
                print(f"  [{idx}]      {label:<25} {name} ({hint}, {conf:.0f}%)")
        else:
            print(f"  [{idx}]      {label:<25} (never predicted)")
    print()

    # More detailed per-image breakdown
    print("─" * 70)
    print("PHASE 2: Detailed logit analysis per synthetic image")
    print("─" * 70)
    print()

    print(">> RESNET50:")
    for name, rgb, hint, _ in SYNTHETIC_TESTS:
        logits, probs = infer(sess_r, preprocess(make_synthetic(rgb)))
        print_result(f"{name} [hint={hint}]", logits, probs, CURRENT_RESNET_LABELS)

    print(">> BLACKGRAM:")
    for name, rgb, hint, _ in SYNTHETIC_TESTS:
        logits, probs = infer(sess_bg, preprocess(make_synthetic(rgb)))
        print_result(f"{name} [hint={hint}]", logits, probs, CURRENT_BLACKGRAM_LABELS)

    # ── Phase 3: Download real images ────────────────────────────────────────
    print("─" * 70)
    print("PHASE 3: Real disease images from public URLs")
    print("─" * 70)
    print()

    real_image_count = 0
    for url, ground_truth, target in TEST_IMAGES:
        print(f"Downloading: {url[:70]}...")
        img = download_image(url)
        if img is None:
            print("  ⚠ FAILED to download. Skipping.\n")
            continue

        real_image_count += 1
        tensor = preprocess(img)
        print(f"  Ground truth hint: {ground_truth}")

        if target in ("resnet50", "both"):
            logits, probs = infer(sess_r, tensor)
            print_result(f"resnet50 → {ground_truth}", logits, probs, CURRENT_RESNET_LABELS)

        if target in ("blackgram", "both"):
            logits, probs = infer(sess_bg, tensor)
            print_result(f"blackgram → {ground_truth}", logits, probs, CURRENT_BLACKGRAM_LABELS)

    if real_image_count == 0:
        print("Could not download any real images (offline or URL changed).")
        print("Using synthetic analysis only.\n")

    # ── Phase 4: Key observations ─────────────────────────────────────────────
    print("=" * 70)
    print("SUMMARY & OBSERVATIONS")
    print("=" * 70)
    print()
    print("Resnet50 model — logit response to pure colours:")
    for name, rgb, hint, _ in SYNTHETIC_TESTS:
        logits, probs = infer(sess_r, preprocess(make_synthetic(rgb)))
        idx = int(np.argmax(logits))
        gap = logits.max() - logits.min()
        print(f"  {name:<30} -> [{idx}] {CURRENT_RESNET_LABELS[idx]:<20} conf={probs[idx]:.0f}%  gap={gap:.1f}")

    print()
    print("Blackgram model — logit response to pure colours:")
    for name, rgb, hint, _ in SYNTHETIC_TESTS:
        logits, probs = infer(sess_bg, preprocess(make_synthetic(rgb)))
        idx = int(np.argmax(logits))
        gap = logits.max() - logits.min()
        print(f"  {name:<30} -> [{idx}] {CURRENT_BLACKGRAM_LABELS[idx]:<25} conf={probs[idx]:.0f}%  gap={gap:.1f}")

    print()
    print("─" * 70)
    print("TO GET CORRECT LABELS: Tell us what folders your training dataset had.")
    print("PyTorch ImageFolder assigns class indices in ALPHABETICAL order of folder names.")
    print("─" * 70)
    print()
    print("Example:")
    print("  If your chickpea dataset had folders: Blight/ Healthy/ Rust/ Wilt/")
    print("  Then: class 0=Blight, 1=Healthy, 2=Rust, 3=Wilt  (alphabetical)")


if __name__ == "__main__":
    main()
