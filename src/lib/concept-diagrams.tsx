import type { ConceptDiagramData } from "@/components/concept-diagram";

export const conceptDiagrams: Record<string, ConceptDiagramData> = {
  "scalability-basics": {
    nodes: [
      { id: "client", label: "Clients", x: 10, y: 85 },
      { id: "lb", label: "Load Balancer", x: 200, y: 85 },
      { id: "s1", label: "Server 1", x: 420, y: 15 },
      { id: "s2", label: "Server 2", x: 420, y: 85 },
      { id: "s3", label: "Server 3", x: 420, y: 155 },
    ],
    edges: [
      ["client", "lb"],
      ["lb", "s1"],
      ["lb", "s2"],
      ["lb", "s3"],
    ],
  },
  "load-balancing": {
    nodes: [
      { id: "client", label: "Clients", x: 10, y: 85 },
      { id: "lb", label: "Load Balancer", x: 230, y: 85 },
      { id: "s1", label: "Server 1", x: 470, y: 15 },
      { id: "s2", label: "Server 2", x: 470, y: 85 },
      { id: "s3", label: "Server 3", x: 470, y: 155 },
    ],
    edges: [
      ["client", "lb"],
      ["lb", "s1"],
      ["lb", "s2"],
      ["lb", "s3"],
    ],
  },
  caching: {
    nodes: [
      { id: "client", label: "Client", x: 10, y: 85 },
      { id: "service", label: "Service", x: 190, y: 85 },
      { id: "cache", label: "Cache", x: 380, y: 15 },
      { id: "db", label: "Database", x: 380, y: 155 },
    ],
    edges: [
      ["client", "service"],
      ["service", "cache"],
      ["service", "db"],
    ],
    viewBoxWidth: 560,
  },
  "sql-vs-nosql": {
    nodes: [
      { id: "service", label: "Service", x: 250, y: 85 },
      { id: "sql", label: "SQL Database", x: 450, y: 15 },
      { id: "nosql", label: "NoSQL Database", x: 450, y: 155 },
      { id: "client", label: "Client", x: 40, y: 85 },
    ],
    edges: [
      ["client", "service"],
      ["service", "sql"],
      ["service", "nosql"],
    ],
  },
  "database-sharding-replication": {
    nodes: [
      { id: "service", label: "Service", x: 10, y: 85 },
      { id: "router", label: "Shard Router", x: 190, y: 85 },
      { id: "shard1", label: "Shard 1\n(primary)", x: 400, y: 15 },
      { id: "shard2", label: "Shard 2\n(primary)", x: 400, y: 85 },
      { id: "shard3", label: "Shard 3\n(primary)", x: 400, y: 155 },
      { id: "replica", label: "Replica", x: 550, y: 85, w: 80 },
    ],
    edges: [
      ["service", "router"],
      ["router", "shard1"],
      ["router", "shard2"],
      ["router", "shard3"],
      ["shard2", "replica"],
    ],
    viewBoxWidth: 660,
  },
  "cap-theorem": {
    nodes: [
      { id: "c", label: "Consistency", x: 260, y: 10 },
      { id: "a", label: "Availability", x: 60, y: 150 },
      { id: "p", label: "Partition\nTolerance", x: 460, y: 150 },
    ],
    edges: [
      ["c", "a"],
      ["c", "p"],
      ["a", "p"],
    ],
    viewBoxHeight: 220,
  },
  "message-queues": {
    nodes: [
      { id: "producer", label: "Producer", x: 20, y: 85 },
      { id: "queue", label: "Queue", x: 250, y: 85 },
      { id: "consumer1", label: "Consumer 1", x: 470, y: 20 },
      { id: "consumer2", label: "Consumer 2", x: 470, y: 150 },
    ],
    edges: [
      ["producer", "queue"],
      ["queue", "consumer1"],
      ["queue", "consumer2"],
    ],
  },
  cdns: {
    nodes: [
      { id: "client", label: "Client", x: 10, y: 85 },
      { id: "edge", label: "CDN Edge", x: 230, y: 85 },
      { id: "origin", label: "Origin Server", x: 450, y: 85 },
    ],
    edges: [
      ["client", "edge"],
      ["edge", "origin"],
    ],
  },
  "rate-limiting": {
    nodes: [
      { id: "client", label: "Client", x: 10, y: 85 },
      { id: "limiter", label: "Rate Limiter", x: 230, y: 85 },
      { id: "service", label: "Service", x: 450, y: 85 },
    ],
    edges: [
      ["client", "limiter"],
      ["limiter", "service"],
    ],
  },
  "api-design-basics": {
    nodes: [
      { id: "client", label: "Client", x: 10, y: 85 },
      { id: "gateway", label: "API Gateway", x: 230, y: 85 },
      { id: "s1", label: "Users Service", x: 450, y: 15 },
      { id: "s2", label: "Orders Service", x: 450, y: 155 },
    ],
    edges: [
      ["client", "gateway"],
      ["gateway", "s1"],
      ["gateway", "s2"],
    ],
  },
};
