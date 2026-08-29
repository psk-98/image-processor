"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="page-shell grid min-h-[65vh] place-items-center py-16 text-center">
      <div className="max-w-lg">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <TriangleAlert className="size-7" />
        </span>
        <h1 className="display-type mt-6 text-5xl">The frame slipped.</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Something interrupted this view. Your images and galleries are
          unchanged.
        </p>
        <Button className="mt-7" onClick={reset}>
          <RotateCcw /> Try again
        </Button>
      </div>
    </section>
  );
}
