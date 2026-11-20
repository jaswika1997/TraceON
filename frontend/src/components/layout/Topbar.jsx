
import { Search, Bell, ChevronDown, Command } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/[0.07] bg-[#080b14]/90 px-8 backdrop-blur-xl">
      <div>
        <p className="text-xs text-slate-500">Workspace / Overview</p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          Fraud Intelligence Overview
        </h2>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 md:flex">
          <Search size={16} className="text-slate-500" />
          <input
            placeholder="Search anything..."
            className="w-40 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
          />
          <Command size={13} className="text-slate-600" />
          <span className="text-[10px] text-slate-600">K</span>
        </div>

        <button className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 hover:bg-white/5 hover:text-white">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>

        <div className="flex items-center gap-3 border-l border-white/10 pl-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-sm font-bold text-white">
            T
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white">TraceON Analyst</p>
            <p className="text-[10px] text-slate-500">Administrator</p>
          </div>
          <ChevronDown size={15} className="text-slate-500" />
        </div>
      </div>
    </header>
  );
}
