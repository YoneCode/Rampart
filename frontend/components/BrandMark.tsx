export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rmpg" x1="6" y1="4" x2="26" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#19D184" />
          <stop offset="1" stopColor="#BFFF00" />
        </linearGradient>
      </defs>
      <path
        d="M16 4 25 7.3V15.5C25 21.4 21 25.7 16 28 11 25.7 7 21.4 7 15.5V7.3L16 4Z"
        fill="url(#rmpg)"
        fillOpacity="0.16"
        stroke="url(#rmpg)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 12.5V20M16 11.5V21M20 12.5V20" stroke="url(#rmpg)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
