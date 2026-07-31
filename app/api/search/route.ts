import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // 1. Extract the search query 'q' from the URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    // If there is no query, return an empty array
    if (!query) {
      return NextResponse.json([]);
    }

    // 2. Query the Turso database using LIKE for partial matching
    // The '%' symbol acts as a wildcard, so `${query}%` means "starts with query"
    const result = await db.execute({
      sql: "SELECT word, meaning, category FROM dictionary WHERE word LIKE ? LIMIT 10",
      args: [`${query}%`],
    });

    // 3. Format the data for the frontend
    const searchResults = result.rows.map((row) => {
      // SQLite doesn't have a native "array" type, so arrays (like category) 
      // are usually stored as JSON strings. We parse it back into an array here.
      let parsedCategory = [];
      if (row.category) {
        try {
          parsedCategory = JSON.parse(row.category as string);
        } catch (e) {
          // Fallback if the data isn't perfectly formatted JSON
          parsedCategory = [row.category]; 
        }
      }

      return {
        word: row.word,
        meaning: row.meaning,
        category: parsedCategory,
      };
    });

    // 4. Send the results back to the frontend dropdown
    return NextResponse.json(searchResults);
    
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Database error during search" }, { status: 500 });
  }
}