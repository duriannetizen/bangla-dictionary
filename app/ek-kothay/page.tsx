"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { convertInput, KeyboardMode } from "@/lib/bengaliConverter";

interface SemanticResult {
  word: string;
  meaning: string;
  distance: number;
}

export default function EkKothayPage() {
  const [rawInput, setRawInput] = useState("");
  const [query, setQuery] = useState("");
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("unicode");
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("dictionaryKeyboardMode") as KeyboardMode | null;
    if (stored) setKeyboardMode(stored);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 50); // Hard limit to 50 characters
    setRawInput(val);
    setQuery(convertInput(val, keyboardMode));
  };

  const executeSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query.trim(), type: "phrase" })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 max-w-4xl mx-auto w-full">
      <nav className="w-full mb-8">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#006A4E]">
          &larr; হোমপেজে ফিরে যান
        </Link>
      </nav>

      <h1 className="text-4xl font-bold text-[#006A4E] dark:text-[#42a88a] mb-8">এক কথায় প্রকাশ (AI)</h1>

      <div className="w-full flex gap-4 mb-6 justify-center">
        <button onClick={() => setKeyboardMode("unicode")} className={`px-4 py-2 rounded-full font-bold ${keyboardMode === "unicode" ? "bg-[#F42A41] text-white" : "bg-gray-200 text-gray-700"}`}>বাংলায় টাইপ</button>
        <button onClick={() => setKeyboardMode("avro")} className={`px-4 py-2 rounded-full font-bold ${keyboardMode === "avro" ? "bg-[#F42A41] text-white" : "bg-gray-200 text-gray-700"}`}>ইংরেজি (অভ্র) টাইপ</button>
      </div>

      <div className="w-full flex gap-2 mb-2 relative">
        <input
          type="text"
          value={rawInput}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && executeSearch()}
          placeholder="বাক্যাংশ লিখুন (সর্বোচ্চ ৫০ অক্ষর)..."
          className="w-full p-4 text-xl rounded-xl border-2 border-[#006A4E] focus:outline-none focus:ring-4 focus:ring-[#006A4E]/20 bg-white dark:bg-gray-800 dark:text-white"
        />
        <button onClick={executeSearch} className="px-8 bg-[#006A4E] text-white font-bold text-xl rounded-xl hover:bg-[#00523b] transition">
          {isLoading ? "খুঁজছে..." : "খুঁজুন"}
        </button>
      </div>
      <p className="text-sm text-gray-400 w-full text-right mb-8">{rawInput.length}/50</p>

      <div className="w-full flex flex-col gap-4">
        {results.map((res, i) => (
          <Link key={i} href={`/word/${encodeURIComponent(res.word)}`} className="block bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 hover:border-[#F42A41] hover:shadow-lg transition">
            <h2 className="text-3xl font-bold text-[#006A4E] mb-2">{res.word}</h2>
            <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{res.meaning}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}