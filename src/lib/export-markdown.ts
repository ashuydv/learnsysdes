export function buildExportMarkdown({
  title,
  description,
  solutionText,
}: {
  title: string;
  description: string;
  solutionText: string;
}) {
  return `# ${title}\n\n${description}\n\n${solutionText}\n`;
}
