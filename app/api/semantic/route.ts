import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pipeline, env } from '@xenova/transformers';

// Prevents the library from looking for local model files during Vercel deployment
env.allowLocalModels = false;

// NEW: Tells the AI to cache the model in Vercel's writable temporary folder
env.cacheDir = '/tmp';

// Singleton pattern ensures the AI model loads only once per server instance, saving memory
class PipelineSingleton {
  static model = 'Xenova/multilingual-e5-base';
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      // Passing the literal string 'feature-extraction' satisfies TypeScript
      this.instance = pipeline('feature-extraction', this.model);
    }
    return this.instance;
  }
}

export async function POST(req: Request) {
  try {
    const { text, type } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    let textToEmbed = text;

    // For সমার্থক শব্দ (Synonyms), we must first grab the exact meaning of the word from the DB
    if (type === 'synonym') {
      const searchWord = text.trim();
      
      // Match the exact word OR any variation that has a superscript suffix (e.g., <sup>১</sup>)
      const meaningLookup = await db.execute({
        sql: "SELECT meaning FROM dictionary WHERE word = ? OR word LIKE ?",
        args: [searchWord, `${searchWord}<sup>%`]
      });
      
      if (meaningLookup.rows.length === 0) {
        return NextResponse.json({ error: "Word not found in dictionary" }, { status: 404 });
      }
      
      // If a word has multiple tagged entries (e.g., অবাক<sup>১</sup> and অবাক<sup>২</sup>),
      // we combine their meanings together to generate a highly accurate semantic footprint.
      textToEmbed = meaningLookup.rows.map(row => row.meaning).join(' ');
    }

    // Initialize AI and generate the embedding for the user's query
    const extractor = await PipelineSingleton.getInstance();
    // Prefix user query with 'query: ' as required by e5 models
    const output = await (await extractor)(`query: ${textToEmbed}`, { pooling: 'mean', normalize: true });
    
    // Format the Float32Array into a string format Turso understands: "[0.1, 0.2, ...]"
    const embeddingArray = Array.from(output.data);
    const vectorString = `[${embeddingArray.join(',')}]`;

    // Perform Turso Cosine Distance Vector Search
    // vector_distance_cos returns 0 for identical vectors, so ASC brings the closest matches to the top
    const results = await db.execute({
      sql: `SELECT word, meaning, vector_distance_cos(embedding, vector(?)) as distance 
            FROM dictionary 
            WHERE embedding IS NOT NULL
            ORDER BY distance ASC 
            LIMIT 5`,
      args: [vectorString]
    });

    return NextResponse.json(results.rows);
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json({ error: "Failed to perform semantic search" }, { status: 500 });
  }
}