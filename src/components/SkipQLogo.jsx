"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function SkipQLogo({ 
  height = 42, 
  variant = "full", // "full" | "icon" | "badge" | "light"
  className = "",
  animate = true 
}) {
  const isLight = variant === "light";
  const primaryTextColor = isLight ? "#FFFFFF" : "#283B3D";
  const subTextColor = isLight ? "#99F6E4" : "#176B65";
  const accentColor = "#F2A15A"; // Warm Amber

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`} style={{ height: `${height}px` }}>
      {/* Sleek Vector Icon Mark */}
      <div 
        className="relative flex items-center justify-center shrink-0 drop-shadow-sm"
        style={{ width: `${height}px`, height: `${height}px` }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="sqGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E827B" />
              <stop offset="100%" stopColor="#105752" />
            </linearGradient>
            <linearGradient id="sqAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>

          {/* Squircle Badge Background */}
          <rect x="4" y="4" width="92" height="92" rx="26" fill="url(#sqGradient)" />
          <rect x="6" y="6" width="88" height="88" rx="24" stroke="#2DD4BF" strokeOpacity="0.4" strokeWidth="2.5" />

          {/* 'Q' Circular Body */}
          <circle cx="48" cy="46" r="23" stroke="#FFFFFF" strokeWidth="7.5" strokeLinecap="round" />

          {/* Speed Forward Streaks inside Q */}
          <path d="M42 37 L51 46 L42 55" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M52 37 L61 46 L52 55" stroke="url(#sqAccentGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Fast-Forward Arrow cutting through Q tail */}
          <path d="M58 56 L78 76" stroke="url(#sqAccentGrad)" strokeWidth="8" strokeLinecap="round" />
          <polygon points="84,82 68,82 84,66" fill="url(#sqAccentGrad)" />
        </svg>
      </div>

      {/* Typography for "Full" variant */}
      {variant !== "icon" && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline font-black tracking-tight" style={{ fontSize: `${Math.round(height * 0.58)}px` }}>
            <span style={{ color: primaryTextColor }}>Skip</span>
            <span className="text-[#176B65] dark:text-[#2DD4BF] ml-[1px] relative">
              Q
              {/* Energetic spark indicator */}
              <span 
                className="absolute -top-1 -right-2 w-2 h-2 rounded-full" 
                style={{ backgroundColor: accentColor }}
              />
            </span>
          </div>
          <span 
            className="font-bold tracking-widest uppercase mt-[3px] hidden sm:block"
            style={{ 
              fontSize: `${Math.max(9, Math.round(height * 0.22))}px`,
              color: subTextColor,
              letterSpacing: "0.18em"
            }}
          >
            Zero Wait • Live
          </span>
        </div>
      )}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="inline-flex items-center cursor-pointer"
    >
      {content}
    </motion.div>
  );
}
