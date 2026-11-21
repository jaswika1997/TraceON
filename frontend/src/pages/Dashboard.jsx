
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(value);

const formatAmount = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/analytics/summary");

      if (!response.data.available) {
        throw new Error("Analytics data is not available.");
      }

      setAnalytics(response.data.analytics);
    } catch (err) {
      console.error("Analytics error:", err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-slate-300">
        <Activity className="mb-3 animate-pulse" />
        Loading TraceON analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Transactions",
      value: formatNumber(analytics.total_transactions),
      description: "Full PaySim dataset",
      icon: Activity,
      color: "text-cyan-400",
    },
    {
      title: "Fraud Transactions",
      value: formatNumber(analytics.fraud_transactions),
      description: "Fraud-labelled records",
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      title: "Legitimate Transactions",
      value: formatNumber(analytics.legitimate_transactions),
      description: "Legitimate-labelled records",
      icon: ShieldCheck,
      color: "text-emerald-400",
    },
    {
      title: "Fraud Rate",
      value: `${analytics.fraud_rate}%`,
      description: "Percentage of all transactions",
      icon: Wallet,
      color: "text-violet-400",
    },
  ];

  const transactionTypeData = Object.entries(
    analytics.transaction_types
  ).map(([name, value]) => ({
    name,
    transactions: value,
  }));

  const fraudData = [
    {
      name: "Fraud",
      value: analytics.fraud_transactions,
    },
    {
      name: "Legitimate",
      value: analytics.legitimate_transactions,
    },
  ];

  return (
    <div className="space-y-8 p-6 text-white">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Overview
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Financial fraud intelligence and transaction analytics
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Refresh data
        </button>
      </div>

      {/* Dataset status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div>
          <p className="font-medium text-emerald-400">
            Dataset successfully connected
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Source: {analytics.source}
          </p>
        </div>

        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          Live API data
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.title}
              className="rounded-xl border border-slate-800 bg-[#111827] p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {metric.title}
                </p>
                <Icon className={metric.color} size={21} />
              </div>

              <h2 className="mt-4 text-2xl font-bold">
                {metric.value}
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Additional statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <p className="text-sm text-slate-400">
            Total Transaction Amount
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            {formatAmount(analytics.total_transaction_amount)}
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Sum of transaction amounts in PaySim
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <p className="text-sm text-slate-400">
            Average Transaction Amount
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            {formatAmount(analytics.average_transaction_amount)}
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Largest transaction:{" "}
            {formatAmount(analytics.largest_transaction_amount)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Transaction type chart */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="text-lg font-semibold">
            Transaction Type Distribution
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Number of transactions by type
          </p>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionTypeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#263244"
                />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(value) =>
                    `${(value / 1000000).toFixed(1)}M`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [
                    formatNumber(value),
                    "Transactions",
                  ]}
                />
                <Bar
                  dataKey="transactions"
                  fill="#8b5cf6"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud distribution */}
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
          <h2 className="text-lg font-semibold">
            Fraud Distribution
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Ground-truth labels in the PaySim dataset
          </p>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                </Pie>

                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatNumber(value)}
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Important note */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-sm font-medium text-amber-400">
          Dataset analytics — not model predictions
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Fraud statistics are calculated from the existing isFraud
          labels in PaySim. TraceON's machine learning model has not
          yet generated these predictions.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
