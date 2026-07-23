const labels: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETE: "Complete",
};

const styles: Record<string, string> = {
  NOT_STARTED: "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETE: "bg-green-500/10 text-green-700 dark:text-green-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? styles.NOT_STARTED}`}
    >
      {labels[status] ?? "Not started"}
    </span>
  );
}
