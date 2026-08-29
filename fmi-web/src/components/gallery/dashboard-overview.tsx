"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { FolderOpen, Images, Plus, ScanSearch, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CreateGalleryForm } from "@/components/forms/create-gallery-form";
import { GalleryCard } from "@/components/gallery/gallery-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Gallery, User } from "@/lib/schemas";

export function DashboardOverview({
  initialGalleries,
  user,
}: {
  initialGalleries: Gallery[];
  user: User;
}) {
  const [galleries, setGalleries] = useState(initialGalleries);
  const [creating, setCreating] = useState(false);
  const frameCount = useMemo(
    () =>
      galleries.reduce(
        (total, gallery) =>
          total + (gallery.images_count ?? gallery.images.length),
        0,
      ),
    [galleries],
  );
  const stats = [
    { label: "Collections", value: galleries.length, icon: FolderOpen },
    { label: "Indexed frames", value: frameCount, icon: Images },
    {
      label: "Public galleries",
      value: galleries.filter((gallery) => gallery.visibility === "public")
        .length,
      icon: ScanSearch,
    },
  ];

  return (
    <>
      <div className="flex flex-col justify-between gap-8 border-b border-neutral-200 pb-10 sm:flex-row sm:items-end">
        <div>
          <Badge variant="outline">{user.role} workspace</Badge>
          <h1 className="display-type mt-4 text-6xl">
            Good to see you, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-neutral-500">
            Your visual library, processing queue, and face search in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/search">
              <ScanSearch /> Search a face
            </Link>
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus /> New gallery
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.label}
              className="border-neutral-200/70 bg-white/65"
            >
              <CardContent className="flex items-end justify-between p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-4xl font-black tracking-[-0.05em]">
                    {stat.value}
                  </p>
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {creating ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="mt-8 border-emerald-200 bg-emerald-50/60">
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>Create a gallery</CardTitle>
                  <CardDescription>
                    Start private; publish whenever you are ready.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCreating(false)}
                  aria-label="Close form"
                >
                  <X />
                </Button>
              </CardHeader>
              <CardContent>
                <CreateGalleryForm
                  onCreated={(gallery) => {
                    setGalleries((current) => [gallery, ...current]);
                    setCreating(false);
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-14 flex items-end justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Your library
          </p>
          <h2 className="display-type mt-2 text-4xl">Galleries</h2>
        </div>
        <span className="text-xs font-semibold text-neutral-400">
          {galleries.length} total
        </span>
      </div>

      {galleries.length ? (
        <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <GalleryCard
              key={gallery.uid}
              gallery={gallery}
              href={`/dashboard/galleries/${gallery.uid}`}
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-7 grid w-full place-items-center rounded-[2rem] border border-dashed border-neutral-300 bg-white/50 px-6 py-24 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50"
        >
          <Plus className="size-9 text-emerald-600" />
          <span className="mt-4 text-lg font-bold">
            Create your first gallery
          </span>
          <span className="mt-1 text-sm text-neutral-500">
            Then upload frames for multi-face processing.
          </span>
        </button>
      )}
    </>
  );
}
