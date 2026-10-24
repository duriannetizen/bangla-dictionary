"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function ApplicationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="absolute top-6 right-6 z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Application menu"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#006A4E]"
      >
        {/* SVG Hamburger Icon */}
        <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">মেনু</span>
          </div>
          <div className="flex flex-col p-2 gap-1">
            <Link 
              href="/ek-kothay" 
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-lg font-semibold text-gray-800 dark:text-gray-200 hover:bg-[#006A4E]/10 hover:text-[#006A4E] dark:hover:bg-[#42a88a]/20 dark:hover:text-[#42a88a] rounded-lg transition-colors"
            >
              এক কথায় প্রকাশ
            </Link>
            <Link 
              href="/somarthok"
              onClick={() => setIsOpen(false)} 
              className="px-4 py-3 text-lg font-semibold text-gray-800 dark:text-gray-200 hover:bg-[#F42A41]/10 hover:text-[#F42A41] dark:hover:bg-[#F42A41]/20 dark:hover:text-[#ff4d60] rounded-lg transition-colors"
            >
              সমার্থক শব্দ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}