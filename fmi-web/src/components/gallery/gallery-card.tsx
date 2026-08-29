"use client";

import Link from "next/link";
import { ArrowUpRight, Images, LockKeyhole } from "lucide-react";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import type { Gallery } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";

export function GalleryCard({
  gallery,
  href,
}: {
  gallery: Gallery;
  href: string;
}) {
  const cover = gallery.images[0];

  return (
    <motion.article
      layout
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
    >
      <Link
        href={href}
        className="group block overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white shadow-[0_24px_70px_-48px_rgba(10,30,22,.45)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
          {cover ? (
            <div
              role="img"
              aria-label={
                cover.celebrity_name || cover.original_name || gallery.name
              }
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url(${JSON.stringify(cover.url).slice(1, -1)})`,
              }}
            />
          ) : (
            <div className="image-wash mesh-grid absolute inset-0 grid place-items-center">
              <Images className="size-10 text-emerald-200/80" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute left-4 top-4 flex gap-2">
            <Badge
              variant={gallery.visibility === "public" ? "default" : "dark"}
            >
              {gallery.visibility === "private" ? (
                <LockKeyhole className="size-3" />
              ) : null}
              {gallery.visibility}
            </Badge>
          </div>
          <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white/90 text-neutral-950 opacity-0 backdrop-blur transition group-hover:opacity-100">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold tracking-[-0.025em] text-neutral-950">
                {gallery.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-500">
                {gallery.description}
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs font-semibold text-neutral-400">
            <span>{gallery.images_count ?? gallery.images.length} frames</span>
            <span>{formatDate(gallery.created_at)}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
