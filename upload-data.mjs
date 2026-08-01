import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';

// 1. Put the exact name of your local database file here
const localDb = new Database('bangla-obhidhan.db');

// 2. Paste your Turso credentials here
const tursoDb = createClient({
  url: "libsql://bengali-dictionary-duriannetizen.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MDIyNDcsImlkIjoiMDE5ZmIyNDMtMGMwMS03NDI0LTlkMGQtYTAwZjY1OTBlZTBjIiwia2lkIjoiX3VtN0RLTi1RamNlY0RHTkRPU3ZjenRJcFdCVm1GLUV6eERfbWZKTE9zZyIsInJpZCI6IjVjMGEzNjRjLWMwOTktNDU0Yy1hZDVkLWZjMDZhOWU3ZTUwZCJ9.PZhIXnNImiB2qG14dorPjE8zmfcrTaB5z26RP8JCbDEScGlS5xgY63Q6xAgs6IVCI2P8aQOvr2ccC_i3g7WZCA",
});

async function uploadData() {
  console.log("Starting data sync...");

  try {
    // 3. Ensure the table exists in Turso
    await tursoDb.execute(`
      CREATE TABLE IF NOT EXISTS dictionary (
        reference TEXT PRIMARY KEY,
        word TEXT,
        pronunciation TEXT,
        root TEXT,
        category TEXT,
        meaning TEXT
      )
    `);

    // 4. Fetch existing references from the cloud (Turso)
    console.log("Checking cloud database for existing words...");
    const tursoResult = await tursoDb.execute('SELECT reference FROM dictionary');
    
    // Store them in a JavaScript Set for instant lookups
    const existingCloudRefs = new Set(tursoResult.rows.map(row => row.reference));
    console.log(`Found ${existingCloudRefs.size} words already in Turso.`);

    // 5. Read all words from your local database
    const localRows = localDb.prepare('SELECT * FROM dictionary').all();
    console.log(`Found ${localRows.length} words in the local database.`);

    // 6. Filter out the ones that already exist in the cloud
    const rowsToUpload = localRows.filter(row => !existingCloudRefs.has(row.reference));

    if (rowsToUpload.length === 0) {
      console.log("✅ The cloud database is already up to date. No new words to upload.");
      return;
    }

    console.log(`Preparing to upload ${rowsToUpload.length} new words...`);

    let count = 0;

    // 7. Upload only the new rows to Turso
    for (const row of rowsToUpload) {
      try {
        await tursoDb.execute({
          // We can use standard INSERT here since we pre-checked for duplicates
          sql: `INSERT INTO dictionary (reference, word, pronunciation, root, category, meaning) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [row.reference, row.word, row.pronunciation, row.root, row.category, row.meaning]
        });
        
        count++;
        // Print a progress update every 100 words
        if (count % 100 === 0) {
          console.log(`Uploaded ${count} of ${rowsToUpload.length} new words...`);
        }
      } catch (error) {
        console.error(`Error uploading reference '${row.reference}':`, error.message);
      }
    }

    console.log(`✅ Success! Finished uploading ${count} new words to Turso.`);
    
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

uploadData();