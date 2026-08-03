"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface WordData {
  reference: string;
  word: string;
  pronunciation?: string;
  root?: string;
  category?: string[];
  meaning: string;
}

type PageParams = { word: string };

interface PageProps {
  params: Promise<PageParams>;
}

export default function WordPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const decodedWord = decodeURIComponent(resolvedParams.word);

  const [data, setData] = useState<WordData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWordDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/word/${encodeURIComponent(decodedWord)}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("শব্দটি অভিধানে পাওয়া যায়নি।");
          throw new Error("তথ্য লোড করতে সমস্যা হয়েছে।");
        }
        const json: WordData = await res.json();
        setData(json);
      } catch (err) {
        const e = err as Error;
        setError(e.message || "একটি ত্রুটি ঘটেছে।");
      } finally {
        setIsLoading(false);
      }
    }
    fetchWordDetails();
  }, [decodedWord]);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center w-full bg-white dark:bg-gray-900 px-4 py-4 transition-colors">
      <div className="w-full max-w-4xl mx-auto flex flex-col">
        
        <nav className="mb-4" aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-[#F42A41] dark:hover:text-[#F42A41] focus:outline-none focus:ring-2 focus:ring-[#006A4E] rounded transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            হোমপেজে ফিরে যান
          </Link>
        </nav>

        {!isLoading && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-[#F42A41] p-6 rounded shadow-sm w-full text-center" role="alert">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">বানান সঠিক রয়েছে কিনা পুনরায় পরীক্ষা করে দেখুন।</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#006A4E] text-white font-bold rounded hover:bg-[#00523b] focus:ring-4 focus:ring-[#006A4E]/30 transition-colors"
            >
              নতুন অনুসন্ধান
            </Link>
          </div>
        )}

        {!isLoading && !error && data && (
          <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden w-full">
            <div className="p-6 md:p-10">
              
              {/* Hero Word and inline Category Capsules */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <h1 
                  className="text-5xl md:text-7xl font-extrabold text-[#006A4E] dark:text-[#42a88a] tracking-tight"
                  dangerouslySetInnerHTML={{ __html: data.word }}
                ></h1>
                
                {/* Capsules moved up and positioned parallel, with title removed */}
                <div className="flex flex-wrap gap-2 mt-2 md:mt-4">
                  {data.category && data.category.length > 0 && (
                    data.category.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#F42A41]/10 dark:bg-[#F42A41]/20 text-[#F42A41] dark:text-[#ff4d60] text-sm font-bold rounded-full border border-[#F42A41]/20"
                        dangerouslySetInnerHTML={{ __html: cat }}
                      ></span>
                    ))
                  )}
                </div>
              </div>

              {/* Uniform Row now contains only Pronunciation and Root (বুৎপত্তি) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5 border-y border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 -mx-6 md:-mx-10 px-6 md:px-10 mb-8 items-center">
                <div>
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">উচ্চারণ</span>
                  <span 
                    className="text-lg font-medium text-gray-900 dark:text-white"
                    dangerouslySetInnerHTML={{ __html: data.pronunciation || "—" }}
                  ></span>
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">বুৎপত্তি</span>
                  <span 
                    className="text-lg font-medium text-gray-900 dark:text-white"
                    dangerouslySetInnerHTML={{ __html: data.root || "—" }}
                  ></span>
                </div>
              </div>

              <section aria-labelledby="meaning-heading">
                <h2 id="meaning-heading" className="text-sm font-bold uppercase tracking-wider text-[#006A4E] dark:text-[#42a88a] mb-3">
                  অর্থ ও প্রয়োগ
                </h2>
                <div 
                  className="text-gray-800 dark:text-gray-200 text-xl md:text-2xl leading-relaxed whitespace-pre-line font-medium"
                  dangerouslySetInnerHTML={{ __html: data.meaning }}
                ></div>
              </section>
              
            </div>
          </article>
        )}
      </div>
    </main>
  );
}