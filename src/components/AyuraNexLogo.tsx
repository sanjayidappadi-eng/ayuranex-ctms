import React from "react";

interface AyuraNexLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const AyuraNexLogo: React.FC<AyuraNexLogoProps> = ({
  size = 32,
  className = "",
  showText = false
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="ayuraTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id="ayuraIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
          <linearGradient id="ayuraGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <filter id="ayuraGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hexagonal Clinical Shield */}
        <polygon
          points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5"
          fill="#06121e"
          stroke="url(#ayuraTealGrad)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          className="opacity-95"
        />

        {/* Inner Clinical Double Helix Strands */}
        <path
          d="M16 12 C 22 18, 26 22, 32 28 C 36 32, 36 36, 32 38"
          stroke="url(#ayuraIndigoGrad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M32 12 C 26 18, 22 22, 16 28 C 12 32, 12 36, 16 38"
          stroke="url(#ayuraTealGrad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Molecular Nodes connecting Helix */}
        <line x1="18" y1="16" x2="30" y2="16" stroke="#475569" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
        <line x1="20" y1="24" x2="28" y2="24" stroke="url(#ayuraGoldGrad)" strokeWidth="1.5" />
        <line x1="18" y1="32" x2="30" y2="32" stroke="#475569" strokeWidth="1.2" strokeDasharray="1.5 1.5" />

        {/* Central Ayurvedic Lotus Diamond Node */}
        <circle cx="24" cy="24" r="3.2" fill="url(#ayuraGoldGrad)" filter="url(#ayuraGlow)" />
        <polygon points="24,19 28,24 24,29 20,24" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />

        {/* Top & Bottom Clinical Cross Pips */}
        <circle cx="24" cy="7.5" r="1.6" fill="#2dd4bf" />
        <circle cx="24" cy="40.5" r="1.6" fill="#818cf8" />
        <circle cx="10" cy="16" r="1.4" fill="#2dd4bf" opacity="0.8" />
        <circle cx="38" cy="16" r="1.4" fill="#818cf8" opacity="0.8" />
        <circle cx="10" cy="32" r="1.4" fill="#818cf8" opacity="0.8" />
        <circle cx="38" cy="32" r="1.4" fill="#2dd4bf" opacity="0.8" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-extrabold tracking-tight text-white leading-none font-sans">
            Ayura<span className="text-teal-400">Nex</span>
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-indigo-300 uppercase leading-tight mt-0.5">
            AIIA CTMS & NPvCC
          </span>
        </div>
      )}
    </div>
  );
};
