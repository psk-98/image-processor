import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { TOKEN_COOKIE } from "@/lib/server-api";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const baseUrl = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api/v1";

  if (token) {
    try {
      await fetch(`${baseUrl.replace(/\/$/, "")}/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // The local session is still cleared if the upstream API is unavailable.
    }
  }

  cookieStore.delete(TOKEN_COOKIE);
  return NextResponse.json({ message: "Logged out." });
}
