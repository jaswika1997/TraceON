import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Intelligence from "./pages/Intelligence";

const pages = {
  "/early-warning": "Early Warning System",
  "/investigations": "Investigation Center",
  "/sandbox": "Fraud Sandbox",
  "/reports": "Investigation Reports",
};

function Placeholder({ title }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
        <span className="text-3xl text-violet-400">✦</span>
      </div>

      <h1 className="text-2xl font-bold text-white">{title}</h1>

      <p className="mt-2 text-sm text-slate-500">
        This module is under development.
      </p>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#080b14]">
      <Sidebar />

      <div className="ml-64 min-h-screen">
        <Topbar />

        <main className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/transactions" element={<Transactions />} />

            <Route path="/intelligence" element={<Intelligence />} />

            {Object.entries(pages).map(([path, title]) => (
              <Route
                key={path}
                path={path}
                element={<Placeholder title={title} />}
              />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}