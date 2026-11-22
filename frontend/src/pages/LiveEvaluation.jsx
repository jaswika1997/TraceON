
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ScanSearch,
  MapPin,
  Smartphone,
  Globe,
  ArrowRight,
  Loader2,
  BriefcaseBusiness,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import api from "../services/api";

const initialForm = {
  transaction_id: "LIVE-TXN-001",
  account_id: "C1001571964",

  step: 100,
  type_code: 4,
  amount: 250000,
  oldbalanceOrg: 300000,
  newbalanceOrig: 50000,
  oldbalanceDest: 10000,
  newbalanceDest: 260000,

  event_city: "Kolkata",
  event_lat: 22.5726,
  event_lon: 88.3639,
  event_ip: "172.16.126.47",
  event_device: "DEVICE-NEW-001",

  previous_step: 99,
  previous_city: "Bengaluru",
  previous_lat: 12.9716,
  previous_lon: 77.5946,
  previous_ip: "10.140.20.245",
  previous_device: "DEVICE-OLD-001",
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c1020] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-500";

const labelClass = "text-xs font-medium text-slate-400";

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
      <div className="mb-5 flex items-center gap-2">
        <Icon size={18} className="text-violet-400" />
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, name, value, onChange, type = "text", step }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
        type={type}
        name={name}
        value={value}
        step={step}
        onChange={onChange}
        required
      />
    </label>
  );
}

function RiskBadge({ decision }) {
  const styles = {
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FLAGGED: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide ${
        styles[decision] || styles.REVIEW
      }`}
    >
      {decision}
    </span>
  );
}

export default function LiveEvaluation() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [caseLoading, setCaseLoading] = useState("");
  const [caseMessages, setCaseMessages] = useState({});

  const handleChange = (event) => {
    const { name, value, type } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "number"
          ? Number(value)
          : value,
    }));
  };

  const evaluateTransaction = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);
    setCaseMessages({});

    try {
      const response = await api.post(
        "/early-warning/evaluate",
        form
      );

      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Transaction evaluation failed. Please check the inputs and backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const createInvestigation = async (alert) => {
    try {
      setCaseLoading(alert.alert_id);

      const response = await api.post(
        `/investigations/from-alert/${encodeURIComponent(
          alert.alert_id
        )}`
      );

      const caseData = response.data.case;

      setCaseMessages((previous) => ({
        ...previous,
        [alert.alert_id]: `Case ${caseData.case_id} created or already exists.`,
      }));
    } catch (err) {
      setCaseMessages((previous) => ({
        ...previous,
        [alert.alert_id]:
          err.response?.data?.detail ||
          "Unable to create investigation.",
      }));
    } finally {
      setCaseLoading("");
    }
  };

  const decisionIcon = {
    APPROVED: ShieldCheck,
    REVIEW: AlertTriangle,
    FLAGGED: ShieldAlert,
  };

  const DecisionIcon = result
    ? decisionIcon[result.decision] || AlertTriangle
    : Activity;

  const formatType = (code) => {
    const types = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"];
    return types[code] || "UNKNOWN";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ScanSearch size={23} className="text-violet-400" />
            <h1 className="text-2xl font-bold text-white">
              Live Transaction Evaluation
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Evaluate incoming transactions using AI fraud detection
            and behavioral intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">
            Evaluation Engine Ready
          </span>
        </div>
      </div>

      {/* NOTICE */}
      <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-400"
        />
        <div>
          <p className="text-sm font-semibold text-amber-300">
            Simulated transaction environment
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Account location, IP and device metadata are simulated.
            This evaluation uses the PaySim-trained XGBoost model
            alongside rule-based Early Warning checks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* FORM */}
        <form onSubmit={evaluateTransaction} className="space-y-5">

          <Section title="Transaction Information" icon={Activity}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Transaction ID"
                name="transaction_id"
                value={form.transaction_id}
                onChange={handleChange}
              />

              <Field
                label="Account ID"
                name="account_id"
                value={form.account_id}
                onChange={handleChange}
              />

              <Field
                label="Simulation Step"
                name="step"
                type="number"
                value={form.step}
                onChange={handleChange}
              />

              <label className="block">
                <span className={labelClass}>Transaction Type</span>
                <select
                  name="type_code"
                  value={form.type_code}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"].map(
                    (type, index) => (
                      <option key={type} value={index}>
                        {type}
                      </option>
                    )
                  )}
                </select>
              </label>

              <Field
                label="Transaction Amount"
                name="amount"
                type="number"
                step="any"
                value={form.amount}
                onChange={handleChange}
              />
            </div>
          </Section>

          <Section title="Account Balance Details" icon={ArrowRight}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Sender Balance Before"
                name="oldbalanceOrg"
                type="number"
                step="any"
                value={form.oldbalanceOrg}
                onChange={handleChange}
              />

              <Field
                label="Sender Balance After"
                name="newbalanceOrig"
                type="number"
                step="any"
                value={form.newbalanceOrig}
                onChange={handleChange}
              />

              <Field
                label="Receiver Balance Before"
                name="oldbalanceDest"
                type="number"
                step="any"
                value={form.oldbalanceDest}
                onChange={handleChange}
              />

              <Field
                label="Receiver Balance After"
                name="newbalanceDest"
                type="number"
                step="any"
                value={form.newbalanceDest}
                onChange={handleChange}
              />
            </div>
          </Section>

          <Section title="Current Transaction Context" icon={MapPin}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Current City"
                name="event_city"
                value={form.event_city}
                onChange={handleChange}
              />

              <Field
                label="Current IP Address"
                name="event_ip"
                value={form.event_ip}
                onChange={handleChange}
              />

              <Field
                label="Current Latitude"
                name="event_lat"
                type="number"
                step="any"
                value={form.event_lat}
                onChange={handleChange}
              />

              <Field
                label="Current Longitude"
                name="event_lon"
                type="number"
                step="any"
                value={form.event_lon}
                onChange={handleChange}
              />

              <Field
                label="Current Device ID"
                name="event_device"
                value={form.event_device}
                onChange={handleChange}
              />
            </div>
          </Section>

          <Section title="Previous Account Context" icon={Globe}>
            <p className="mb-4 text-xs text-slate-500">
              Previously observed account information used for
              behavioral comparison.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Previous Step"
                name="previous_step"
                type="number"
                value={form.previous_step}
                onChange={handleChange}
              />

              <Field
                label="Previous City"
                name="previous_city"
                value={form.previous_city}
                onChange={handleChange}
              />

              <Field
                label="Previous Latitude"
                name="previous_lat"
                type="number"
                step="any"
                value={form.previous_lat}
                onChange={handleChange}
              />

              <Field
                label="Previous Longitude"
                name="previous_lon"
                type="number"
                step="any"
                value={form.previous_lon}
                onChange={handleChange}
              />

              <Field
                label="Previous IP Address"
                name="previous_ip"
                value={form.previous_ip}
                onChange={handleChange}
              />

              <Field
                label="Previous Device ID"
                name="previous_device"
                value={form.previous_device}
                onChange={handleChange}
              />
            </div>
          </Section>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/10 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Evaluating Transaction...
              </>
            ) : (
              <>
                <ScanSearch size={18} />
                Evaluate Transaction
              </>
            )}
          </button>
        </form>

        {/* RESULTS PANEL */}
        <div className="space-y-5">
          <Section title="Evaluation Result" icon={ShieldCheck}>
            {!result ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                  <ScanSearch size={32} className="text-violet-400" />
                </div>

                <h3 className="font-semibold text-white">
                  Awaiting Transaction
                </h3>

                <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
                  Submit transaction information to run the fraud
                  model and Early Warning evaluation.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-white/[0.07] bg-[#0c1020] p-5 text-center">
                  <DecisionIcon
                    size={38}
                    className={`mx-auto mb-3 ${
                      result.decision === "APPROVED"
                        ? "text-emerald-400"
                        : result.decision === "FLAGGED"
                        ? "text-red-400"
                        : "text-amber-400"
                    }`}
                  />

                  <p className="text-xs text-slate-400">
                    Final Transaction Decision
                  </p>

                  <div className="mt-3">
                    <RiskBadge decision={result.decision} />
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    {result.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.07] bg-[#0c1020] p-4">
                    <p className="text-xs text-slate-500">
                      Combined Risk Score
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {result.combined_risk_score}
                      <span className="text-sm text-slate-500"> /100</span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.07] bg-[#0c1020] p-4">
                    <p className="text-xs text-slate-500">
                      Alerts Generated
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {result.alerts_generated}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-[#0c1020] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      XGBoost Prediction
                    </h3>
                    <Activity size={17} className="text-violet-400" />
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {(
                          result.model_prediction.fraud_probability * 100
                        ).toFixed(2)}%
                      </p>
                      <p className="text-xs text-slate-500">
                        Fraud Probability
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {result.model_prediction.risk_level}
                      </p>
                      <p className="text-xs text-slate-500">
                        {result.model_prediction.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(
                          100,
                          result.model_prediction.risk_score
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* GENERATED ALERTS */}
          {result && (
            <Section title="Detection Signals" icon={AlertTriangle}>
              {result.alerts.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-sm text-emerald-400">
                  <CheckCircle2 size={19} />
                  No Early Warning or model alerts generated.
                </div>
              ) : (
                <div className="space-y-3">
                  {result.alerts.map((alert) => (
                    <div
                      key={alert.alert_id}
                      className="rounded-xl border border-white/[0.07] bg-[#0c1020] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">
                          {alert.alert_type.replaceAll("_", " ")}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            alert.severity === "CRITICAL"
                              ? "bg-red-500/10 text-red-400"
                              : alert.severity === "HIGH"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {alert.reason}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">
                          Risk score: {alert.risk_score}
                        </span>

                        <button
                          onClick={() => createInvestigation(alert)}
                          disabled={caseLoading === alert.alert_id}
                          className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-50"
                        >
                          {caseLoading === alert.alert_id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <BriefcaseBusiness size={13} />
                          )}
                          Create Investigation
                        </button>
                      </div>

                      {caseMessages[alert.alert_id] && (
                        <p className="mt-2 text-xs text-emerald-400">
                          {caseMessages[alert.alert_id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {result && (
            <div className="rounded-xl border border-white/[0.07] bg-[#111827] p-4">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-slate-500" />
                <p className="text-xs font-semibold text-slate-300">
                  Transaction Reference
                </p>
              </div>

              <p className="mt-2 text-sm font-medium text-white">
                {result.transaction_id}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Account: {result.account_id}
              </p>

              <p className="mt-3 text-[10px] text-slate-600">
                Evaluation uses simulated metadata.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
