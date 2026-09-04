'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-blue/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none shrink-0';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-xs px-4 py-2 rounded-xl gap-2',
    lg: 'text-sm px-5 py-2.5 rounded-xl gap-2.5'
  };

  const variantStyles = {
    primary: 'bg-accent-blue hover:bg-accent-blue/90 text-white shadow-sm shadow-accent-blue/20 active:scale-[0.98]',
    secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10 active:scale-[0.98]',
    outline: 'bg-transparent hover:bg-white/5 text-text-secondary hover:text-white border border-border-subtle active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-white/5 text-text-secondary hover:text-white active:scale-[0.98]',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 active:scale-[0.98]'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 flex-shrink-0" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-3.5 h-3.5 shrink-0 flex-shrink-0" />
      ) : null}
      
      {children}

      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-3.5 h-3.5 shrink-0 flex-shrink-0" />
      )}
    </button>
  );
}
