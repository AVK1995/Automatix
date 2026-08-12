'use client';

import { motion } from 'framer-motion';

const LogoPath = "M41.5 15L15 90h18l7.5-22.5h20L67.5 90h18L58.5 15h-17zM45 45l5-15 5 15h-10z";

export default function Loader({ fullScreen = true }) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-md"
    : "flex flex-col items-center justify-center py-12";

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        <div className="relative w-24 h-24 mb-6">
          {/* Base outline logo */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-white/5">
            <path d={LogoPath} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
          </svg>

          {/* Filled logo that reveals from bottom to top like liquid silver */}
          <motion.div 
            initial={{ height: "0%" }}
            animate={{ height: "100%" }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-0 left-0 w-full overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                <defs>
                  <linearGradient id="silver-water" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="30%" stopColor="#e2e8f0" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="70%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>
                </defs>
                <path d={LogoPath} fill="url(#silver-water)" fillRule="evenodd" clipRule="evenodd" />
              </svg>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-text-secondary font-medium tracking-widest uppercase text-sm flex items-center gap-1"
        >
          Initializing Engine
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.5, 1] }}>.</motion.span>
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2, times: [0, 0.5, 1] }}>.</motion.span>
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, times: [0, 0.5, 1] }}>.</motion.span>
        </motion.div>
      </motion.div>
    </div>
  );
}
