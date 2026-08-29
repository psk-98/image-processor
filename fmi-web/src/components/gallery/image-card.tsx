"use client";

import { motion } from "motion/react";
import { ScanFace, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { GalleryImage } from "@/lib/schemas";
import { formatSimilarity } from "@/lib/utils";

function statusVariant(status: GalleryImage["processing_status"]) {
  if (status === "processed") return "default" as const;
  if (status === "failed") return "danger" as const;
  return "warning" as const;
}

export function ImageCard({
  image,
  actions,
  index = 0,
}: {
  image: GalleryImage;
  actions?: React.ReactNode;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.045, 0.35), duration: 0.35 }}
      layout
      className="group overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-white shadow-[0_20px_60px_-44px_rgba(10,30,22,.45)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <div
          role="img"
          aria-label={
            image.celebrity_name || image.original_name || "Gallery image"
          }
          className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
          style={{
            backgroundImage: `url(${JSON.stringify(image.url).slice(1, -1)})`,
          }}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <Badge variant={statusVariant(image.processing_status)}>
            {image.processing_status}
          </Badge>
          {typeof image.similarity === "number" ? (
            <Badge variant="dark">
              <Sparkles className="size-3" />{" "}
              {formatSimilarity(image.similarity)}
            </Badge>
          ) : null}
        </div>
        {actions ? (
          <div className="absolute bottom-3 right-3">{actions}</div>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-bold tracking-[-0.02em]">
              {image.celebrity_name || image.original_name || "Untitled frame"}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-neutral-400">
              {image.description ||
                image.tags.join(" · ") ||
                "Ready for visual indexing"}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-700">
            <ScanFace className="size-3.5" /> {image.face_count ?? 0}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
