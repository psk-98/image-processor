"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Aperture, LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { User } from "@/lib/schemas";
import { cn, initials } from "@/lib/utils";

const publicLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/#how-it-works", label: "How it works" },
];

export function SiteHeader({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/session/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/70 bg-[#f6f7f2]/85 backdrop-blur-2xl">
      <div className="page-shell flex h-18 items-center justify-between gap-5">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="FMI home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-neutral-950 text-emerald-400 shadow-lg">
            <Aperture className="size-5" />
          </span>
          <span className="text-base font-black tracking-[-0.04em]">FMI</span>
          <span className="hidden h-4 w-px bg-neutral-300 sm:block" />
          <span className="hidden text-xs font-medium text-neutral-500 sm:block">
            Face Media Index
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary navigation"
        >
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-white hover:text-neutral-950",
                pathname === link.href && "bg-white text-neutral-950 shadow-sm",
              )}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link
              href="/search"
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-white hover:text-neutral-950",
                pathname === "/search" && "bg-white text-neutral-950 shadow-sm",
              )}
            >
              <Search className="size-3.5" /> Search faces
            </Link>
          ) : null}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                  <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800">
                    {initials(user.name)}
                  </span>
                  Workspace
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                disabled={loggingOut}
                aria-label="Log out"
              >
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/login">Open workspace</Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-neutral-200 bg-[#f6f7f2] p-3 md:hidden">
          <nav className="page-shell grid gap-1">
            {[
              ...publicLinks,
              ...(user ? [{ href: "/search", label: "Search faces" }] : []),
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild className="mt-2 w-full">
              <Link
                href={user ? "/dashboard" : "/login"}
                onClick={() => setOpen(false)}
              >
                {user ? "Open workspace" : "Sign in"}
              </Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
