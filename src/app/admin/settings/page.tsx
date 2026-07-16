import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Admin Settings</h1>
        <p className="text-slate-500 mt-1">Manage your platform configuration.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-2xl">
        <h2 className="font-bold text-slate-900 mb-4">Platform Configuration</h2>
        
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Platform Name</label>
            <input defaultValue="WhatsApp Micro-Store Platform" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Admin Email</label>
            <input defaultValue="admin@app.com" type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
          </div>
          <button type="button" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700">
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
