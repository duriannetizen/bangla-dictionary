// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { convertInput, KeyboardMode } from "@/lib/bengaliConverter";

interface SearchResult {
  word: string;
  meaning?: string;
  category?: string[];
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("unicode");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced API Search
  useEffect(() => {
    const converted = convertInput(rawInput, keyboardMode);
    setQuery(converted);

    if (!converted.trim()) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(converted)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsDropdownOpen(true);
        }
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [rawInput, keyboardMode]);

  const handleSelectWord = (word: string) => {
    setIsDropdownOpen(false);
    router.push(`/word/${encodeURIComponent(word)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      handleSelectWord(query.trim());
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 md:py-20 max-w-5xl mx-auto w-full">
      {/* Title Section */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4">
          আধুনিক বাংলা ভাষার অভিধান
        </h1>
        <p className="text-lg md:text-xl text-slate-600">
          সহজ, নির্ভুল ও সমৃদ্ধ বাংলা শব্দার্থ ও উচ্চারণ ভাণ্ডার
        </p>
      </div>

      {/* Central Search Area */}
      <div ref={searchContainerRef} className="w-full max-w-2xl relative mb-16">
        {/* Keyboard Mode Selectors */}
        <div className="flex items-center justify-center gap-2 mb-3 text-sm">
          <span className="text-slate-500 font-medium mr-1">কীবোর্ড:</span>
          {(
            [
              { id: "unicode", label: "ইউনিকোড" },
              { id: "avro", label: "অভ্র ফনেটিক" },
              { id: "unibijoy", label: "ইউনিবিজয়" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setKeyboardMode(mode.id)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                keyboardMode === mode.id
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div className="relative shadow-lg rounded-2xl bg-white border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
          <div className="flex items-center px-4 py-3 md:py-4">
            <svg
              className="w-6 h-6 text-slate-400 mr-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && setIsDropdownOpen(true)}
              placeholder={
                keyboardMode === "avro"
                  ? "এখানে ইংরেজি বানানে টাইপ করুন (যেমন: amader)..."
                  : "শব্দ অনুসন্ধান করুন..."
              }
              className="w-full text-lg md:text-xl text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent ml-2 shrink-0" />
            )}
            {rawInput && (
              <button
                onClick={() => {
                  setRawInput("");
                  setQuery("");
                  setResults([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 ml-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Real-time input preview for Avro/UniBijoy */}
          {keyboardMode !== "unicode" && rawInput && (
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 text-xs text-slate-500 flex justify-between items-center">
              <span>রূপান্তরিত রূপ:</span>
              <span className="font-semibold text-emerald-700 text-sm">{query}</span>
            </div>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-slate-100">
            {results.length > 0 ? (
              results.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectWord(item.word)}
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                  <span className="text-lg font-semibold text-slate-800 group-hover:text-emerald-700">
                    {item.word}
                  </span>
                  {item.category && item.category.length > 0 && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {item.category[0]}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-5 py-4 text-center text-slate-500 text-sm">
                কোনো ফলাফল পাওয়া যায়নি
              </div>
            )}
          </div>
        )}
      </div>

      {/* Featured Sections */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Word of the Day */}
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-900 to-teal-800 text-white rounded-2xl p-6 md:p-8 shadow-md flex flex-col justify-between">
          <div>
            <div className="inline-block bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              আজকের শব্দ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">অবিচল</h2>
            <p className="text-emerald-200 text-sm mb-4">উচ্চারণ: [অ-বি-চোল্]</p>
            <p className="text-slate-100 text-base md:text-lg leading-relaxed line-clamp-3">
              যা বিচলিত হয় না; স্থির, দৃঢ়, অটল। যেকোনো পরিস্থিতিতে সিদ্ধান্ত পরিবর্তন না করার মানসিক দৃঢ়তা।
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-emerald-700/50 flex justify-end">
            <Link
              href="/word/অবিচল"
              className="inline-flex items-center text-sm font-semibold text-emerald-200 hover:text-white group"
            >
              বিস্তারিত দেখুন
              <svg
                className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Trending Words */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">জনপ্রিয় শব্দসমূহ</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "অনুগামী",
                "জিজ্ঞাসা",
                "সংকল্প",
                "সৃজনশীল",
                "অভিধান",
                "প্রচেষ্টা",
                "শ্রদ্ধাঞ্জলি",
                "বাঙালি",
              ].map((word) => (
                <Link
                  key={word}
                  href={`/word/${encodeURIComponent(word)}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {word}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 text-xs text-slate-400 text-center">
            সর্বশেষ আপডেটকৃত অভিধান ডাটাবেজ
          </div>
        </div>
      </div>
    </main>
  );
}