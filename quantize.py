import os
# Import specifically from onnxruntime.quantization
from onnxruntime.quantization import quantize_dynamic, QuantType

def quantize_model(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: {input_path} does not exist.")
        return
    print(f"Quantizing {input_path} to {output_path}...")
    try:
        # Fixed parameter names for onnxruntime version > 1.4
        quantize_dynamic(
            model_input=input_path,
            model_output=output_path,
            weight_type=QuantType.QUInt8
        )
        if os.path.exists(output_path):
            original_size = os.path.getsize(input_path) / (1024 * 1024)
            quantized_size = os.path.getsize(output_path) / (1024 * 1024)
            print(f"Original: {original_size:.2f} MB")
            print(f"Quantized: {quantized_size:.2f} MB")
            print(f"Reduction: {((original_size - quantized_size) / original_size) * 100:.2f}%")
        else:
            print("Quantized file not found!")
    except Exception as e:
        print(f"Quantization failed for {input_path}: {e}")

if __name__ == "__main__":
    models = [
        ('public/models/resnet50.onnx', 'public/models/resnet50_int8.onnx'),
        ('public/models/blackgram.onnx', 'public/models/blackgram_int8.onnx'),
    ]
    for inp, outp in models:
        quantize_model(inp, outp)
