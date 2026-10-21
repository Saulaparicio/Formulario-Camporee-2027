import React, { useState } from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ConquistadoresLogo: React.FC<Props> = ({ className = '', size = 'md' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  }[size];

  // Official Camporee Logo uploaded by the user
  const officialCamporeeLogo =
    '/assets/aistudio/logo_preparados_para_su_regreso_transparente_b4357a91.png';

  if (!imageError) {
    return (
      <img
        src={officialCamporeeLogo}
        alt="VII Camporee AMAP 2027 - Preparados Para Su Regreso"
        className={`object-contain drop-shadow-[0_4px_12px_rgba(245,158,11,0.25)] transition-transform hover:scale-105 ${sizeClasses} ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback high-fidelity SVG emblem of Conquistadores
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-red-600 to-amber-700 p-1.5 shadow-lg shadow-amber-500/20 ${sizeClasses} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow text-white fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Inverted triangle shield */}
        <polygon points="5,10 95,10 50,90" fill="#dc2626" stroke="#fbbf24" strokeWidth="4" />
        <polygon points="12,16 88,16 50,82" fill="#ffffff" />
        <polygon points="16,20 84,20 50,78" fill="#1e3a8a" />
        {/* Golden sword / shield detail */}
        <path d="M50 24 L53 30 L60 30 L55 35 L57 42 L50 38 L43 42 L45 35 L40 30 L47 30 Z" fill="#fbbf24" />
        <line x1="50" y1="36" x2="50" y2="70" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
        <line x1="42" y1="44" x2="58" y2="44" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};
