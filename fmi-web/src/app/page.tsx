import Link from "next/link";
import {
  ArrowRight,
  Database,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { GalleryCard } from "@/components/gallery/gallery-card";
import { FaceCanvas } from "@/components/marketing/face-canvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicGalleries } from "@/lib/server-api";

export default async function HomePage() {
  const galleries = await getPublicGalleries();

  return (
    <>
      <section className="page-shell grid min-h-[calc(100vh-4.5rem)] items-center gap-12 py-16 lg:grid-cols-[1.04fr_.96fr] lg:py-20">
        <div>
          <Badge>
            <Sparkles className="size-3" /> Multi-face visual intelligence
          </Badge>
          <h1 className="display-type mt-7 max-w-3xl text-[clamp(3.7rem,8vw,7.4rem)] leading-[.88] text-neutral-950">
            Find the frame.{" "}
            <span className="text-emerald-600">Follow the face.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-500">
            One visual index for every person in every image. Upload a frame,
            detect each face, and search your entire gallery in seconds.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                Start indexing <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/explore">Explore public galleries</Link>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" /> Private by
              default
            </span>
            <span className="flex items-center gap-2">
              <Database className="size-4 text-emerald-600" /> pgvector search
            </span>
          </div>
        </div>
        <FaceCanvas />
      </section>

      <section
        id="how-it-works"
        className="border-y border-neutral-200 bg-white/60 py-24"
      >
        <div className="page-shell">
          <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                From upload to answer
              </p>
              <h2 className="display-type mt-4 text-5xl leading-none sm:text-6xl">
                A visual memory that gets the whole picture.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [
                  "01",
                  "Upload",
                  "Add a portrait, event frame, or a full group photo.",
                ],
                [
                  "02",
                  "Detect",
                  "OpenCV maps every frontal face into its own vector.",
                ],
                [
                  "03",
                  "Discover",
                  "Search one face against every gallery you can access.",
                ],
              ].map(([number, title, copy]) => (
                <div
                  key={number}
                  className="rounded-[1.75rem] border border-neutral-200 bg-white p-6"
                >
                  <span className="font-mono text-xs font-bold text-emerald-600">
                    {number}
                  </span>
                  <h3 className="mt-10 text-xl font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Public index
            </p>
            <h2 className="display-type mt-3 text-5xl">
              Recently opened galleries.
            </h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/explore">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>

        {galleries.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {galleries.slice(0, 3).map((gallery) => (
              <GalleryCard
                key={gallery.uid}
                gallery={gallery}
                href={`/explore/galleries/${gallery.uid}`}
              />
            ))}
          </div>
        ) : (
          <div className="image-wash mesh-grid mt-10 overflow-hidden rounded-[2rem] p-10 text-white sm:p-14">
            <ScanFace className="size-10 text-emerald-300" />
            <h3 className="display-type mt-10 max-w-xl text-4xl">
              The public index is ready for its first collection.
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
              Sign in, create a public gallery, and publish approved frames
              here.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
