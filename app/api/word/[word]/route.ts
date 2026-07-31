import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Adjust the import path if necessary

export async function GET(
  request: Request,
  { params }: { params: { word: string } }
) {
  try {
    const wordToFind = decodeURIComponent(params.word);
    
    // Example SQL query using Turso
    const result = await db.execute({
      sql: "SELECT * FROM dictionary WHERE word = ?",
      args: [wordToFind],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}