import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function GET(
  request: Request,
  // 1. Update the type to be a Promise
  context: { params: Promise<{ word: string }> } 
) {
  try {
    // 2. Await the params before trying to read the word
    const params = await context.params;
    const wordToFind = decodeURIComponent(params.word);
    
    const result = await db.execute({
      sql: "SELECT * FROM dictionary WHERE word = ?",
      args: [wordToFind],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}