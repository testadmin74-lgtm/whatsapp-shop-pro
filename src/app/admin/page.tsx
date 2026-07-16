import { db } from "@/lib/db";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const merchants = await db.merchant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } }
  });

  const settings = await db.platformSettings.findUnique({ where: { id: "global" } });
  const globalAnnouncement = settings?.broadcastMessage || "";

  return (
    <main className="min-h-screen bg-slate-50 flex">
      <AdminClient initialMerchants={merchants} initialAnnouncement={globalAnnouncement} />
    </main>
  );
}
