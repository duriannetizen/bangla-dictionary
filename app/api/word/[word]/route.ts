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

    // 1. Convert the SQLite category text back into a JavaScript Array
    let parsedCategory = [];
    if (row.category) {
      try {
        parsedCategory = JSON.parse(row.category as string);
      } catch (e) {
        // Fallback just in case the data isn't perfectly formatted JSON
        parsedCategory = [row.category]; 
      }
    }

    // 2. Construct the final object to send to the frontend
    const formattedWord = {
      //reference: row.reference,
      word: row.word,
      pronunciation: row.pronunciation,
      root: row.root,
      category: parsedCategory, // Send the array, not the string!
      meaning: row.meaning
    };

    return NextResponse.json(formattedWord);

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}