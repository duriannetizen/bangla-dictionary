"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { convertInput, KeyboardMode } from "@/lib/bengaliConverter";

interface SemanticResult {
  word: string;
  meaning: string;
}

export default function SomarthokPage() {
  const [rawInput, setRawInput] = useState("");
  const [query, setQuery] = useState("");
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("unicode");
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("dictionaryKeyboardMode") as KeyboardMode | null;
    if (stored) setKeyboardMode(stored);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawInput(e.target.value);
    setQuery(convertInput(e.target.value, keyboardMode));
  };

  const executeSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query.trim(), type: "synonym" })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      // Filter out the exact searched word from the results so it doesn't show up as its own synonym
      setResults(data.filter((r: SemanticResult) => r.word !== query.trim()));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 max-w-4xl mx-auto w-full">
      <nav className="w-full mb-8">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#F42A41]">
          &larr; হোমপেজে ফিরে যান
        </Link>
      </nav>

      <h1 className="text-4xl font-bold text-[#F42A41] dark:text-[#ff4d60] mb-8">সমার্থক শব্দ (AI)</h1>

      <div className="w-full flex gap-4 mb-6 justify-center">
        <button onClick={() => setKeyboardMode("unicode")} className={`px-4 py-2 rounded-full font-bold ${keyboardMode === "unicode" ? "bg-[#006A4E] text-white" : "bg-gray-200 text-gray-700"}`}>বাংলায় টাইপ</button>
        <button onClick={() => setKeyboardMode("avro")} className={`px-4 py-2 rounded-full font-bold ${keyboardMode === "avro" ? "bg-[#006A4E] text-white" : "bg-gray-200 text-gray-700"}`}>ইংরেজি (অভ্র) টাইপ</button>
      </div>

      <div className="w-full flex gap-2 mb-8 relative">
        <input
          type="text"
          value={rawInput}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && executeSearch()}
          placeholder="মূল শব্দটি লিখুন..."
          className="w-full p-4 text-xl rounded-xl border-2 border-[#F42A41] focus:outline-none focus:ring-4 focus:ring-[#F42A41]/20 bg-white dark:bg-gray-800 dark:text-white"
        />
        <button onClick={executeSearch} className="px-8 bg-[#F42A41] text-white font-bold text-xl rounded-xl hover:bg-[#d92236] transition">
          {isLoading ? "খুঁজছে..." : "খুঁজুন"}
        </button>
      </div>

      {error && <div className="w-full p-4 mb-6 bg-red-100 text-red-700 font-bold rounded-lg">{error}</div>}

      <div className="w-full flex flex-col gap-4">
        {results.map((res, i) => (
          <Link key={i} href={`/word/${encodeURIComponent(res.word)}`} className="block bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 hover:border-[#006A4E] hover:shadow-lg transition">
            <h2 className="text-3xl font-bold text-[#F42A41] mb-2">{res.word}</h2>
            <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{res.meaning}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}