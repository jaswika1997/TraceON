import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  AlertTriangle,
  Activity,
  Network,
  Users,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  X,
  GitBranch,
} from "lucide-react";

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";

import api from "../services/api";

// ------------------------------------------
// CUSTOM ACCOUNT NODE
// ------------------------------------------

function AccountNode({ data, selected }) {
  const suspicious = data.suspicious;

  return (
    <div
      className={`min-w-[145px] rounded-xl border px-4 py-3 shadow-xl transition-all ${
        suspicious
            ? "border-red-500/60 bg-[#321923] shadow-red-950/40"
            : "border-blue-500/40 bg-[#14243b] shadow-blue-950/40"
        } ${
        selected
            ? "ring-2 ring-violet-400"
            : data.isNeighbour
            ? "ring-2 ring-blue-400/70"
            : ""
        } ${data.dimmed ? "opacity-20" : "opacity-100"}`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            suspicious ? "bg-red-400" : "bg-blue-400"
          }`}
        />

        <span className="text-xs font-semibold text-white">
          {suspicious ? "Suspicious" : "Connected Account"}
        </span>
      </div>

      <p className="mt-2 max-w-[145px] truncate text-xs text-slate-300">
        {data.label}
      </p>

      {suspicious && (
        <p className="mt-1 text-[10px] text-red-300">
          {data.fraud_transactions} fraud-linked transactions
        </p>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  account: AccountNode,
};

// ------------------------------------------
// FORCE-DIRECTED GRAPH LAYOUT
// ------------------------------------------

function arrangeNodes(nodes, edges) {
  const layoutNodes = nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / Math.max(nodes.length, 1);

    return {
      ...node,
      x: 650 + 250 * Math.cos(angle),
      y: 430 + 250 * Math.sin(angle),
    };
  });

  const layoutLinks = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  const simulation = forceSimulation(layoutNodes)
    .force(
      "link",
      forceLink(layoutLinks)
        .id((node) => node.id)
        .distance(180)
        .strength(0.5)
    )
    .force("charge", forceManyBody().strength(-500))
    .force("center", forceCenter(650, 430))
    .force("collision", forceCollide(110))
    .stop();

  simulation.tick(300);

  return layoutNodes.map((node) => ({
    ...node,
    position: {
      x: node.x - 90,
      y: node.y - 45,
    },
    type: "account",
  }));
}

// ------------------------------------------
// STATISTICS CARD
// ------------------------------------------

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#101626] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>

          <h2 className="mt-3 text-2xl font-bold text-white">
            {Number(value ?? 0).toLocaleString("en-IN")}
          </h2>

          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------
// MAIN INTELLIGENCE PAGE
// ------------------------------------------

export default function Intelligence() {
  const [statistics, setStatistics] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  // ----------------------------------------
  // LOAD DATA FROM BACKEND
  // ----------------------------------------

  const loadIntelligence = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewResponse, networkResponse] = await Promise.all([
        api.get("/intelligence/overview"),

        api.get("/intelligence/network", {
          params: { limit: 100 },
        }),
      ]);

      const overview = overviewResponse.data;
      const network = networkResponse.data;

      setStatistics(overview.statistics ?? {});

      const rawNodes = network.nodes ?? [];
      const rawEdges = network.edges ?? [];

      // Format nodes

      const formattedNodes = rawNodes.map((node) => ({
        id: String(node.id),

        type: "account",

        data: {
          label: node.label ?? node.id,
          suspicious: Boolean(node.suspicious),
          fraud_transactions: node.fraud_transactions ?? 0,
        },

        position: { x: 0, y: 0 },
      }));

      // Format edges

      const formattedEdges = rawEdges.map((edge, index) => ({
        id: String(edge.id ?? `edge-${index}`),

        source: String(edge.source),
        target: String(edge.target),

        animated: Boolean(edge.suspicious),

        style: {
          stroke: edge.suspicious ? "#ef4444" : "#475569",
          strokeWidth: edge.suspicious ? 2 : 1,
          opacity: edge.suspicious ? 0.85 : 0.45,
        },

        data: {
          transaction_count: edge.transaction_count ?? 0,
          total_amount: edge.total_amount ?? 0,
          fraud_count: edge.fraud_count ?? 0,
          suspicious: Boolean(edge.suspicious),
        },
      }));

      // Apply force-directed layout

      setNodes(arrangeNodes(formattedNodes, formattedEdges));
      setEdges(formattedEdges);

      setSelectedItem(null);
    } catch (err) {
      console.error("Intelligence API error:", err);

      setError(
        "Unable to load fraud intelligence. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntelligence();
  }, [loadIntelligence]);

  // ----------------------------------------
  // NODE CLICK
  // ----------------------------------------

  const onNodeClick = useCallback(
    (_, node) => {
        const directConnections = edges.filter(
        (edge) =>
            edge.source === node.id || edge.target === node.id
        );

        setSelectedItem({
        type: "account",
        ...node.data,
        id: node.id,
        connected_accounts: directConnections.length,
        });
    },
    [edges]
    );

  // ----------------------------------------
  // EDGE CLICK
  // ----------------------------------------

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedItem({
      type: "connection",
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...edge.data,
    });
  }, []);

  // ----------------------------------------
  // NETWORK COUNTS
  // ----------------------------------------

  const suspiciousNodeCount = useMemo(
    () => nodes.filter((node) => node.data.suspicious).length,
    [nodes]
  );

  const filteredNodes = useMemo(() => {
  if (networkFilter === "fraud") {
    return nodes.filter((node) => node.data.suspicious);
  }

  if (networkFilter === "connected") {
    return nodes.filter((node) => !node.data.suspicious);
  }

  return nodes;
}, [nodes, networkFilter]);

const visibleNodeIds = useMemo(
  () => new Set(filteredNodes.map((node) => node.id)),
  [filteredNodes]
);

const filteredEdges = useMemo(
  () =>
    edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) &&
        visibleNodeIds.has(edge.target)
    ),
  [edges, visibleNodeIds]
);

const selectedAccountId =
  selectedItem?.type === "account" ? selectedItem.id : null;
// ----------------------------------------
// LOAD SELECTED ACCOUNT TRANSACTION HISTORY
// ----------------------------------------

useEffect(() => {
  if (!selectedAccountId) {
    setTransactionHistory([]);
    setHistoryError("");
    setHistoryLoading(false);
    return;
  }

  let cancelled = false;

  const loadTransactionHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");
    setTransactionHistory([]);

    try {
      const response = await api.get(
        `/accounts/${encodeURIComponent(selectedAccountId)}/transactions`,
        {
          params: { limit: 20 },
        }
      );

      if (!cancelled) {
        setTransactionHistory(
          response.data.transactions ?? []
        );
      }
    } catch (err) {
      console.error("Transaction history error:", err);

      if (!cancelled) {
        setHistoryError(
          "Unable to load transaction history."
        );
      }
    } finally {
      if (!cancelled) {
        setHistoryLoading(false);
      }
    }
  };

  loadTransactionHistory();

  return () => {
    cancelled = true;
  };
}, [selectedAccountId]);
// Find the selected account's direct neighbours
const connectedAccountIds = useMemo(() => {
  if (!selectedAccountId) {
    return new Set();
  }

  const ids = new Set([selectedAccountId]);

  filteredEdges.forEach((edge) => {
    if (edge.source === selectedAccountId) {
      ids.add(edge.target);
    }

    if (edge.target === selectedAccountId) {
      ids.add(edge.source);
    }
  });

  return ids;
}, [filteredEdges, selectedAccountId]);

// Highlight selected account and its neighbours
const investigationNodes = useMemo(() => {
  return filteredNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      dimmed:
        selectedAccountId !== null &&
        !connectedAccountIds.has(node.id),

      isNeighbour:
        selectedAccountId !== null &&
        node.id !== selectedAccountId &&
        connectedAccountIds.has(node.id),
    },
  }));
}, [filteredNodes, selectedAccountId, connectedAccountIds]);

// Highlight connections belonging to the selected account
const investigationEdges = useMemo(() => {
  return filteredEdges.map((edge) => {
    const isConnected =
      selectedAccountId !== null &&
      (edge.source === selectedAccountId ||
        edge.target === selectedAccountId);

    return {
      ...edge,
      style: {
        ...edge.style,
        stroke: isConnected
          ? "#a78bfa"
          : selectedAccountId
          ? "#334155"
          : edge.style.stroke,

        strokeWidth: isConnected ? 3 : 1,

        opacity: selectedAccountId
          ? isConnected
            ? 1
            : 0.12
          : edge.style.opacity,
      },
    };
  });
}, [filteredEdges, selectedAccountId]);
  // ----------------------------------------
  // UI
  // ----------------------------------------

  return (
    <div className="space-y-7 text-white">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="text-violet-400" size={23} />

            <h1 className="text-2xl font-bold">
              Fraud Network Intelligence
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Explore suspicious accounts and transaction relationships.
          </p>
        </div>

        <button
          onClick={loadIntelligence}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />

          Refresh Data
        </button>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Accounts"
          value={statistics?.total_accounts}
          subtitle="Accounts in analyzed network"
          icon={Users}
          color="bg-blue-500/10 text-blue-400"
        />

        <StatCard
          title="Total Connections"
          value={statistics?.total_connections}
          subtitle="Transaction relationships"
          icon={GitBranch}
          color="bg-violet-500/10 text-violet-400"
        />

        <StatCard
          title="Suspicious Accounts"
          value={statistics?.suspicious_accounts}
          subtitle="Accounts linked to fraud"
          icon={ShieldAlert}
          color="bg-red-500/10 text-red-400"
        />

        <StatCard
          title="Suspicious Clusters"
          value={statistics?.suspicious_clusters}
          subtitle="Components containing fraud-linked accounts"
          icon={Activity}
          color="bg-amber-500/10 text-amber-400"
        />

      </div>

      {/* NETWORK GRAPH */}

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101626]">

        {/* GRAPH HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">

          <div>
            <h2 className="font-semibold text-white">
              Account Relationship Network
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredNodes.length} displayed accounts · {filteredEdges.length} displayed connections
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <button
                onClick={() => {
                setNetworkFilter("all");
                setSelectedItem(null);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                networkFilter === "all"
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
            >
                All ({nodes.length})
            </button>

            <button
                onClick={() => {
                setNetworkFilter("fraud");
                setSelectedItem(null);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                networkFilter === "fraud"
                    ? "bg-red-600 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
            >
                Fraud-linked ({suspiciousNodeCount})
            </button>

            <button
                onClick={() => {
                setNetworkFilter("connected");
                setSelectedItem(null);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                networkFilter === "connected"
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
            >
                Connected ({nodes.length - suspiciousNodeCount})
            </button>

            </div>
        </div>

        {/* ERROR STATE */}

        {error ? (

          <div className="flex min-h-[480px] flex-col items-center justify-center gap-3 text-center">

            <AlertTriangle className="text-red-400" size={32} />

            <p className="text-sm text-red-300">
              {error}
            </p>

            <button
              onClick={loadIntelligence}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm"
            >
              Try Again
            </button>

          </div>

        ) : loading ? (

          <div className="flex min-h-[480px] items-center justify-center gap-3 text-slate-400">

            <RefreshCw className="animate-spin" size={20} />

            Loading network intelligence...

          </div>

        ) : (

          /* REACT FLOW */

          <div className="relative h-[620px]">

            <ReactFlow
              nodes={investigationNodes}
              edges={investigationEdges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >

              <Background
                color="#334155"
                gap={22}
                size={1}
              />

              <Controls />

              <MiniMap
                nodeColor={(node) =>
                  node.data?.suspicious ? "#ef4444" : "#3b82f6"
                }
                maskColor="rgba(8, 11, 20, 0.75)"
                style={{ background: "#0c1020" }}
              />

            </ReactFlow>

            {/* SELECTED ITEM DETAILS */}

            {selectedItem && (

              <div className="absolute right-4 top-4 z-10 max-h-[580px] w-[340px] overflow-y-auto rounded-xl border border-white/10 bg-[#111827] p-5 shadow-2xl">

                <div className="mb-4 flex items-center justify-between">

                  <h3 className="font-semibold text-white">
                    {selectedItem.type === "account"
                      ? "Account Details"
                      : "Connection Details"}
                  </h3>

                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>

                </div>

                {/* ACCOUNT DETAILS */}

                {selectedItem.type === "account" ? (

                  <div className="space-y-3 text-sm">

                    <div>
                      <p className="text-xs text-slate-500">
                        Account ID
                      </p>

                      <p className="mt-1 break-all text-slate-200">
                        {selectedItem.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Classification
                      </p>

                      <p
                        className={`mt-1 font-medium ${
                          selectedItem.suspicious
                            ? "text-red-400"
                            : "text-blue-400"
                        }`}
                      >
                        {selectedItem.suspicious
                          ? "Suspicious / Fraud-linked"
                          : "Connected Account"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Fraud-linked transactions
                      </p>

                      <p className="mt-1 text-lg font-semibold text-white">
                        {selectedItem.fraud_transactions}
                      </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">
                            Direct connections
                        </p>

                        <p className="mt-1 text-lg font-semibold text-blue-400">
                            {selectedItem.connected_accounts}
                        </p>
                    </div>
                    {/* TRANSACTION HISTORY */}
                    <div className="border-t border-white/10 pt-4">

                        <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-semibold text-white">
                            Transaction History
                            </h4>

                            <span className="text-xs text-slate-500">
                            Latest 20
                            </span>
                        </div>

                        {historyLoading ? (

                            <div className="flex items-center gap-2 py-5 text-sm text-slate-400">
                            <RefreshCw size={15} className="animate-spin" />
                            Loading transactions...
                            </div>

                        ) : historyError ? (

                            <p className="py-3 text-xs text-red-400">
                            {historyError}
                            </p>

                        ) : transactionHistory.length === 0 ? (

                            <p className="py-3 text-xs text-slate-400">
                            No transactions found for this account.
                            </p>

                        ) : (

                            <div className="space-y-3">

                            {transactionHistory.map((transaction) => (

                                <div
                                key={transaction.transaction_id}
                                className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"
                                >

                                <div className="flex items-center justify-between gap-2">

                                    <span className="text-xs font-semibold text-slate-200">
                                    {transaction.transaction_type}
                                    </span>

                                    <span
                                    className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                                        transaction.actual_label === 1
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-emerald-500/10 text-emerald-400"
                                    }`}
                                    >
                                    {transaction.status}
                                    </span>

                                </div>

                                <p className="mt-2 text-lg font-bold text-white">
                                    {Number(transaction.amount).toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                    })}
                                </p>

                                <div className="mt-3 space-y-1.5 text-xs">

                                    <div className="flex justify-between gap-2">
                                    <span className="text-slate-500">Direction</span>
                                    <span className="text-slate-300">
                                        {transaction.direction}
                                    </span>
                                    </div>

                                    <div className="flex justify-between gap-2">
                                    <span className="text-slate-500">Transaction ID</span>
                                    <span className="text-slate-300">
                                        {transaction.transaction_id}
                                    </span>
                                    </div>

                                    <div className="flex justify-between gap-2">
                                    <span className="text-slate-500">Simulation step</span>
                                    <span className="text-slate-300">
                                        {transaction.step}
                                    </span>
                                    </div>

                                    <div className="flex justify-between gap-2">
                                    <span className="text-slate-500">Counterparty</span>
                                    <span className="max-w-[165px] truncate text-slate-300">
                                        {transaction.direction === "Outgoing"
                                        ? transaction.receiver
                                        : transaction.sender}
                                    </span>
                                    </div>

                                </div>

                                </div>

                            ))}

                            </div>

                        )}

                        </div>                
                    </div>

                ) : (

                  /* CONNECTION DETAILS */

                  <div className="space-y-3 text-sm">

                    <div>
                      <p className="text-xs text-slate-500">
                        From
                      </p>

                      <p className="mt-1 break-all text-slate-200">
                        {selectedItem.source}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="text-violet-400" />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        To
                      </p>

                      <p className="mt-1 break-all text-slate-200">
                        {selectedItem.target}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Transactions
                      </p>

                      <p className="mt-1 text-white">
                        {selectedItem.transaction_count}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Total Amount
                      </p>

                      <p className="mt-1 text-white">
                        {Number(
                          selectedItem.total_amount
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Fraud-linked transactions
                      </p>

                      <p className="mt-1 font-semibold text-red-400">
                        {selectedItem.fraud_count}
                      </p>
                    </div>

                  </div>

                )}

              </div>

            )}

          </div>

        )}

      </div>

      {/* NETWORK SUMMARY */}

      {!loading && !error && (

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-white/[0.07] bg-[#101626] p-4">

            <p className="text-xs text-slate-500">
              Displayed suspicious accounts
            </p>

            <p className="mt-2 text-xl font-bold text-red-400">
              {filteredNodes.filter((node) => node.data.suspicious).length.toLocaleString("en-IN")}
            </p>

          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#101626] p-4">

            <p className="text-xs text-slate-500">
              Displayed connected accounts
            </p>

            <p className="mt-2 text-xl font-bold text-blue-400">
              {filteredNodes.filter((node) => !node.data.suspicious).length.toLocaleString("en-IN")}
            </p>

          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#101626] p-4">

            <p className="text-xs text-slate-500">
              Fraud-linked connections
            </p>

            <p className="mt-2 text-xl font-bold text-amber-400">
              {edges
                .filter((edge) => edge.data.suspicious)
                .length.toLocaleString("en-IN")}
            </p>

          </div>

        </div>

      )}

      {/* DISCLAIMER */}

      <p className="text-xs text-slate-600">
        Suspicious classifications indicate accounts connected to
        fraud-labelled transactions in the synthetic PaySim dataset.
        They are analytical flags, not proof of real-world fraudulent activity.
      </p>

    </div>
  );
}