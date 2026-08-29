import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Images, UserRound } from "lucide-react";

import { ImageCard } from "@/components/gallery/image-card";
import { Badge } from "@/components/ui/badge";
import { getPublicGallery } from "@/lib/server-api";

type PageProps = { params: Promise<{ uid: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { uid } = await params;
  const gallery = await getPublicGallery(uid);
  return { title: gallery?.name ?? "Gallery" };
}

export default async function PublicGalleryPage({ params }: PageProps) {
  const { uid } = await params;
  const gallery = await getPublicGallery(uid);
  if (!gallery) notFound();

  return (
    <section className="page-shell py-14 sm:py-20">
      <div className="image-wash mesh-grid relative overflow-hidden rounded-[2.25rem] px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="relative z-10 max-w-3xl">
          <Badge className="bg-emerald-300 text-emerald-950">
            Public gallery
          </Badge>
          <h1 className="display-type mt-6 text-6xl sm:text-7xl">
            {gallery.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
            {gallery.description}
          </p>
          <div className="mt-9 flex flex-wrap gap-5 text-xs font-bold uppercase tracking-[0.14em] text-white/50">
            <span className="flex items-center gap-2">
              <Images className="size-4 text-emerald-300" />{" "}
              {gallery.images_count ?? gallery.images.length} frames
            </span>
            {gallery.owner ? (
              <span className="flex items-center gap-2">
                <UserRound className="size-4 text-emerald-300" />{" "}
                {gallery.owner.name}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {gallery.images.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gallery.images.map((image, index) => (
            <ImageCard key={image.uid} image={image} index={index} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-[2rem] border border-dashed border-neutral-300 p-16 text-center text-sm text-neutral-500">
          This gallery has no published frames yet.
        </div>
      )}
    </section>
  );
}
