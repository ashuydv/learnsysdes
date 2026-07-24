"use client";

import { useState } from "react";
import type { ProblemRequirements } from "@/lib/types";

function ChecklistGroup({
  title,
  items,
  groupKey,
  checked,
  onToggle,
}: {
  title: string;
  items: string[];
  groupKey: string;
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item, i) => {
          const id = `${groupKey}-${i}`;
          return (
            <li key={id}>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-brand-via"
                  checked={Boolean(checked[id])}
                  onChange={() => onToggle(id)}
                />
                <span className={checked[id] ? "line-through opacity-50" : ""}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RequirementsChecklist({
  requirements,
}: {
  requirements: ProblemRequirements;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="rounded-lg border border-black/10 p-6 dark:border-white/10">
      <h2 className="text-lg font-semibold tracking-tight">Requirements</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ChecklistGroup
          title="Functional"
          items={requirements.functional}
          groupKey="functional"
          checked={checked}
          onToggle={toggle}
        />
        <ChecklistGroup
          title="Non-functional"
          items={requirements.nonFunctional}
          groupKey="nonfunctional"
          checked={checked}
          onToggle={toggle}
        />
      </div>
    </div>
  );
}
