"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingUp, Store, CreditCard, CheckCircle, XCircle, Trash2, ExternalLink, Plus, Megaphone, BarChart3, Star } from "lucide-react";
import { addMerchant, toggleMerchantStatus, deleteMerchant, updatePlatformAnnouncement, updateMerchantTier } from "@/lib/actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type MerchantType = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  isActive: boolean;
  subscriptionTier: string;
  createdAt: Date;
  _count: { products: number };
};

export default function AdminClient({ initialMerchants, initialAnnouncement }: { initialMerchants: MerchantType[], initialAnnouncement: string }) {
  const [merchants, setMerchants] = useState(initialMerchants);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (initialMerchants !== merchants && !loading) {
      setMerchants(initialMerchants);
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    setMerchants(merchants.map(m => m.id === id ? { ...m, isActive: !currentStatus } : m));
    await toggleMerchantStatus(id, currentStatus);
    setLoading(false);
  };

  const handleTierChange = async (id: string, newTier: string) => {
    setLoading(true);
    setMerchants(merchants.map(m => m.id === id ? { ...m, subscriptionTier: newTier } : m));
    await updateMerchantTier(id, newTier);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(confirm("Are you sure you want to delete this merchant and all their products?")) {
      setLoading(true);
      setMerchants(merchants.filter(m => m.id !== id));
      await deleteMerchant(id);
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addMerchant(formData);
    if (res?.error) {
      alert(res.error);
    } else {
      setIsAddModalOpen(false);
    }
    setLoading(false);
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const message = formData.get("message") as string;
    await updatePlatformAnnouncement(message);
    alert("Broadcast sent successfully to all merchants!");
    setLoading(false);
  };

  // Mock data for Platform Analytics chart
  const analyticsData = [
    { name: 'Mon', Revenue: 15000, Stores: 2 },
    { name: 'Tue', Revenue: 22000, Stores: 4 },
    { name: 'Wed', Revenue: 31000, Stores: 5 },
    { name: 'Thu', Revenue: 28000, Stores: 5 },
    { name: 'Fri', Revenue: 45000, Stores: 8 },
    { name: 'Sat', Revenue: 62000, Stores: 12 },
    { name: 'Sun', Revenue: 70000, Stores: 15 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Super Admin Platform</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Manage all merchants, subscriptions, and global settings.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* Global Broadcast */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-xl text-white">
          <div className="flex items-center space-x-2 mb-4">
            <Megaphone className="w-6 h-6" />
            <h2 className="text-xl font-bold">Global Broadcast</h2>
          </div>
          <p className="text-indigo-100 text-sm mb-4">This message will appear at the top of every merchant's dashboard.</p>
          <form onSubmit={handleAnnouncementSubmit} className="space-y-3">
            <textarea 
              name="message" 
              defaultValue={initialAnnouncement}
              placeholder="e.g. Platform maintenance scheduled at midnight..."
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none h-24"
            />
            <button disabled={loading} type="submit" className="w-full bg-white text-indigo-600 font-bold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50">
              Broadcast Message
            </button>
          </form>
        </div>

        {/* Platform Analytics Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900">Platform GMV (Last 7 Days)</h2>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Total Stores" 
          value={merchants.length.toString()} 
          icon={<Store className="w-6 h-6 text-blue-500" />}
          trend="All registered"
        />
        <StatCard 
          title="Pro Tier Stores" 
          value={merchants.filter(m => m.subscriptionTier === "Pro").length.toString()} 
          icon={<Star className="w-6 h-6 text-yellow-500" />}
          trend="Paying customers"
        />
        <StatCard 
          title="Total Products" 
          value={merchants.reduce((sum, m) => sum + m._count.products, 0).toString()} 
          icon={<Users className="w-6 h-6 text-purple-500" />}
          trend="Across all stores"
        />
        <StatCard 
          title="Estimated MRR" 
          value={`Rs. ${merchants.filter(m => m.subscriptionTier === "Pro").length * 5000}`} 
          icon={<CreditCard className="w-6 h-6 text-green-500" />}
          trend="Based on Rs.5000/Pro store"
        />
      </div>

      {/* Merchant Management Table */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Clients (Merchants)</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Store Info</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Status</th>
                <th className="p-4">Products</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {merchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
                        {merchant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{merchant.name}</div>
                        <div className="text-xs text-slate-500 flex items-center mt-0.5">
                          localhost:3000/{merchant.slug}
                          <a href={`/${merchant.slug}`} target="_blank" className="ml-1 text-indigo-500 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select 
                      value={merchant.subscriptionTier}
                      onChange={(e) => handleTierChange(merchant.id, e.target.value)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border-2 focus:outline-none ${
                        merchant.subscriptionTier === 'Pro' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <option value="Free">Free Tier</option>
                      <option value="Pro">Pro Tier</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      merchant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {merchant.isActive ? (
                         <><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> Paid / Active</>
                      ) : (
                         <><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span> Suspended</>
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700">{merchant._count.products}</td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleToggle(merchant.id, merchant.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          merchant.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={merchant.isActive ? 'Suspend Store' : 'Activate Store'}
                      >
                        {merchant.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(merchant.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete Store"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {merchants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No merchants found. Add your first client to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Merchant</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Store Name</label>
                  <input name="name" required type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Ali Biryani" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL Slug</label>
                  <input name="slug" required type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="ali-biryani" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp Phone</label>
                  <input name="phone" required type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="923001234567" />
                </div>
                <div className="pt-2 flex justify-end space-x-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold">Cancel</button>
                  <button type="submit" disabled={loading} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <TrendingUp className="w-4 h-4 text-slate-300" />
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{title}</h3>
        <div className="text-3xl font-black text-slate-900">{value}</div>
        <div className="text-xs text-slate-400 mt-2 font-medium">{trend}</div>
      </div>
      <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-150 transition-transform duration-500 pointer-events-none">
        {icon}
      </div>
    </motion.div>
  );
}
