'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';

export default function SearchInput({ placeholder = "Search..." }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      
      const newUrl = `?${params.toString()}`;
      if (window.location.search !== newUrl && newUrl !== '?') {
        startTransition(() => {
          router.replace(newUrl);
        });
      } else if (!query && window.location.search.includes('q=')) {
        startTransition(() => {
          router.replace(window.location.pathname);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-border-subtle rounded-md leading-5 bg-background text-foreground placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue sm:text-sm transition-colors"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isPending && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <div className="animate-spin h-3 w-3 border-2 border-accent-blue border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}
