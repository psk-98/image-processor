import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ScanFace, ShieldCheck, Sparkles } from "lucide-react";

import { LoginForm } from "@/components/forms/login-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server-api";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <section className="page-shell grid min-h-[calc(100vh-4.5rem)] items-center gap-10 py-12 lg:grid-cols-[1fr_.82fr]">
      <div className="image-wash mesh-grid relative hidden min-h-[42rem] overflow-hidden rounded-[2.25rem] p-12 text-white lg:block">
        <Badge className="bg-emerald-300 text-emerald-950">
          <Sparkles className="size-3" /> Visual workspace
        </Badge>
        <h1 className="display-type mt-8 max-w-xl text-7xl leading-[.92]">
          Every face has somewhere to be found.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-white/60">
          Manage private galleries, watch image processing, and search all
          accessible collections from one quiet workspace.
        </p>
        <div className="absolute inset-x-12 bottom-12 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <ScanFace className="size-5 text-emerald-300" />
            <p className="mt-8 text-2xl font-bold">Multi-face</p>
            <p className="mt-1 text-xs text-white/45">
              One vector per detected person
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <ShieldCheck className="size-5 text-emerald-300" />
            <p className="mt-8 text-2xl font-bold">Private</p>
            <p className="mt-1 text-xs text-white/45">
              HTTP-only token sessions
            </p>
          </div>
        </div>
      </div>

      <Card className="mx-auto w-full max-w-lg border-0 bg-transparent shadow-none sm:border sm:bg-white/80 sm:shadow-[0_24px_80px_-48px_rgba(10,30,22,.35)]">
        <CardHeader className="p-0 pb-8 sm:p-8 sm:pb-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Welcome back
          </p>
          <CardTitle className="display-type mt-3 text-5xl">
            Sign in to FMI.
          </CardTitle>
          <CardDescription>
            Use your gallery account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-8 sm:pt-0">
          <LoginForm />
        </CardContent>
      </Card>
    </section>
  );
}
