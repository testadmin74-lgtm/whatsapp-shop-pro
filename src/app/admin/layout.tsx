"use client";

import { ReactNode, useState } from "react";
import { LayoutDashboard, Users, Settings, LogOut, BarChart3, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const getLinkClasses = (path: string) => {
    const isActive = pathname === path || (path === "/admin/merchants" && pathname === "/admin");
    return isActive 
      ? "flex items-center space-x-3 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-indigo-600/20 font-medium"
      : "flex items-center space-x-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition-colors font-medium";
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            SuperAdmin
          </h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-bold">Workspace</p>
        </div>
        {/* Close button for mobile */}
        <button className="md:hidden text-slate-400 hover:text-white" onClick={toggleMenu}>
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClasses("/admin")}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClasses("/admin/merchants")}>
          <Users className="w-5 h-5" />
          <span>Merchants</span>
        </Link>
        <Link href="/admin/analytics" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClasses("/admin/analytics")}>
          <BarChart3 className="w-5 h-5" />
          <span>Analytics</span>
        </Link>
        <Link href="/admin/settings" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClasses("/admin/settings")}>
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>
      
      <div className="p-4 mt-auto">
        <div className="bg-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white">
              WO
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Web Owner</span>
              <span className="text-xs text-slate-400">admin@app.com</span>
            </div>
          </div>
        </div>
        <button className="flex items-center space-x-2 text-slate-400 hover:text-red-400 mt-4 px-2 text-sm font-medium transition-colors w-full">
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-col hidden md:flex shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative w-full h-full flex flex-col">
        {/* Mobile Topbar */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button onClick={toggleMenu} className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-black text-slate-800 text-lg">SuperAdmin</h1>
          </div>
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white text-xs">
            WO
          </div>
        </div>
        
        {children}
      </main>
    </div>
  );
}
