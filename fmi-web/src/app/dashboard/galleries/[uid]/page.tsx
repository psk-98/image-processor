import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { GalleryStudio } from "@/components/gallery/gallery-studio";
import { getCurrentUser, getOwnedGallery } from "@/lib/server-api";

type PageProps = { params: Promise<{ uid: string }> };

export const metadata: Metadata = { title: "Gallery studio" };

export default async function GalleryStudioPage({ params }: PageProps) {
  if (!(await getCurrentUser())) redirect("/login");
  const { uid } = await params;
  const gallery = await getOwnedGallery(uid);
  if (!gallery) notFound();

  return (
    <section className="page-shell py-12 sm:py-16">
      <GalleryStudio initialGallery={gallery} />
    </section>
  );
}
