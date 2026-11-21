import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ShieldAlert,
  Activity,
  Filter,
  X,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import api from "../services/api";

const riskStyles = {
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon size={19} className={color} />
      </div>

      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [risk, setRisk] = useState("all");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");

  const limit = 20;

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/transactions", {
        params: {
          limit,
          offset,
          risk,
        },
      });

      setTransactions(response.data.transactions || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load transactions. Check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [offset, risk]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openTransactionDetails = async (transaction) => {
    setSelectedTransaction(transaction);
    setExplanation(null);
    setExplanationError("");
    setExplanationLoading(true);

    try {
      const response = await api.get(
        `/transactions/${transaction.transaction_id}/explanation`
      );

      setExplanation(response.data.explanation);
    } catch (err) {
      setExplanationError(
        err.response?.data?.detail || "Unable to load explanation."
      );
    } finally {
      setExplanationLoading(false);
    }
  };

  const closeTransactionDetails = () => {
    setSelectedTransaction(null);
    setExplanation(null);
    setExplanationError("");
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const query = search.toLowerCase();

    return (
      String(transaction.transaction_id).includes(query) ||
      transaction.transaction_type.toLowerCase().includes(query) ||
      transaction.risk_level.toLowerCase().includes(query)
    );
  });

  const criticalCount = transactions.filter(
    (transaction) => transaction.risk_level === "Critical"
  ).length;

  const reviewCount = transactions.filter(
    (transaction) => transaction.recommendation === "Review"
  ).length;

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="space-y-7 text-white">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-cyan-400">
            MONITORING / TRANSACTIONS
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Transaction Monitor
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Analyze transactions and identify potentially fraudulent activity.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#111827] px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* DATASET NOTICE */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-200">
        <Activity size={16} className="mr-2 inline" />
        Historical PaySim dataset · Model-generated risk predictions · Not live banking transactions
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Transactions Loaded"
          value={transactions.length}
          icon={Activity}
          color="text-cyan-400"
        />

        <StatCard
          label="Critical Risk"
          value={criticalCount}
          icon={ShieldAlert}
          color="text-red-400"
        />

        <StatCard
          label="Require Review"
          value={reviewCount}
          icon={Filter}
          color="text-orange-400"
        />

        <StatCard
          label="Current Page"
          value={Math.floor(offset / limit) + 1}
          icon={ArrowUpRight}
          color="text-violet-400"
        />
      </div>

      {/* TRANSACTION TABLE */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Transaction Records
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Review model predictions and transaction risk levels.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* SEARCH */}
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#080b14] px-3">
              <Search size={17} className="text-slate-500" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-500 sm:w-52"
              />
            </div>

            {/* RISK FILTER */}
            <select
              value={risk}
              onChange={(e) => {
                setRisk(e.target.value);
                setOffset(0);
              }}
              className="rounded-lg border border-white/10 bg-[#080b14] px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="all">All risk levels</option>
              <option value="low">Low risk</option>
              <option value="medium">Medium risk</option>
              <option value="high">High risk</option>
              <option value="critical">Critical risk</option>
            </select>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* TABLE */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">

            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-4">Transaction ID</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Risk Score</th>
                <th className="px-4 py-4">Risk Level</th>
                <th className="px-4 py-4">Recommendation</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-12 text-center text-slate-400"
                  >
                    Loading transaction data...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-12 text-center text-slate-400"
                  >
                    No matching transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.transaction_id}
                    onClick={() => openTransactionDetails(transaction)}
                    className="cursor-pointer border-b border-white/5 transition hover:bg-violet-500/[0.06]"
                  >
                    <td className="px-4 py-4 font-medium text-cyan-300">
                      TXN-{transaction.transaction_id}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {transaction.transaction_type}
                    </td>

                    <td className="px-4 py-4 text-slate-200">
                      {formatAmount(transaction.amount)}
                    </td>

                    <td className="px-4 py-4 font-medium">
                      {transaction.risk_score.toFixed(2)}%
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          riskStyles[transaction.risk_level]
                        }`}
                      >
                        {transaction.risk_level}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {transaction.recommendation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-xs text-slate-500">
            Showing {filteredTransactions.length} matching records
          </p>

          <div className="flex gap-2">
            <button
              disabled={offset === 0 || loading}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              disabled={transactions.length < limit || loading}
              onClick={() => setOffset(offset + limit)}
              className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* TRANSACTION INVESTIGATION PANEL */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60"
          onClick={closeTransactionDetails}
        >
          <div
            className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#0d1320] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* PANEL HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-wider text-violet-400">
                  TRANSACTION INVESTIGATION
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  TXN-{selectedTransaction.transaction_id}
                </h2>
              </div>

              <button
                onClick={closeTransactionDetails}
                className="rounded-lg border border-white/10 p-2 hover:bg-white/10"
              >
                <X size={19} />
              </button>
            </div>

            {/* TRANSACTION DETAILS */}
            <div className="mt-6 grid grid-cols-2 gap-3">

              <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
                <p className="text-xs text-slate-500">
                  Transaction Amount
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {formatAmount(selectedTransaction.amount)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
                <p className="text-xs text-slate-500">
                  Transaction Type
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {selectedTransaction.transaction_type}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
                <p className="text-xs text-slate-500">
                  Fraud Risk Score
                </p>

                <p className="mt-2 text-2xl font-bold text-cyan-400">
                  {selectedTransaction.risk_score.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
                <p className="text-xs text-slate-500">
                  Risk Classification
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {selectedTransaction.risk_level}
                </p>
              </div>
            </div>

            {/* RECOMMENDATION */}
            <div className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
              <p className="text-sm text-slate-400">
                Model Recommendation
              </p>

              <p className="mt-2 text-lg font-semibold">
                {selectedTransaction.recommendation}
              </p>
            </div>

            {/* SHAP EXPLANATION */}
            <div className="mt-7">

              <div className="flex items-center gap-2">
                <BrainCircuit className="text-violet-400" size={20} />

                <h3 className="text-lg font-semibold">
                  AI Decision Explanation
                </h3>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Top model factors influencing this prediction.
              </p>

              {explanationLoading && (
                <p className="mt-6 text-sm text-slate-400">
                  Generating SHAP explanation...
                </p>
              )}

              {explanationError && (
                <p className="mt-6 text-sm text-red-400">
                  {explanationError}
                </p>
              )}

              {explanation && (
                <div className="mt-5 space-y-3">
                  {explanation.top_factors.map((factor) => (
                    <div
                      key={factor.feature}
                      className="rounded-xl border border-white/10 bg-[#111827] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium capitalize text-slate-200">
                          {factor.feature.replaceAll("_", " ")}
                        </p>

                        {factor.contribution > 0 ? (
                          <TrendingUp
                            size={18}
                            className="text-red-400"
                          />
                        ) : (
                          <TrendingDown
                            size={18}
                            className="text-emerald-400"
                          />
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Value:{" "}
                          {Number(factor.value).toLocaleString("en-IN")}
                        </span>

                        <span
                          className={
                            factor.contribution > 0
                              ? "text-red-400"
                              : "text-emerald-400"
                          }
                        >
                          {factor.contribution > 0 ? "+" : ""}
                          {factor.contribution.toFixed(4)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {factor.impact}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXPLANATION DISCLAIMER */}
            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              SHAP contributions describe how model features influence its
              prediction. They do not establish causation or prove fraudulent
              activity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}