import type { Metadata } from "next";
import { Globe2, Images } from "lucide-react";

import { GalleryCard } from "@/components/gallery/gallery-card";
import { Badge } from "@/components/ui/badge";
import { getPublicGalleries } from "@/lib/server-api";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const galleries = await getPublicGalleries();

  return (
    <section className="page-shell py-14 sm:py-20">
      <div className="grid items-end gap-8 border-b border-neutral-200 pb-12 lg:grid-cols-[1fr_auto]">
        <div>
          <Badge>
            <Globe2 className="size-3" /> Public index
          </Badge>
          <h1 className="display-type mt-5 text-6xl sm:text-7xl">
            Open collections.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-500">
            Browse approved frames from photographers and curators across the
            FMI community.
          </p>
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
          {galleries.length.toString().padStart(2, "0")} galleries indexed
        </p>
      </div>

      {galleries.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <GalleryCard
              key={gallery.uid}
              gallery={gallery}
              href={`/explore/galleries/${gallery.uid}`}
            />
          ))}
        </div>
      ) : (
        <div className="mt-14 grid place-items-center rounded-[2rem] border border-dashed border-neutral-300 bg-white/50 px-6 py-24 text-center">
          <Images className="size-10 text-emerald-500" />
          <h2 className="mt-5 text-2xl font-bold">No public galleries yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
            Public, approved collections will appear here automatically.
          </p>
        </div>
      )}
    </section>
  );
}
