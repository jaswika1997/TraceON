
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  BriefcaseBusiness,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  ShieldAlert,
  X,
  ChevronRight,
  UserRound,
  MessageSquare,
  Save,
} from "lucide-react";
import api from "../services/api";
import { useLocation } from "react-router-dom";

const STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED", "ESCALATED"];

const severityStyles = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/20",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const statusStyles = {
  OPEN: "bg-blue-500/10 text-blue-400",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-400",
  RESOLVED: "bg-emerald-500/10 text-emerald-400",
  ESCALATED: "bg-red-500/10 text-red-400",
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const value = (severity || "MEDIUM").toUpperCase();

  return (
    <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
      severityStyles[value] || severityStyles.MEDIUM
    }`}>
      {value}
    </span>
  );
}

function StatusBadge({ status }) {
  const value = (status || "OPEN").toUpperCase();

  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
      statusStyles[value] || statusStyles.OPEN
    }`}>
      {value.replace("_", " ")}
    </span>
  );
}

export default function Investigations() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCase, setSelectedCase] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [newStatus, setNewStatus] = useState("OPEN");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const location = useLocation();

  const fetchCases = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await api.get("/investigations");
      const data = response.data;

      setCases(Array.isArray(data) ? data : data.cases || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load investigation cases."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const selectedCaseId = location.state?.selectedCaseId;

    if (selectedCaseId && cases.length > 0) {
        const matchingCase = cases.find(
        item => item.case_id === selectedCaseId
        );

        if (matchingCase) {
        openCase(matchingCase);
        window.history.replaceState({}, document.title);
        }
    }
    }, [location.state, cases]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const stats = useMemo(() => ({
    total: cases.length,
    open: cases.filter(c => c.status === "OPEN").length,
    review: cases.filter(c => c.status === "UNDER_REVIEW").length,
    resolved: cases.filter(c => c.status === "RESOLVED").length,
    escalated: cases.filter(c => c.status === "ESCALATED").length,
  }), [cases]);

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      const matchesSearch = !query || [
        item.case_id,
        item.alert_id,
        item.transaction_id,
        item.account_id,
        item.alert_type,
        item.assigned_to,
      ].some(value =>
        String(value ?? "").toLowerCase().includes(query)
      );

      return matchesStatus && matchesSearch;
    });
  }, [cases, search, statusFilter]);

  const openCase = (item) => {
    setSelectedCase(item);
    setAssignedTo(item.assigned_to || "");
    setNewStatus(item.status || "OPEN");
    setNote("");
    setActionMessage("");
  };

  const saveChanges = async () => {
    if (!selectedCase) return;

    try {
      setSaving(true);
      setActionMessage("");

      const payload = {
        status: newStatus,
        assigned_to: assignedTo.trim() || null,
      };

      if (note.trim()) {
        payload.note = note.trim();
      }

      const response = await api.patch(
        `/investigations/${selectedCase.case_id}`,
        payload
      );

      const updatedCase = response.data.case;

      setCases(previous =>
        previous.map(item =>
          item.case_id === updatedCase.case_id ? updatedCase : item
        )
      );

      setSelectedCase(updatedCase);
      setAssignedTo(updatedCase.assigned_to || "");
      setNewStatus(updatedCase.status);
      setNote("");
      setActionMessage("Investigation updated successfully.");
    } catch (err) {
      setActionMessage(
        err.response?.data?.detail || "Unable to update investigation."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BriefcaseBusiness size={23} className="text-violet-400" />
            <h1 className="text-2xl font-bold text-white">
              Investigation Center
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Manage fraud alerts, investigate suspicious accounts and track case outcomes.
          </p>
        </div>

        <button
          onClick={() => fetchCases(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#111827] px-4 py-2.5 text-sm hover:border-violet-500/50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh cases
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
          <button onClick={() => fetchCases(true)} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Cases"
          value={loading ? "—" : stats.total}
          icon={BriefcaseBusiness}
          color="bg-violet-500/10 text-violet-400"
        />
        <StatCard
          title="Open"
          value={loading ? "—" : stats.open}
          icon={ShieldAlert}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          title="Under Review"
          value={loading ? "—" : stats.review}
          icon={Clock3}
          color="bg-amber-500/10 text-amber-400"
        />
        <StatCard
          title="Resolved"
          value={loading ? "—" : stats.resolved}
          icon={CheckCircle2}
          color="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          title="Escalated"
          value={loading ? "—" : stats.escalated}
          icon={AlertTriangle}
          color="bg-red-500/10 text-red-400"
        />
      </div>

      {/* Cases table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111827]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 xl:flex-row xl:items-center">
          <div>
            <h2 className="font-semibold text-white">Investigation Cases</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a case to view details and manage its progress
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="w-full rounded-lg border border-slate-700 bg-[#0b1220] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-violet-500 sm:w-52"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500"
            >
              <option value="ALL">All statuses</option>
              {STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#0b1220] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Case ID</th>
                <th className="px-5 py-4 font-medium">Alert Type</th>
                <th className="px-5 py-4 font-medium">Account</th>
                <th className="px-5 py-4 font-medium">Severity</th>
                <th className="px-5 py-4 font-medium">Risk Score</th>
                <th className="px-5 py-4 font-medium">Assigned To</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    Loading investigation cases...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    No investigation cases found. Create a case from an Early Warning alert first.
                  </td>
                </tr>
              ) : (
                filteredCases.map(item => (
                  <tr
                    key={item.case_id}
                    onClick={() => openCase(item)}
                    className="cursor-pointer transition hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-violet-300">
                      {item.case_id}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {(item.alert_type || "—").replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {item.account_id || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <SeverityBadge severity={item.severity} />
                    </td>
                    <td className="px-5 py-4 font-medium text-white">
                      {item.risk_score ?? "—"}
                      {item.risk_score != null ? "%" : ""}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {item.assigned_to || "Unassigned"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      <ChevronRight size={17} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
          Showing {filteredCases.length} of {cases.length} cases
        </div>
      </div>

      {/* Case details drawer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <div className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-[#0d1422] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <p className="text-xs text-slate-500">Investigation details</p>
                <h2 className="mt-1 font-semibold text-white">
                  {selectedCase.case_id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={selectedCase.severity} />
                <StatusBadge status={selectedCase.status} />
              </div>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Alert information
                </h3>
                <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
                  <p className="text-xs text-slate-500">Detection reason</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {selectedCase.reason || "No detection reason available."}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Transaction and account
                </h3>
                <div className="space-y-3">
                  {[
                    ["Alert ID", selectedCase.alert_id],
                    ["Transaction ID", selectedCase.transaction_id],
                    ["Account ID", selectedCase.account_id],
                    ["Alert type", selectedCase.alert_type],
                    ["Location", selectedCase.event_city],
                    ["Risk score", selectedCase.risk_score != null ? `${selectedCase.risk_score}%` : null],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-slate-800 pb-3">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="break-all text-right text-sm text-slate-300">
                        {value ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <UserRound size={16} className="text-violet-400" />
                  Analyst assignment and status
                </h3>

                <div className="space-y-3 rounded-xl border border-slate-800 bg-[#111827] p-4">
                  <label className="block text-xs text-slate-400">
                    Assigned analyst
                  </label>
                  <input
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    placeholder="Enter analyst name"
                    className="w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  />

                  <label className="block pt-2 text-xs text-slate-400">
                    Investigation status
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                    <MessageSquare size={14} />
                    Add investigation note
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                    placeholder="Write your investigation findings..."
                    className="w-full resize-none rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
                  />

                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save changes"}
                  </button>

                  {actionMessage && (
                    <p className={`text-xs ${
                      actionMessage.includes("successfully")
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}>
                      {actionMessage}
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-white">
                  Investigation notes
                </h3>

                {selectedCase.notes?.length ? (
                  <div className="space-y-3">
                    {selectedCase.notes.map((item, index) => (
                      <div key={index} className="rounded-lg border border-slate-800 bg-[#111827] p-3">
                        <p className="text-sm text-slate-300">{item.note}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No investigation notes yet.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
