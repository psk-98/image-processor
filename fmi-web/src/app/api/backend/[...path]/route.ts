import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { TOKEN_COOKIE } from "@/lib/server-api";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const baseUrl = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000/api/v1";
  const upstreamUrl = new URL(
    `${baseUrl.replace(/\/$/, "")}/${path.map(encodeURIComponent).join("/")}`,
  );
  upstreamUrl.search = request.nextUrl.search;

  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const headers = new Headers({ Accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType)
      responseHeaders.set("Content-Type", upstreamContentType);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "The Laravel API is unavailable." },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
