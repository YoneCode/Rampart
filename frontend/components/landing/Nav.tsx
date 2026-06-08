import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Social } from "@/components/Social";

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "FAQ", href: "#faq" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7" />
          <span className="font-display text-xl tracking-tight text-gray-100">RAMPART</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-gray-400 transition-colors hover:text-gray-100">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Social className="hidden sm:flex" />
          <Link
            href="/app"
            className="rounded-lg border border-ritual-green px-4 py-2 text-sm font-semibold text-ritual-green transition-all hover:bg-ritual-green/10 hover:shadow-glow-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
