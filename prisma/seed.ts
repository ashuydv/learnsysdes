import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildDiagramSnapshot, type DiagramNode, type DiagramEdge } from "../src/lib/diagram-builder";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface ModuleSeed {
  slug: string;
  title: string;
  order: number;
  summary: string;
  content: string;
  quiz: QuizQuestion[];
}

interface ProblemSeed {
  slug: string;
  title: string;
  order: number;
  description: string;
  requirements: { functional: string[]; nonFunctional: string[] };
  referenceSolution: string;
  diagram: { nodes: DiagramNode[]; edges: DiagramEdge[] };
}

const modules: ModuleSeed[] = [
  {
    slug: "scalability-basics",
    title: "Scalability Basics",
    order: 1,
    summary: "Understand vertical vs horizontal scaling and where bottlenecks move to.",
    content: `Scalability is a system's ability to handle increasing load — more users, more data, more requests — without a proportional drop in performance. Every high-level design conversation starts here: how will this system grow, and what breaks first?

## Vertical vs horizontal scaling
Vertical scaling (scaling up) means adding more power — CPU, RAM, disk — to a single machine. It's simple but has a hard ceiling: eventually you run out of bigger machines to buy, and a single point of failure remains.
Horizontal scaling (scaling out) means adding more machines and distributing load across them. It has a near-unlimited ceiling but introduces complexity: coordination, data consistency, and network overhead between nodes.

## Stateless vs stateful services
Stateless services don't hold session data locally, so any instance can handle any request — this makes horizontal scaling trivial. Stateful services need sticky sessions or externalized state (e.g. in Redis) to scale out safely.

## Bottlenecks move, they don't disappear
Scaling one layer often just shifts the bottleneck to the next one. Adding app servers behind a load balancer is easy; the database usually becomes the new constraint, which is why later modules cover caching, sharding, and replication.

- Prefer horizontal scaling for anything user-facing and long-lived
- Keep services stateless wherever possible
- Always ask: what's the next bottleneck after this fix?`,
    quiz: [
      {
        question: "What is the main limitation of vertical scaling?",
        options: [
          "It requires more code changes",
          "There's a hard ceiling on how much a single machine can be upgraded",
          "It only works for stateless services",
          "It's more expensive than horizontal scaling in all cases",
        ],
        correctIndex: 1,
      },
      {
        question: "Why are stateless services easier to scale horizontally?",
        options: [
          "They use less memory",
          "Any instance can handle any request without session affinity",
          "They don't need a database",
          "They run faster than stateful services",
        ],
        correctIndex: 1,
      },
      {
        question: "What typically happens when you scale out the application layer alone?",
        options: [
          "The system becomes infinitely scalable",
          "The bottleneck usually shifts to the database",
          "Latency always decreases to zero",
          "No further scaling is needed",
        ],
        correctIndex: 1,
      },
      {
        question: "Which is an example of horizontal scaling?",
        options: [
          "Upgrading a server's RAM from 32GB to 128GB",
          "Adding more servers behind a load balancer",
          "Adding a faster CPU to an existing server",
          "Using a bigger hard drive",
        ],
        correctIndex: 1,
      },
      {
        question: "What technique helps a stateful service scale out safely?",
        options: [
          "Ignoring session data",
          "Sticky sessions or externalizing state to a shared store like Redis",
          "Vertical scaling only",
          "Removing the load balancer",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "load-balancing",
    title: "Load Balancing",
    order: 2,
    summary: "How load balancers distribute traffic across servers and keep systems available.",
    content: `A load balancer sits between clients and your servers, distributing incoming requests so no single server is overwhelmed. It's often the first component added once a system needs more than one server.

## Common algorithms
Round robin sends requests to servers in rotating order — simple, but ignores server load. Least connections sends new requests to whichever server currently has the fewest active connections. Weighted variants let you account for servers with different capacities.

## Layer 4 vs Layer 7
Layer 4 load balancers route based on IP and port (transport layer) — fast, but blind to request content. Layer 7 load balancers inspect HTTP requests (headers, paths, cookies) and can route \`/api/*\` differently from \`/static/*\`, but cost more CPU per request.

## Health checks
Load balancers periodically ping servers (e.g. GET /health) and stop routing traffic to any that fail, which is how the system tolerates individual server crashes without downtime.

## High availability
A single load balancer is a single point of failure, so production systems typically run at least two, with a mechanism like DNS failover or a floating IP to fail over automatically.

- Round robin is simple but load-unaware
- Layer 7 balancers enable content-based routing
- Health checks are what make failover automatic
- Always plan for the load balancer itself to fail`,
    quiz: [
      {
        question: "What is the main purpose of a load balancer?",
        options: [
          "To store data permanently",
          "To distribute incoming requests across multiple servers",
          "To encrypt traffic",
          "To compress images",
        ],
        correctIndex: 1,
      },
      {
        question:
          "Which load balancing algorithm routes new requests to the server with the fewest active connections?",
        options: ["Round robin", "Least connections", "Random", "Sticky sessions"],
        correctIndex: 1,
      },
      {
        question: "What is a key difference between Layer 4 and Layer 7 load balancing?",
        options: [
          "Layer 4 is slower than Layer 7",
          "Layer 7 can route based on HTTP content like path or headers, Layer 4 cannot",
          "Layer 4 only works with HTTPS",
          "There is no difference",
        ],
        correctIndex: 1,
      },
      {
        question: "What do health checks allow a load balancer to do?",
        options: [
          "Encrypt traffic automatically",
          "Stop routing traffic to unhealthy servers",
          "Increase server capacity",
          "Cache responses",
        ],
        correctIndex: 1,
      },
      {
        question: "Why do production systems often run more than one load balancer?",
        options: [
          "To reduce cost",
          "Because a single load balancer is a single point of failure",
          "Because DNS requires it",
          "To support round robin",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "caching",
    title: "Caching",
    order: 3,
    summary: "Speed up reads and reduce database load with the right caching strategy.",
    content: `Caching stores a copy of frequently accessed data somewhere faster to read from than the source of truth — usually in memory — so repeated requests don't have to hit the database every time.

## Cache-aside (lazy loading)
The application checks the cache first; on a miss, it reads from the database, then writes the result into the cache for next time. It's the most common pattern because it only caches what's actually requested.

## Write-through and write-back
Write-through writes to the cache and the database at the same time, keeping them consistent but adding latency to writes. Write-back writes to the cache first and flushes to the database later, which is fast but risks data loss if the cache fails before flushing.

## Eviction policies
Caches have limited memory, so something has to be removed when they fill up. LRU (least recently used) is the most common policy — it evicts whatever hasn't been accessed in the longest time.

## Cache invalidation
The hardest part of caching is knowing when cached data is stale. Common approaches are a short TTL (time to live), explicit invalidation on writes, or event-based invalidation.

- Cache-aside is the default choice for most read-heavy workloads
- TTLs trade staleness for simplicity
- Watch for the 'thundering herd' problem when a hot key expires and many requests hit the database at once`,
    quiz: [
      {
        question: "In the cache-aside pattern, what happens on a cache miss?",
        options: [
          "The request fails",
          "The app reads from the database and populates the cache",
          "The cache is deleted",
          "Nothing, the miss is ignored",
        ],
        correctIndex: 1,
      },
      {
        question: "What is a downside of write-through caching?",
        options: [
          "It never keeps cache and database consistent",
          "It adds latency to writes since both cache and database are updated together",
          "It cannot be used with LRU",
          "It only works for read-heavy workloads",
        ],
        correctIndex: 1,
      },
      {
        question: "What does the LRU eviction policy remove first?",
        options: [
          "The most recently used item",
          "The least recently used item",
          "A random item",
          "The largest item",
        ],
        correctIndex: 1,
      },
      {
        question: "What is a common way to handle cache invalidation?",
        options: [
          "Never expire any keys",
          "Use a TTL so entries expire automatically",
          "Restart the cache server daily",
          "Disable caching for writes",
        ],
        correctIndex: 1,
      },
      {
        question: "What is the 'thundering herd' problem?",
        options: [
          "Too many cache servers",
          "When a popular cached key expires and many requests simultaneously hit the database",
          "A load balancer failure",
          "A type of database sharding",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "sql-vs-nosql",
    title: "SQL vs NoSQL",
    order: 4,
    summary: "Choosing between relational and non-relational databases.",
    content: `SQL (relational) and NoSQL (non-relational) databases make different trade-offs, and the right choice depends on your data shape, consistency needs, and scale.

## SQL databases
Relational databases (Postgres, MySQL) store data in tables with fixed schemas and support joins and multi-row transactions with strong (ACID) consistency guarantees. They're the default choice when data is relational and consistency matters, like financial records.

## NoSQL databases
NoSQL covers several models: document stores (MongoDB), key-value stores (Redis, DynamoDB), wide-column stores (Cassandra), and graph databases (Neo4j). They typically trade strict consistency and joins for flexible schemas and easier horizontal scaling.

## How to choose
Ask: does my data have complex relationships that need joins? Do I need multi-row ACID transactions? If yes, lean SQL. Is my access pattern simple key lookups at massive scale, or does my schema change frequently? If yes, lean NoSQL.

## It's rarely all-or-nothing
Many real systems use both — Postgres for the core transactional data, Redis for caching and sessions, and Elasticsearch for full-text search — each database doing what it's best at.

- SQL: strong consistency, joins, fixed schema
- NoSQL: flexible schema, horizontal scale, eventual consistency
- Most large systems are polyglot, not single-database`,
    quiz: [
      {
        question: "What is a key strength of SQL databases?",
        options: [
          "Flexible schemas",
          "Strong ACID consistency and support for joins",
          "No need for a schema",
          "Automatic horizontal sharding",
        ],
        correctIndex: 1,
      },
      {
        question: "Which of these is a document-store NoSQL database?",
        options: ["PostgreSQL", "MongoDB", "MySQL", "Oracle"],
        correctIndex: 1,
      },
      {
        question: "When is NoSQL often a better fit than SQL?",
        options: [
          "When you need multi-row ACID transactions",
          "When your schema changes frequently and access patterns are simple key lookups at scale",
          "When you need complex joins",
          "Never, SQL is always better",
        ],
        correctIndex: 1,
      },
      {
        question: "What does 'polyglot persistence' mean?",
        options: [
          "Using only one database for everything",
          "Using multiple different databases, each suited to a specific need",
          "Translating database queries between languages",
          "A type of NoSQL database",
        ],
        correctIndex: 1,
      },
      {
        question: "Which database type is Redis?",
        options: ["Relational", "Key-value store", "Graph database", "Wide-column store"],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "database-sharding-replication",
    title: "Database Sharding & Replication",
    order: 5,
    summary: "Split data across machines (sharding) and copy it across machines (replication).",
    content: `As data and traffic grow beyond what one database server can handle, two complementary techniques help: sharding (splitting data) and replication (copying data).

## Sharding
Sharding partitions a dataset across multiple database instances, each holding a subset of the data — for example, users A-M on shard 1, N-Z on shard 2. This scales both storage and write throughput, but cross-shard queries and joins become expensive or impossible, and choosing a good shard key is critical to avoid hot spots.

## Replication
Replication keeps copies of the same data on multiple servers. A primary (leader) handles writes and replicates them to one or more replicas (followers), which can serve read traffic. This scales reads and provides failover if the primary goes down, but replicas can lag behind the primary (replication lag), leading to eventually-consistent reads.

## Combining both
Large systems often shard data across many primary-replica sets: each shard scales writes and storage, while each shard's replicas scale reads and provide durability.

- Sharding scales writes and storage; pick your shard key carefully
- Replication scales reads and adds durability/failover
- Replication lag means replicas can serve slightly stale data
- Most large-scale databases combine sharding and replication`,
    quiz: [
      {
        question: "What problem does sharding primarily solve?",
        options: [
          "Read scaling only",
          "Scaling storage and write throughput by splitting data across servers",
          "Encrypting data",
          "Load balancing HTTP traffic",
        ],
        correctIndex: 1,
      },
      {
        question: "What is a major risk of a poorly chosen shard key?",
        options: [
          "Slower reads only",
          "Hot spots, where one shard receives disproportionate traffic",
          "Automatic replication failure",
          "Loss of ACID guarantees in SQL",
        ],
        correctIndex: 1,
      },
      {
        question: "In primary-replica replication, what does the primary do?",
        options: [
          "Only serves read traffic",
          "Handles writes and replicates them to replicas",
          "Nothing, it's a backup",
          "Balances load between replicas",
        ],
        correctIndex: 1,
      },
      {
        question: "What is replication lag?",
        options: [
          "The time it takes to shard a database",
          "The delay between a write on the primary and it appearing on a replica",
          "A type of load balancer delay",
          "The time to fail over shards",
        ],
        correctIndex: 1,
      },
      {
        question: "Why do large-scale systems often combine sharding and replication?",
        options: [
          "They are mutually exclusive so this is impossible",
          "Sharding scales writes/storage while replication scales reads/durability — together they cover both",
          "It's required by SQL databases",
          "Neither technique works alone under any circumstance",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "cap-theorem",
    title: "CAP Theorem",
    order: 6,
    summary: "Why distributed systems trade off consistency and availability during a partition.",
    content: `The CAP theorem states that a distributed data store can only guarantee two of three properties at the same time: Consistency, Availability, and Partition tolerance.

## The three properties
Consistency means every read receives the most recent write or an error. Availability means every request receives a (non-error) response, without guaranteeing it's the most recent write. Partition tolerance means the system keeps operating despite network failures between nodes.

## Why you can't have all three
Network partitions will happen in any real distributed system, so partition tolerance isn't really optional — the real trade-off during a partition is between consistency and availability. Either you refuse to answer until you're sure the data is fresh (CP), or you answer immediately with possibly-stale data (AP).

## CP vs AP in practice
CP systems (e.g. many configurations of HBase, Zookeeper) prioritize correctness over uptime — good for financial data. AP systems (e.g. Cassandra, DynamoDB in default mode) prioritize staying available — good for things like shopping carts or social feeds where slightly stale data is tolerable.

## Beyond CAP
In practice most systems aren't purely CP or AP; they're tunable, and many use eventual consistency with mechanisms to converge over time. PACELC extends CAP by also considering the trade-off between latency and consistency when there's no partition.

- Partitions are inevitable — the real choice is C vs A during one
- CP: correctness first, may reject requests
- AP: availability first, may serve stale data
- Most real systems are tunable, not strictly one or the other`,
    quiz: [
      {
        question: "What does the 'P' in CAP theorem stand for?",
        options: ["Performance", "Partition tolerance", "Persistence", "Processing"],
        correctIndex: 1,
      },
      {
        question:
          "According to CAP, during a network partition a system must choose between which two properties?",
        options: [
          "Consistency and Partition tolerance",
          "Consistency and Availability",
          "Availability and Partition tolerance",
          "Performance and Consistency",
        ],
        correctIndex: 1,
      },
      {
        question: "Which of these best describes an AP system?",
        options: [
          "It rejects all requests during a partition",
          "It stays available and may return stale data during a partition",
          "It never has partitions",
          "It guarantees only the freshest data at all times",
        ],
        correctIndex: 1,
      },
      {
        question: "Why is partition tolerance generally treated as non-negotiable?",
        options: [
          "It's the least important property",
          "Network partitions will happen in any real distributed system, so you must handle them",
          "It's guaranteed by all databases automatically",
          "It only matters for single-server systems",
        ],
        correctIndex: 1,
      },
      {
        question: "What does PACELC add to the CAP theorem?",
        options: [
          "A fourth consistency model",
          "A trade-off between latency and consistency even when there's no partition",
          "A requirement for SQL databases",
          "Nothing, it's the same as CAP",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "message-queues",
    title: "Message Queues",
    order: 7,
    summary: "Decouple producers and consumers, absorb spikes, and enable async processing.",
    content: `A message queue lets one part of a system (a producer) send work to another part (a consumer) asynchronously, without either needing to be available at the same time.

## Why use a queue
Queues decouple services — the producer doesn't need the consumer to be up or fast. They also smooth out traffic spikes by buffering work, and they enable retrying failed work without losing it.

## Delivery guarantees
At-most-once delivery may lose messages but never duplicates them. At-least-once delivery never loses messages but may deliver duplicates, so consumers should be idempotent. Exactly-once is the hardest to guarantee and usually built on top of at-least-once plus deduplication.

## Queues vs pub/sub
A queue typically delivers each message to one consumer (work distribution). A pub/sub system (like Kafka topics) delivers each message to every subscriber, which suits broadcasting events to multiple independent consumers.

## Common use cases
Sending emails or push notifications asynchronously, processing uploaded videos or images, and connecting microservices without tight coupling are all classic queue use cases.

- Queues decouple producers and consumers in time
- Prefer idempotent consumers under at-least-once delivery
- Use pub/sub instead of a plain queue when multiple services need the same event`,
    quiz: [
      {
        question: "What is a primary benefit of using a message queue?",
        options: [
          "It makes services tightly coupled",
          "It decouples producers and consumers so they don't need to be available simultaneously",
          "It replaces the need for a database",
          "It guarantees zero latency",
        ],
        correctIndex: 1,
      },
      {
        question: "Under at-least-once delivery, what should consumers be?",
        options: [
          "Stateless only",
          "Idempotent, since duplicate messages may be delivered",
          "Synchronous",
          "Unable to retry",
        ],
        correctIndex: 1,
      },
      {
        question: "What's the key difference between a queue and pub/sub?",
        options: [
          "A queue delivers each message to one consumer; pub/sub delivers to every subscriber",
          "They are identical",
          "Pub/sub cannot scale",
          "Queues only work with SQL databases",
        ],
        correctIndex: 0,
      },
      {
        question: "Which of these is a classic message queue use case?",
        options: [
          "Storing user passwords",
          "Asynchronously sending emails or processing uploaded videos",
          "Rendering a webpage",
          "Running a SQL join",
        ],
        correctIndex: 1,
      },
      {
        question: "What does at-most-once delivery risk?",
        options: [
          "Duplicate messages",
          "Losing messages",
          "Infinite retries",
          "Guaranteed ordering",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "cdns",
    title: "CDNs",
    order: 8,
    summary: "Serve content from servers close to users to cut latency and origin load.",
    content: `A Content Delivery Network (CDN) is a geographically distributed set of servers ('edge' servers) that cache and serve content close to where users actually are.

## Why it matters
Without a CDN, every request travels all the way to your origin server, which could be on another continent from the user. A CDN edge node close to the user can respond in milliseconds instead of hundreds of milliseconds, and it shields your origin from most of the traffic.

## What CDNs cache
Static assets — images, videos, CSS, JS, and increasingly whole HTML pages via edge caching — are the classic fit. Highly dynamic, per-user content is harder to cache and usually still goes to the origin.

## Cache invalidation and TTLs
Like any cache, CDN content needs an expiration strategy: a TTL header, or explicit invalidation ('purge') when you deploy new assets, often paired with versioned filenames (e.g. app.a1b2c3.js) so old cached files simply stop being referenced.

## Beyond static files
Modern CDNs also offer DDoS protection, TLS termination, and edge compute (running small pieces of logic at the edge), blurring the line between a CDN and a full edge platform.

- CDNs reduce latency by serving content near the user
- They reduce load on your origin servers
- Versioned filenames make cache invalidation painless
- Modern CDNs do more than caching: security, TLS, edge compute`,
    quiz: [
      {
        question: "What is the main purpose of a CDN?",
        options: [
          "To run your database",
          "To serve content from servers geographically close to users",
          "To replace your load balancer",
          "To store user passwords",
        ],
        correctIndex: 1,
      },
      {
        question: "What kind of content is the classic fit for CDN caching?",
        options: [
          "Highly personalized per-user data",
          "Static assets like images, CSS, and JS",
          "Live database writes",
          "Encryption keys",
        ],
        correctIndex: 1,
      },
      {
        question: "Why are versioned filenames (e.g. app.a1b2c3.js) useful with CDNs?",
        options: [
          "They make files smaller",
          "They let you invalidate cache simply by changing the filename referenced",
          "They are required by all browsers",
          "They speed up database queries",
        ],
        correctIndex: 1,
      },
      {
        question: "What additional capability do modern CDNs commonly provide beyond caching?",
        options: [
          "SQL query optimization",
          "DDoS protection and edge compute",
          "Automatic database sharding",
          "Message queue delivery",
        ],
        correctIndex: 1,
      },
      {
        question: "How does a CDN reduce load on the origin server?",
        options: [
          "It doesn't; origin load is unaffected",
          "By serving cached content directly from edge nodes instead of hitting the origin",
          "By slowing down requests",
          "By deleting old data",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "rate-limiting",
    title: "Rate Limiting",
    order: 9,
    summary: "Protect services from abuse and overload by limiting request rates.",
    content: `Rate limiting caps how many requests a client (a user, API key, or IP) can make in a given time window, protecting services from abuse, bugs, and traffic spikes.

## Common algorithms
Fixed window counts requests in discrete time buckets (e.g. per minute) — simple, but allows bursts at window boundaries. Sliding window smooths this out by considering a rolling time range. Token bucket allows bursts up to a bucket size while enforcing a steady average refill rate, and is popular because it's both burst-tolerant and simple to reason about. Leaky bucket processes requests at a constant rate, smoothing out bursts entirely.

## Where to enforce it
Rate limiting can live at the API gateway/edge (protects everything behind it cheaply) or inside individual services (more precise, e.g. per-endpoint limits). Many systems do both: a coarse limit at the edge, finer limits per service.

## What happens when the limit is hit
Services typically respond with HTTP 429 (Too Many Requests) and a Retry-After header, so well-behaved clients know when to try again.

## Distributed rate limiting
When requests are spread across many servers, the counter needs to be shared — usually in a fast store like Redis — so limits are enforced globally rather than per-server.

- Token bucket is a popular default: burst-tolerant, steady average rate
- Enforce at the edge for cheap protection, in-service for precision
- Respond with 429 + Retry-After
- Use a shared store (like Redis) for limits across multiple servers`,
    quiz: [
      {
        question: "What is the purpose of rate limiting?",
        options: [
          "To make responses faster for all users",
          "To cap how many requests a client can make in a given time window",
          "To cache static assets",
          "To encrypt API traffic",
        ],
        correctIndex: 1,
      },
      {
        question:
          "Which algorithm allows bursts up to a bucket size while enforcing a steady average rate?",
        options: ["Fixed window", "Token bucket", "Round robin", "LRU"],
        correctIndex: 1,
      },
      {
        question: "What HTTP status code is conventionally returned when a rate limit is exceeded?",
        options: ["200", "404", "429", "500"],
        correctIndex: 2,
      },
      {
        question: "Why is a shared store like Redis often used for rate limiting?",
        options: [
          "To store user passwords",
          "So request counters are consistent across multiple servers",
          "To replace the database entirely",
          "It's required by HTTP",
        ],
        correctIndex: 1,
      },
      {
        question: "What is a downside of the fixed window algorithm?",
        options: [
          "It's too complex to implement",
          "It can allow request bursts right at window boundaries",
          "It cannot be distributed",
          "It always under-counts requests",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "api-design-basics",
    title: "API Design Basics",
    order: 10,
    summary: "Principles for designing clear, consistent, and evolvable APIs.",
    content: `A well-designed API is a contract between your service and everyone who calls it — clients, other services, third parties — so clarity and consistency matter more than cleverness.

## REST fundamentals
REST APIs model resources as URLs (/users/123/orders) and use HTTP methods to express intent: GET (read), POST (create), PUT/PATCH (update), DELETE (remove). Status codes should be meaningful: 200s for success, 400s for client errors, 500s for server errors.

## Versioning
APIs change over time, but breaking existing clients is expensive. Common strategies include a version in the URL (/v1/users), a header, or careful additive-only changes so old clients keep working.

## Pagination and filtering
List endpoints should support pagination (cursor-based scales better than offset-based for large datasets) rather than returning unbounded result sets, plus filtering and sorting parameters for flexibility.

## Idempotency
Clients retry failed requests, so unsafe operations (like POST) benefit from an idempotency key so a retried request doesn't create a duplicate resource.

## API gateways
An API gateway sits in front of multiple backend services, handling cross-cutting concerns — auth, rate limiting, routing, logging — in one place instead of duplicating them in every service.

- Model resources as URLs, use HTTP methods for intent
- Version your API from day one
- Prefer cursor-based pagination for large lists
- Use idempotency keys for retried unsafe operations
- An API gateway centralizes cross-cutting concerns`,
    quiz: [
      {
        question: "In REST, which HTTP method is typically used to update a resource?",
        options: ["GET", "PUT/PATCH", "DELETE", "OPTIONS"],
        correctIndex: 1,
      },
      {
        question: "Why is API versioning important?",
        options: [
          "It makes APIs faster",
          "It allows APIs to evolve without breaking existing clients",
          "It's required by HTTP",
          "It replaces authentication",
        ],
        correctIndex: 1,
      },
      {
        question:
          "Why is cursor-based pagination often preferred over offset-based for large datasets?",
        options: [
          "It's simpler to implement",
          "It scales better and avoids issues when data changes between pages",
          "It doesn't require a database",
          "It's the only option REST supports",
        ],
        correctIndex: 1,
      },
      {
        question: "What problem does an idempotency key solve?",
        options: [
          "It speeds up GET requests",
          "It prevents a retried unsafe request (like POST) from creating a duplicate resource",
          "It replaces rate limiting",
          "It encrypts request bodies",
        ],
        correctIndex: 1,
      },
      {
        question: "What is a key benefit of an API gateway?",
        options: [
          "It eliminates the need for a database",
          "It centralizes cross-cutting concerns like auth and rate limiting instead of duplicating them per service",
          "It removes the need for versioning",
          "It only works with GraphQL",
        ],
        correctIndex: 1,
      },
    ],
  },
];

const problems: ProblemSeed[] = [
  {
    slug: "url-shortener",
    title: "Design a URL Shortener",
    order: 1,
    description:
      "Design a service like bit.ly that takes a long URL and returns a short one, then redirects visitors from the short URL back to the original.",
    requirements: {
      functional: [
        "Given a long URL, generate a unique short URL",
        "Visiting a short URL redirects (HTTP 3xx) to the original long URL",
        "Support optional custom aliases",
        "Support optional expiration for links",
      ],
      nonFunctional: [
        "Redirects should be low-latency (reads vastly outnumber writes)",
        "Short codes must be unique and hard to enumerate",
        "System should scale to hundreds of millions of URLs",
        "High availability for the redirect path",
      ],
    },
    referenceSolution: `## Approach
Store a mapping from a short code to the long URL in a key-value-friendly database. On creation, generate a short code (e.g. base62-encode an auto-incrementing ID, or hash the URL and take the first 7 characters, checking for collisions) and write it once. On redirect, look up the code and return an HTTP 301/302 to the long URL.

## Data model
A single table/collection: short_code (PK), long_url, created_at, expires_at, owner_id. The access pattern is a point lookup by short_code, which is exactly what key-value stores and indexed SQL tables both do well.

## Scaling reads
Redirects vastly outnumber creations, so put a cache (e.g. Redis) in front of the database keyed by short_code — most popular links get served from cache, and the database only sees cache misses and writes.

## Scaling writes and avoiding collisions
Base62-encoding a globally unique, monotonically increasing ID (e.g. from a dedicated ID-generation service or database sequence) sidesteps collision-checking entirely, at the cost of needing a scalable ID generator once you shard the database.

## Back-of-envelope
At 100M new URLs/month (~40 writes/sec average) and a 100:1 read:write ratio, redirects run at roughly 4,000 reads/sec average — comfortably handled by a cache-backed key-value store with database sharding for durability.`,
    diagram: {
      nodes: [
        { id: "client", label: "Client", x: 20, y: 160, kind: "client" },
        { id: "lb", label: "Load Balancer", x: 260, y: 160, kind: "lb" },
        { id: "service", label: "URL Service", x: 500, y: 160, kind: "service" },
        { id: "cache", label: "Cache", x: 760, y: 60, kind: "cache" },
        { id: "db", label: "Database", x: 760, y: 260, kind: "db" },
      ],
      edges: [
        { from: "client", to: "lb" },
        { from: "lb", to: "service" },
        { from: "service", to: "cache" },
        { from: "service", to: "db" },
      ],
    },
  },
  {
    slug: "rate-limiter",
    title: "Design a Rate Limiter",
    order: 2,
    description:
      "Design a rate limiting service that caps how many requests a client can make in a given time window, protecting downstream services from overload and abuse.",
    requirements: {
      functional: [
        "Limit requests per client (e.g. per API key or user ID) to N requests per time window",
        "Return HTTP 429 with a Retry-After header when the limit is exceeded",
        "Support different limits for different clients or tiers",
      ],
      nonFunctional: [
        "Adding the limiter should add minimal latency to each request",
        "Limits must be enforced correctly even when requests hit different servers",
        "The limiter itself must not become a single point of failure",
      ],
    },
    referenceSolution: `## Approach
Use the token bucket algorithm: each client has a bucket with a maximum capacity and a refill rate. Each request consumes one token; if the bucket is empty, the request is rejected with 429. This allows short bursts while enforcing a steady average rate.

## Where state lives
Bucket state (tokens remaining, last refill time) must be shared across all servers handling requests, so it lives in a fast, shared store like Redis rather than in-process memory — otherwise each server would enforce its own independent limit.

## Enforcement point
A lightweight check at the API gateway/edge protects all downstream services cheaply and consistently, before a request ever reaches business logic.

## Making it fast and correct
The check-and-decrement operation on the bucket must be atomic to avoid race conditions under concurrent requests — implemented as a single Lua script or atomic command in Redis rather than a separate read-then-write.

## Back-of-envelope
A Redis-backed check adds roughly 1-2ms of latency per request, which is negligible compared to typical service response times, even at tens of thousands of requests per second.`,
    diagram: {
      nodes: [
        { id: "client", label: "Client", x: 20, y: 160, kind: "client" },
        { id: "gateway", label: "API Gateway", x: 260, y: 160, kind: "lb" },
        { id: "limiter", label: "Rate Limiter", x: 500, y: 60, kind: "service" },
        { id: "cache", label: "Redis (buckets)", x: 740, y: 60, kind: "cache" },
        { id: "service", label: "Backend Service", x: 500, y: 260, kind: "service" },
      ],
      edges: [
        { from: "client", to: "gateway" },
        { from: "gateway", to: "limiter" },
        { from: "limiter", to: "cache" },
        { from: "gateway", to: "service" },
      ],
    },
  },
  {
    slug: "chat-app",
    title: "Design a Chat App (Basic)",
    order: 3,
    description:
      "Design a basic real-time one-to-one and group chat application, similar to a simple WhatsApp/Slack core: users can send and receive messages in near real-time.",
    requirements: {
      functional: [
        "Users can send a message to another user or a group and have it delivered in near real-time",
        "Message history is persisted and retrievable when a user opens a conversation",
        "Users can see whether they're online (basic presence)",
      ],
      nonFunctional: [
        "Low latency message delivery (sub-second)",
        "Messages must not be lost even if a recipient is briefly offline",
        "System should scale to millions of concurrent connections",
      ],
    },
    referenceSolution: `## Approach
Clients hold a persistent connection (WebSocket) to a chat server. When a message is sent, the server persists it to a database and pushes it to the recipient's active connection if they're online; if offline, it's delivered on next connect (and optionally triggers a push notification).

## Connection management
Because WebSocket connections are stateful and long-lived, a connection-routing layer (e.g. a lookup in Redis of "which chat server is user X connected to") is needed so any server can find where to deliver a message meant for a specific user.

## Data model
Messages are stored keyed by conversation_id with a timestamp/sequence number, which supports efficient retrieval of a conversation's history in order, typically via a wide-column or document store for write-heavy, append-mostly access patterns.

## Fan-out for groups
For group chats, a new message fans out to every member's active connection; for very large groups this fan-out is done asynchronously via a queue rather than synchronously in the request path.

## Back-of-envelope
At 10M daily active users sending 20 messages/day each, that's roughly 2,300 messages/sec average, with connection state (millions of concurrent WebSockets) as the main scaling challenge rather than message throughput itself.`,
    diagram: {
      nodes: [
        { id: "client", label: "Client", x: 20, y: 160, kind: "client" },
        { id: "gateway", label: "WS Gateway", x: 260, y: 160, kind: "lb" },
        { id: "chat", label: "Chat Service", x: 500, y: 160, kind: "service" },
        { id: "cache", label: "Presence/Routing", x: 740, y: 40, kind: "cache" },
        { id: "db", label: "Message Store", x: 740, y: 160, kind: "db" },
        { id: "queue", label: "Fan-out Queue", x: 740, y: 280, kind: "queue" },
      ],
      edges: [
        { from: "client", to: "gateway" },
        { from: "gateway", to: "chat" },
        { from: "chat", to: "cache" },
        { from: "chat", to: "db" },
        { from: "chat", to: "queue" },
      ],
    },
  },
  {
    slug: "notification-system",
    title: "Design a Notification System",
    order: 4,
    description:
      "Design a system that sends notifications (push, email, SMS) to users triggered by events elsewhere in the platform, such as 'someone liked your post' or 'your order shipped'.",
    requirements: {
      functional: [
        "Accept notification requests from other internal services (event-driven)",
        "Deliver notifications via multiple channels: push, email, SMS",
        "Respect user preferences (e.g. muted channels, quiet hours)",
        "Retry failed deliveries",
      ],
      nonFunctional: [
        "The notification system must not slow down or block the services that trigger notifications",
        "At-least-once delivery — better a duplicate than a lost notification",
        "Scale to sending millions of notifications per day across providers",
      ],
    },
    referenceSolution: `## Approach
Other services publish notification events to a message queue rather than calling the notification system synchronously — this decouples the two, so a slow or down notification system never blocks e.g. checkout or posting a comment.

## Processing pipeline
Workers consume events from the queue, look up the target user's channel preferences, render the appropriate template per channel, and hand off delivery to channel-specific services (push provider, email provider, SMS provider).

## Reliability
Each channel delivery is retried with exponential backoff on failure, and the queue's at-least-once semantics mean workers must be idempotent (e.g. dedupe by a notification_id) so retries or re-processing don't send duplicates to the user.

## Respecting preferences
A user-preferences store (simple key-value: user_id, channel, enabled) is checked before sending anything, and can also encode quiet hours to defer non-urgent notifications.

## Back-of-envelope
At 50M notifications/day (~580/sec average, several times that at peak), a queue-backed worker pool scales horizontally by adding more consumers, independent of how fast the triggering services run.`,
    diagram: {
      nodes: [
        { id: "trigger", label: "Triggering Service", x: 20, y: 160, kind: "service" },
        { id: "queue", label: "Event Queue", x: 280, y: 160, kind: "queue" },
        { id: "worker", label: "Notification Worker", x: 540, y: 160, kind: "service" },
        { id: "prefs", label: "Preferences DB", x: 780, y: 40, kind: "db" },
        { id: "providers", label: "Push / Email / SMS", x: 780, y: 280, kind: "cdn" },
      ],
      edges: [
        { from: "trigger", to: "queue" },
        { from: "queue", to: "worker" },
        { from: "worker", to: "prefs" },
        { from: "worker", to: "providers" },
      ],
    },
  },
  {
    slug: "ecommerce-checkout",
    title: "Design an E-commerce Checkout",
    order: 5,
    description:
      "Design the checkout flow for an e-commerce platform: a user reviews their cart, provides payment, and the system reserves inventory and creates an order — reliably, even under partial failures.",
    requirements: {
      functional: [
        "User can review cart and submit an order with a payment method",
        "System reserves inventory for items in the order before charging",
        "Payment is processed via a third-party payment provider",
        "User receives order confirmation; failed payments roll back inventory reservation",
      ],
      nonFunctional: [
        "No overselling: inventory must not go negative under concurrent checkouts",
        "Checkout must be resilient to partial failures (e.g. payment succeeds but order-write fails)",
        "Reasonable latency for the user-facing checkout request (a few seconds)",
      ],
    },
    referenceSolution: `## Approach
Checkout is a multi-step process that must stay consistent even if a step fails partway through: reserve inventory, charge payment, create the order record, and release the reservation if any step fails.

## Avoiding overselling
Inventory reservation uses an atomic conditional decrement (e.g. UPDATE inventory SET qty = qty - 1 WHERE product_id = ? AND qty > 0) so concurrent checkouts for the last unit can't both succeed — the database's row-level locking or a compare-and-swap enforces this.

## Handling partial failures
Because payment and order-creation touch different systems, a saga pattern (a sequence of local transactions with compensating actions) keeps things consistent: if payment fails, release the inventory reservation; if the order-write fails after payment succeeded, retry the write or refund and release inventory.

## Idempotency
The checkout request itself should carry an idempotency key so a user's accidental double-click (or a client retry after a timeout) doesn't create two orders or charge twice.

## Asynchronous follow-up
Once the order is confirmed, non-critical follow-up work — sending a confirmation email, notifying the warehouse — is pushed to a queue rather than done synchronously, keeping the user-facing checkout fast.

## Back-of-envelope
At 500,000 orders/day (~6 orders/sec average, higher at peak sale events), the main scaling concern isn't raw throughput but correctness under concurrency — the inventory decrement must remain atomic even as write volume grows.`,
    diagram: {
      nodes: [
        { id: "client", label: "Client", x: 20, y: 160, kind: "client" },
        { id: "service", label: "Checkout Service", x: 280, y: 160, kind: "service" },
        { id: "db", label: "Inventory / Orders DB", x: 540, y: 60, kind: "db" },
        { id: "payment", label: "Payment Provider", x: 540, y: 260, kind: "cdn" },
        { id: "queue", label: "Follow-up Queue", x: 800, y: 160, kind: "queue" },
      ],
      edges: [
        { from: "client", to: "service" },
        { from: "service", to: "db" },
        { from: "service", to: "payment" },
        { from: "service", to: "queue" },
      ],
    },
  },
];

async function main() {
  for (const moduleSeed of modules) {
    await prisma.module.upsert({
      where: { slug: moduleSeed.slug },
      update: {
        title: moduleSeed.title,
        order: moduleSeed.order,
        summary: moduleSeed.summary,
        content: moduleSeed.content,
        quizJson: moduleSeed.quiz as never,
      },
      create: {
        slug: moduleSeed.slug,
        title: moduleSeed.title,
        order: moduleSeed.order,
        summary: moduleSeed.summary,
        content: moduleSeed.content,
        quizJson: moduleSeed.quiz as never,
      },
    });
    console.log(`Seeded module: ${moduleSeed.title}`);
  }

  for (const problem of problems) {
    const referenceDiagramJson = buildDiagramSnapshot(problem.diagram.nodes, problem.diagram.edges);

    await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: {
        title: problem.title,
        order: problem.order,
        description: problem.description,
        requirements: problem.requirements,
        referenceSolution: problem.referenceSolution,
        referenceDiagramJson: referenceDiagramJson as never,
      },
      create: {
        slug: problem.slug,
        title: problem.title,
        order: problem.order,
        description: problem.description,
        requirements: problem.requirements,
        referenceSolution: problem.referenceSolution,
        referenceDiagramJson: referenceDiagramJson as never,
      },
    });
    console.log(`Seeded problem: ${problem.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
