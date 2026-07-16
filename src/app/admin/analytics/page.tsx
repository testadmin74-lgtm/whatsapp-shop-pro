import { BarChart3, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-slate-500 mt-1">Platform growth and merchant statistics.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Detailed Analytics Coming Soon</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          We are currently gathering data to generate comprehensive growth charts, revenue models, and merchant performance metrics.
        </p>
      </div>
    </div>
  );
}
