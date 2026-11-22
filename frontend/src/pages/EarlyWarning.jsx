
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  MapPin,
  Clock3,
  Smartphone,
  Globe,
  X,
  ChevronRight,
  Info,
  BriefcaseBusiness,
} from "lucide-react";
import api from "../services/api";


const severityStyles = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/20",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const typeLabels = {
  GEO_VELOCITY: "Geo Velocity",
  NEW_DEVICE: "New Device",
  IP_CHANGE: "IP Change",
};

function StatCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const normalized = (severity || "MEDIUM").toUpperCase();

  return (
    <span
      className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
        severityStyles[normalized] || severityStyles.MEDIUM
      }`}
    >
      {normalized}
    </span>
  );
}

function AlertTypeIcon({ type }) {
  const normalized = (type || "").toUpperCase();

  if (normalized === "GEO_VELOCITY") return <MapPin size={16} />;
  if (normalized === "NEW_DEVICE") return <Smartphone size={16} />;
  if (normalized === "IP_CHANGE") return <Globe size={16} />;

  return <AlertTriangle size={16} />;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString();
}

export default function EarlyWarning() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const navigate = useNavigate();
  const [creatingCase, setCreatingCase] = useState(false);
  const [caseMessage, setCaseMessage] = useState("");
  const [caseError, setCaseError] = useState("");

  const fetchAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await api.get("/early-warning/alerts", {
        params: {
          limit: 200,
          offset: 0,
          severity:
            severityFilter === "all" ? undefined : severityFilter,
          alert_type: typeFilter === "all" ? undefined : typeFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });

      const result = response.data;
      const receivedAlerts = Array.isArray(result)
        ? result
        : result.alerts || result.data || [];

      setAlerts(receivedAlerts);
    } catch (err) {
      console.error("Early Warning API error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load Early Warning alerts. Check that the backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [severityFilter, typeFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      if (!query) return true;

      return [
        alert.alert_id,
        alert.transaction_id,
        alert.account_id,
        alert.alert_type,
        alert.severity,
        alert.reason,
        alert.event_city,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });
  }, [alerts, search]);

  const stats = useMemo(() => {
    const count = (severity) =>
      alerts.filter(
        (alert) => String(alert.severity).toUpperCase() === severity
      ).length;

    return {
      total: alerts.length,
      critical: count("CRITICAL"),
      high: count("HIGH"),
      medium: count("MEDIUM"),
    };
  }, [alerts]);

  const typeCounts = useMemo(() => {
    return Object.keys(typeLabels).map((type) => ({
      type,
      count: alerts.filter(
        (alert) => String(alert.alert_type).toUpperCase() === type
      ).length,
    }));
  }, [alerts]);

  const createInvestigation = async (alert) => {
  if (!alert?.alert_id) return;

  try {
    setCreatingCase(true);
    setCaseMessage("");
    setCaseError("");

    const response = await api.post(
      `/investigations/from-alert/${encodeURIComponent(alert.alert_id)}`
    );

    const createdCase = response.data.case;

    setCaseMessage(
      response.data.message || "Investigation case created successfully."
    );

    // Navigate after successful creation.
    setTimeout(() => {
      navigate("/investigations", {
        state: { selectedCaseId: createdCase.case_id }
      });
    }, 700);

  } catch (err) {
    setCaseError(
      err.response?.data?.detail || "Unable to create investigation."
    );
  } finally {
    setCreatingCase(false);
  }
};

  return (
    <div className="space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-violet-400" size={23} />
            <h1 className="text-2xl font-bold text-white">
              Early Warning System
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Detect unusual transaction patterns and emerging account risks.
          </p>
        </div>

        <button
          onClick={() => fetchAlerts(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#111827] px-4 py-2.5 text-sm text-slate-200 transition hover:border-violet-500/50 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh alerts
        </button>
      </div>

      {/* Data notice */}
      <div className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info className="mt-0.5 shrink-0 text-blue-400" size={18} />
        <div>
          <p className="text-sm font-medium text-blue-300">
            Controlled simulation data
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            These alerts are generated from simulated geographic, device and
            IP anomaly scenarios. They demonstrate detection capabilities and
            should not be interpreted as confirmed real-world fraud.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => fetchAlerts(true)}
            className="text-sm text-red-300 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Alerts"
          value={loading ? "—" : stats.total}
          description="Alerts returned by the API"
          icon={ShieldAlert}
          color="bg-violet-500/10 text-violet-400"
        />
        <StatCard
          title="Critical Alerts"
          value={loading ? "—" : stats.critical}
          description="Highest severity signals"
          icon={AlertTriangle}
          color="bg-red-500/10 text-red-400"
        />
        <StatCard
          title="High Alerts"
          value={loading ? "—" : stats.high}
          description="Elevated-risk signals"
          icon={Activity}
          color="bg-orange-500/10 text-orange-400"
        />
        <StatCard
          title="Medium Alerts"
          value={loading ? "—" : stats.medium}
          description="Signals requiring attention"
          icon={ShieldCheck}
          color="bg-amber-500/10 text-amber-400"
        />
      </div>

      {/* Alert type distribution */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
        <h2 className="font-semibold text-white">Detection Breakdown</h2>
        <p className="mt-1 text-xs text-slate-500">
          Distribution of detected anomaly types in the returned alerts
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {typeCounts.map((item) => {
            const percentage = stats.total
              ? (item.count / stats.total) * 100
              : 0;

            return (
              <div
                key={item.type}
                className="rounded-lg border border-slate-800 bg-[#0b1220] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-violet-400">
                      <AlertTypeIcon type={item.type} />
                    </span>
                    {typeLabels[item.type]}
                  </div>
                  <span className="font-semibold text-white">
                    {loading ? "—" : item.count}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {percentage.toFixed(1)}% of returned alerts
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111827]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 xl:flex-row xl:items-center">
          <div>
            <h2 className="font-semibold text-white">Detected Alerts</h2>
            <p className="mt-1 text-xs text-slate-500">
              Review and inspect suspicious account activity
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alerts..."
                className="w-full rounded-lg border border-slate-700 bg-[#0b1220] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500 sm:w-48"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500"
            >
              <option value="all">All severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500"
            >
              <option value="all">All types</option>
              <option value="GEO_VELOCITY">Geo Velocity</option>
              <option value="NEW_DEVICE">New Device</option>
              <option value="IP_CHANGE">IP Change</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500"
            >
              <option value="all">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#0b1220] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Alert ID</th>
                <th className="px-5 py-4 font-medium">Detection</th>
                <th className="px-5 py-4 font-medium">Account</th>
                <th className="px-5 py-4 font-medium">Location</th>
                <th className="px-5 py-4 font-medium">Severity</th>
                <th className="px-5 py-4 font-medium">Risk Score</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    Loading alerts...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    No alerts match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, index) => (
                  <tr
                    key={alert.alert_id || index}
                    onClick={() => setSelectedAlert(alert)}
                    className="cursor-pointer transition hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-violet-300">
                      {alert.alert_id || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-200">
                        <span className="text-violet-400">
                          <AlertTypeIcon type={alert.alert_type} />
                        </span>
                        {typeLabels[alert.alert_type] || alert.alert_type}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {alert.account_id || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {alert.event_city || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="px-5 py-4 font-medium text-white">
                      {alert.risk_score ?? "—"}
                      {alert.risk_score != null ? "%" : ""}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-xs text-slate-300">
                        {alert.status || "OPEN"}
                      </span>
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
          Showing {filteredAlerts.length} of {alerts.length} returned alerts
        </div>
      </div>

      {/* Alert detail panel */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-slate-800 bg-[#0d1422] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <p className="text-xs text-slate-500">Alert details</p>
                <h2 className="mt-1 font-semibold text-white">
                  {selectedAlert.alert_id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-5">
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <div className="flex items-center gap-2">
                        <BriefcaseBusiness size={18} className="text-violet-400" />
                        <h3 className="font-semibold text-white">
                        Investigation
                        </h3>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                        Create an investigation case for this alert and assign it
                        for analyst review.
                    </p>

                    <button
                        onClick={() => createInvestigation(selectedAlert)}
                        disabled={creatingCase}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                        <BriefcaseBusiness size={16} />
                        {creatingCase ? "Creating case..." : "Create Investigation"}
                    </button>

                    {caseMessage && (
                        <p className="mt-3 text-xs text-emerald-400">
                        {caseMessage}
                        </p>
                    )}

                    {caseError && (
                        <p className="mt-3 text-xs text-red-400">
                        {caseError}
                        </p>
                    )}
                </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Severity</span>
                <SeverityBadge severity={selectedAlert.severity} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Detection type</span>
                <span className="text-sm text-white">
                  {typeLabels[selectedAlert.alert_type] ||
                    selectedAlert.alert_type}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Risk score</span>
                <span className="text-lg font-semibold text-white">
                  {selectedAlert.risk_score ?? "—"}
                  {selectedAlert.risk_score != null ? "%" : ""}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Status</span>
                <span className="text-sm text-white">
                  {selectedAlert.status || "OPEN"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Detection reason
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {selectedAlert.reason || "No reason provided."}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Transaction and account
                </h3>
                {[
                  ["Transaction ID", selectedAlert.transaction_id],
                  ["Account ID", selectedAlert.account_id],
                  ["Location", selectedAlert.event_city],
                  ["Simulation step", selectedAlert.step],
                  ["Created at", formatDate(selectedAlert.created_at)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-slate-800 pb-3"
                  >
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="break-all text-right text-sm text-slate-300">
                      {value ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <p className="text-xs leading-relaxed text-blue-300">
                  This alert belongs to a controlled simulated scenario.
                  Its detection signal is not proof of financial fraud.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
