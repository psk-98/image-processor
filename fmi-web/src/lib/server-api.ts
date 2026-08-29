import "server-only";

import { cookies } from "next/headers";

import {
  galleryCollectionSchema,
  galleryResponseSchema,
  userResponseSchema,
  type Gallery,
  type User,
} from "@/lib/schemas";

export const TOKEN_COOKIE = "fmi_session";

function apiUrl(path: string) {
  const baseUrl = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api/v1";
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function serverRequest(path: string, authenticated = false) {
  const token = authenticated
    ? (await cookies()).get(TOKEN_COOKIE)?.value
    : undefined;

  if (authenticated && !token) return null;

  try {
    return await fetch(apiUrl(path), {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await serverRequest("auth/me", true);
  if (!response?.ok) return null;

  const parsed = userResponseSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.data : null;
}

export async function getPublicGalleries(): Promise<Gallery[]> {
  const response = await serverRequest("galleries");
  if (!response?.ok) return [];

  const parsed = galleryCollectionSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.data : [];
}

export async function getMyGalleries(): Promise<Gallery[]> {
  const response = await serverRequest("me/galleries", true);
  if (!response?.ok) return [];

  const parsed = galleryCollectionSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.data : [];
}

export async function getPublicGallery(uid: string): Promise<Gallery | null> {
  const response = await serverRequest(`galleries/${uid}`);
  if (!response?.ok) return null;

  const parsed = galleryResponseSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.data : null;
}

export async function getOwnedGallery(uid: string): Promise<Gallery | null> {
  const response = await serverRequest(`me/galleries/${uid}`, true);
  if (!response?.ok) return null;

  const parsed = galleryResponseSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.data : null;
}
