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

interface WordOfDay {
  word: string;
  pronunciation?: string;
  meaning: string;
}

interface TrendingWord {
  word: string;
}

// Defined outside to prevent Turbopack JSX parsing errors
const KEYBOARD_OPTIONS: { id: KeyboardMode; label: string }[] = [
  { id: "unicode", label: "ইউনিকোড" },
  { id: "avro", label: "অভ্র ফনেটিক" }
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("unicode");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Dynamic Data States
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null);
  const [trendingWords, setTrendingWords] = useState<TrendingWord[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/random")
      .then(res => res.json())
      .then(data => {
        if (data.wordOfDay) setWordOfDay(data.wordOfDay);
        if (data.trending) setTrendingWords(data.trending);
      })
      .catch(err => console.error("Failed to load random words", err));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-8 max-w-5xl mx-auto w-full bg-white dark:bg-gray-900 transition-colors">
      
      <header className="text-center mb-10 w-full">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#006A4E] dark:text-[#42a88a] mb-4">
          আধুনিক বাংলা ভাষার অভিধান
        </h1>
      </header>

      <section 
        ref={searchContainerRef} 
        className="w-full max-w-2xl relative mb-12"
        aria-label="Search section"
      >
        <fieldset className="flex items-center justify-center gap-2 mb-4 text-sm">
          <legend className="sr-only">কীবোর্ড নির্বাচন করুন</legend>
          <span className="text-gray-600 dark:text-gray-300 font-medium mr-2">কীবোর্ড:</span>
          {KEYBOARD_OPTIONS.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setKeyboardMode(mode.id)}
              aria-pressed={keyboardMode === mode.id}
              className={`px-4 py-1.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#F42A41] transition-all font-medium ${
                keyboardMode === mode.id
                  ? "bg-[#F42A41] text-white border-[#F42A41] shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </fieldset>

        <div className="relative shadow-lg rounded-full bg-white dark:bg-gray-800 border-2 border-[#006A4E] dark:border-[#42a88a] overflow-hidden focus-within:ring-4 focus-within:ring-[#006A4E]/20 transition-all">
          <div className="flex items-center px-6 py-4">
            <svg
              className="w-6 h-6 text-[#F42A41] mr-3 shrink-0"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && setIsDropdownOpen(true)}
              placeholder={keyboardMode === "avro" ? "এখানে ইংরেজি বানানে টাইপ করুন..." : "শব্দ অনুসন্ধান করুন..."}
              aria-label="Search for a Bengali word"
              className="w-full text-lg md:text-xl text-gray-900 dark:text-white bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#006A4E] border-t-transparent ml-2 shrink-0" role="status" aria-label="Loading" />
            )}
          </div>
        </div>

        {isDropdownOpen && (
          <ul 
            className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700"
            role="listbox"
          >
            {results.length > 0 ? (
              results.map((item, index) => (
                <li key={index} role="option" aria-selected="false">
                  <button
                    onClick={() => handleSelectWord(item.word)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none transition-colors flex items-center justify-between group"
                  >
                    <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#F42A41] dark:group-hover:text-[#F42A41] transition-colors">
                      {item.word}
                    </span>
                    {item.category && item.category.length > 0 && (
                      <span className="text-xs bg-[#006A4E]/10 dark:bg-[#42a88a]/20 text-[#006A4E] dark:text-[#42a88a] font-semibold px-2.5 py-1 rounded-full">
                        {item.category[0]}
                      </span>
                    )}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">কোনো ফলাফল পাওয়া যায়নি</li>
            )}
          </ul>
        )}
      </section>

      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Featured content">
        <article className="bg-[#006A4E] text-white rounded-2xl p-6 md:p-8 shadow-lg flex flex-col justify-between border border-[#00523b] h-full">
          <div>
            <div className="inline-block bg-[#F42A41] text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
              আজকের শব্দ
            </div>
            {wordOfDay ? (
              <>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">{wordOfDay.word}</h2>
                {wordOfDay.pronunciation && (
                  <p className="text-emerald-100 text-sm md:text-base mb-4 opacity-90">উচ্চারণ: {wordOfDay.pronunciation}</p>
                )}
                <p className="text-white text-base leading-relaxed line-clamp-3 opacity-95">
                  {wordOfDay.meaning}
                </p>
              </>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className="h-8 bg-white/20 rounded w-1/2"></div>
                <div className="h-4 bg-white/20 rounded w-1/3"></div>
                <div className="h-16 bg-white/20 rounded w-full mt-4"></div>
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-white/20">
            {wordOfDay && (
              <Link
                href={`/word/${encodeURIComponent(wordOfDay.word)}`}
                className="inline-flex items-center text-sm font-bold text-white hover:text-[#F42A41] focus:outline-none focus:ring-2 focus:ring-[#F42A41] rounded-sm group transition-colors"
              >
                বিস্তারিত দেখুন
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </article>

        <article className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-6 md:p-8 shadow-lg flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#006A4E] dark:text-[#42a88a]">জনপ্রিয় শব্দসমূহ</h3>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F42A41] animate-pulse" aria-hidden="true" />
            </div>
            
            <div className="flex flex-wrap gap-2.5" role="list">
              {trendingWords.length > 0 ? (
                trendingWords.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/word/${encodeURIComponent(item.word)}`}
                    className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-[#F42A41] dark:hover:bg-[#F42A41] hover:text-white dark:hover:text-white text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#006A4E]"
                    role="listitem"
                  >
                    {item.word}
                  </Link>
                ))
              ) : (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                ))
              )}
            </div>
          </div>
        </article>

      </section>
    </main>
  );
}