"use client";

import { ReactNode } from "react";
import { Store, Bell } from "lucide-react";

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl relative overflow-hidden flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 leading-tight">Merchant Panel</h1>
              <p className="text-xs text-green-600 font-bold flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Dashboard Active
              </p>
            </div>
          </div>
          <button className="relative p-2 mr-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 pb-24">
          {children}
        </div>
      </div>
    </main>
  );
}
