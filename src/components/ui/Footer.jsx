import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-4 text-center">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
        <p className="text-[10px] text-text-tertiary mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} Automatix. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="text-[10px] text-text-tertiary hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-[10px] text-text-tertiary hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/refunds" className="text-[10px] text-text-tertiary hover:text-white transition-colors">
            Refund Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
