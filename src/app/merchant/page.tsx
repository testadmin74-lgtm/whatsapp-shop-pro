import { db } from "@/lib/db";
import MerchantClient from "./MerchantClient";

export default async function MerchantPage() {
  // For MVP, just grab the first merchant in the DB to act as the "logged in" user
  const merchant = await db.merchant.findFirst({
    include: { 
      products: { include: { variants: true } },
      promos: true,
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  const settings = await db.platformSettings.findUnique({ where: { id: "global" } });
  const globalAnnouncement = settings?.broadcastMessage || "";

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col h-screen">
        <MerchantClient merchant={merchant} globalAnnouncement={globalAnnouncement} />
      </div>
    </main>
  );
}
