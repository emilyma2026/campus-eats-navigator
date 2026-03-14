import React from 'react';

export default function MeituanLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FFD000" />
      <text x="12" y="16" textAnchor="middle" fill="#000" fontSize="11" fontWeight="800" fontFamily="Arial">M</text>
    </svg>
  );
}
