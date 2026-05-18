import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.29.0";
import { parse } from "https://esm.sh/pdf-parse@1.1.1?no-check";

// Using native Deno/ESM compatible PDF parser if pdf-parse fails in Edge environment
// Note: pdf-parse often has issues in Deno. Alternative is to use a pure JS pdf parser or a WASM one.
// We'll use esm.sh version which handles some node shims.

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { file_path, room_id, fed_by_user_id } = await req.json();

    if (!file_path || !room_id || !fed_by_user_id) {
      throw new Error("Missing required parameters");
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 1. Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(file_path);

    if (downloadError) throw downloadError;

    // 2. Extract text from PDF
    const arrayBuffer = await fileData.arrayBuffer();
    // In Deno, some node-based libs need more shims. If pdf-parse fails, 
    // we would fallback to a Deno-native solution.
    const pdf = await parse(new Uint8Array(arrayBuffer));
    const fullText = pdf.text;

    // 3. Chunk text (max 1500 chars)
    const chunks = chunkText(fullText, 1500);

    // 4. Generate Embeddings using Gemini (Parallelized)
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });
    
    console.log(`Processing ${chunks.length} chunks...`);

    const segmentPromises = chunks.map(async (content, i) => {
      try {
        const embeddingResult = await genAI.models.embedContent({
          model: "text-embedding-004",
          content: { parts: [{ text: content }] }
        });

        return {
          room_id,
          content,
          embedding: embeddingResult.embedding.values,
          fed_by_user_id,
          chunk_index: i,
          file_path,
          created_at: new Date().toISOString(),
        };
      } catch (err) {
        console.error(`Error embedding chunk ${i}:`, err);
        throw err;
      }
    });

    const segments = await Promise.all(segmentPromises);

    // 5. Insert into doc_segments
    console.log('Inserting segments into database...');
    const { error: insertError } = await supabase
      .from("doc_segments")
      .insert(segments);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, processed: chunks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxLength;
    
    // Try to break at a paragraph or newline if possible
    if (endIndex < text.length) {
      const lastNewline = text.lastIndexOf('\n', endIndex);
      if (lastNewline > startIndex) {
        endIndex = lastNewline;
      } else {
        const lastSpace = text.lastIndexOf(' ', endIndex);
        if (lastSpace > startIndex) {
          endIndex = lastSpace;
        }
      }
    }

    chunks.push(text.slice(startIndex, endIndex).trim());
    startIndex = endIndex;
  }

  return chunks.filter(c => c.length > 0);
}
