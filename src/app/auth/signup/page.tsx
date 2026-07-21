"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupMerchant } from "@/lib/actions";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits");
      setLoading(false);
      return;
    }

    const res = await signupMerchant(name, phone, pin);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/merchant");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h1 className="text-2xl font-black text-slate-900 mb-2 text-center">Create Store 🏪</h1>
        <p className="text-sm text-slate-500 mb-8 text-center">Start selling on WhatsApp in 2 minutes!</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="e.g. Ali Biryani"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone Number</label>
            <input 
              type="text" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="e.g. 03001234567"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Create 4-Digit PIN</label>
            <input 
              type="password" 
              required
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-widest text-lg font-black" 
              placeholder="••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 mt-4"
          >
            {loading ? "Creating Store..." : "Create My Store"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 font-medium">
          Already have a store? <a href="/auth/login" className="text-indigo-600 font-bold hover:underline">Log in</a>
        </div>
      </div>
    </div>
  );
}
