"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiRequest } from "@/lib/api";
import {
  imageResponseSchema,
  uploadImageSchema,
  type GalleryImage,
  type UploadImageValues,
} from "@/lib/schemas";

export function UploadImageForm({
  galleryUid,
  onUploaded,
}: {
  galleryUid: string;
  onUploaded: (image: GalleryImage) => void;
}) {
  const form = useForm<UploadImageValues>({
    resolver: zodResolver(uploadImageSchema),
    defaultValues: {
      celebrity_name: "",
      description: "",
      tags: "",
      is_public: false,
    },
  });

  async function submit(values: UploadImageValues) {
    const file = values.image[0];
    if (!file) return;
    form.clearErrors("root");

    const body = new FormData();
    body.set("image", file);
    if (values.celebrity_name)
      body.set("celebrity_name", values.celebrity_name);
    if (values.description) body.set("description", values.description);
    values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => body.append("tags[]", tag));
    body.set("is_public", values.is_public ? "1" : "0");

    try {
      const payload = await apiRequest<unknown>(
        `galleries/${galleryUid}/images`,
        { method: "POST", body },
      );
      const parsed = imageResponseSchema.parse(payload);
      onUploaded(parsed.data);
      form.reset();
    } catch (error) {
      form.setError("root", {
        message: error instanceof ApiError ? error.message : "Upload failed.",
      });
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="grid gap-4"
      noValidate
    >
      <Field
        label="Image"
        htmlFor="gallery-image"
        hint="JPG, PNG or WebP · 10 MB"
        error={form.formState.errors.image?.message}
      >
        <Input
          id="gallery-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          {...form.register("image")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Person / celebrity"
          htmlFor="celebrity-name"
          error={form.formState.errors.celebrity_name?.message}
        >
          <Input
            id="celebrity-name"
            placeholder="Optional label"
            {...form.register("celebrity_name")}
          />
        </Field>
        <Field
          label="Tags"
          htmlFor="image-tags"
          hint="Comma-separated"
          error={form.formState.errors.tags?.message}
        >
          <Input
            id="image-tags"
            placeholder="event, portrait"
            {...form.register("tags")}
          />
        </Field>
      </div>
      <Field
        label="Description"
        htmlFor="image-description"
        error={form.formState.errors.description?.message}
      >
        <Textarea
          id="image-description"
          className="min-h-20"
          placeholder="Context for this frame"
          {...form.register("description")}
        />
      </Field>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white/60 p-4 text-sm font-medium text-neutral-600">
        <input
          type="checkbox"
          className="size-4 accent-emerald-600"
          {...form.register("is_public")}
        />
        Make this frame eligible for public display after moderation
      </label>
      {form.formState.errors.root?.message ? (
        <p className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <ImagePlus />
        )}
        Upload and process
      </Button>
    </form>
  );
}
