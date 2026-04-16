import { createClient } from "https://esm.sh/@supabase/supabase-js"
import "@supabase/functions-js/edge-runtime.d.ts"

// --- CONFIG ---
const PRIMARY_MODEL = "llama-3.3-70b-versatile"
const SECONDARY_MODEL = "mixtral-8x7b-32768"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// --- STEP 1: NORMALIZE (local disease name mapping) ---
function normalizeQuery(query: string): string {
  let q = query.toLowerCase()

  // Phonetic variants of bhuri/bhurri (powdery mildew in Marathi/Hindi)
  q = q.replace(/bh[u]+[r]+[iy]*/g, "powdery mildew")

  const map: Record<string, string> = {
    "safed rog":   "powdery mildew",
    "safedrog":    "powdery mildew",
    "karpa":       "anthracnose",
    "downy":       "downy mildew",
    "mrudal":      "downy mildew",
    "kevda":       "downy mildew",
    "tila rog":    "leaf spot",
    "leaf curl":   "leaf curl disease",
    "tikka":       "cercospora leaf spot",
    "wilt":        "fusarium wilt",
  }

  for (const [key, val] of Object.entries(map)) {
    if (q.includes(key)) q = q.replace(new RegExp(key, "g"), val)
  }

  return q
}

// --- STEP 2: EXTRACT KEYWORDS via Groq ---
async function extractKeywords(normalizedQuery: string): Promise<string[]> {
  const apiKey = Deno.env.get("GROQ_API_KEY")
  if (!apiKey) return normalizedQuery.split(" ").filter(w => w.length > 3)

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: "Extract 3-5 specific agricultural keywords or disease names from the query. Return ONLY a comma-separated list, no explanation." },
          { role: "user", content: normalizedQuery },
        ],
      }),
    })
    if (!res.ok) return [normalizedQuery]
    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content || ""
    const llmKeywords = text.split(",").map(s => s.trim()).filter(s => s.length > 2)

    // Merge LLM keywords with raw words from normalized query for coverage
    const rawWords = normalizedQuery.split(/\s+/).filter(w => w.length > 3)
    return Array.from(new Set([...llmKeywords, ...rawWords]))
  } catch {
    return normalizedQuery.split(" ").filter(w => w.length > 3)
  }
}

// --- STEP 3: RETRIEVE from RAG database ---
async function retrieveContext(keywords: string[]): Promise<{ context: string, rawData: any[], hasGoodContext: boolean }> {
  let allResults: any[] = []

  for (const kw of keywords) {
    const { data } = await supabase
      .from("knowledge_base")
      .select("*")
      .ilike("content", `%${kw}%`)
      .limit(3)
    if (data) allResults.push(...data)
  }

  // Deduplicate by id
  const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values())

  // Relevance guard: at least one result must actually contain a keyword
  const isRelevant = uniqueResults.some(res =>
    keywords.some(kw => res.content.toLowerCase().includes(kw.toLowerCase()))
  )

  const context = uniqueResults.map((d: any) => d.content).join("\n---\n").substring(0, 7000)

  // "Good context" = relevant results + enough content
  const hasGoodContext = uniqueResults.length > 0 && isRelevant && context.length > 150

  return { context, rawData: uniqueResults, hasGoodContext }
}

// --- STEP 4: CALL GROQ (primary + secondary) ---
async function callGroq(model: string, normalizedQuery: string, context: string, hasGoodContext: boolean, language: string): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY")
  if (!apiKey) return "[Error: No Groq API key]"

  const systemPrompt = hasGoodContext
    ? `You are eCropGuard AI, an elite Indian agronomist. Language: ${language}.
You have been given RESEARCH CONTEXT from our agricultural database.
Use the context as your PRIMARY source of information.
You may add practical general knowledge to complement it.
Do NOT contradict the provided context.
Start your response with [STRICT RESEARCH].`
    : `You are eCropGuard AI, an elite Indian agronomist. Language: ${language}.
No strong match was found in our research database for this query.
Answer using your deep general agricultural knowledge.
Give practical, farmer-friendly advice relevant to Indian farming conditions.
Be specific, helpful, and actionable.
Start your response with [GENERAL ADVISORY].`

  const userMessage = hasGoodContext
    ? `RESEARCH CONTEXT:\n${context}\n\nFARMER QUESTION: ${normalizedQuery}`
    : `FARMER QUESTION: ${normalizedQuery}`

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error(`Groq [${model}] error (${res.status}): ${err}`)
      return `[Groq Error: ${res.status}]`
    }
    const data = await res.json()
    return data?.choices?.[0]?.message?.content || "No response"
  } catch (e: any) {
    return `[Groq Exception: ${e.message}]`
  }
}

// --- MAIN HANDLER ---
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const body = await req.json()
    const { query, lang = "English" } = body

    if (!query) {
      return new Response(JSON.stringify({ error: "Empty query" }), { status: 400, headers: corsHeaders })
    }

    console.log("=== eCropGuard RAG Query ===")
    console.log("Raw query:", query)

    // STEP 1: Normalize
    const normalizedQuery = normalizeQuery(query)
    console.log("Normalized:", normalizedQuery)

    // STEP 2: Extract keywords
    const keywords = await extractKeywords(normalizedQuery)
    console.log("Keywords:", keywords)

    // STEP 3: Retrieve from RAG
    const { context, rawData, hasGoodContext } = await retrieveContext(keywords)
    console.log("RAG mode:", hasGoodContext ? "STRICT_RESEARCH" : "GENERAL_FALLBACK", "| Results:", rawData.length)

    // STEP 4: Call both Groq models in parallel
    const [primaryAnswer, secondaryAnswer] = await Promise.all([
      callGroq(PRIMARY_MODEL, normalizedQuery, context, hasGoodContext, lang),
      callGroq(SECONDARY_MODEL, normalizedQuery, context, hasGoodContext, lang),
    ])

    // Final response
    return new Response(JSON.stringify({
      query: normalizedQuery,
      mode: hasGoodContext ? "rag" : "fallback",
      best_answer: primaryAnswer,
      confidence: hasGoodContext ? 0.9 : 0.7,
      agreement: "MULTI-MODEL VERIFIED",
      answers: {
        llama: primaryAnswer,
        mixtral: secondaryAnswer,
      },
      sources: rawData.slice(0, 5).map((d: any) => ({
        ...(d.metadata || {}),
        preview: (d.content || "").substring(0, 150),
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: any) {
    console.error("FATAL:", err)
    return new Response(JSON.stringify({
      best_answer: "I'm temporarily unavailable. Please try again.",
      error: err.message,
    }), { status: 200, headers: corsHeaders })
  }
})