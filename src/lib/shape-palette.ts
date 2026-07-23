export interface PaletteItem {
  kind: string;
  label: string;
  color: string;
}

export const starterPalette: PaletteItem[] = [
  { kind: "client", label: "Client", color: "grey" },
  { kind: "cdn", label: "CDN", color: "light-blue" },
  { kind: "lb", label: "Load Balancer", color: "orange" },
  { kind: "service", label: "Service", color: "blue" },
  { kind: "cache", label: "Cache", color: "yellow" },
  { kind: "db", label: "Database", color: "green" },
  { kind: "queue", label: "Queue", color: "violet" },
];
