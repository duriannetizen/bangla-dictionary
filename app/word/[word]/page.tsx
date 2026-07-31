// app/word/[word]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface WordData {
  word: string;
  pronunciation?: string;
  root?: string;
  category?: string[];
  meaning: string;
}

interface PageProps {
  params: Promise<{ word: string }>;
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
          if (res.status === 404) {
            throw new Error("শব্দটি অভিধানে পাওয়া যায়নি।");
          }
          throw new Error("তথ্য লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        }
        const json: WordData = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "একটি ত্রুটি ঘটেছে।");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWordDetails();
  }, [decodedWord]);

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12">
      {/* Navigation Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          হোমপেজে ফিরে যান
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 rounded-lg w-1/3" />
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <div className="h-4 bg-slate-200 rounded w-1/6" />
            <div className="h-20 bg-slate-200 rounded w-full" />
          </div>
        </div>
      )}

      {/* Error / Not Found State */}
      {!isLoading && error && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ?
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{error}</h2>
          <p className="text-slate-500 mb-6">
            &quot;{decodedWord}&quot; শব্দটির বানান সঠিক রয়েছে কিনা পুনরায় পরীক্ষা করে দেখুন।
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
          >
            নতুন শব্দ অনুসন্ধান করুন
          </Link>
        </div>
      )}

      {/* Word Details View */}
      {!isLoading && !error && data && (
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Main Header */}
          <div className="p-6 md:p-10 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
              {data.word}
            </h1>

            {/* Sub-header: Pronunciation & Parts of Speech */}
            <div className="flex flex-wrap items-center gap-3">
              {data.pronunciation && (
                <div className="text-slate-500 text-base md:text-lg font-medium tracking-wide">
                  উচ্চারণ: <span className="text-slate-700">[{data.pronunciation}]</span>
                </div>
              )}

              {data.category && data.category.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 ml-0 md:ml-2">
                  {data.category.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs md:text-sm font-semibold rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Body Sections */}
          <div className="p-6 md:p-10 space-y-8">
            {/* Etymology / Root (বুৎপত্তি) */}
            {data.root && (
              <section className="bg-slate-50/80 rounded-xl p-5 border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  বুৎপত্তি
                </h3>
                <p className="text-slate-700 text-base md:text-lg font-medium">
                  {data.root}
                </p>
              </section>
            )}

            {/* Meaning & Usage (অর্থ/প্রয়োগ) */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                অর্থ ও প্রয়োগ
              </h3>
              <div className="text-slate-800 text-lg md:text-xl leading-relaxed whitespace-pre-line font-normal">
                {data.meaning}
              </div>
            </section>
          </div>
        </article>
      )}
    </div>
  );
}