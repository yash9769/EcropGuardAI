package com.ecropguard.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;

import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "OnnxPlugin")
public class OnnxPlugin extends Plugin {

    private static final String TAG = "OnnxPlugin";

    // ImageNet normalization constants
    private static final float[] MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] STD  = {0.229f, 0.224f, 0.225f};
    private static final int INPUT_SIZE = 224;

    // Labels for resnet50 (general crops) — must match training order
    private static final String[] LABELS_RESNET50 = {
        "Healthy", "Early Blight", "Late Blight", "Rust"
    };

    // Labels for blackgram model — must match training order
    private static final String[] LABELS_BLACKGRAM = {
        "Healthy", "Cercospora Leaf Spot", "Yellow Mosaic Virus", "Powdery Mildew", "Anthracnose"
    };

    private OrtEnvironment ortEnv;

    @Override
    public void load() {
        try {
            ortEnv = OrtEnvironment.getEnvironment();
            Log.i(TAG, "ORT environment initialized");
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize ORT environment", e);
        }
    }

    /**
     * JS call: OnnxPlugin.predict({ imageBase64: "...", model: "resnet50" | "blackgram" })
     * Returns: { label: string, confidence: number, classIndex: number, allScores: {}, rawLogits: {}, modelUsed: string, timestamp: number }
     */
    @PluginMethod
    public void predict(PluginCall call) {
        String imageBase64 = call.getString("imageBase64");
        String modelName   = call.getString("model", "resnet50");

        if (imageBase64 == null || imageBase64.isEmpty()) {
            call.reject("imageBase64 is required");
            return;
        }

        // Strip data URL prefix if present
        if (imageBase64.contains(",")) {
            imageBase64 = imageBase64.split(",")[1];
        }

        try {
            // 1. Decode base64 → Bitmap
            byte[] imageBytes = Base64.decode(imageBase64, Base64.DEFAULT);
            Bitmap originalBitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
            if (originalBitmap == null) {
                call.reject("Failed to decode image. Make sure it is a valid JPEG/PNG.");
                return;
            }

            // 2. Resize to 224×224
            Bitmap bitmap = Bitmap.createScaledBitmap(originalBitmap, INPUT_SIZE, INPUT_SIZE, true);

            // 3. Choose model & labels
            String modelFileName;
            String[] labels;
            if ("blackgram".equals(modelName)) {
                modelFileName = "public/models/blackgram.onnx";
                labels = LABELS_BLACKGRAM;
            } else {
                modelFileName = "public/models/resnet50.onnx";
                labels = LABELS_RESNET50;
            }

            // 4. Load ONNX model from assets
            Context ctx = getContext();
            InputStream modelStream;
            try {
                modelStream = ctx.getAssets().open(modelFileName);
            } catch (Exception e) {
                call.reject("Model file NOT FOUND in assets: " + modelFileName + ". Please ensure it is present in android/app/src/main/assets/" + modelFileName);
                return;
            }
            byte[] modelBytes = modelStream.readAllBytes();
            modelStream.close();

            OrtSession.SessionOptions opts = new OrtSession.SessionOptions();
            opts.setIntraOpNumThreads(2);
            OrtSession session = ortEnv.createSession(modelBytes, opts);

            // 5. Preprocess: HWC Bitmap → CHW Float32 tensor (1,3,224,224)
            float[] tensorData = bitmapToTensor(bitmap);
            long[] shape = {1, 3, INPUT_SIZE, INPUT_SIZE};
            OnnxTensor inputTensor = OnnxTensor.createTensor(
                ortEnv,
                FloatBuffer.wrap(tensorData),
                shape
            );

            // 6. Run inference
            Map<String, OnnxTensor> feeds = new HashMap<>();
            feeds.put("input", inputTensor);
            OrtSession.Result result = session.run(feeds);

            // 7. Extract output logits
            float[][] logitsArray = (float[][]) result.get(0).getValue();
            float[] scores = logitsArray[0];

            // 8. Softmax to get probabilities
            float[] probs = softmax(scores);
            int maxIdx = argmax(probs);
            float confidence = probs[maxIdx];

            String label = (maxIdx < labels.length)
                ? labels[maxIdx]
                : "Unknown (class " + maxIdx + ")";

            // Return pixel stats to prove the model is seeing the actual image
            float[] stats = getPixelStats(tensorData);
            float mean = stats[0];
            float stdDev = stats[1];

            // 9. Cleanup
            inputTensor.close();
            result.close();
            session.close();
            bitmap.recycle();
            if (!originalBitmap.isRecycled()) originalBitmap.recycle();

            // 10. Return to JS
            JSObject ret = new JSObject();
            ret.put("label", label);
            ret.put("confidence", Math.round(confidence * 100)); // 0-100 integer
            ret.put("classIndex", maxIdx);
            ret.put("allScores", scoresToJson(probs, labels));
            ret.put("rawLogits", scoresToJson(scores, labels)); // Raw model outputs
            ret.put("modelUsed", modelFileName);
            ret.put("imgMean", mean);
            ret.put("imgStdDev", stdDev);
            ret.put("timestamp", System.currentTimeMillis());
            
            Log.i(TAG, "Inference: " + label + " (Conf: " + Math.round(confidence * 100) + "%, Mean: " + mean + ", Std: " + stdDev + ")");
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "ONNX inference failed", e);
            call.reject("ONNX inference failed: " + e.getMessage());
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /** Convert a 224×224 Bitmap to a CHW float32 array normalized with ImageNet stats */
    private float[] bitmapToTensor(Bitmap bitmap) {
        int[] pixels = new int[INPUT_SIZE * INPUT_SIZE];
        bitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE);

        float[] data = new float[3 * INPUT_SIZE * INPUT_SIZE];
        int pixelCount = INPUT_SIZE * INPUT_SIZE;

        for (int i = 0; i < pixelCount; i++) {
            int px = pixels[i];
            float r = ((px >> 16) & 0xFF) / 255.0f;
            float g = ((px >> 8)  & 0xFF) / 255.0f;
            float b = ( px        & 0xFF) / 255.0f;

            data[i]                      = (r - MEAN[0]) / STD[0]; // R channel
            data[i + pixelCount]         = (g - MEAN[1]) / STD[1]; // G channel
            data[i + 2 * pixelCount]     = (b - MEAN[2]) / STD[2]; // B channel
        }
        return data;
    }

    private float[] softmax(float[] logits) {
        float max = logits[0];
        for (float v : logits) if (v > max) max = v;

        float sum = 0;
        float[] exp = new float[logits.length];
        for (int i = 0; i < logits.length; i++) {
            exp[i] = (float) Math.exp(logits[i] - max);
            sum += exp[i];
        }
        for (int i = 0; i < exp.length; i++) exp[i] /= sum;
        return exp;
    }

    private int argmax(float[] probs) {
        int maxIdx = 0;
        for (int i = 1; i < probs.length; i++) {
            if (probs[i] > probs[maxIdx]) maxIdx = i;
        }
        return maxIdx;
    }

    private JSObject scoresToJson(float[] values, String[] labels) {
        JSObject obj = new JSObject();
        for (int i = 0; i < values.length; i++) {
            String lbl = (i < labels.length) ? labels[i] : "class_" + i;
            obj.put(lbl, values[i]);
        }
        return obj;
    }

    /** Returns [mean, stdDev] of the normalized tensor data */
    private float[] getPixelStats(float[] data) {
        if (data == null || data.length == 0) return new float[]{0, 0};
        float sum = 0;
        for (float v : data) sum += v;
        float mean = sum / data.length;

        float sqSum = 0;
        for (float v : data) sqSum += (v - mean) * (v - mean);
        float stdDev = (float) Math.sqrt(sqSum / data.length);

        return new float[]{mean, stdDev};
    }
}

