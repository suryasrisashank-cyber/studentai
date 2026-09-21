'use client';

import React from 'react';

interface StudentAI3DCapProps {
  className?: string;
  size?: number;
}

export function StudentAI3DCap({ className = '', size = 180 }: StudentAI3DCapProps) {
  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      {/* Ambient Radial Glow */}
      <div
        className="absolute inset-0 rounded-full filter blur-2xl opacity-60 bg-gradient-to-tr from-[#6D5DFB]/40 via-[#3B82F6]/30 to-[#22D3EE]/20 animate-pulse"
        style={{ width: `${size}px`, height: `${size}px` }}
      />

      <svg
        width={size}
        height={size * 0.85}
        viewBox="0 0 240 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_12px_24px_rgba(59,130,246,0.35)]"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="capTopGrad" x1="20" y1="50" x2="220" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="45%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>

          <linearGradient id="capEdgeGrad" x1="120" y1="75" x2="120" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="capSkullGrad" x1="60" y1="90" x2="180" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="60%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#0B0F19" />
          </linearGradient>

          <linearGradient id="tasselGrad" x1="120" y1="65" x2="200" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          <linearGradient id="basePlatformGrad" x1="30" y1="140" x2="210" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
            <stop offset="50%" stopColor="rgba(99, 102, 241, 0.2)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </linearGradient>

          {/* Neon Glow Filter */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Floating Base Light Grid / Platform */}
        <ellipse cx="120" cy="160" rx="90" ry="24" fill="url(#basePlatformGrad)" />
        <ellipse cx="120" cy="160" rx="65" ry="16" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

        {/* Skull Cap Lower Section */}
        <path
          d="M68 92 C68 128 172 128 172 92 L168 135 C168 152 72 152 72 135 Z"
          fill="url(#capSkullGrad)"
          stroke="#38BDF8"
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />

        {/* Skull Base Rim Ring */}
        <path
          d="M72 135 C72 150 168 150 168 135"
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#neonGlow)"
        />

        {/* Mortarboard Diamond Top - Lower Edge (Extrusion) */}
        <path
          d="M120 72 L215 98 L120 124 L25 98 Z"
          fill="url(#capEdgeGrad)"
          stroke="#1E293B"
          strokeWidth="1"
        />

        {/* Mortarboard Diamond Top - Primary Surface */}
        <path
          d="M120 62 L215 88 L120 114 L25 88 Z"
          fill="url(#capTopGrad)"
          stroke="#38BDF8"
          strokeWidth="1.5"
        />

        {/* Inner Highlight Reflection */}
        <path
          d="M120 66 L195 88 L120 108 L45 88 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1"
        />

        {/* Center Button */}
        <ellipse cx="120" cy="88" rx="6" ry="4" fill="#67E8F9" filter="url(#neonGlow)" />
        <ellipse cx="120" cy="88" rx="3.5" ry="2.5" fill="#FFFFFF" />

        {/* Flowing Neon Tassel */}
        <path
          d="M120 88 Q150 82 175 105 T192 145"
          fill="none"
          stroke="url(#tasselGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#neonGlow)"
        />

        {/* Tassel Fringe Cluster */}
        <path
          d="M192 145 L190 168 M192 145 L194 169 M192 145 L197 166 M192 145 L187 165"
          stroke="#93C5FD"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="192" cy="147" r="3.5" fill="#38BDF8" />

        {/* Particle Light Sparkles */}
        <circle cx="35" cy="70" r="1.5" fill="#38BDF8" opacity="0.8" />
        <circle cx="210" cy="65" r="2" fill="#818CF8" opacity="0.9" />
        <circle cx="180" cy="45" r="1.5" fill="#C084FC" opacity="0.7" />
        <circle cx="60" cy="150" r="1.5" fill="#38BDF8" opacity="0.6" />
      </svg>
    </div>
  );
}
