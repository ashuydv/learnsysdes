"use client";

import { useState } from "react";

export interface EstimationInputs {
  users: number;
  qps: number;
  storageGb: number;
  requestsPerUserPerDay: number;
  avgObjectSizeKb: number;
  retentionDays: number;
}

export const defaultEstimationInputs: EstimationInputs = {
  users: 1_000_000,
  qps: 0,
  storageGb: 0,
  requestsPerUserPerDay: 10,
  avgObjectSizeKb: 1,
  retentionDays: 365,
};

function NumberField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-md border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-brand-via focus:ring-2 focus:ring-brand-via/20 dark:border-white/20 dark:bg-transparent"
        />
        {unit && <span className="shrink-0 text-black/40 dark:text-white/40">{unit}</span>}
      </div>
    </label>
  );
}

export function EstimationPanel({
  value,
  onChange,
}: {
  value: EstimationInputs;
  onChange: (value: EstimationInputs) => void;
}) {
  const [showHelpers, setShowHelpers] = useState(false);

  function set<K extends keyof EstimationInputs>(key: K, next: number) {
    onChange({ ...value, [key]: next });
  }

  const avgQps = (value.users * value.requestsPerUserPerDay) / 86_400;
  const peakQps = avgQps * 3;
  const estimatedStorageGb =
    (value.users * value.requestsPerUserPerDay * value.avgObjectSizeKb * value.retentionDays) /
    1_000_000;

  return (
    <div className="rounded-lg border border-black/10 p-6 dark:border-white/10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Back-of-envelope estimation</h2>
        <button
          type="button"
          onClick={() => setShowHelpers((s) => !s)}
          className="text-sm text-black/50 hover:text-brand-via hover:underline dark:text-white/50"
        >
          {showHelpers ? "Hide helpers" : "Show calculation helpers"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumberField label="Users" value={value.users} onChange={(v) => set("users", v)} />
        <NumberField label="QPS" value={value.qps} onChange={(v) => set("qps", v)} unit="req/s" />
        <NumberField
          label="Storage"
          value={value.storageGb}
          onChange={(v) => set("storageGb", v)}
          unit="GB"
        />
      </div>

      {showHelpers && (
        <div className="mt-6 flex flex-col gap-6 border-t border-black/10 pt-6 dark:border-white/10">
          <div>
            <p className="text-sm font-medium">QPS helper</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField
                label="Requests / user / day"
                value={value.requestsPerUserPerDay}
                onChange={(v) => set("requestsPerUserPerDay", v)}
              />
              <div className="flex flex-col justify-end gap-1 text-sm">
                <p>
                  Avg: <span className="font-semibold">{avgQps.toFixed(1)}</span> req/s · Peak (×3):{" "}
                  <span className="font-semibold">{peakQps.toFixed(1)}</span> req/s
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => set("qps", Math.round(avgQps))}
                    className="rounded-md border border-black/10 px-2.5 py-1 text-xs transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/15"
                  >
                    Use average
                  </button>
                  <button
                    type="button"
                    onClick={() => set("qps", Math.round(peakQps))}
                    className="rounded-md border border-black/10 px-2.5 py-1 text-xs transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/15"
                  >
                    Use peak
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Storage helper</p>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumberField
                label="Avg record size"
                value={value.avgObjectSizeKb}
                onChange={(v) => set("avgObjectSizeKb", v)}
                unit="KB"
              />
              <NumberField
                label="Retention"
                value={value.retentionDays}
                onChange={(v) => set("retentionDays", v)}
                unit="days"
              />
              <div className="flex flex-col justify-end gap-1 text-sm">
                <p>
                  ≈ <span className="font-semibold">{estimatedStorageGb.toFixed(1)}</span> GB
                </p>
                <button
                  type="button"
                  onClick={() => set("storageGb", Math.round(estimatedStorageGb))}
                  className="w-fit rounded-md border border-black/10 px-2.5 py-1 text-xs transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/15"
                >
                  Use this
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
