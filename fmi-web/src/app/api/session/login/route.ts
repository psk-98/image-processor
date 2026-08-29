import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { loginFormSchema, loginResponseSchema } from "@/lib/schemas";
import { TOKEN_COOKIE } from "@/lib/server-api";

export async function POST(request: Request) {
  const input = loginFormSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!input.success) {
    return NextResponse.json(
      {
        message: "Check the highlighted fields.",
        errors: input.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const baseUrl = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api/v1";

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...input.data, device_name: "fmi-next-web" }),
      cache: "no-store",
    });
    const payload: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    const login = loginResponseSchema.safeParse(payload);
    if (!login.success) {
      return NextResponse.json(
        { message: "The API returned an invalid login response." },
        { status: 502 },
      );
    }

    (await cookies()).set(TOKEN_COOKIE, login.data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ user: login.data.user });
  } catch {
    return NextResponse.json(
      { message: "The Laravel API is unavailable." },
      { status: 502 },
    );
  }
}
