"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Globe2,
  LockKeyhole,
  RefreshCcw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { UploadImageForm } from "@/components/forms/upload-image-form";
import { ImageCard } from "@/components/gallery/image-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError, apiRequest } from "@/lib/api";
import { galleryResponseSchema, type Gallery } from "@/lib/schemas";

export function GalleryStudio({ initialGallery }: { initialGallery: Gallery }) {
  const [gallery, setGallery] = useState(initialGallery);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hasProcessingImages = useMemo(
    () =>
      gallery.images.some(
        (image) =>
          image.processing_status === "pending" ||
          image.processing_status === "processing",
      ),
    [gallery.images],
  );

  const refresh = useCallback(async () => {
    try {
      const payload = await apiRequest<unknown>(`me/galleries/${gallery.uid}`);
      setGallery(galleryResponseSchema.parse(payload).data);
    } catch {
      setMessage("Could not refresh processing status.");
    }
  }, [gallery.uid]);

  useEffect(() => {
    if (!hasProcessingImages) return;
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [hasProcessingImages, refresh]);

  async function toggleVisibility() {
    setSaving(true);
    setMessage(null);
    const visibility = gallery.visibility === "public" ? "private" : "public";

    try {
      const payload = await apiRequest<unknown>(`galleries/${gallery.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      const updated = galleryResponseSchema.parse(payload).data;
      setGallery((current) => ({ ...current, visibility: updated.visibility }));
      setMessage(`Gallery is now ${visibility}.`);
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : "Could not update visibility.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteImage(uid: string) {
    if (!window.confirm("Delete this image permanently?")) return;

    try {
      await apiRequest(`images/${uid}`, { method: "DELETE" });
      setGallery((current) => ({
        ...current,
        images: current.images.filter((image) => image.uid !== uid),
        images_count: Math.max(
          0,
          (current.images_count ?? current.images.length) - 1,
        ),
      }));
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : "Could not delete the image.",
      );
    }
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-950"
      >
        <ArrowLeft className="size-4" /> Back to workspace
      </Link>
      <div className="mt-8 grid items-end gap-8 border-b border-neutral-200 pb-10 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={gallery.visibility === "public" ? "default" : "dark"}
            >
              {gallery.visibility === "public" ? (
                <Globe2 className="size-3" />
              ) : (
                <LockKeyhole className="size-3" />
              )}
              {gallery.visibility}
            </Badge>
            {hasProcessingImages ? (
              <Badge variant="warning">
                <RefreshCcw className="size-3 animate-spin" /> Processing
              </Badge>
            ) : null}
          </div>
          <h1 className="display-type mt-4 text-6xl">{gallery.name}</h1>
          <p className="mt-3 max-w-2xl text-neutral-500">
            {gallery.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/search">
              <Search /> Search
            </Link>
          </Button>
          <Button variant="outline" onClick={refresh}>
            <RefreshCcw /> Refresh
          </Button>
          <Button onClick={toggleVisibility} disabled={saving}>
            {gallery.visibility === "public" ? <LockKeyhole /> : <Globe2 />}{" "}
            Make {gallery.visibility === "public" ? "private" : "public"}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-neutral-600 shadow-sm">
          {message}
        </p>
      ) : null}

      <div className="mt-9 grid items-start gap-8 lg:grid-cols-[22rem_1fr]">
        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5 text-emerald-600" /> Add a frame
            </CardTitle>
            <CardDescription>
              Every detected face receives its own searchable vector.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadImageForm
              galleryUid={gallery.uid}
              onUploaded={(image) =>
                setGallery((current) => ({
                  ...current,
                  images: [image, ...current.images],
                  images_count:
                    (current.images_count ?? current.images.length) + 1,
                }))
              }
            />
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Frames</h2>
            <span className="text-xs font-semibold text-neutral-400">
              {gallery.images.length} visible
            </span>
          </div>
          {gallery.images.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {gallery.images.map((image, index) => (
                <ImageCard
                  key={image.uid}
                  image={image}
                  index={index}
                  actions={
                    <Button
                      variant="destructive"
                      size="icon"
                      className="size-9 opacity-0 shadow-lg group-hover:opacity-100"
                      onClick={() => deleteImage(image.uid)}
                      aria-label="Delete image"
                    >
                      <Trash2 />
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[2rem] border border-dashed border-neutral-300 bg-white/45 p-16 text-center text-sm text-neutral-500">
              Upload the first frame to start this visual index.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
