export interface PaletteItem {
  kind: string;
  label: string;
  strokeColor: string;
  backgroundColor: string;
}

export const starterPalette: PaletteItem[] = [
  { kind: "client", label: "Client", strokeColor: "#495057", backgroundColor: "#e9ecef" },
  { kind: "cdn", label: "CDN", strokeColor: "#0c8599", backgroundColor: "#99e9f2" },
  { kind: "lb", label: "Load Balancer", strokeColor: "#e8590c", backgroundColor: "#ffd8a8" },
  { kind: "service", label: "Service", strokeColor: "#1971c2", backgroundColor: "#a5d8ff" },
  { kind: "cache", label: "Cache", strokeColor: "#f08c00", backgroundColor: "#ffec99" },
  { kind: "db", label: "Database", strokeColor: "#2f9e44", backgroundColor: "#b2f2bb" },
  { kind: "queue", label: "Queue", strokeColor: "#6741d9", backgroundColor: "#d0bfff" },
];
