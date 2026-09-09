interface YappLogoProps {
  size?: number | string;
  className?: string;
}

export const YappLogo = ({ size = 48, className = '' }: YappLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Exact gradient from lime green (#8ae82c) to emerald teal (#059669 / #0d9488) */}
        <linearGradient id="yappBubbleGradient" x1="15" y1="15" x2="185" y2="185" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8cf226" />
          <stop offset="30%" stopColor="#4ade80" />
          <stop offset="70%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>

        {/* Subtle shadow for depth */}
        <filter id="yappDropShadow" x="-10%" y="-10%" width="125%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#047857" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Chat bubble body with smooth rounded corners and bottom notch */}
      <path
        d="M 45 20
           L 155 20
           A 35 35 0 0 1 190 55
           L 190 135
           A 35 35 0 0 1 155 170
           L 115 170
           C 107 170 104 174 100 188
           C 96 174 93 170 85 170
           L 45 170
           A 35 35 0 0 1 10 135
           L 10 55
           A 35 35 0 0 1 45 20
           Z"
        fill="url(#yappBubbleGradient)"
        filter="url(#yappDropShadow)"
      />

      {/* Bold modern sans-serif "Y" in deep teal */}
      <path
        d="M 68 56
           L 91 102
           L 91 146
           L 109 146
           L 109 102
           L 132 56
           L 114 56
           L 100 88
           L 86 56
           Z"
        fill="#046c64"
      />
    </svg>
  );
};
