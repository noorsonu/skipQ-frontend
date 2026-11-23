"use client";

import React from 'react';
import SkipQLogo from './SkipQLogo';

export default function FreshUrbanLogo({ size = 48, className = "" }) {
  return (
    <SkipQLogo
      height={size}
      variant="icon"
      className={className}
      animate={false}
    />
  );
}
