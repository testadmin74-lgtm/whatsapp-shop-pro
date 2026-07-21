import { db } from "@/lib/db";
import MerchantClient from "./MerchantClient";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MerchantPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const merchant = await db.merchant.findUnique({
    where: { id: session.merchantId },
    include: { 
      products: { include: { variants: true } },
      promos: true,
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!merchant) redirect("/auth/login");

  const settings = await db.platformSettings.findUnique({ where: { id: "global" } });
  const globalAnnouncement = settings?.broadcastMessage || "";

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col h-screen">
        <MerchantClient merchant={merchant} globalAnnouncement={globalAnnouncement} role={session.role} />
      </div>
    </main>
  );
}
