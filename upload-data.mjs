import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';

// 1. Pointing to your local database file
const localDb = new Database('bangla-obhidhan.db');

// 2. Paste your Turso credentials here
const tursoDb = createClient({
  url: "libsql://bengali-dictionary-duriannetizen.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MDIyNDcsImlkIjoiMDE5ZmIyNDMtMGMwMS03NDI0LTlkMGQtYTAwZjY1OTBlZTBjIiwia2lkIjoiX3VtN0RLTi1RamNlY0RHTkRPU3ZjenRJcFdCVm1GLUV6eERfbWZKTE9zZyIsInJpZCI6IjVjMGEzNjRjLWMwOTktNDU0Yy1hZDVkLWZjMDZhOWU3ZTUwZCJ9.PZhIXnNImiB2qG14dorPjE8zmfcrTaB5z26RP8JCbDEScGlS5xgY63Q6xAgs6IVCI2P8aQOvr2ccC_i3g7WZCA",
});

async function uploadData() {
  console.log("Starting data sync for all tables...\n");

  try {
    // ==========================================
    // Phase 1: SYNC 'dictionary' TABLE
    // ==========================================
    console.log("--- Syncing 'dictionary' table ---");
    
    // 1. Create table (for new setups)
    await tursoDb.execute(`
      CREATE TABLE IF NOT EXISTS dictionary (
        reference TEXT PRIMARY KEY,
        word TEXT,
        pronunciation TEXT,
        root TEXT,
        category TEXT,
        meaning TEXT,
        embedding F32_BLOB(384)
      )
    `);

    // 2. Safely alter existing table to add the embedding column
    const tableInfo = await tursoDb.execute("PRAGMA table_info(dictionary)");
    const hasEmbedding = tableInfo.rows.some(col => col.name === "embedding");

    if (!hasEmbedding) {
      console.log("⚙️ Altering existing 'dictionary' table to add 'embedding' column...");
      await tursoDb.execute("ALTER TABLE dictionary ADD COLUMN embedding F32_BLOB(384)");
      console.log("✅ Column added successfully.");
    }

    // Load local rows into memory once to use for both inserts and updates
    const localDictRows = localDb.prepare('SELECT * FROM dictionary').all();

    // 3. Handle NEW words
    const tursoDictResult = await tursoDb.execute('SELECT reference FROM dictionary');
    const existingDictRefs = new Set(tursoDictResult.rows.map(row => row.reference));
    const dictRowsToUpload = localDictRows.filter(row => !existingDictRefs.has(row.reference));

    if (dictRowsToUpload.length === 0) {
      console.log("✅ No completely new words to add to 'dictionary'.");
    } else {
      console.log(`Uploading ${dictRowsToUpload.length} new words to 'dictionary'...`);
      let dictCount = 0;
      for (const row of dictRowsToUpload) {
        try {
          await tursoDb.execute({
            sql: `INSERT INTO dictionary (reference, word, pronunciation, root, category, meaning, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [row.reference, row.word, row.pronunciation, row.root, row.category, row.meaning, row.embedding || null]
          });
          dictCount++;
          if (dictCount % 100 === 0) console.log(`Uploaded ${dictCount} of ${dictRowsToUpload.length}...`);
        } catch (error) {
          console.error(`Error uploading reference '${row.reference}' to dictionary:`, error.message);
        }
      }
      console.log(`✅ Finished uploading ${dictCount} new words to 'dictionary'.`);
    }

    // 4. Handle EXISTING words that are missing their new embeddings
    console.log("--- Checking for missing embeddings in existing words ---");
    const missingEmbeddingsResult = await tursoDb.execute('SELECT reference FROM dictionary WHERE embedding IS NULL');
    const refsNeedingEmbeddings = missingEmbeddingsResult.rows.map(row => row.reference);

    if (refsNeedingEmbeddings.length === 0) {
      console.log("✅ All existing words already have their embeddings.");
    } else {
      console.log(`Pushing embeddings for ${refsNeedingEmbeddings.length} existing words...`);
      let updateCount = 0;
      
      for (const ref of refsNeedingEmbeddings) {
        const localRow = localDictRows.find(row => row.reference === ref);
        
        if (localRow && localRow.embedding) {
          try {
            await tursoDb.execute({
              sql: `UPDATE dictionary SET embedding = ? WHERE reference = ?`,
              args: [localRow.embedding, ref]
            });
            updateCount++;
            if (updateCount % 100 === 0) console.log(`Updated ${updateCount} of ${refsNeedingEmbeddings.length}...`);
          } catch (error) {
            console.error(`Error updating embedding for reference '${ref}':`, error.message);
          }
        }
      }
      console.log(`✅ Finished updating ${updateCount} word embeddings.`);
    }

    // ==========================================
    // Phase 2: SYNC 'eng_trans' TABLE
    // ==========================================
    console.log("\n--- Syncing 'eng_trans' table ---");
    
    // Create the table with your exact columns and the Foreign Key constraint
    await tursoDb.execute(`
      CREATE TABLE IF NOT EXISTS eng_trans (
        reference TEXT PRIMARY KEY,
        english_word TEXT NOT NULL,
        usage_sentence TEXT NOT NULL,
        part_of_speech TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reference) REFERENCES dictionary(reference)
      )
    `);

    // Check if part_of_speech column exists in Turso (for existing tables)
    const engTableInfo = await tursoDb.execute("PRAGMA table_info(eng_trans)");
    const hasPartOfSpeech = engTableInfo.rows.some(col => col.name === "part_of_speech");

    // If it doesn't exist, safely alter the table to add it
    if (!hasPartOfSpeech) {
      console.log("⚙️ Altering existing 'eng_trans' table to add 'part_of_speech' column...");
      await tursoDb.execute("ALTER TABLE eng_trans ADD COLUMN part_of_speech TEXT");
      console.log("✅ Column added successfully.");
    }

    // Fetch existing references to avoid duplicates
    const tursoEngResult = await tursoDb.execute('SELECT reference FROM eng_trans');
    const existingEngRefs = new Set(tursoEngResult.rows.map(row => row.reference));

    const localEngRows = localDb.prepare('SELECT * FROM eng_trans').all();
    const engRowsToUpload = localEngRows.filter(row => !existingEngRefs.has(row.reference));

    if (engRowsToUpload.length === 0) {
      console.log("✅ 'eng_trans' table is already up to date.");
    } else {
      console.log(`Uploading ${engRowsToUpload.length} new records to 'eng_trans'...`);
      let engCount = 0;
      for (const row of engRowsToUpload) {
        try {
          // Insert data including the part_of_speech column
          await tursoDb.execute({
            sql: `INSERT INTO eng_trans (reference, english_word, usage_sentence, part_of_speech, created_at) VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
            args: [row.reference, row.english_word, row.usage_sentence, row.part_of_speech, row.created_at || null]
          });
          
          engCount++;
          if (engCount % 100 === 0) console.log(`Uploaded ${engCount} of ${engRowsToUpload.length}...`);
        } catch (error) {
          console.error(`Error uploading row '${row.reference}' to eng_trans:`, error.message);
        }
      }
      console.log(`✅ Finished uploading ${engCount} new records to 'eng_trans'.`);
    }

    console.log("\n🎉 Full database sync complete!");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
  }
}

uploadData();