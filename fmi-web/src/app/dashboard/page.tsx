import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/gallery/dashboard-overview";
import { getCurrentUser, getMyGalleries } from "@/lib/server-api";

export const metadata: Metadata = { title: "Workspace" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const galleries = await getMyGalleries();

  return (
    <section className="page-shell py-12 sm:py-16">
      <DashboardOverview initialGalleries={galleries} user={user} />
    </section>
  );
}
