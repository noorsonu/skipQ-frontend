"use client";

import React from 'react';
import SkipQLogo from './SkipQLogo';

export default function OfficialBrandLogo({ 
  height = 46, 
  variant = "full", // "full" | "icon" | "badge" | "light"
  className = "",
  animate = true
}) {
  return (
    <SkipQLogo
      height={height}
      variant={variant}
      className={className}
      animate={animate}
    />
  );
}
