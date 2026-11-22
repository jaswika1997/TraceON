
import {
  LayoutDashboard,
  ArrowLeftRight,
  Network,
  Activity,
  BriefcaseBusiness,
  FlaskConical,
  FileText,
  ShieldCheck,
  ScanSearch,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Overview", path: "/", icon: LayoutDashboard },
  { name: "Transactions", path: "/transactions", icon: ArrowLeftRight },
  { name: "Fraud Intelligence", path: "/intelligence", icon: Network },
  { name: "Early Warning", path: "/early-warning", icon: Activity },
  { name: "Live Evaluation", path: "/live-evaluation", icon: ScanSearch },
  { name: "Investigations", path: "/investigations", icon: BriefcaseBusiness },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-white/[0.07] bg-[#0c1020]">
      <div className="flex h-20 items-center gap-3 border-b border-white/[0.07] px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20">
          <ShieldCheck size={23} className="text-white" />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">
            TraceON
          </h1>
          <p className="text-[10px] tracking-[2px] text-slate-500">
            FRAUD INTELLIGENCE
          </p>
        </div>
      </div>

      <div className="px-4 pt-7">
        <p className="mb-3 px-3 text-[10px] font-semibold tracking-[2px] text-slate-500">
          WORKSPACE
        </p>

        <nav className="space-y-1">
          {navigation.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${
                  isActive
                    ? "border border-violet-500/20 bg-violet-500/10 text-violet-300"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/[0.07] p-4">
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.05] p-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-xs font-medium text-emerald-400">
              Intelligence Engine
            </span>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Platform interface initialized
          </p>
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-600">
          TRACEON • HACKATHON BUILD
        </p>
      </div>
    </aside>
  );
}
