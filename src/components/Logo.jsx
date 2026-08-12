import { useId } from 'react';

const LogoPath = "M41.5 15L15 90h18l7.5-22.5h20L67.5 90h18L58.5 15h-17zM45 45l5-15 5 15h-10z";

export default function Logo({ size = 40, className = '' }) {
  const gradientId = useId();
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        viewBox="0 0 100 100" 
        style={{ width: size, height: size }}
        className="flex-shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d={LogoPath} 
          fill={`url(#${gradientId})`} 
        />
      </svg>
      <span className="font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70" style={{ fontSize: size * 0.45 }}>
        Automatix
      </span>
    </div>
  );
}
