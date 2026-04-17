const fs = require('fs');
const path = require('path');
const pdfParse = async (dataBuffer) => {
    const mod = require('pdf-parse');
    // Handle classic pdf-parse (v1.x) or ESM default
    const fn = (typeof mod === 'function') ? mod : mod.default;
    if (typeof fn === 'function') return fn(dataBuffer);
    
    // Handle new pdf-parse (v2.x) which uses a class
    if (mod.PDFParse) {
        const parser = new mod.PDFParse(new Uint8Array(dataBuffer));
        const result = await parser.getText();
        // v2 returns { pages: [{ text: "..." }] }
        const text = result.pages ? result.pages.map(p => p.text).join('\n') : (typeof result === 'string' ? result : '');
        return { text };
    }
    throw new Error('pdf-parse: No valid export found');
};
const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_DIR = path.join(__dirname, 'data');
const BATCH_SIZE = 10;

// --force flag: wipe and re-ingest (explicit opt-in only, default is safe)
const FORCE_WIPE = process.argv.includes('--force');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ FAILED: Missing env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function isUsefulContent(text) {
    const badPatterns = [
        "certificate", "acknowledgement", "declaration",
        "registration no", "candidate", "all rights reserved"
    ];
    const lower = text.toLowerCase();
    if (badPatterns.some(p => lower.includes(p))) return false;
    if (text.split(" ").length < 30) return false;
    return true;
}

function isGarbage(text) {
    const letters = text.replace(/[^a-zA-Z]/g, "");
    const upper = letters.replace(/[^A-Z]/g, "");
    if (letters.length === 0) return true;
    return (upper.length / letters.length) > 0.6;
}

function isAgriRelevant(text) {
    const keywords = ["crop", "soil", "pest", "disease", "farmer", "agriculture", "yield", "growth", "farming"];
    return keywords.some(k => text.toLowerCase().includes(k));
}

function isFarmerRelevant(text) {
    const good = ["disease", "symptom", "treatment", "control", "fungal", "infection", "leaf", "crop", "yield", "spray", "farmer", "plant", "bhuri", "mildew", "kevda", "tila"];
    const lower = text.toLowerCase();
    return good.some(g => lower.includes(g)); // Keep content if it has any agri keywords
}

function cleanText(text) {
    return text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

function chunkText(text, size = 400, overlap = 80) {
    const words = text.split(" ");
    const chunks = [];
    for (let i = 0; i < words.length; i += (size - overlap)) {
        const chunk = words.slice(i, i + size).join(" ");
        const cleaned = cleanText(chunk);
        if (
            cleaned.length > 200 &&
            isUsefulContent(cleaned) &&
            !isGarbage(cleaned) &&
            isAgriRelevant(cleaned) &&
            isFarmerRelevant(cleaned)
        ) {
            chunks.push(cleaned);
        }
    }
    return chunks;
}

/**
 * Check whether a chunk already exists in knowledge_base.
 * We identify a chunk by metadata.source (filename) + metadata.chunk_index.
 * Returns true if existing row found (caller should skip insert).
 */
async function chunkExists(sourceFile, chunkIndex) {
    try {
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('id')
            .eq('metadata->>source', sourceFile)
            .eq('metadata->>chunk_index', String(chunkIndex))
            .limit(1);

        if (error) {
            // If the query fails we conservatively assume it doesn't exist
            console.warn(`  ⚠️  Existence check failed for ${sourceFile}[${chunkIndex}]: ${error.message}`);
            return false;
        }
        return data && data.length > 0;
    } catch (err) {
        console.warn(`  ⚠️  chunkExists error: ${err.message}`);
        return false;
    }
}

async function run() {
    if (FORCE_WIPE) {
        // --force: wipe all rows before re-ingesting (explicit opt-in)
        console.log("⚠️  --force flag detected. Wiping existing data...");
        let totalDeleted = 0;
        while (true) {
            const { data: batch, error } = await supabase.from('knowledge_base').select('id').limit(5000);
            if (error || !batch || batch.length === 0) break;
            const ids = batch.map(r => r.id);
            await supabase.from('knowledge_base').delete().in('id', ids);
            totalDeleted += ids.length;
            process.stdout.write(`\r  🗑️  Purged ${totalDeleted} rows...`);
        }
        console.log("\n✅ Database cleared (--force).");
    } else {
        console.log("🛡️  Safe mode: existing chunks will be skipped (use --force to wipe).");
    }

    // --- Load embedding model ---
    console.log("🚀 Loading MiniLM-L6-v2...");
    const generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log("✅ Model ready.");

    // --- Process PDFs ---
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.pdf'));
    console.log(`\n📂 Found ${files.length} PDFs in ./data`);

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const file of files) {
        console.log(`\n📄 Processing: ${file}`);
        try {
            const dataBuffer = fs.readFileSync(path.join(DATA_DIR, file));
            const parsed = await pdfParse(dataBuffer);
            const rawText = parsed.text;

            if (!rawText || rawText.trim().length === 0) {
                console.log("  ⚠️  No text extracted. Skipping.");
                continue;
            }

            const chunks = chunkText(rawText);

            if (chunks.length === 0) {
                console.log("  ⚠️  No farmer-relevant chunks found. Skipping.");
                continue;
            }

            console.log(`  ✨ ${chunks.length} chunks to process.`);

            for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                const batch = chunks.slice(i, i + BATCH_SIZE);
                const records = [];

                for (let j = 0; j < batch.length; j++) {
                    const content = batch[j];
                    const chunkIndex = i + j;

                    // --- UPSERT guard: skip if already ingested ---
                    if (!FORCE_WIPE) {
                        const exists = await chunkExists(file, chunkIndex);
                        if (exists) {
                            totalSkipped++;
                            continue;
                        }
                    }

                    // Embed and prepare record
                    const output = await generateEmbedding(content, { pooling: 'mean', normalize: true });
                    const embedding = Array.from(output.data);

                    if (embedding.length !== 384) {
                        console.warn(`  ⚠️  Unexpected embedding dim: ${embedding.length}. Skipping chunk.`);
                        continue;
                    }

                    records.push({
                        content,
                        metadata: {
                            source: file,
                            chunk_index: chunkIndex,
                            type: "agri_research",
                            quality: "high"
                        },
                        embedding
                    });
                }

                if (records.length === 0) continue;

                const { error } = await supabase.from('knowledge_base').insert(records);
                if (error) {
                    console.error(`  ❌ Insert error:`, error.message);
                } else {
                    totalInserted += records.length;
                    console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted (${records.length} chunks).`);
                }
            }
        } catch (err) {
            console.error(`  ❌ Failed on ${file}:`, err.message);
        }
    }

    console.log(`\n🏁 DONE. Skipped ${totalSkipped} existing chunks, inserted ${totalInserted} new chunks.`);

    if (totalInserted === 0 && totalSkipped === 0) {
        console.warn("\n⚠️  WARNING: Zero chunks processed! Check:");
        console.warn("   1. Are PDFs in ./data folder?");
        console.warn("   2. Are PDFs text-based (not scanned images)?");
        console.warn("   3. Do they contain agri/crop/disease content?");
    }
}

run();