import Storefront from "@/components/Storefront";
import { getMerchantBySlug } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function StorefrontPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const resolvedParams = await params;
  const merchant = await getMerchantBySlug(resolvedParams.storeSlug);

  if (!merchant) {
    notFound();
  }

  if (!merchant.isActive) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl max-w-sm shadow-2xl">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">Store Temporarily Unavailable</h1>
          <p className="text-slate-500 text-sm">This store has been temporarily suspended by the platform administrator due to pending subscription payments. Please contact the store owner.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-2xl relative overflow-hidden flex flex-col min-h-screen">
        <Storefront merchant={merchant} />
      </div>
    </main>
  );
}
