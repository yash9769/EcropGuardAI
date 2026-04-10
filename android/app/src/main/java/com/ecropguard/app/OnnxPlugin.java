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
        "Blight", "Healthy", "Leaf Spot", "Wilt"
    };

    // Labels for blackgram model — must match training order
    private static final String[] LABELS_BLACKGRAM = {
        "Anthracnose", "Cercospora", "Healthy", "Powdery Mildew", "Yellow Mosaic Virus"
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
    /**
     * JS call: OnnxPlugin.predict({ imageBase64: "..." })
     * Returns: { label: string, confidence: number, classIndex: number, allScores: {}, modelUsed: string, isNoise: boolean }
     */
    @PluginMethod
    public void predict(PluginCall call) {
        String imageBase64 = call.getString("imageBase64");

        if (imageBase64 == null || imageBase64.isEmpty()) {
            call.reject("imageBase64 is required");
            return;
        }

        if (imageBase64.contains(",")) {
            imageBase64 = imageBase64.split(",")[1];
        }

        try {
            byte[] imageBytes = Base64.decode(imageBase64, Base64.DEFAULT);
            Bitmap originalBitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
            if (originalBitmap == null) {
                call.reject("Failed to decode image");
                return;
            }

            Bitmap bitmap = Bitmap.createScaledBitmap(originalBitmap, INPUT_SIZE, INPUT_SIZE, true);
            int[] pixels = new int[INPUT_SIZE * INPUT_SIZE];
            bitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE);
            float[] tensorData = bitmapToTensor(pixels);
            
            long[] shape = {1, 3, INPUT_SIZE, INPUT_SIZE};
            OnnxTensor inputTensor = OnnxTensor.createTensor(ortEnv, FloatBuffer.wrap(tensorData), shape);

            // Run ResNet50 (Chickpea)
            Prediction resChickpea = runModelInference(inputTensor, "public/models/resnet50_int8.onnx", LABELS_RESNET50);
            // Run Blackgram
            Prediction resBlackgram = runModelInference(inputTensor, "public/models/blackgram_int8.onnx", LABELS_BLACKGRAM);

            // Selection Logic: Take the one with higher confidence
            Prediction winner = (resBlackgram.confidence > resChickpea.confidence) ? resBlackgram : resChickpea;
            String[] winnerLabels = (winner == resBlackgram) ? LABELS_BLACKGRAM : LABELS_RESNET50;

            // Saturation & Variance for Noise Rejection
            float sum = 0, sqSum = 0, saturationSum = 0;
            for (int px : pixels) {
                float r = (px >> 16) & 0xFF, g = (px >> 8) & 0xFF, b = px & 0xFF;
                float avg = (r + g + b) / 3.0f;
                sum += avg; sqSum += avg * avg;
                saturationSum += (Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)) / 3.0f;
            }
            float n = pixels.length;
            float variance = (sqSum / n) - ((sum / n) * (sum / n));
            float saturation = saturationSum / n;

            boolean isLikelyNoise = false;
            if (saturation < 6.0f || variance < 20 || variance > 8000) isLikelyNoise = true;
            
            // Model specific additional noise gating
            if (winner == resChickpea) {
                if (winner.topLogit < 3.2f || winner.confidence < 0.60f) isLikelyNoise = true;
            } else {
                if (winner.confidence < 0.45f) isLikelyNoise = true;
            }

            String label = winner.label;
            if (isLikelyNoise) label = "No Crop Detected";

            // Cleanup & Response
            inputTensor.close();
            bitmap.recycle();
            if (!originalBitmap.isRecycled()) originalBitmap.recycle();

            JSObject ret = new JSObject();
            ret.put("label", label);
            ret.put("confidence", isLikelyNoise ? 0 : Math.round(winner.confidence * 100));
            ret.put("classIndex", winner.index);
            ret.put("allScores", scoresToJson(winner.probs, winnerLabels));
            ret.put("rawLogits", scoresToJson(winner.logits, winnerLabels));
            ret.put("modelUsed", winner.modelName);
            ret.put("isNoise", isLikelyNoise);
            ret.put("cropType", winner == resChickpea ? "Chickpea" : "Blackgram");
            ret.put("timestamp", System.currentTimeMillis());
            
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Inference failed", e);
            call.reject("Inference failed: " + e.getMessage());
        }
    }

    private static class Prediction {
        String label;
        float confidence;
        float topLogit;
        int index;
        float[] logits;
        float[] probs;
        String modelName;
    }

    private Prediction runModelInference(OnnxTensor input, String modelPath, String[] labels) throws Exception {
        InputStream is = getContext().getAssets().open(modelPath);
        byte[] modelBytes = is.readAllBytes();
        is.close();

        OrtSession session = ortEnv.createSession(modelBytes, new OrtSession.SessionOptions());
        OrtSession.Result result = session.run(Collections.singletonMap("input", input));
        float[] scores = ((float[][]) result.get(0).getValue())[0];
        float[] probs = softmax(scores);
        int idx = argmax(probs);

        Prediction p = new Prediction();
        p.label = labels[idx];
        p.confidence = probs[idx];
        p.topLogit = scores[idx];
        p.index = idx;
        p.logits = scores;
        p.probs = probs;
        p.modelName = modelPath;

        result.close();
        session.close();
        return p;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /** Convert a 224×224 pixel array to a CHW float32 array normalized with ImageNet stats */
    private float[] bitmapToTensor(int[] pixels) {
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
