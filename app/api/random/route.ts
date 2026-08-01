import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch 11 random words from SQLite
    const result = await db.execute("SELECT * FROM dictionary ORDER BY RANDOM() LIMIT 11");
    
    if (result.rows.length === 0) {
      return NextResponse.json({ wordOfDay: null, trending: [] });
    }

    const parseCategory = (catStr: unknown) => {
      try { return JSON.parse(catStr as string); } 
      catch { return catStr ? [catStr] : []; }
    };

    // Separate the first row as Word of the Day, and the rest as Trending
    const rawWordOfDay = result.rows[0];
    const wordOfDay = {
      ...rawWordOfDay,
      category: parseCategory(rawWordOfDay.category)
    };

    const trending = result.rows.slice(1, 11).map(row => ({
      word: row.word,
      reference: row.reference
    }));

    return NextResponse.json({ wordOfDay, trending });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to fetch random words" }, { status: 500 });
  }
}