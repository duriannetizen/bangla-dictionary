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
  params: Promise;
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
    
      
        
        
          
            
              
            
            হোমপেজে ফিরে যান
          
        

        {!isLoading && error && (
          
            {error}
            বানান সঠিক রয়েছে কিনা পুনরায় পরীক্ষা করে দেখুন।
            
              নতুন অনুসন্ধান
            
          
        )}

        {!isLoading && !error && data && (
          
            
              
              {/* Hero Word and inline Category Capsules */}
              
                
                
                {/* Capsules moved up and positioned parallel, with title removed */}
                
                  {data.category && data.category.length > 0 && (
                    data.category.map((cat, idx) => (
                      
                    ))
                  )}
                
              

              {/* Uniform Row now contains only Pronunciation and Root (বুৎপত্তি) */}
              
                
                  উচ্চারণ
                  
                
                
                  বুৎপত্তি
                  
                
              

              
                
                  অর্থ ও প্রয়োগ
                
                
              
              
            
          
        )}
      
    
  );
}