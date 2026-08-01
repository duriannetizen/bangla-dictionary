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

interface PageProps {
  params: Promise<{ word: string }>;
}

export default function WordPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const decodedWord = decodeURIComponent(resolvedParams.word);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err: any) {
        setError(err.message || "একটি ত্রুটি ঘটেছে।");
      } finally {
        setIsLoading(false);
      }
    }
    fetchWordDetails();
  }, [decodedWord]);

  return (
    
      
        
        {/* Top Navigation */}
        
          
            
              
            
            হোমপেজে ফিরে যান
          
        

        {/* Error State */}
        {!isLoading && error && (
          
            {error}
            বানান সঠিক রয়েছে কিনা পুনরায় পরীক্ষা করে দেখুন।
            
              নতুন অনুসন্ধান
            
          
        )}

        {/* Content View */}
        {!isLoading && !error && data && (
          
            
              
              {/* Hero Word */}
              
                {data.word}
              

              {/* Uniform Alignment Row: Pronunciation, Root, Category */}
              
                
                
                  উচ্চারণ
                  
                    {data.pronunciation || "—"}
                  
                

                
                  বুৎপত্তি
                  
                    {data.root || "—"}
                  
                

                
                  পদ
                  
                    {data.category && data.category.length > 0 ? (
                      data.category.map((cat, idx) => (
                        
                          {cat}
                        
                      ))
                    ) : (
                      —
                    )}
                  
                

              

              {/* Meaning Section */}
              
                
                  অর্থ ও প্রয়োগ
                
                
                  {data.meaning}
                
              
              
            
          
        )}
      
    
  );
}