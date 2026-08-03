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

const KEYBOARD_OPTIONS: { id: KeyboardMode; label: string }[] = [
  { id: "unicode", label: "ইউনিকোড" },
  { id: "avro", label: "অভ্র ফনেটিক" }
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [keyboardMode, setKeyboardMode] = useState("unicode");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [wordOfDay, setWordOfDay] = useState(null);
  const [trendingWords, setTrendingWords] = useState([]);

  const searchContainerRef = useRef(null);

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
    
      
      
        
          আধুনিক বাংলা ভাষার অভিধান
        
      

      
        
          কীবোর্ড নির্বাচন করুন
          কীবোর্ড:
          {KEYBOARD_OPTIONS.map((mode) => (
             setKeyboardMode(mode.id)}
              aria-pressed={keyboardMode === mode.id}
              className={`px-4 py-1.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-[#F42A41] transition-all font-medium ${
                keyboardMode === mode.id
                  ? "bg-[#F42A41] text-white border-[#F42A41] shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {mode.label}
            
          ))}
        

        
          
            
              
            
             setRawInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && setIsDropdownOpen(true)}
              placeholder={keyboardMode === "avro" ? "এখানে ইংরেজি বানানে টাইপ করুন..." : "শব্দ অনুসন্ধান করুন..."}
              aria-label="Search for a Bengali word"
              className="w-full text-lg md:text-xl text-gray-900 dark:text-white bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            {isLoading && (
              
            )}
          
        

        {isDropdownOpen && (
          
            {results.length > 0 ? (
              results.map((item, index) => (
                
                   handleSelectWord(item.word)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none transition-colors flex items-center justify-between group"
                  >
                    {/* Word rendered with HTML support for tags like  */}
                    
                    {item.category && item.category.length > 0 && (
                      
                    )}
                  
                
              ))
            ) : (
              কোনো ফলাফল পাওয়া যায়নি
            )}
          
        )}
      

      
        
          
            
              আলোচিত শব্দ
            
            {wordOfDay ? (
              <>
                
                {wordOfDay.pronunciation && (
                  
                )}
                
              
            ) : (
              
                
                
                
              
            )}
          
          
            {wordOfDay && (
              
                বিস্তারিত দেখুন
                
                  
                
              
            )}
          
        

        
          
            
              জনপ্রিয় শব্দসমূহ
              
            
            
            
              {trendingWords.length > 0 ? (
                trendingWords.map((item, idx) => (
                  
                ))
              ) : (
                Array(8).fill(0).map((_, i) => (
                  
                ))
              )}
            
          
        
      
    
  );
}