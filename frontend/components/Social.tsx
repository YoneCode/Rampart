import { Github } from "lucide-react";

export const GITHUB_URL = "https://github.com/YoneCode/Rampart";
export const X_URL = "https://x.com/YoneCode";

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function Social({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Rampart on GitHub"
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50"
      >
        <Github className="h-[18px] w-[18px]" />
      </a>
      <a
        href={X_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Rampart on X"
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50"
      >
        <XIcon className="h-[15px] w-[15px]" />
      </a>
    </div>
  );
}
