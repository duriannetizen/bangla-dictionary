import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function GET(
  request: Request,
  context: { params: Promise<{ word: string }> } 
) {
  try {
    const params = await context.params;
    const wordToFind = decodeURIComponent(params.word);
    
    const result = await db.execute({
      sql: "SELECT * FROM dictionary WHERE word = ?",
      args: [wordToFind],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const row = result.rows[0];

    // Convert the SQLite category text back into a JavaScript Array
    let parsedCategory = [];
    if (row.category) {
      try {
        parsedCategory = JSON.parse(row.category as string);
      } catch (e) {
        parsedCategory = [row.category]; 
      }
    }

    // Fetch English Translation based on the reference key
    let englishTranslation = null;
    try {
      const engResult = await db.execute({
        sql: "SELECT english_word, part_of_speech, usage_sentence FROM eng_trans WHERE reference = ?",
        args: [row.reference],
      });
      
      if (engResult.rows.length > 0) {
        const engRow = engResult.rows[0];
        englishTranslation = {
          english_word: engRow.english_word,
          part_of_speech: engRow.part_of_speech,
          usage_sentence: engRow.usage_sentence
        };
      }
    } catch (err) {
      console.error("Error fetching eng_trans:", err);
      // If translation fails, we still return the dictionary word safely
    }

    const formattedWord = {
      reference: row.reference,
      word: row.word,
      pronunciation: row.pronunciation,
      root: row.root,
      category: parsedCategory,
      meaning: row.meaning,
      englishTranslation // Attached to the response payload
    };

    return NextResponse.json(formattedWord);

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}