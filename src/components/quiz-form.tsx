"use client";

import { useState, useTransition } from "react";
import { submitQuiz } from "@/lib/actions";
import type { QuizQuestion } from "@/lib/types";

export function QuizForm({
  moduleId,
  questions,
  initialScore,
}: {
  moduleId: string;
  questions: QuizQuestion[];
  initialScore: number | null;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(
    initialScore != null
      ? {
          score: initialScore,
          correct: Math.round((initialScore / 100) * questions.length),
          total: questions.length,
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allAnswered = answers.every((a) => a !== null);

  function handleSubmit() {
    if (!allAnswered) {
      setError("Answer every question before submitting.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitQuiz(moduleId, answers as number[]);
      setResult(res);
    });
  }

  function handleRetake() {
    setAnswers(questions.map(() => null));
    setResult(null);
    setError(null);
  }

  return (
    <div className="mt-10 rounded-lg border border-black/10 p-6 dark:border-white/10">
      <h2 className="text-lg font-semibold tracking-tight">Quiz</h2>
      <div className="mt-4 flex flex-col gap-6">
        {questions.map((question, qi) => (
          <fieldset key={qi} disabled={result != null}>
            <legend className="font-medium">
              {qi + 1}. {question.question}
            </legend>
            <div className="mt-2 flex flex-col gap-1.5">
              {question.options.map((option, oi) => {
                const isSelected = answers[qi] === oi;
                const isCorrectOption = oi === question.correctIndex;
                const showCorrectness = result != null;

                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                      showCorrectness && isCorrectOption
                        ? "bg-emerald-500/10"
                        : showCorrectness && isSelected
                          ? "bg-red-500/10"
                          : "hover:bg-brand-via/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qi}`}
                      className="accent-brand-via"
                      checked={isSelected}
                      onChange={() =>
                        setAnswers((prev) => prev.map((v, i) => (i === qi ? oi : v)))
                      }
                    />
                    <span>{option}</span>
                    {showCorrectness && isCorrectOption && (
                      <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    )}
                    {showCorrectness && isSelected && !isCorrectOption && (
                      <span className="text-red-600 dark:text-red-400">✗</span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-md bg-black/5 px-4 py-3 text-sm dark:bg-white/10">
          <p>
            Score: <span className="font-semibold">{result.score}%</span> ({result.correct}/
            {result.total} correct)
          </p>
          <button
            onClick={handleRetake}
            className="rounded-md border border-black/10 px-3 py-1.5 text-sm transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/15"
          >
            Retake quiz
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={pending}
          className="btn-gradient mt-5 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit quiz"}
        </button>
      )}
    </div>
  );
}
