import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "mark" | "stacked";
  roleBadge?: string;
  href?: string;
  theme?: "light" | "dark" | "auto";
}

export function LogoMark({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fsLeafGrad" x1="10" y1="8" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="60%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="fsHandGrad" x1="6" y1="24" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="50%" stopColor="#166534" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
        <linearGradient id="fsSeedGrad" x1="22" y1="16" x2="26" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="fsGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#16a34a" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer subtle circular aura */}
      <circle cx="24" cy="24" r="22" fill="#f0fdf4" stroke="#dcfce7" strokeWidth="1.5" />

      {/* Caring hand cradle - warm supportive arc */}
      <path
        d="M10 26C10 33.732 16.268 40 24 40C30.2 40 35.48 35.98 37.3 30.4C37.8 28.9 36.6 27.5 35 27.5C33.7 27.5 32.6 28.4 32.1 29.6C30.7 33 27.6 35.5 24 35.5C18.753 35.5 14.5 31.247 14.5 26C14.5 24.2 15 22.5 15.9 21.1C16.6 19.9 15.9 18.5 14.5 18.5C13.8 18.5 13.1 18.9 12.6 19.5C11 21.4 10 23.6 10 26Z"
        fill="url(#fsHandGrad)"
      />

      {/* Organic rising rescue leaf with shadow */}
      <path
        d="M24 8C24 8 36 12 36 24C36 30 31 35 24 35C17 35 12 30 12 24C12 16 20 9 24 8Z"
        fill="url(#fsLeafGrad)"
        filter="url(#fsGlow)"
      />

      {/* Central leaf vein / light trail */}
      <path
        d="M24 12V32M24 18L30 14M24 23L31 20M24 28L28 26M24 18L18 15M24 23L17 21"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Compassion droplet / golden nourishment seed */}
      <circle cx="24" cy="21" r="3.2" fill="url(#fsSeedGrad)" />
      <path
        d="M24 16.5C24 16.5 26.5 19.5 26.5 21C26.5 22.38 25.38 23.5 24 23.5C22.62 23.5 21.5 22.38 21.5 21C21.5 19.5 24 16.5 24 16.5Z"
        fill="#fef3c7"
        opacity="0.9"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  size = "md",
  variant = "full",
  roleBadge,
  href = "/",
  theme = "auto",
}: LogoProps) {
  const sizeMap = {
    sm: { mark: "w-7 h-7", text: "text-lg", badge: "text-[10px] px-1.5 py-0.5", gap: "gap-2" },
    md: { mark: "w-9 h-9", text: "text-xl", badge: "text-xs px-2 py-0.5", gap: "gap-2.5" },
    lg: { mark: "w-11 h-11", text: "text-2xl", badge: "text-xs px-2.5 py-0.5", gap: "gap-3" },
    xl: { mark: "w-14 h-14", text: "text-3xl", badge: "text-sm px-3 py-1", gap: "gap-3.5" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center ${currentSize.gap} group select-none ${className}`}>
      {/* Visual Logo Mark */}
      <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
        <LogoMark className={currentSize.mark} />
      </div>

      {/* Brand Typography & Wordmark */}
      {variant !== "mark" && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold tracking-tight font-sans ${currentSize.text} ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Food
              <span className="text-green-600 transition-colors group-hover:text-green-500">
                Share
              </span>
            </span>

            {/* Optional Role Badge */}
            {roleBadge && (
              <span
                className={`inline-flex items-center font-medium rounded-full border border-green-200 bg-green-50/80 text-green-800 ${currentSize.badge} shadow-xs`}
              >
                {roleBadge}
              </span>
            )}
          </div>
          {size === "xl" && (
            <span className="text-xs font-medium text-gray-500 tracking-wide">
              Zero Waste • Community Food Rescue
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus:outline-hidden focus-visible:ring-2 focus-visible:ring-green-500 rounded-lg inline-flex items-center"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
