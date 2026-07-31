"use client";

import { useState } from "react";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

interface Question {
  id: string;
  slug: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  order: number;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert / Specialized",
};

export function QuestionsTabs({
  groups,
}: {
  groups: { difficulty: Difficulty; items: Question[] }[];
}) {
  const [active, setActive] = useState(groups[0]?.difficulty);
  const activeGroup = groups.find((g) => g.difficulty === active) ?? groups[0];

  return (
    <div className="mt-10">
      <div
        role="tablist"
        className="flex flex-wrap gap-2 border-b border-black/10 pb-3 dark:border-white/10"
      >
        {groups.map((group) => {
          const isActive = group.difficulty === activeGroup?.difficulty;
          return (
            <button
              key={group.difficulty}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(group.difficulty)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white"
                  : "text-black/60 hover:bg-brand-soft hover:text-brand dark:text-white/60"
              }`}
            >
              {DIFFICULTY_LABEL[group.difficulty]}
              <span className={`ml-1.5 ${isActive ? "text-white/70" : "text-black/40 dark:text-white/40"}`}>
                {group.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {activeGroup && (
        <ul className="mt-6 flex flex-col gap-2">
          {activeGroup.items.map((q) => (
            <li key={q.id}>
              <details className="group rounded-lg border border-black/10 px-4 py-3 dark:border-white/10">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex gap-3">
                    <span className="shrink-0 text-sm font-semibold text-brand">
                      {String(q.order).padStart(2, "0")}
                    </span>
                    <span className="font-medium">{q.question}</span>
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 h-4 w-4 shrink-0 text-black/40 transition-transform group-open:rotate-180 dark:text-white/40"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <p className="mt-3 pl-8 text-sm text-black/70 dark:text-white/70">{q.answer}</p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
