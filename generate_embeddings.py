import sqlite3
import struct
from sentence_transformers import SentenceTransformer

print("Loading the multilingual-e5-small model...")
# e5 models work best when text is prefixed with 'passage: ' or 'query: '
model = SentenceTransformer('intfloat/multilingual-e5-small')

print("Connecting to local database...")
conn = sqlite3.connect('bangla-obhidhan.db')
c = conn.cursor()

# Ensure the embedding column exists locally
try:
    c.execute("ALTER TABLE dictionary ADD COLUMN embedding BLOB")
except sqlite3.OperationalError:
    pass # Column already exists

print("Fetching words without embeddings...")
rows = c.execute("SELECT reference, meaning FROM dictionary WHERE embedding IS NULL").fetchall()

print(f"Generating embeddings for {len(rows)} words...")
for index, (ref, meaning) in enumerate(rows):
    if meaning:
        # Prefix meaning with 'passage: ' as required by e5 models
        text_to_embed = f"passage: {meaning}"

        # Generate the 384-dimensional vector
        emb = model.encode(text_to_embed, normalize_embeddings=True)

        # Convert the Python float array into a binary Buffer (BLOB) for SQLite/Turso
        emb_blob = struct.pack(f'{len(emb)}f', *emb)

        c.execute("UPDATE dictionary SET embedding = ? WHERE reference = ?", (emb_blob, ref))

    if (index + 1) % 100 == 0:
        print(f"Processed {index + 1}/{len(rows)}")

conn.commit()
conn.close()
print("✅ Offline embedding generation complete!")