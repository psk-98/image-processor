"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginFormSchema, type LoginFormValues } from "@/lib/schemas";

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: LoginFormValues) {
    form.clearErrors("root");

    try {
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (!response.ok) {
        for (const [field, messages] of Object.entries(payload.errors ?? {})) {
          if (field === "email" || field === "password") {
            form.setError(field, { message: messages[0] });
          }
        }

        form.setError("root", {
          message: payload.message ?? "Unable to sign in.",
        });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      form.setError("root", {
        message: "The application is currently unavailable.",
      });
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="grid gap-5"
      noValidate
    >
      <Field
        label="Email address"
        htmlFor="email"
        error={form.formState.errors.email?.message}
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register("email")}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={form.formState.errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...form.register("password")}
        />
      </Field>
      {form.formState.errors.root?.message ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="mt-1 w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <LoaderCircle className="animate-spin" />
        ) : null}
        Enter workspace <ArrowRight />
      </Button>
      <button
        type="button"
        className="text-xs font-semibold text-neutral-400 transition hover:text-emerald-700"
        onClick={() => {
          form.setValue("email", "naledi@fmi.test", { shouldValidate: true });
          form.setValue("password", "password", { shouldValidate: true });
        }}
      >
        Use seeded photographer account
      </button>
    </form>
  );
}
