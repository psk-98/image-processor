import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SearchWorkspace } from "@/components/gallery/search-workspace";
import { getCurrentUser } from "@/lib/server-api";

export const metadata: Metadata = { title: "Search faces" };

export default async function SearchPage() {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <section className="page-shell py-12 sm:py-16">
      <SearchWorkspace />
    </section>
  );
}
