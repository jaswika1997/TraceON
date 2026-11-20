
import {
  ShieldAlert,
  ArrowLeftRight,
  CircleDollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

const stats = [
  {
    title: "Transactions Analyzed",
    value: "24,891",
    change: "+12.8%",
    positive: true,
    icon: ArrowLeftRight,
    color: "violet",
  },
  {
    title: "Fraud Detected",
    value: "1,284",
    change: "+8.2%",
    positive: false,
    icon: ShieldAlert,
    color: "rose",
  },
  {
    title: "Amount at Risk",
    value: "₹48.2L",
    change: "-4.6%",
    positive: true,
    icon: CircleDollarSign,
    color: "amber",
  },
  {
    title: "Detection Accuracy",
    value: "96.8%",
    change: "+2.4%",
    positive: true,
    icon: Activity,
    color: "emerald",
  },
];

const transactions = [
  { id: "TXN-90281", account: "ACC-8821", amount: "₹84,500", risk: "Critical", location: "Mumbai, IN", time: "2 min ago" },
  { id: "TXN-90280", account: "ACC-1942", amount: "₹42,000", risk: "High", location: "Delhi, IN", time: "5 min ago" },
  { id: "TXN-90279", account: "ACC-6610", amount: "₹12,800", risk: "Medium", location: "Bengaluru, IN", time: "8 min ago" },
  { id: "TXN-90278", account: "ACC-3318", amount: "₹2,400", risk: "Low", location: "Pune, IN", time: "12 min ago" },
];

const riskStyles = {
  Critical: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function StatCard({ item }) {
  const Icon = item.icon;

  const iconStyles = {
    violet: "bg-violet-500/10 text-violet-400",
    rose: "bg-rose-500/10 text-rose-400",
    amber: "bg-amber-500/10 text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#101626] p-5 transition hover:border-violet-500/30">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{item.title}</p>
        <div className={`rounded-xl p-2.5 ${iconStyles[item.color]}`}>
          <Icon size={19} />
        </div>
      </div>

      <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">
        {item.value}
      </h3>

      <div className="mt-3 flex items-center gap-2">
        {item.positive ? (
          <ArrowUpRight size={15} className="text-emerald-400" />
        ) : (
          <ArrowDownRight size={15} className="text-rose-400" />
        )}
        <span className={`text-xs font-medium ${item.positive ? "text-emerald-400" : "text-rose-400"}`}>
          {item.change}
        </span>
        <span className="text-xs text-slate-600">vs previous period</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
              System overview
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Welcome to TraceON
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor transactions, identify threats and investigate suspicious activity.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-400">
          Demo dashboard · Sample data
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.07] bg-[#101626] p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Fraud Activity</h3>
              <p className="mt-1 text-xs text-slate-500">
                Illustrative transaction risk distribution
              </p>
            </div>
            <button className="rounded-lg p-2 text-slate-500 hover:bg-white/5">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="mt-8 flex h-48 items-end gap-3">
            {[35, 52, 42, 72, 48, 85, 60, 44, 68, 92, 55, 76].map((height, i) => (
              <div key={i} className="group flex h-full flex-1 flex-col justify-end">
                <div
                  style={{ height: `${height}%` }}
                  className="w-full rounded-t-md bg-gradient-to-t from-violet-700 to-cyan-400 opacity-80 transition group-hover:opacity-100"
                />
                <span className="mt-3 text-center text-[10px] text-slate-600">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-5 border-t border-white/[0.07] pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Transaction activity
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Risk intensity
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#101626] p-5">
          <h3 className="font-semibold text-white">Risk Distribution</h3>
          <p className="mt-1 text-xs text-slate-500">Sample flagged transactions</p>

          <div className="mt-8 flex items-center justify-center">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{ background: "conic-gradient(#f43f5e 0% 18%, #f97316 18% 43%, #f59e0b 43% 68%, #10b981 68% 100%)" }}>
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#101626]">
                <span className="text-2xl font-bold text-white">100%</span>
                <span className="text-[10px] text-slate-500">Sample data</span>
              </div>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            {[
              ["Critical", "18%", "bg-rose-500"],
              ["High", "25%", "bg-orange-500"],
              ["Medium", "25%", "bg-amber-500"],
              ["Low", "32%", "bg-emerald-500"],
            ].map(([name, value, color]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  {name}
                </div>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101626]">
        <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
          <div>
            <h3 className="font-semibold text-white">Recent Suspicious Transactions</h3>
            <p className="mt-1 text-xs text-slate-500">Illustrative records for UI development</p>
          </div>
          <button className="text-xs font-medium text-violet-400 hover:text-violet-300">
            View all
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Transaction ID</th>
                <th className="px-5 py-4 font-medium">Account</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Risk level</th>
                <th className="px-5 py-4 font-medium">Location</th>
                <th className="px-5 py-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-t border-white/[0.05] transition hover:bg-white/[0.02]">
                  <td className="px-5 py-4 font-medium text-violet-300">{txn.id}</td>
                  <td className="px-5 py-4 text-slate-400">{txn.account}</td>
                  <td className="px-5 py-4 font-medium text-white">{txn.amount}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${riskStyles[txn.risk]}`}>
                      {txn.risk}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{txn.location}</td>
                  <td className="px-5 py-4 text-slate-500">{txn.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/10 bg-rose-500/[0.04] p-4">
          <AlertTriangle className="text-rose-400" size={20} />
          <div>
            <p className="text-sm font-semibold text-white">Critical alerts</p>
            <p className="text-xs text-slate-500">Demo alert indicator</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-4">
          <Clock3 className="text-amber-400" size={20} />
          <div>
            <p className="text-sm font-semibold text-white">Pending reviews</p>
            <p className="text-xs text-slate-500">Demo review indicator</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
          <CheckCircle2 className="text-emerald-400" size={20} />
          <div>
            <p className="text-sm font-semibold text-white">Platform status</p>
            <p className="text-xs text-slate-500">Frontend running locally</p>
          </div>
        </div>
      </div>
    </div>
  );
}
