import Storefront from "@/components/Storefront";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CustomDomainPage({ params }: { params: { hostname: string } }) {
  const { hostname } = await params;
  
  const merchant = await prisma.merchant.findUnique({
    where: { customDomain: hostname },
    include: {
      products: {
        include: {
          variants: true
        }
      },
      promos: true
    }
  });

  if (!merchant) {
    notFound();
  }

  // Get global announcement from Admin Settings if exists
  const globalAnnouncement = "Free Delivery on orders above Rs. 1000! 🎉";

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col min-h-screen">
        <Storefront merchant={merchant} globalAnnouncement={globalAnnouncement} />
      </div>
    </main>
  );
}
