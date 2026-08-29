import Link from "next/link";
import { Aperture } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-neutral-200 py-8">
      <div className="page-shell flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
        <Link href="/" className="flex items-center gap-2 text-sm font-black">
          <Aperture className="size-4 text-emerald-600" /> FMI
        </Link>
        <p className="text-xs text-neutral-400">
          Face-first discovery for curated image libraries.
        </p>
        <div className="flex gap-5 text-xs font-semibold text-neutral-500">
          <Link href="/explore" className="hover:text-emerald-700">
            Explore
          </Link>
          <Link href="/login" className="hover:text-emerald-700">
            Workspace
          </Link>
        </div>
      </div>
    </footer>
  );
}
