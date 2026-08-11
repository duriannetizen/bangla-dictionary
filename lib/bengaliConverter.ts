// lib/bengaliConverter.ts

// @ts-ignore - We use this flag because the package doesn't have native TypeScript definitions
import avro from "nodejs-avro-phonetic";

export type KeyboardMode = "unicode" | "avro";

export function convertInput(text: string, mode: KeyboardMode): string {
  if (!text) return "";
  
  if (mode === "avro") {
    try {
      // Passes the English text through the official OmicronLab parsing logic
      return avro.parse(text);
    } catch (e) {
      console.error("Phonetic conversion error:", e);
      return text; // Fallback in case of an unexpected crash
    }
  }
  
  return text; // Returns as-is if mode is set to 'unicode'
}