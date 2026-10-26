import React from 'react';

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mailscope-grad-brand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <filter id="mailscope-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#22D3EE" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Rounded squircle container with brand gradient */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#mailscope-grad-brand)"
        filter="url(#mailscope-glow)"
      />

      {/* Envelope body outline */}
      <rect
        x="10"
        y="14"
        width="28"
        height="20"
        rx="4"
        fill="#060A16"
        fillOpacity="0.28"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Flap forming scope / crosshair mark */}
      <path
        d="M11 16L21.5 25.5C22.8 26.7 24.8 26.8 26.2 25.6L37 16"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Check / scope accent nestled on the flap */}
      <path
        d="M20 25.5L23.5 29L31 20.5"
        stroke="#22D3EE"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
