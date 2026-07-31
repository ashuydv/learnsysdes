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

type QuestionDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

interface QuestionSeed {
  slug: string;
  question: string;
  answer: string;
  difficulty: QuestionDifficulty;
  order: number;
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
          "It only works for stateless services",
          "It requires more code changes",
          "There's a hard ceiling on how much a single machine can be upgraded",
          "It's more expensive than horizontal scaling in all cases",
        ],
        correctIndex: 2,
      },
      {
        question: "Why are stateless services easier to scale horizontally?",
        options: [
          "They run faster than stateful services",
          "Any instance can handle any request without session affinity",
          "They use less memory",
          "They don't need a database",
        ],
        correctIndex: 1,
      },
      {
        question: "What typically happens when you scale out the application layer alone?",
        options: [
          "The bottleneck usually shifts to the database",
          "No further scaling is needed",
          "The system becomes infinitely scalable",
          "Latency always decreases to zero",
        ],
        correctIndex: 0,
      },
      {
        question: "Which is an example of horizontal scaling?",
        options: [
          "Upgrading a server's RAM from 32GB to 128GB",
          "Using a bigger hard drive",
          "Adding more servers behind a load balancer",
          "Adding a faster CPU to an existing server",
        ],
        correctIndex: 2,
      },
      {
        question: "What technique helps a stateful service scale out safely?",
        options: [
          "Ignoring session data",
          "Removing the load balancer",
          "Sticky sessions or externalizing state to a shared store like Redis",
          "Vertical scaling only",
        ],
        correctIndex: 2,
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
          "To distribute incoming requests across multiple servers",
          "To compress images",
          "To encrypt traffic",
          "To store data permanently",
        ],
        correctIndex: 0,
      },
      {
        question:
          "Which load balancing algorithm routes new requests to the server with the fewest active connections?",
        options: [
          "Least connections",
          "Random",
          "Round robin",
          "Sticky sessions",
        ],
        correctIndex: 0,
      },
      {
        question: "What is a key difference between Layer 4 and Layer 7 load balancing?",
        options: [
          "Layer 4 is slower than Layer 7",
          "There is no difference",
          "Layer 7 can route based on HTTP content like path or headers, Layer 4 cannot",
          "Layer 4 only works with HTTPS",
        ],
        correctIndex: 2,
      },
      {
        question: "What do health checks allow a load balancer to do?",
        options: [
          "Cache responses",
          "Increase server capacity",
          "Encrypt traffic automatically",
          "Stop routing traffic to unhealthy servers",
        ],
        correctIndex: 3,
      },
      {
        question: "Why do production systems often run more than one load balancer?",
        options: [
          "To support round robin",
          "Because DNS requires it",
          "Because a single load balancer is a single point of failure",
          "To reduce cost",
        ],
        correctIndex: 2,
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
          "Nothing, the miss is ignored",
          "The app reads from the database and populates the cache",
          "The request fails",
          "The cache is deleted",
        ],
        correctIndex: 1,
      },
      {
        question: "What is a downside of write-through caching?",
        options: [
          "It only works for read-heavy workloads",
          "It adds latency to writes since both cache and database are updated together",
          "It never keeps cache and database consistent",
          "It cannot be used with LRU",
        ],
        correctIndex: 1,
      },
      {
        question: "What does the LRU eviction policy remove first?",
        options: [
          "The most recently used item",
          "A random item",
          "The largest item",
          "The least recently used item",
        ],
        correctIndex: 3,
      },
      {
        question: "What is a common way to handle cache invalidation?",
        options: [
          "Use a TTL so entries expire automatically",
          "Restart the cache server daily",
          "Disable caching for writes",
          "Never expire any keys",
        ],
        correctIndex: 0,
      },
      {
        question: "What is the 'thundering herd' problem?",
        options: [
          "A type of database sharding",
          "A load balancer failure",
          "When a popular cached key expires and many requests simultaneously hit the database",
          "Too many cache servers",
        ],
        correctIndex: 2,
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
          "Automatic horizontal sharding",
          "No need for a schema",
          "Strong ACID consistency and support for joins",
        ],
        correctIndex: 3,
      },
      {
        question: "Which of these is a document-store NoSQL database?",
        options: [
          "MongoDB",
          "MySQL",
          "PostgreSQL",
          "Oracle",
        ],
        correctIndex: 0,
      },
      {
        question: "When is NoSQL often a better fit than SQL?",
        options: [
          "When your schema changes frequently and access patterns are simple key lookups at scale",
          "Never, SQL is always better",
          "When you need multi-row ACID transactions",
          "When you need complex joins",
        ],
        correctIndex: 0,
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
        options: [
          "Relational",
          "Graph database",
          "Key-value store",
          "Wide-column store",
        ],
        correctIndex: 2,
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
          "Encrypting data",
          "Load balancing HTTP traffic",
          "Read scaling only",
          "Scaling storage and write throughput by splitting data across servers",
        ],
        correctIndex: 3,
      },
      {
        question: "What is a major risk of a poorly chosen shard key?",
        options: [
          "Loss of ACID guarantees in SQL",
          "Slower reads only",
          "Hot spots, where one shard receives disproportionate traffic",
          "Automatic replication failure",
        ],
        correctIndex: 2,
      },
      {
        question: "In primary-replica replication, what does the primary do?",
        options: [
          "Nothing, it's a backup",
          "Handles writes and replicates them to replicas",
          "Only serves read traffic",
          "Balances load between replicas",
        ],
        correctIndex: 1,
      },
      {
        question: "What is replication lag?",
        options: [
          "The time to fail over shards",
          "A type of load balancer delay",
          "The delay between a write on the primary and it appearing on a replica",
          "The time it takes to shard a database",
        ],
        correctIndex: 2,
      },
      {
        question: "Why do large-scale systems often combine sharding and replication?",
        options: [
          "They are mutually exclusive so this is impossible",
          "Neither technique works alone under any circumstance",
          "Sharding scales writes/storage while replication scales reads/durability — together they cover both",
          "It's required by SQL databases",
        ],
        correctIndex: 2,
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
        options: [
          "Processing",
          "Performance",
          "Partition tolerance",
          "Persistence",
        ],
        correctIndex: 2,
      },
      {
        question:
          "According to CAP, during a network partition a system must choose between which two properties?",
        options: [
          "Performance and Consistency",
          "Consistency and Partition tolerance",
          "Availability and Partition tolerance",
          "Consistency and Availability",
        ],
        correctIndex: 3,
      },
      {
        question: "Which of these best describes an AP system?",
        options: [
          "It guarantees only the freshest data at all times",
          "It never has partitions",
          "It rejects all requests during a partition",
          "It stays available and may return stale data during a partition",
        ],
        correctIndex: 3,
      },
      {
        question: "Why is partition tolerance generally treated as non-negotiable?",
        options: [
          "It's the least important property",
          "It's guaranteed by all databases automatically",
          "It only matters for single-server systems",
          "Network partitions will happen in any real distributed system, so you must handle them",
        ],
        correctIndex: 3,
      },
      {
        question: "What does PACELC add to the CAP theorem?",
        options: [
          "Nothing, it's the same as CAP",
          "A requirement for SQL databases",
          "A trade-off between latency and consistency even when there's no partition",
          "A fourth consistency model",
        ],
        correctIndex: 2,
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
          "It decouples producers and consumers so they don't need to be available simultaneously",
          "It guarantees zero latency",
          "It makes services tightly coupled",
          "It replaces the need for a database",
        ],
        correctIndex: 0,
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
          "Pub/sub cannot scale",
          "A queue delivers each message to one consumer; pub/sub delivers to every subscriber",
          "They are identical",
          "Queues only work with SQL databases",
        ],
        correctIndex: 1,
      },
      {
        question: "Which of these is a classic message queue use case?",
        options: [
          "Rendering a webpage",
          "Asynchronously sending emails or processing uploaded videos",
          "Storing user passwords",
          "Running a SQL join",
        ],
        correctIndex: 1,
      },
      {
        question: "What does at-most-once delivery risk?",
        options: [
          "Losing messages",
          "Infinite retries",
          "Duplicate messages",
          "Guaranteed ordering",
        ],
        correctIndex: 0,
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
          "To serve content from servers geographically close to users",
          "To store user passwords",
          "To replace your load balancer",
          "To run your database",
        ],
        correctIndex: 0,
      },
      {
        question: "What kind of content is the classic fit for CDN caching?",
        options: [
          "Encryption keys",
          "Static assets like images, CSS, and JS",
          "Live database writes",
          "Highly personalized per-user data",
        ],
        correctIndex: 1,
      },
      {
        question: "Why are versioned filenames (e.g. app.a1b2c3.js) useful with CDNs?",
        options: [
          "They speed up database queries",
          "They let you invalidate cache simply by changing the filename referenced",
          "They make files smaller",
          "They are required by all browsers",
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
          "By deleting old data",
          "By serving cached content directly from edge nodes instead of hitting the origin",
          "By slowing down requests",
        ],
        correctIndex: 2,
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
          "To cache static assets",
          "To encrypt API traffic",
          "To cap how many requests a client can make in a given time window",
          "To make responses faster for all users",
        ],
        correctIndex: 2,
      },
      {
        question:
          "Which algorithm allows bursts up to a bucket size while enforcing a steady average rate?",
        options: [
          "LRU",
          "Token bucket",
          "Round robin",
          "Fixed window",
        ],
        correctIndex: 1,
      },
      {
        question: "What HTTP status code is conventionally returned when a rate limit is exceeded?",
        options: [
          "500",
          "429",
          "200",
          "404",
        ],
        correctIndex: 1,
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
          "It always under-counts requests",
          "It can allow request bursts right at window boundaries",
          "It's too complex to implement",
          "It cannot be distributed",
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
        options: [
          "PUT/PATCH",
          "GET",
          "OPTIONS",
          "DELETE",
        ],
        correctIndex: 0,
      },
      {
        question: "Why is API versioning important?",
        options: [
          "It replaces authentication",
          "It makes APIs faster",
          "It's required by HTTP",
          "It allows APIs to evolve without breaking existing clients",
        ],
        correctIndex: 3,
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
          "It encrypts request bodies",
          "It replaces rate limiting",
          "It speeds up GET requests",
          "It prevents a retried unsafe request (like POST) from creating a duplicate resource",
        ],
        correctIndex: 3,
      },
      {
        question: "What is a key benefit of an API gateway?",
        options: [
          "It only works with GraphQL",
          "It centralizes cross-cutting concerns like auth and rate limiting instead of duplicating them per service",
          "It removes the need for versioning",
          "It eliminates the need for a database",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "availability-consistency-patterns",
    title: "Availability & Consistency Patterns",
    order: 11,
    summary: "How systems stay up and stay correct, and why you usually can't max out both.",
    content: `Once a system spans multiple machines, two questions come up constantly: will it stay up when something fails, and will every reader see the same, correct data. These pull in different directions, so most designs pick a deliberate point on the spectrum instead of chasing perfection on both.

## Availability patterns

### Fail-over
Fail-over keeps a standby ready to take over when the primary goes down.
- **Active-passive**: one node serves traffic while a standby stays idle, watching via heartbeat. On failure, the standby is promoted. Simple, but the standby's capacity sits unused most of the time.
- **Active-active**: multiple nodes serve traffic simultaneously, so there's no idle capacity and failing over is just routing around the dead node. It requires the nodes to be able to serve requests independently or coordinate state.

### Replication
Replication keeps copies of data on multiple nodes so a single node failure does not mean data loss.
- **Master-slave**: the master handles writes and replicates to slaves, which serve reads. Read scaling is easy; a master failure needs a promotion step.
- **Master-master**: multiple masters accept writes and replicate to each other. Removes the single write bottleneck, but conflicting concurrent writes to the same record need a resolution strategy.

### Availability in numbers
Availability is usually expressed in "nines": 99.9% (three nines) allows about 8.7 hours of downtime a year; 99.99% (four nines) allows about 52 minutes. Each additional nine is an order of magnitude harder and more expensive to achieve.
When components are in sequence, overall availability is the product of each one's availability, so it drops below the weakest link. When components are in parallel (redundant), overall availability improves, since all of them would have to fail together.

## Consistency patterns
Consistency is about whether every read sees the most recent write, and how strictly that is enforced across replicas.

- **Weak consistency**: after a write, reads may or may not see it. Common in real-time systems like video chat or multiplayer games, where a stale frame is better than a stalled one.
- **Eventual consistency**: after a write, reads will eventually see it, typically within milliseconds, once replication catches up. DNS and many NoSQL stores work this way; it favors availability over immediacy.
- **Strong consistency**: after a write, all subsequent reads see it immediately, usually by having writes replicate synchronously before acknowledging. This is what relational databases default to, at the cost of higher write latency.

## Why you can't have it all
The CAP theorem states that under a network partition, a system must choose between consistency and availability. AP systems keep responding but might return stale data; CP systems refuse to respond rather than return possibly-wrong data. This is only relevant during a partition; most of the time, well-designed systems give you both.

- Fail-over (active-passive or active-active) is how availability survives node failure
- Replication (master-slave or master-master) is how data survives node failure
- Nines are multiplicative in sequence, improved in parallel
- Pick weak, eventual, or strong consistency deliberately based on what the data represents, not by default`,
    quiz: [
      {
        question: "What is the main tradeoff of an active-passive fail-over setup?",
        options: [
          "It cannot detect failures",
          "It only works with NoSQL databases",
          "The standby node's capacity is unused until a fail-over happens",
          "It requires strong consistency",
        ],
        correctIndex: 2,
      },
      {
        question: "In master-master replication, what new problem does removing the single-master write bottleneck introduce?",
        options: [
          "Reads become impossible",
          "Conflicting concurrent writes to the same record need a resolution strategy",
          "It requires active-passive fail-over",
          "Replication is no longer needed",
        ],
        correctIndex: 1,
      },
      {
        question: "Roughly how much downtime per year does 99.99% (four nines) availability allow?",
        options: [
          "About 8.7 hours",
          "About 52 minutes",
          "About 5 minutes",
          "Zero downtime",
        ],
        correctIndex: 1,
      },
      {
        question: "For a chain of components in sequence, how does overall availability behave?",
        options: [
          "It equals the most available component",
          "It is the product of each component's availability, so it drops below the weakest link",
          "It always improves with more components",
          "It is unrelated to individual component availability",
        ],
        correctIndex: 1,
      },
      {
        question: "Under a network partition, what does the CAP theorem say a system must choose between?",
        options: [
          "Latency and throughput",
          "Consistency and availability",
          "SQL and NoSQL",
          "Replication and sharding",
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "dns-communication-protocols",
    title: "DNS & Communication Protocols",
    order: 12,
    summary: "How a request finds its way to a server, and the protocol choices for talking once it gets there.",
    content: `Before any system design conversation gets to load balancers and databases, a request has to find the right server and speak a protocol it understands. DNS handles the first part; HTTP, TCP, UDP, and the RPC/REST/GraphQL family handle the second.

## DNS
The Domain Name System translates a human-readable hostname into an IP address. A lookup typically walks through a chain: browser and OS cache, a recursive resolver, root servers, TLD servers, and finally the authoritative name server for the domain, which returns the IP. Results are cached at each layer according to a TTL, trading freshness for fewer round trips. DNS itself is a good example of eventual consistency: propagating a DNS change worldwide can take from minutes to the TTL's full duration.

## TCP vs UDP
- **TCP** is connection-oriented: it establishes a handshake, guarantees ordered delivery, and retransmits lost packets. That reliability costs latency and overhead, which is why it's the default for HTTP, database connections, and anything where correctness matters more than speed.
- **UDP** is connectionless: it fires packets with no delivery guarantee and no ordering. It's faster and lower-overhead, which is why it's used for video streaming, VoIP, and DNS lookups, cases where a dropped packet is cheaper to ignore than to wait for a retransmit.

## Idempotent operations
An operation is idempotent if performing it multiple times has the same effect as performing it once. GET, PUT, and DELETE are idempotent by definition in HTTP; POST is not. This matters directly for retries: a client (or a proxy, or a flaky network) can safely retry an idempotent request without worrying about duplicate side effects, but retrying a POST might create the same order twice unless the server adds its own idempotency key.

## RPC vs REST vs gRPC vs GraphQL
- **RPC** (remote procedure call) exposes server-side functions that a client calls as if they were local. It's tightly coupled to a specific function signature, but efficient for internal service-to-service calls.
- **REST** models the API as resources and URLs, using HTTP verbs to express intent. It's widely understood, cacheable via HTTP semantics, and a natural fit for public APIs.
- **gRPC** is Google's RPC framework built on HTTP/2 and Protocol Buffers. It supports streaming in both directions and is significantly faster than JSON-over-HTTP, making it a common choice for internal microservice communication.
- **GraphQL** lets the client specify exactly which fields it needs in a single request, instead of the server dictating a fixed response shape per endpoint. This avoids the classic REST problems of over-fetching (getting fields you don't need) and under-fetching (needing several round trips to assemble one screen).

- DNS resolution is cached at multiple layers and is itself eventually consistent
- TCP trades speed for reliability; UDP trades reliability for speed
- Only GET, PUT, and DELETE are idempotent by default in HTTP; POST needs an explicit idempotency key
- Choose REST for public, cacheable APIs; gRPC for fast internal service calls; GraphQL when clients need flexible, precise data shapes`,
    quiz: [
      {
        question: "What does a DNS resolver primarily do?",
        options: [
          "Encrypts HTTP traffic",
          "Translates a hostname into an IP address",
          "Load-balances requests across servers",
          "Compresses response payloads",
        ],
        correctIndex: 1,
      },
      {
        question: "Why is UDP preferred over TCP for video streaming and VoIP?",
        options: [
          "UDP guarantees delivery of every packet",
          "UDP is lower-overhead and faster, and a dropped packet is cheaper to skip than to wait for a retransmit",
          "UDP requires a handshake before sending data",
          "TCP cannot be used over the internet",
        ],
        correctIndex: 1,
      },
      {
        question: "Which HTTP method is NOT idempotent by default?",
        options: [
          "GET",
          "PUT",
          "DELETE",
          "POST",
        ],
        correctIndex: 3,
      },
      {
        question: "What problem does GraphQL solve that plain REST endpoints often have?",
        options: [
          "It removes the need for a network request entirely",
          "It replaces TCP with UDP",
          "Over-fetching and under-fetching, by letting clients specify exactly which fields they need",
          "It guarantees strong consistency",
        ],
        correctIndex: 2,
      },
      {
        question: "Why is gRPC often chosen for internal service-to-service communication?",
        options: [
          "It only works with GraphQL clients",
          "It requires no serialization format",
          "It is built on HTTP/2 and Protocol Buffers, making it faster than JSON-over-HTTP with support for streaming",
          "It replaces the need for DNS",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    slug: "performance-antipatterns",
    title: "Performance Antipatterns",
    order: 13,
    summary: "Recurring mistakes that quietly tank performance, and how to spot them before they ship.",
    content: `Most performance problems in production aren't exotic; they're a small set of recurring antipatterns showing up in a new place. Recognizing the pattern is often faster than profiling from scratch.

## Busy Database / Busy Frontend
Offloading too much processing onto the database (heavy computation in queries, business logic in stored procedures) makes the database the bottleneck, since it's usually the hardest layer to scale horizontally. The same problem in reverse, a busy frontend, happens when the client does work that belongs on the server, like processing large datasets in the browser instead of paginating server-side.

## Chatty I/O
Chatty I/O is making many small requests to a resource (a database, an API, a file system) instead of batching them into fewer, larger ones. Each request carries fixed overhead (network round trip, connection setup), so 100 single-row queries in a loop are far slower than one batched query, even though the total data transferred is similar.

## Extraneous Fetching
Extraneous fetching pulls more data than the request actually needs, such as a SELECT * that returns 40 columns when only 3 are used. It wastes bandwidth and memory, and it gets worse as the table grows, since the waste scales with the unused data, not the useful data.

## Improper Instantiation
Improper instantiation repeatedly creates a new instance of an object that's expensive to construct (a database connection, an HTTP client) when it should be created once and reused. This shows up as unexplained latency spikes and connection exhaustion under load, since setup cost is paid on every request instead of once.

## Monolithic Persistence
Monolithic persistence uses a single data store for every kind of data (transactional records, logs, session state, files) regardless of how differently each is accessed. Different access patterns usually want different storage: a relational database for transactional data, a blob store for files, a cache for session state.

## No Caching
Recomputing or re-fetching the same expensive result on every request, when the underlying data barely changes, wastes capacity that caching would give back for free. The instinct to skip caching "to keep things simple" often ends up being the single largest performance cost in a design.

## Noisy Neighbor
In a multi-tenant system, one tenant's spike in usage can degrade performance for every other tenant sharing the same resources, if there's no isolation or per-tenant limits. This is why rate limiting and resource quotas per tenant matter even when the system as a whole has capacity to spare.

## Synchronous I/O / Retry Storm
Blocking a thread on synchronous I/O ties up a resource (a thread, a connection) for the entire duration of a slow call, when it could be freed to do other work. Compounding this, naive retry logic without backoff can create a retry storm: a struggling downstream service gets hit with a wave of immediate retries right when it's least able to handle them, turning a brief blip into an outage.

- Batch I/O instead of making many small chatty calls
- Fetch only the fields and rows you actually need
- Reuse expensive-to-create objects like connections and clients
- Cache expensive, slow-changing results by default, not as an afterthought
- Isolate tenants and add backoff to retries so one bad actor or one bad blip doesn't cascade`,
    quiz: [
      {
        question: "What is \"chatty I/O\"?",
        options: [
          "Using too much bandwidth on a single large request",
          "Making many small requests instead of batching them into fewer, larger ones",
          "Logging too many debug messages",
          "Using UDP instead of TCP",
        ],
        correctIndex: 1,
      },
      {
        question: "What does \"extraneous fetching\" describe?",
        options: [
          "Caching too aggressively",
          "Retrying a failed request too many times",
          "Fetching more data than the request actually needs, like SELECT * when only a few columns are used",
          "Creating a new database connection per request",
        ],
        correctIndex: 2,
      },
      {
        question: "What is the fix for \"improper instantiation\" of an expensive object like a database connection?",
        options: [
          "Create it once and reuse it instead of constructing it on every request",
          "Always create a fresh one per request for isolation",
          "Move it to the frontend",
          "Replace it with a stored procedure",
        ],
        correctIndex: 0,
      },
      {
        question: "What is a \"noisy neighbor\" problem?",
        options: [
          "A caching bug that serves stale data",
          "One tenant's usage spike degrading performance for other tenants sharing the same resources",
          "A DNS misconfiguration",
          "A database running out of disk space",
        ],
        correctIndex: 1,
      },
      {
        question: "What can naive retry logic without backoff cause during a downstream outage?",
        options: [
          "It has no effect on the downstream service",
          "It automatically caches the failed response",
          "A retry storm, where a wave of immediate retries hits the struggling service right when it's least able to handle them",
          "It converts synchronous calls into asynchronous ones",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    slug: "monitoring-observability",
    title: "Monitoring & Observability",
    order: 14,
    summary: "How to know a system is healthy, and how to find out why it isn't.",
    content: `A system you can't observe is a system you can only guess about. Monitoring turns "it feels slow" into a specific, actionable signal, and gives you the trail to follow when something breaks.

## What to monitor
- **Health monitoring**: is each instance up and responding, typically via a lightweight health check endpoint that a load balancer or orchestrator polls.
- **Availability monitoring**: is the system reachable and serving traffic from the outside, often checked from multiple regions to catch regional outages.
- **Performance monitoring**: latency, throughput, and error rates, usually tracked as percentiles (p50, p95, p99) rather than averages, since an average hides the slow requests that actually hurt users.
- **Security monitoring**: unusual access patterns, failed auth attempts, and anomalous traffic that might indicate an attack in progress.
- **Usage monitoring**: how the system is actually being used, which features, which endpoints, which customers, informing both capacity planning and product decisions.

## Instrumentation
Instrumentation is the code that emits the data monitoring depends on: metrics (numeric time series like request count or latency), logs (discrete timestamped events with context), and traces (the path a single request takes across services, useful for pinpointing which hop in a distributed call chain is slow). Good instrumentation is added deliberately at the boundaries that matter (entry points, external calls, expensive operations), not sprinkled everywhere, since excessive instrumentation adds overhead and noise.

## Visualization and alerts
Dashboards turn raw metrics into something a human can scan in seconds; alerts turn a metric crossing a threshold into a page. The design tension is alert fatigue: too many low-signal alerts train people to ignore them, so the one alert that matters gets missed. Alerts should be actionable (something a human can actually do in response) and tied to symptoms users would notice (elevated error rate, high latency) rather than every internal fluctuation.

## Why percentiles over averages
If 95 out of 100 requests take 50ms and 5 take 5000ms, the average looks fine at around 300ms, but 5% of users are having a terrible experience. p95 and p99 latency surface that tail directly, which is why they're the standard metric for performance monitoring rather than the mean.

- Track health, availability, performance, security, and usage separately; they answer different questions
- Use metrics for trends, logs for context, and traces for pinpointing where in a distributed request things went wrong
- Prefer p95/p99 latency over averages, since averages hide the slow tail that hurts real users
- Alert on user-visible symptoms and keep alerts actionable to avoid alert fatigue`,
    quiz: [
      {
        question: "Why is p95 or p99 latency preferred over average latency for performance monitoring?",
        options: [
          "Percentiles are cheaper to compute",
          "Averages can hide a slow tail of requests that significantly hurts a subset of users",
          "Percentiles don't require instrumentation",
          "Averages only work for error rates, not latency",
        ],
        correctIndex: 1,
      },
      {
        question: "What is the main difference between metrics, logs, and traces?",
        options: [
          "They are three names for the same thing",
          "Metrics are numeric time series for trends, logs are timestamped events with context, and traces follow a single request across services",
          "Logs are only used for security monitoring",
          "Traces replace the need for metrics",
        ],
        correctIndex: 1,
      },
      {
        question: "What is \"alert fatigue\"?",
        options: [
          "A server running out of memory from too many alerts",
          "When too many low-signal alerts train people to ignore alerts, causing the important one to get missed",
          "A monitoring tool that only supports a limited number of alerts",
          "The delay between an incident and its alert firing",
        ],
        correctIndex: 1,
      },
      {
        question: "What does availability monitoring typically check?",
        options: [
          "Whether the system is reachable and serving traffic from the outside, often from multiple regions",
          "Whether the code compiles",
          "The number of active feature flags",
          "The size of the database",
        ],
        correctIndex: 0,
      },
      {
        question: "Where should instrumentation typically be added?",
        options: [
          "Uniformly on every single line of code",
          "Only in the frontend",
          "Deliberately at boundaries that matter, like entry points, external calls, and expensive operations",
          "Only after an incident has already happened",
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    slug: "cloud-reliability-patterns",
    title: "Cloud & Reliability Design Patterns",
    order: 15,
    summary: "Reusable patterns for building systems that stay correct and available under failure and load.",
    content: `Distributed systems fail in predictable ways: dependencies get slow, load spikes hit unevenly, requests fail halfway through. Cloud and reliability design patterns are names for the recurring solutions to those problems, so a team can reach for a known pattern instead of reinventing one under pressure.

## Handling failure
- **Circuit breaker**: after a downstream dependency fails repeatedly, the circuit "opens" and further calls fail immediately (or fall back) instead of waiting on a timeout every time, giving the dependency room to recover instead of being hit with more load while it's struggling.
- **Retry**: retries a failed operation, ideally with exponential backoff and jitter, so transient failures self-heal without a naive retry storm making things worse.
- **Bulkhead**: partitions resources (connection pools, thread pools) per dependency or tenant, so one failing or slow dependency can't exhaust resources needed by the rest of the system, the way a ship's bulkheads contain flooding to one compartment.
- **Health endpoint monitoring**: exposes a lightweight endpoint an orchestrator or load balancer can poll to detect and route around unhealthy instances automatically.
- **Compensating transaction**: undoes the effects of a previously completed step when a later step in a multi-step operation fails, since distributed operations often can't roll back atomically the way a single database transaction can.

## Handling load
- **Queue-based load leveling**: puts a queue between a producer and a consumer so bursts of load are absorbed and smoothed out into a steady processing rate, instead of overwhelming the consumer directly.
- **Throttling**: deliberately limits the rate a client or tenant can consume a resource, protecting overall system capacity at the cost of that one client's throughput.
- **Competing consumers**: multiple consumer instances pull from the same queue in parallel, so processing throughput scales with the number of consumers.
- **Priority queue**: separates work by priority so high-value or time-sensitive requests aren't stuck behind a backlog of low-priority ones.

## Managing data and requests across services
- **CQRS** (Command Query Responsibility Segregation): splits the read model from the write model, letting each be optimized and scaled independently, useful when read and write patterns are very different.
- **Event sourcing**: stores state as an append-only sequence of events rather than the current state alone, so the full history is preserved and current state is derived by replaying events.
- **Materialized view**: precomputes and stores a query result so expensive joins or aggregations don't need to be recomputed on every read.
- **Saga (choreography)**: coordinates a multi-step distributed transaction as a sequence of local transactions, each triggering the next via events, with compensating transactions to undo prior steps on failure.
- **Gateway aggregation / offloading**: an API gateway combines multiple backend calls into one client-facing response (aggregation) or handles cross-cutting concerns like auth and rate limiting centrally (offloading), instead of every service reimplementing them.

## High availability
- **Deployment stamps**: deploys independent copies (stamps) of the full system per customer or region, so one stamp's failure or a botched deploy doesn't affect the others.
- **Geodes**: deploys the system to multiple geographic regions serving local traffic, reducing latency and containing the blast radius of a regional outage.

- Circuit breaker and bulkhead contain failure so one bad dependency doesn't take down everything else
- Queue-based load leveling and throttling absorb and shape bursty load instead of passing it straight through
- CQRS and event sourcing separate concerns (reads/writes, current state/history) so each can scale and evolve independently
- Deployment stamps and geodes trade infrastructure duplication for a smaller blast radius per failure`,
    quiz: [
      {
        question: "What problem does a circuit breaker solve?",
        options: [
          "It speeds up successful requests",
          "It stops repeatedly calling a failing downstream dependency, giving it room to recover instead of piling on more load",
          "It replaces the need for retries",
          "It encrypts requests to a dependency",
        ],
        correctIndex: 1,
      },
      {
        question: "What does the bulkhead pattern do?",
        options: [
          "Merges all connection pools into one shared pool for efficiency",
          "Partitions resources per dependency or tenant so one failing dependency can't exhaust resources needed by the rest of the system",
          "Automatically retries every failed request",
          "Replaces a queue with direct synchronous calls",
        ],
        correctIndex: 1,
      },
      {
        question: "What is the purpose of queue-based load leveling?",
        options: [
          "To guarantee strong consistency",
          "To absorb bursts of load and smooth them into a steady processing rate instead of overwhelming the consumer",
          "To replace the need for a database",
          "To increase the priority of all requests equally",
        ],
        correctIndex: 1,
      },
      {
        question: "What does CQRS separate?",
        options: [
          "TCP from UDP traffic",
          "The read model from the write model, so each can be optimized and scaled independently",
          "Frontend code from backend code",
          "Logs from metrics",
        ],
        correctIndex: 1,
      },
      {
        question: "What is the main benefit of deployment stamps or geodes?",
        options: [
          "They eliminate the need for monitoring",
          "They reduce the total amount of infrastructure needed",
          "They contain the blast radius of a failure or bad deploy to one stamp or region instead of affecting everyone",
          "They remove the need for a circuit breaker",
        ],
        correctIndex: 2,
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
    referenceSolution: `## Summary
A cache-backed key-value store in front of a durable database handles this well: redirects are pure point lookups by short_code, and a base62-encoded sequential ID sidesteps collision-checking on writes entirely. The result comfortably meets a low-latency redirect requirement at a 100:1 read:write ratio.

## Key strengths
- **Fast redirects** — a cache keyed by short_code serves the overwhelming majority of reads, so the database only sees cache misses and writes.
- **Collision-free code generation** — base62-encoding a monotonically increasing ID guarantees unique short codes without a collision-detection step.
- **Simple, well-understood access pattern** — every operation is a point lookup or point write by short_code, which both key-value stores and indexed SQL tables handle efficiently.

## Approach
Store a mapping from a short code to the long URL in a key-value-friendly database. On creation, generate a short code (base62-encode an auto-incrementing ID, or hash the URL and take the first 7 characters, checking for collisions) and write it once. On redirect, look up the code and return an HTTP 301/302 to the long URL.

## API endpoints
| Method | Path | Description |
| --- | --- | --- |
| POST | /api/v1/shorten | Create a short URL for a given long URL |
| GET | /:shortCode | Redirect to the original long URL and record a click |

## Data model
| Field | Type | Description |
| --- | --- | --- |
| short_code | VARCHAR(8), PK | Unique short code, used for direct lookups |
| long_url | VARCHAR(2048) | The original URL to redirect to |
| created_at | TIMESTAMP | When the short URL was created |
| expires_at | TIMESTAMP, nullable | Optional expiration for the link |
| owner_id | TEXT, nullable | User who created the link, if authenticated |

## Scaling reads
Redirects vastly outnumber creations, so put a cache (e.g. Redis) in front of the database keyed by short_code — most popular links get served from cache, and the database only sees cache misses and writes.

## Scaling writes and avoiding collisions
Base62-encoding a globally unique, monotonically increasing ID (e.g. from a dedicated ID-generation service or database sequence) sidesteps collision-checking entirely, at the cost of needing a scalable ID generator once you shard the database.

## Estimates
- **Write volume**: 100M new URLs/month (~40 writes/sec average)
- **Read:write ratio**: 100:1
- **Peak redirect QPS**: ~4,000 reads/sec average — comfortably handled by a cache-backed key-value store with database sharding for durability

## Future improvements
- Multi-region deployment with geo-distributed caching to cut redirect latency for global users
- Analytics pipeline (async) for click trends beyond a simple counter`,
    diagram: {
      nodes: [
        { id: "client", label: "Client", x: 20, y: 210, kind: "client" },
        { id: "gateway", label: "API Gateway", x: 260, y: 90, kind: "lb", w: 140, h: 260 },
        { id: "shorten", label: "URL Shortening Service", x: 500, y: 60, kind: "service", w: 220 },
        { id: "redirect", label: "URL Redirection Request Handler", x: 500, y: 280, kind: "service", w: 220 },
        { id: "db", label: "NoSQL DB", x: 820, y: 60, kind: "db" },
        { id: "cache", label: "Cache", x: 820, y: 280, kind: "cache" },
      ],
      edges: [
        { from: "client", to: "gateway" },
        { from: "gateway", to: "shorten", label: "POST /api/v1/shorten" },
        { from: "gateway", to: "redirect", label: "GET /:shortCode" },
        { from: "redirect", to: "gateway", label: "302 redirect" },
        { from: "shorten", to: "db", label: "write shortCode:longURL" },
        { from: "redirect", to: "cache", label: "read (cache hit)" },
        { from: "cache", to: "db", label: "cache miss / populate" },
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
    referenceSolution: `## Summary
A token bucket per client, backed by a shared Redis store and enforced atomically at the API gateway, allows short bursts while capping the steady-state rate — all with only 1-2ms of added latency per request.

## Key strengths
- **Shared, consistent state** — bucket state lives in Redis rather than per-server memory, so the limit is enforced correctly no matter which server handles a given request.
- **Atomic enforcement** — the check-and-decrement is a single Lua script/atomic command, eliminating race conditions under concurrent requests.
- **Cheap, centralized enforcement** — a lightweight check at the API gateway protects every downstream service without each one implementing its own limiting logic.

## Approach
Use the token bucket algorithm: each client has a bucket with a maximum capacity and a refill rate. Each request consumes one token; if the bucket is empty, the request is rejected with 429. This allows short bursts while enforcing a steady average rate.

## API endpoints
| Method | Path | Description |
| --- | --- | --- |
| ANY | /* (via gateway middleware) | Checked before every request; returns 429 with Retry-After when the limit is exceeded |
| GET | /admin/limits/:clientId | Inspect or configure a client's rate limit tier |

## Data model
| Field | Type | Description |
| --- | --- | --- |
| client_id | TEXT, PK | API key or user ID the bucket belongs to |
| tokens_remaining | INT | Current tokens available in the bucket |
| last_refill_at | TIMESTAMP | Last time the bucket was refilled, used to compute elapsed refills |
| capacity | INT | Maximum burst size for this client's tier |
| refill_rate | FLOAT | Tokens added per second for this client's tier |

## Where state lives
Bucket state (tokens remaining, last refill time) must be shared across all servers handling requests, so it lives in a fast, shared store like Redis rather than in-process memory — otherwise each server would enforce its own independent limit.

## Enforcement point
A lightweight check at the API gateway/edge protects all downstream services cheaply and consistently, before a request ever reaches business logic.

## Making it fast and correct
The check-and-decrement operation on the bucket must be atomic to avoid race conditions under concurrent requests — implemented as a single Lua script or atomic command in Redis rather than a separate read-then-write.

## Estimates
- **Added latency**: ~1-2ms per request for the Redis-backed check
- **Throughput**: negligible overhead even at tens of thousands of requests/sec, since the check is a single round trip to Redis

## Future improvements
- Sliding-window or leaky-bucket variants for smoother rate enforcement at tier boundaries
- Per-endpoint (not just per-client) limits for finer-grained protection of expensive routes`,
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
    referenceSolution: `## Summary
Persistent WebSocket connections, a Redis-backed connection-routing layer, and an append-mostly message store together deliver near-real-time messages while keeping history durable — the main scaling challenge is connection state, not message throughput.

## Key strengths
- **Real-time delivery with offline fallback** — messages push immediately to an online recipient's connection, or wait for next connect (plus an optional push notification) when offline.
- **Stateless routing across chat servers** — a Redis lookup of "which server is user X on" lets any server locate where to deliver a message, so the fleet can scale horizontally.
- **Ordered, durable history** — messages keyed by conversation_id with a sequence number support efficient, in-order retrieval of a conversation.

## Approach
Clients hold a persistent connection (WebSocket) to a chat server. When a message is sent, the server persists it to a database and pushes it to the recipient's active connection if they're online; if offline, it's delivered on next connect (and optionally triggers a push notification).

## API endpoints
| Method | Path | Description |
| --- | --- | --- |
| WS | /ws/connect | Establish the persistent connection for sending/receiving messages |
| GET | /api/v1/conversations/:id/messages | Fetch message history for a conversation |
| GET | /api/v1/presence/:userId | Check whether a user is currently online |

## Data model
| Field | Type | Description |
| --- | --- | --- |
| message_id | TEXT, PK | Unique message identifier |
| conversation_id | TEXT | Conversation (1:1 or group) this message belongs to |
| sender_id | TEXT | User who sent the message |
| body | TEXT | Message content |
| sent_at | TIMESTAMP / sequence | Ordering key for retrieving history in order |

## Connection management
Because WebSocket connections are stateful and long-lived, a connection-routing layer (e.g. a lookup in Redis of "which chat server is user X connected to") is needed so any server can find where to deliver a message meant for a specific user.

## Fan-out for groups
For group chats, a new message fans out to every member's active connection; for very large groups this fan-out is done asynchronously via a queue rather than synchronously in the request path.

## Estimates
- **Daily active users**: 10M, sending ~20 messages/day each
- **Average message throughput**: ~2,300 messages/sec
- **Main scaling constraint**: concurrent WebSocket connections (millions), not message throughput

## Future improvements
- Read receipts and typing indicators as additional low-latency presence signals
- Message search via a secondary index or search service for large conversation histories`,
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
    referenceSolution: `## Summary
Triggering services publish events to a queue instead of calling the notification system directly, so a pool of idempotent workers can render, retry, and deliver across push/email/SMS without ever slowing down the services that generate the events.

## Key strengths
- **Fully decoupled from triggering services** — an event queue means checkout, posting, or any other service is never blocked by a slow or down notification system.
- **At-least-once delivery without duplicates** — idempotent workers (deduped by notification_id) make retries and re-processing safe.
- **Horizontally scalable throughput** — adding more queue consumers scales delivery independent of how fast triggering services produce events.

## Approach
Other services publish notification events to a message queue rather than calling the notification system synchronously — this decouples the two, so a slow or down notification system never blocks e.g. checkout or posting a comment.

## API endpoints
| Method | Path | Description |
| --- | --- | --- |
| POST | /api/v1/notifications | Internal endpoint for services to enqueue a notification event |
| GET/PUT | /api/v1/users/:id/preferences | Read or update a user's channel and quiet-hours preferences |

## Data model
| Field | Type | Description |
| --- | --- | --- |
| notification_id | TEXT, PK | Unique ID, used to dedupe retries |
| user_id | TEXT | Recipient of the notification |
| channel | ENUM(push, email, sms) | Delivery channel |
| status | ENUM(pending, sent, failed) | Current delivery status |
| created_at | TIMESTAMP | When the event was enqueued |

## Processing pipeline
Workers consume events from the queue, look up the target user's channel preferences, render the appropriate template per channel, and hand off delivery to channel-specific services (push provider, email provider, SMS provider).

## Reliability
Each channel delivery is retried with exponential backoff on failure, and the queue's at-least-once semantics mean workers must be idempotent (e.g. dedupe by a notification_id) so retries or re-processing don't send duplicates to the user.

## Respecting preferences
A user-preferences store (simple key-value: user_id, channel, enabled) is checked before sending anything, and can also encode quiet hours to defer non-urgent notifications.

## Estimates
- **Daily volume**: 50M notifications/day
- **Average throughput**: ~580/sec, several times that at peak
- **Scaling lever**: horizontal worker pool size, independent of triggering-service load

## Future improvements
- Per-channel rate limiting to stay within third-party provider quotas
- A digest mode that batches low-priority notifications instead of sending each individually`,
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
    referenceSolution: `## Summary
Checkout is modeled as a saga — reserve inventory, charge payment, create the order — with atomic inventory decrements, compensating actions on failure, and an idempotency key on the request, so the system stays correct under concurrency and partial failures rather than relying on raw throughput.

## Key strengths
- **No overselling under concurrency** — an atomic conditional decrement on inventory means two concurrent checkouts for the last unit can't both succeed.
- **Resilient to partial failures** — a saga pattern with compensating actions (release reservation, refund) keeps payment, inventory, and order state consistent across independent systems.
- **Safe against retries and double-clicks** — an idempotency key on the checkout request guarantees a retried or double-submitted request never creates two orders or charges twice.

## Approach
Checkout is a multi-step process that must stay consistent even if a step fails partway through: reserve inventory, charge payment, create the order record, and release the reservation if any step fails.

## API endpoints
| Method | Path | Description |
| --- | --- | --- |
| POST | /api/v1/checkout | Submit a cart + payment method; carries an idempotency key |
| GET | /api/v1/orders/:id | Retrieve order status and confirmation details |

## Data model
| Field | Type | Description |
| --- | --- | --- |
| order_id | TEXT, PK | Unique order identifier |
| user_id | TEXT | Customer placing the order |
| idempotency_key | TEXT, unique | Dedupes retried/duplicate checkout requests |
| status | ENUM(pending, paid, failed, fulfilled) | Current state of the order |
| inventory_reservation_id | TEXT | Links to the atomic inventory reservation for this order |

## Avoiding overselling
Inventory reservation uses an atomic conditional decrement (e.g. UPDATE inventory SET qty = qty - 1 WHERE product_id = ? AND qty > 0) so concurrent checkouts for the last unit can't both succeed — the database's row-level locking or a compare-and-swap enforces this.

## Handling partial failures
Because payment and order-creation touch different systems, a saga pattern (a sequence of local transactions with compensating actions) keeps things consistent: if payment fails, release the inventory reservation; if the order-write fails after payment succeeded, retry the write or refund and release inventory.

## Idempotency
The checkout request itself should carry an idempotency key so a user's accidental double-click (or a client retry after a timeout) doesn't create two orders or charge twice.

## Asynchronous follow-up
Once the order is confirmed, non-critical follow-up work — sending a confirmation email, notifying the warehouse — is pushed to a queue rather than done synchronously, keeping the user-facing checkout fast.

## Estimates
- **Daily volume**: 500,000 orders/day (~6 orders/sec average, higher at peak sale events)
- **Primary scaling concern**: correctness under concurrency, not raw throughput — the inventory decrement must remain atomic as write volume grows

## Future improvements
- Pre-warm inventory caches ahead of known flash-sale events to reduce database contention at peak
- A dedicated saga orchestrator/state machine if the checkout flow grows beyond 3-4 steps`,
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
  {
    slug: "pnr-confirmation-prediction",
    title: "Design a PNR Confirmation Prediction System",
    order: 6,
    description:
      "Design a system like ConfirmTkt that predicts, for a waitlisted or RAC train ticket, the probability it will be confirmed by chart preparation time, based on historical booking and cancellation patterns.",
    requirements: {
      functional: [
        "Given a PNR's train, date, class, quota, and current waitlist/RAC number, return a confirmation probability",
        "Continuously ingest historical PNR status data to learn how waitlist positions moved to confirmed/RAC/cancelled over time",
        "Serve separate confirmation curves per (train, class, quota, days-to-departure)",
        "Fall back to a route or zone-level estimate when a specific train has insufficient history (cold start)",
      ],
      nonFunctional: [
        "Prediction requests must stay well under 100ms even during the traffic spike right before chart preparation",
        "The historical-data polling pipeline must tolerate upstream rate limits without falling behind",
        "Predictions must be calibrated — a 70% prediction should be right about 70% of the time, not just directionally correct",
        "System should scale to millions of PNR checks per day",
      ],
    },
    referenceSolution: `## Summary
A nightly batch job aggregates historical PNR outcomes into per-(train, class, quota, days-to-departure) confirmation curves, served from a cache with a hierarchical fallback for cold-start trains. A separate, independently-scaled polling worker fleet keeps that historical dataset fresh, so upstream rate limits or scraping slowness never touch the request-serving path.

## Key strengths
- **Fast, cheap predictions** — the request path is a precomputed curve lookup, not live model inference, so it stays fast through the pre-chart-prep traffic spike.
- **Cold-start handling via hierarchical fallback** — sparse trains borrow from route- or zone-level curves instead of returning nothing or an uncalibrated guess.
- **Decoupled data collection** — the PNR-status polling pipeline runs and scales independently of the prediction path, so scraping backoff or upstream rate limits never add latency to a prediction request.

## Approach
Historical PNR outcomes (how a waitlist number moved from booking to chart preparation) are collected by a polling worker fleet and aggregated offline into confirmation-probability curves, bucketed by train, class, quota, and days-to-departure. At request time, the prediction service does a single lookup against these precomputed curves — falling back to a coarser bucket when the exact one lacks enough data — rather than running a model per request.

## API endpoints
| Method | Path | Description |
| --- | --- | --- |
| GET | /api/v1/pnr/:pnrNumber/predict | Return confirmation probability + confidence for a PNR |
| POST | /internal/pnr/track | Register a PNR for periodic status polling |

## Data model
| Field | Type | Description |
| --- | --- | --- |
| pnr_number | TEXT, PK | Tracked PNR being polled |
| train_number, class, quota | TEXT | Identify which bucket this ticket belongs to |
| wl_number | INT | Current waitlist/RAC position |
| journey_date | DATE | Used to compute days-to-departure |
| checked_at | TIMESTAMP | When this status snapshot was taken |
| confirmation_curves (train_number, class, quota, days_to_departure_bucket, wl_number_bucket) | Aggregated table | confirmed_count / total_count for that bucket, recomputed nightly |

## Historical data ingestion
A worker fleet polls PNR status for tracked tickets on an increasing schedule as the journey date approaches (e.g. daily, then hourly, then every 15 minutes near chart-prep), with jittered backoff to stay within upstream rate limits. Each poll writes a snapshot (wl_number, checked_at); the sequence of snapshots up to the final chart-prep outcome is what trains the confirmation curves.

## Prediction model and cold-start fallback
Rather than a live ML model, confirmation probability is served from a lookup table of historical confirmation rates, bucketed by (train, class, quota, days-to-departure, wl_number range). When a bucket has too few historical samples (a rarely-booked train), the lookup falls back to the same bucket at the route level, then the zone level — trading precision for enough data to be calibrated instead of noisy.

## Calibration
Because the output is a probability shown to users making a booking decision, calibration matters more than raw accuracy: predictions are periodically checked against actual outcomes (of tickets predicted at ~70%, did roughly 70% confirm?) and curves are recomputed nightly as fresh outcome data arrives.

## Estimates
- **Tracked PNRs**: tens of millions of waitlisted tickets active at any time
- **Peak read QPS**: heaviest right before chart preparation (~day before departure), served entirely from precomputed curves
- **Ingestion load**: bounded by upstream rate limits, not by read traffic — polling frequency is the tuning knob, not server capacity

## Future improvements
- Move from static buckets to a lightweight regression model per train/class once enough data exists, using the bucketed lookup as a fallback
- Incorporate calendar effects (festivals, long weekends) as an explicit feature rather than folding them into the general historical average`,
    diagram: {
      nodes: [
        { id: "client", label: "Client", x: 20, y: 160, kind: "client" },
        { id: "gateway", label: "API Gateway", x: 260, y: 160, kind: "lb" },
        { id: "predictor", label: "Prediction Service", x: 500, y: 60, kind: "service" },
        { id: "cache", label: "Curve Cache", x: 740, y: 60, kind: "cache" },
        { id: "poller", label: "PNR Poller Workers", x: 500, y: 280, kind: "service" },
        { id: "db", label: "Historical Outcomes DB", x: 740, y: 280, kind: "db" },
        { id: "irctc", label: "IRCTC PNR Status API", x: 980, y: 280, kind: "cdn" },
      ],
      edges: [
        { from: "client", to: "gateway" },
        { from: "gateway", to: "predictor", label: "GET /api/v1/pnr/:number/predict" },
        { from: "predictor", to: "cache", label: "read curve" },
        { from: "cache", to: "db", label: "cache miss / rebuild" },
        { from: "poller", to: "irctc", label: "poll PNR status" },
        { from: "poller", to: "db", label: "write outcome snapshot" },
      ],
    },
  },
  {
    slug: "rag-qa-system",
    title: "Design a RAG-based Q&A System",
    order: 7,
    description:
      "Design a retrieval-augmented generation (RAG) system like an internal docs chatbot that ingests a corpus of documents, indexes them for semantic search, and answers user questions by retrieving relevant chunks and feeding them to an LLM.",
    requirements: {
      functional: [
        "Ingest documents (PDFs, wiki pages, markdown) from multiple sources and keep the index up to date as they change",
        "Split documents into chunks, embed them, and store them in a vector index for semantic search",
        "Given a user question, retrieve the most relevant chunks and generate a grounded answer via an LLM",
        "Return citations/sources alongside the generated answer so users can verify it",
        "Support incremental re-indexing when a source document is updated or deleted, without a full rebuild",
      ],
      nonFunctional: [
        "End-to-end answer latency (retrieval + generation) should stay within a few seconds for a good user experience",
        "The system must be resilient to LLM provider rate limits and transient failures without failing the whole request",
        "Retrieval must scale to millions of chunks without a linear scan",
        "Ingestion pipeline must be idempotent — re-processing the same document version should not create duplicate chunks",
        "Keep LLM token costs bounded by capping how many chunks are sent per query",
      ],
    },
    referenceSolution: `## Summary
An offline ingestion pipeline chunks, embeds, and writes documents into a vector index; the online query path embeds the user's question, retrieves the top-k nearest chunks, and passes them plus the question to an LLM to generate a grounded, cited answer.

## Key strengths
- **Decoupled ingestion and query paths** — indexing runs as an async pipeline independent of user traffic, so a slow embedding backfill never adds latency to live questions.
- **Grounded generation** — the LLM only answers from retrieved chunks it's given, which keeps responses tied to the actual corpus and enables citations instead of unverifiable free-form output.
- **Idempotent chunking** — chunks are keyed by a hash of (document id, version, chunk index), so re-ingesting an unchanged document is a no-op and an updated document cleanly replaces only its stale chunks.

## Approach
The ingestion pipeline pulls documents from source systems, splits each into overlapping text chunks, computes an embedding per chunk, and upserts (chunk id, embedding, text, metadata) into a vector index. A change-detection step (content hash per document) skips unchanged documents and diffs updated ones so only affected chunks are re-embedded and re-indexed. On the query path, the user's question is embedded with the same model, the vector index returns the top-k semantically closest chunks, and those chunks plus the question are assembled into a prompt sent to the LLM, which generates an answer constrained to cite the source chunks it used.

## API endpoints
| Method | Path | Description |
| --- | --- | --- |
| POST | /api/v1/query | Submit a question, return a generated answer with citations |
| POST | /internal/ingest/documents | Register or update a document for ingestion |
| DELETE | /internal/ingest/documents/:id | Remove a document and its chunks from the index |
| GET | /internal/ingest/documents/:id/status | Check indexing status of a document |

## Data model
| Field | Type | Description |
| --- | --- | --- |
| document_id | TEXT, PK | Source document identifier |
| version_hash | TEXT | Content hash, used to detect changes and skip unchanged re-ingestion |
| source | TEXT | Origin system (wiki, PDF store, etc.) |
| chunk_id | TEXT, PK | Hash of (document_id, version_hash, chunk_index) — idempotency key |
| chunk_text | TEXT | Raw chunk content stored alongside the embedding for citation display |
| embedding | VECTOR | Chunk embedding stored in the vector index |
| updated_at | TIMESTAMP | Last time this chunk was (re)written |

## Chunking and retrieval quality
Documents are split with overlapping windows (e.g. 500 tokens with 50-token overlap) so an answer-relevant sentence near a chunk boundary isn't split away from its context. Retrieval uses approximate nearest-neighbor search (e.g. HNSW) over the embedding index rather than exact search, trading a small recall loss for sub-linear query time at millions of chunks. A reranking pass over the top-k candidates (cheaper than the LLM call itself) can reorder results before they're sent to the LLM, improving precision when the initial vector search returns marginally-relevant chunks.

## Handling LLM failures and cost
Generation calls go through a retry-with-backoff wrapper and a fallback to a smaller/cheaper model if the primary model is rate-limited, so a provider outage degrades answer quality rather than failing the request outright. Prompt size is bounded by capping k (top retrieved chunks) and truncating chunk text, keeping token cost and latency predictable regardless of corpus size.

## Incremental re-indexing
Each document carries a version_hash; ingestion recomputes it on every sync and only re-chunks/re-embeds documents whose hash changed. Deleting a document removes all chunks whose chunk_id was derived from its (document_id, version_hash) pairs, so stale content never lingers in the index after a source document is deleted or updated.

## Estimates
- **Corpus size**: millions of chunks across the indexed document set
- **Query latency budget**: retrieval ~100-200ms (ANN lookup), generation ~1-3s (LLM call) — dominated by the LLM call, not retrieval
- **Ingestion throughput**: bounded by embedding API rate limits, batched to amortize per-call overhead

## Future improvements
- Add a semantic cache keyed on question embeddings so near-duplicate questions skip a redundant LLM call
- Support hybrid search (BM25 keyword search + vector search) for queries with exact terms (IDs, error codes) that embeddings alone handle poorly`,
    diagram: {
      nodes: [
        { id: "client", label: "Client", x: 20, y: 160, kind: "client" },
        { id: "gateway", label: "API Gateway", x: 260, y: 160, kind: "lb" },
        { id: "query", label: "Query Service", x: 500, y: 60, kind: "service" },
        { id: "vectordb", label: "Vector Index", x: 740, y: 60, kind: "db" },
        { id: "llm", label: "LLM Provider", x: 980, y: 60, kind: "cdn" },
        { id: "cache", label: "Answer Cache", x: 500, y: -140, kind: "cache" },
        { id: "ingest", label: "Ingestion Pipeline", x: 500, y: 280, kind: "service" },
        { id: "embedder", label: "Embedding Service", x: 740, y: 280, kind: "service" },
        { id: "sources", label: "Source Documents", x: 980, y: 280, kind: "cdn" },
      ],
      edges: [
        { from: "client", to: "gateway" },
        { from: "gateway", to: "query", label: "POST /api/v1/query" },
        { from: "query", to: "cache", label: "check cached answer" },
        { from: "query", to: "vectordb", label: "top-k chunk search" },
        { from: "query", to: "llm", label: "generate grounded answer" },
        { from: "ingest", to: "sources", label: "pull documents" },
        { from: "ingest", to: "embedder", label: "chunk + embed" },
        { from: "embedder", to: "vectordb", label: "upsert chunk embeddings" },
      ],
    },
  },
];

const questions: QuestionSeed[] = [
  // ---------- Beginner (1-25) ----------
  {
    slug: "what-is-system-design",
    question: "What is system design and why does it matter?",
    answer:
      "System design is the process of defining the architecture, components, and data flow of a software system to meet a given set of functional and non-functional requirements. It matters because the same feature can be built in wildly different ways, and the choice determines whether the system stays fast, available, and maintainable as usage grows. Getting it wrong early is expensive to fix later, since architecture decisions are much harder to reverse than code.",
    difficulty: "BEGINNER",
    order: 1,
  },
  {
    slug: "functional-vs-non-functional-requirements",
    question: "What's the difference between functional and non-functional requirements?",
    answer:
      "Functional requirements describe what the system should do: its features and behaviors, like \"users can post a message\" or \"the system sends a confirmation email.\" Non-functional requirements describe how well the system should do it: performance, availability, scalability, security, and consistency. Both matter for design, but non-functional requirements are usually what drive the harder architectural tradeoffs.",
    difficulty: "BEGINNER",
    order: 2,
  },
  {
    slug: "client-server-model",
    question: "Explain the client-server model.",
    answer:
      "In the client-server model, clients (browsers, mobile apps) send requests to a server, which processes them and returns a response, typically over a network using a protocol like HTTP. The server centralizes logic and data, so many clients can consume the same backend without duplicating that logic themselves. It's the foundational structure nearly every web system builds on, even as the server side becomes many distributed services.",
    difficulty: "BEGINNER",
    order: 3,
  },
  {
    slug: "http-vs-https",
    question: "What is the difference between HTTP and HTTPS?",
    answer:
      "HTTP transmits data in plain text, so anyone intercepting the traffic can read or tamper with it. HTTPS wraps HTTP in TLS encryption, so the connection is encrypted, authenticated (via certificates), and protected against tampering in transit. HTTPS is the default expectation for any production web service today, not an optional upgrade.",
    difficulty: "BEGINNER",
    order: 4,
  },
  {
    slug: "what-happens-when-you-type-a-url",
    question: "What happens when you type a URL into a browser?",
    answer:
      "The browser first resolves the hostname to an IP address via DNS, then opens a TCP connection (with a TLS handshake if HTTPS) to that IP. It sends an HTTP request, the server processes it and returns a response, and the browser parses the HTML, fetching additional resources (CSS, JS, images) as it renders the page. This single question touches DNS, TCP, TLS, HTTP, load balancing, and rendering, which is why it's a common opener in interviews.",
    difficulty: "BEGINNER",
    order: 5,
  },
  {
    slug: "what-is-dns",
    question: "What is DNS and how does it work?",
    answer:
      "DNS (Domain Name System) translates human-readable hostnames into IP addresses. A lookup walks through a chain of resolvers: local cache, recursive resolver, root servers, TLD servers, and the authoritative name server for the domain, which returns the IP. Results are cached at each layer for a TTL, so most lookups never reach the authoritative server.",
    difficulty: "BEGINNER",
    order: 6,
  },
  {
    slug: "tcp-vs-udp",
    question: "What's the difference between TCP and UDP?",
    answer:
      "TCP is connection-oriented and reliable: it handshakes, guarantees ordered delivery, and retransmits lost packets, at the cost of extra latency and overhead. UDP is connectionless and best-effort: it sends packets with no delivery or ordering guarantee, but is faster and lower-overhead. TCP fits use cases where correctness matters (HTTP, databases); UDP fits use cases where speed matters more than a dropped packet (video, VoIP, DNS).",
    difficulty: "BEGINNER",
    order: 7,
  },
  {
    slug: "what-is-a-rest-api",
    question: "What is a REST API? What makes an API \"RESTful\"?",
    answer:
      "A REST API models a system as resources, each identified by a URL, and uses standard HTTP methods (GET, POST, PUT, DELETE) to act on them. An API is considered RESTful when it's stateless (each request carries everything needed to process it), uses uniform resource-based URLs, and relies on standard HTTP semantics like status codes and caching headers rather than custom protocols on top of HTTP.",
    difficulty: "BEGINNER",
    order: 8,
  },
  {
    slug: "common-http-status-codes",
    question: "Explain common HTTP status codes (200, 301, 404, 500, etc.)",
    answer:
      "Status codes are grouped by their first digit: 2xx means success (200 OK, 201 Created), 3xx means redirection (301 Moved Permanently, 304 Not Modified), 4xx means the client made a bad request (400 Bad Request, 404 Not Found, 429 Too Many Requests), and 5xx means the server failed to handle a valid request (500 Internal Server Error, 503 Service Unavailable). Picking the right code matters because clients, proxies, and monitoring systems all key off it to decide how to react.",
    difficulty: "BEGINNER",
    order: 9,
  },
  {
    slug: "sql-vs-nosql",
    question: "What is the difference between SQL and NoSQL databases?",
    answer:
      "SQL databases store data in structured tables with a fixed schema and relationships enforced by foreign keys, and they typically guarantee strong ACID consistency. NoSQL databases (key-value, document, wide-column, graph) trade schema rigidity and, often, strict consistency for flexible data models and easier horizontal scaling. The choice comes down to whether your data is relational and needs strong consistency, or is more flexible and needs to scale out cheaply.",
    difficulty: "BEGINNER",
    order: 10,
  },
  {
    slug: "when-to-choose-nosql",
    question: "When would you choose NoSQL over SQL?",
    answer:
      "NoSQL fits well when the data model doesn't need complex joins, the schema changes frequently, or the system needs to scale writes horizontally beyond what a single relational database can handle, such as user session storage, event logs, or product catalogs with varying attributes. It's a poor fit when you need multi-row transactional consistency or complex relational queries, where SQL's guarantees are worth the tradeoff.",
    difficulty: "BEGINNER",
    order: 11,
  },
  {
    slug: "latency-vs-throughput",
    question: "What is latency vs throughput?",
    answer:
      "Latency is the time it takes for a single request to complete, usually measured in milliseconds. Throughput is the number of requests a system can process per unit of time, usually measured in requests per second. The two aren't always aligned: a system can have high throughput but poor latency for individual requests (e.g. under heavy batching), or low latency for a single request but limited overall throughput.",
    difficulty: "BEGINNER",
    order: 12,
  },
  {
    slug: "vertical-vs-horizontal-scaling",
    question: "What is vertical scaling vs horizontal scaling?",
    answer:
      "Vertical scaling adds more resources (CPU, RAM) to a single machine; it's simple but has a hard ceiling and remains a single point of failure. Horizontal scaling adds more machines and distributes load across them; it scales much further but introduces coordination complexity, like data partitioning and consistency across nodes. Most large-scale systems favor horizontal scaling for anything user-facing and long-lived.",
    difficulty: "BEGINNER",
    order: 13,
  },
  {
    slug: "forward-vs-reverse-proxy",
    question: "What is a proxy server? Forward proxy vs reverse proxy?",
    answer:
      "A proxy sits between a client and a server, forwarding requests on one side's behalf. A forward proxy sits in front of clients, hiding their identity from the server (e.g. a corporate proxy hiding internal employees from the internet). A reverse proxy sits in front of servers, hiding the backend's identity and topology from clients while handling things like load balancing, TLS termination, and caching.",
    difficulty: "BEGINNER",
    order: 14,
  },
  {
    slug: "what-is-statelessness",
    question: "What is statelessness in web services?",
    answer:
      "A stateless service doesn't retain any client-specific data between requests; each request carries all the context it needs to be processed. This means any server instance can handle any request, which makes horizontal scaling and fail-over trivial, since there's no session affinity to worry about. Stateful services need externalized state (like a shared session store) to get the same benefit.",
    difficulty: "BEGINNER",
    order: 15,
  },
  {
    slug: "what-is-a-session",
    question: "What is a session, and how is session state managed?",
    answer:
      "A session represents a period of interaction between a client and a server, typically used to track a logged-in user across multiple requests. It's commonly managed with a session ID stored in a cookie, which the server uses to look up session data in memory, a database, or a shared cache like Redis. Storing session data in a shared store rather than per-server memory is what lets any server instance handle a returning user's requests.",
    difficulty: "BEGINNER",
    order: 16,
  },
  {
    slug: "cookie-vs-session",
    question: "What is a cookie, and how is it different from a session?",
    answer:
      "A cookie is a small piece of data the server asks the browser to store and send back on every subsequent request to that domain. A session is server-side state, often just identified by a session ID stored in a cookie. In short, the cookie is the pointer sent over the wire; the session is the actual data it points to, sitting on the server.",
    difficulty: "BEGINNER",
    order: 17,
  },
  {
    slug: "ip-address-vs-mac-address",
    question: "What is an IP address vs a MAC address?",
    answer:
      "An IP address is a logical, network-layer address used to route traffic across networks, and it can change depending on which network a device joins. A MAC address is a physical, hardware-level address burned into a network interface, used for communication within a local network segment. Routing across the internet relies on IP addresses; delivering a packet to the right device on the local network relies on MAC addresses.",
    difficulty: "BEGINNER",
    order: 18,
  },
  {
    slug: "what-is-a-firewall",
    question: "What is a firewall?",
    answer:
      "A firewall is a network security system that monitors and controls incoming and outgoing traffic based on defined rules, such as allowed ports, IP ranges, or protocols. It acts as a barrier between a trusted internal network and an untrusted external one, blocking traffic that doesn't match the allowed rules. Firewalls exist at multiple layers, from a cloud provider's security groups down to host-level rules on individual machines.",
    difficulty: "BEGINNER",
    order: 19,
  },
  {
    slug: "authentication-vs-authorization",
    question: "What's the difference between authentication and authorization?",
    answer:
      "Authentication verifies who a user is, typically via a password, token, or certificate. Authorization determines what an authenticated user is allowed to do, such as which resources they can read or modify. A system authenticates once at login, then authorizes on every subsequent action based on the user's roles or permissions.",
    difficulty: "BEGINNER",
    order: 20,
  },
  {
    slug: "what-is-json",
    question: "What is JSON and why is it commonly used in APIs?",
    answer:
      "JSON (JavaScript Object Notation) is a lightweight, text-based data format representing structured data as key-value pairs, arrays, and nested objects. It's used widely in APIs because it's human-readable, has native parsing support in nearly every language, and is far less verbose than alternatives like XML. Its simplicity makes it the default choice for REST API payloads, even outside JavaScript ecosystems.",
    difficulty: "BEGINNER",
    order: 21,
  },
  {
    slug: "what-is-a-websocket",
    question: "What is a WebSocket, and how does it differ from HTTP?",
    answer:
      "A WebSocket is a persistent, full-duplex connection between client and server, opened with an initial HTTP handshake and then upgraded to stay open for bidirectional messages. Plain HTTP is request-response only: the client always initiates, and the connection typically closes after each response. WebSockets fit real-time use cases like chat or live updates, where the server needs to push data without the client polling for it.",
    difficulty: "BEGINNER",
    order: 22,
  },
  {
    slug: "polling-vs-long-polling",
    question: "What is polling vs long polling?",
    answer:
      "Polling has the client repeatedly ask the server \"anything new?\" on a fixed interval, which is simple but wastes requests when nothing has changed and adds latency up to the polling interval when something has. Long polling has the server hold the request open until new data is available (or a timeout hits) before responding, reducing wasted requests and latency at the cost of holding connections open longer. Both are simpler than WebSockets but less efficient for high-frequency, bidirectional updates.",
    difficulty: "BEGINNER",
    order: 23,
  },
  {
    slug: "what-is-a-cdn",
    question: "What is a CDN and why is it used?",
    answer:
      "A CDN (Content Delivery Network) is a geographically distributed network of servers that cache and serve content from a location physically closer to the requesting user. It reduces latency by avoiding a round trip to the origin server, and it reduces load on the origin by absorbing repeated requests for the same content. CDNs are most valuable for static or infrequently changing content like images, videos, and JS/CSS bundles.",
    difficulty: "BEGINNER",
    order: 24,
  },
  {
    slug: "basic-web-app-architecture-components",
    question: "What are the basic components of a web application architecture?",
    answer:
      "A typical web application has a client (browser or mobile app), a server or set of application servers handling business logic, a database for persistent storage, and often a load balancer distributing traffic across multiple server instances. Larger systems add a cache for hot data, a CDN for static assets, and a message queue for asynchronous work. Every more advanced pattern (sharding, microservices, event-driven architecture) is an elaboration on this basic shape.",
    difficulty: "BEGINNER",
    order: 25,
  },

  // ---------- Intermediate (26-55) ----------
  {
    slug: "what-is-load-balancing",
    question: "What is load balancing? Name common load balancing algorithms.",
    answer:
      "Load balancing distributes incoming requests across multiple server instances so no single server is overwhelmed, improving both throughput and availability. Common algorithms include round robin (cycle through servers in order), least connections (send to the server with the fewest active connections), and IP hash (route based on a hash of the client IP for session affinity). The right algorithm depends on whether requests are roughly equal cost and whether you need a given client to consistently hit the same server.",
    difficulty: "INTERMEDIATE",
    order: 26,
  },
  {
    slug: "layer-4-vs-layer-7-load-balancing",
    question: "Difference between Layer 4 and Layer 7 load balancing?",
    answer:
      "Layer 4 load balancing operates at the transport layer, routing based on IP and port without inspecting the actual request content, which makes it fast but limited in routing logic. Layer 7 load balancing operates at the application layer, able to inspect HTTP headers, paths, and cookies to make smarter routing decisions, like sending /api requests to one service and /static to another. Layer 7 is more flexible but adds more processing overhead per request.",
    difficulty: "INTERMEDIATE",
    order: 27,
  },
  {
    slug: "what-is-caching",
    question: "What is caching, and where can caching be applied in a system?",
    answer:
      "Caching stores a copy of expensive-to-compute or slow-to-fetch data somewhere faster to access, so repeated requests skip the expensive path. It can be applied at nearly every layer: client-side (browser cache), CDN, a reverse proxy/API gateway, an application-level cache like Redis, and even inside the database itself. The right layer depends on how shared the data is and how fresh it needs to be.",
    difficulty: "INTERMEDIATE",
    order: 28,
  },
  {
    slug: "cache-invalidation-strategies",
    question: "What is cache invalidation? Name common strategies.",
    answer:
      "Cache invalidation is the process of removing or updating stale cached data once the underlying source changes, famously one of the hardest problems in computer science because it's easy to leave stale data serving. Common strategies are TTL-based expiration (simple, but can serve stale data until expiry), explicit invalidation on write (accurate, but requires every write path to remember to invalidate), and write-through caching (updates the cache and the source together, keeping them always in sync).",
    difficulty: "INTERMEDIATE",
    order: 29,
  },
  {
    slug: "cache-aside-write-through-write-back",
    question: "Explain cache-aside, write-through, and write-back caching.",
    answer:
      "Cache-aside has the application check the cache first, and on a miss, read from the source and populate the cache; writes go to the source and either invalidate or update the cache. Write-through writes go to the cache and the source synchronously, keeping them always consistent but adding write latency. Write-back (write-behind) writes go to the cache first and are flushed to the source asynchronously later, giving the fastest writes but risking data loss if the cache fails before the flush.",
    difficulty: "INTERMEDIATE",
    order: 30,
  },
  {
    slug: "database-indexing-b-tree",
    question: "What is database indexing, and how does a B-tree index work?",
    answer:
      "An index is a separate data structure that lets the database find rows matching a query without scanning the whole table. A B-tree index keeps keys sorted in a balanced tree where each node has multiple children, so a lookup, insert, or range scan takes logarithmic time relative to the table size rather than a full linear scan. This is why indexed lookups stay fast even as a table grows into the millions of rows.",
    difficulty: "INTERMEDIATE",
    order: 31,
  },
  {
    slug: "tradeoffs-of-too-many-indexes",
    question: "What are the tradeoffs of adding too many indexes?",
    answer:
      "Every index speeds up reads that use it, but it also has to be updated on every write, so more indexes mean slower inserts, updates, and deletes. Indexes also consume additional disk space and memory, which can push the database's working set out of cache. The rule of thumb is to index the columns your queries actually filter or sort on, not every column that might someday be useful.",
    difficulty: "INTERMEDIATE",
    order: 32,
  },
  {
    slug: "database-replication-master-slave-master-master",
    question: "What is database replication? Master-slave vs master-master.",
    answer:
      "Replication keeps copies of the same data on multiple database nodes, both for fault tolerance and to scale reads. In master-slave replication, the master handles all writes and replicates to slaves, which serve read traffic; a master failure requires promoting a slave. In master-master replication, multiple nodes accept writes and replicate to each other, removing the single-write bottleneck but requiring a conflict resolution strategy for concurrent writes to the same record.",
    difficulty: "INTERMEDIATE",
    order: 33,
  },
  {
    slug: "database-sharding-strategies",
    question: "What is database sharding? What are common sharding strategies?",
    answer:
      "Sharding splits a dataset across multiple database instances so no single instance holds the entire dataset, letting writes scale horizontally. Common strategies are range-based sharding (partition by a value range, simple but risks hot shards for skewed data), hash-based sharding (partition by a hash of the key, spreads load evenly but complicates range queries), and directory-based sharding (a lookup service maps keys to shards, flexible but adds a dependency).",
    difficulty: "INTERMEDIATE",
    order: 34,
  },
  {
    slug: "choosing-a-sharding-key",
    question: "What is a sharding key, and how do you choose a good one?",
    answer:
      "The sharding key is the field used to decide which shard a given row lives on. A good sharding key distributes data and load evenly across shards, is present on most queries (so lookups can go directly to the right shard instead of fanning out to all of them), and doesn't change over a row's lifetime, since moving a row between shards is expensive. Picking a key with high cardinality and even access patterns (like a user ID, not a boolean status flag) avoids hot shards.",
    difficulty: "INTERMEDIATE",
    order: 35,
  },
  {
    slug: "cap-theorem-explained",
    question: "Explain the CAP theorem.",
    answer:
      "The CAP theorem states that a distributed system can only guarantee two of three properties during a network partition: consistency (every read sees the latest write), availability (every request gets a response), and partition tolerance (the system keeps working despite network splits). Since partitions are unavoidable in real distributed systems, the practical choice is between consistency and availability when one occurs. Outside of a partition, well-designed systems can offer both.",
    difficulty: "INTERMEDIATE",
    order: 36,
  },
  {
    slug: "acid-vs-base",
    question: "What is the difference between ACID and BASE?",
    answer:
      "ACID (Atomicity, Consistency, Isolation, Durability) describes the strong transactional guarantees traditional relational databases provide, prioritizing correctness even under concurrent access. BASE (Basically Available, Soft state, Eventually consistent) describes the looser guarantees many distributed NoSQL systems provide, prioritizing availability and partition tolerance over immediate consistency. The choice reflects the CAP tradeoff: ACID systems tend to be CP, while BASE systems tend to be AP.",
    difficulty: "INTERMEDIATE",
    order: 37,
  },
  {
    slug: "what-is-eventual-consistency",
    question: "What is eventual consistency?",
    answer:
      "Eventual consistency means that after a write, all replicas will converge to the same value given enough time without new writes, but a read immediately after a write might briefly see stale data. It's a deliberate tradeoff to favor availability and low latency over strict correctness on every single read. It's a reasonable default for data where a brief staleness window is harmless, like a social media like count.",
    difficulty: "INTERMEDIATE",
    order: 38,
  },
  {
    slug: "what-is-a-message-queue",
    question: "What is a message queue, and why would you use one?",
    answer:
      "A message queue lets producers push messages that consumers process asynchronously, decoupling the two in time and load. It's used to smooth out bursty traffic (absorb a spike without overwhelming downstream services), decouple services so one can be down without blocking the other, and enable retry semantics for work that might fail transiently. Common examples are order processing, email sending, and event notification pipelines.",
    difficulty: "INTERMEDIATE",
    order: 39,
  },
  {
    slug: "pub-sub-vs-point-to-point",
    question: "Difference between pub/sub and point-to-point messaging?",
    answer:
      "In point-to-point messaging, a message is delivered to exactly one consumer, even if multiple consumers are listening on the same queue, useful for distributing work across a pool of workers. In pub/sub, a message is broadcast to every subscriber of a topic, useful when multiple independent services all need to react to the same event. The choice depends on whether the message represents a unit of work to be done once, or an event multiple parties care about.",
    difficulty: "INTERMEDIATE",
    order: 40,
  },
  {
    slug: "kafka-vs-rabbitmq",
    question: "What is Kafka, and how does it differ from RabbitMQ?",
    answer:
      "Kafka is a distributed log-based streaming platform: messages are appended to partitioned, ordered logs and retained for a configurable period, so multiple consumer groups can independently replay and process the same stream at their own pace. RabbitMQ is a traditional message broker: messages are pushed to queues and typically removed once consumed and acknowledged, optimized for flexible routing rather than long-term replay. Kafka fits high-throughput event streaming and log aggregation; RabbitMQ fits classic task queues with complex routing needs.",
    difficulty: "INTERMEDIATE",
    order: 41,
  },
  {
    slug: "what-is-an-api-gateway",
    question: "What is an API Gateway, and what problems does it solve?",
    answer:
      "An API gateway is a single entry point that sits in front of multiple backend services, handling cross-cutting concerns like authentication, rate limiting, request routing, and logging in one place. It solves the problem of every individual service having to reimplement the same concerns, and it gives clients one stable interface even as backend services change or move. It's especially valuable in a microservices architecture, where dozens of services would otherwise each need their own auth and rate-limiting logic.",
    difficulty: "INTERMEDIATE",
    order: 42,
  },
  {
    slug: "what-is-rate-limiting",
    question: "What is rate limiting, and why is it needed?",
    answer:
      "Rate limiting caps how many requests a client can make in a given time window, rejecting excess requests, usually with an HTTP 429. It's needed to protect a system from being overwhelmed by a single misbehaving client, prevent abuse like credential stuffing or scraping, and ensure fair resource usage across all clients sharing the system. Without it, one client's spike can degrade service for everyone else.",
    difficulty: "INTERMEDIATE",
    order: 43,
  },
  {
    slug: "token-bucket-vs-leaky-bucket",
    question: "Explain the token bucket and leaky bucket algorithms.",
    answer:
      "The token bucket algorithm gives each client a bucket that refills with tokens at a fixed rate; each request consumes a token, and requests are rejected once the bucket is empty, allowing short bursts up to the bucket's capacity. The leaky bucket algorithm processes requests at a strictly constant output rate regardless of how bursty the input is, smoothing traffic but not allowing bursts through. Token bucket is more common in practice because it tolerates legitimate bursty traffic; leaky bucket is preferred when a perfectly steady output rate matters more.",
    difficulty: "INTERMEDIATE",
    order: 44,
  },
  {
    slug: "what-is-consistent-hashing",
    question: "What is consistent hashing, and why is it useful?",
    answer:
      "Consistent hashing maps both servers and keys onto a hash ring, and each key is owned by the next server clockwise on the ring. Its advantage over naive modulo-based hashing is that when a server is added or removed, only the keys between it and its neighbor need to move, instead of nearly the entire keyspace being remapped. This makes it the standard technique behind distributed caches and databases that need to scale their node count without a full data reshuffle.",
    difficulty: "INTERMEDIATE",
    order: 45,
  },
  {
    slug: "what-is-a-connection-pool",
    question: "What is a connection pool?",
    answer:
      "A connection pool is a cache of reusable database (or other network) connections that the application checks out and returns instead of opening a new connection per request. Establishing a connection is relatively expensive (TCP handshake, auth, sometimes TLS), so reusing a small pool of already-open connections dramatically reduces latency and load compared to opening one fresh for every request. Pool size is typically tuned to the database's max connection limit and the application's expected concurrency.",
    difficulty: "INTERMEDIATE",
    order: 46,
  },
  {
    slug: "database-denormalization",
    question: "What is database denormalization, and when would you use it?",
    answer:
      "Denormalization intentionally introduces redundant data (like duplicating a username onto every comment row) to avoid expensive joins at read time. It's used when read performance matters more than storage efficiency or write simplicity, typically after profiling shows that joins are the bottleneck. The tradeoff is that every place the duplicated data lives now needs to be kept in sync, which adds complexity to writes.",
    difficulty: "INTERMEDIATE",
    order: 47,
  },
  {
    slug: "read-replica-and-replication-lag",
    question: "What is a read replica, and how does replication lag affect design?",
    answer:
      "A read replica is a copy of a database that serves read traffic, kept in sync with the primary via replication, letting reads scale independently of writes. Replication lag, the delay between a write on the primary and it appearing on the replica, means a read right after a write might return stale data if it hits a replica. This is why systems either read your own writes from the primary, or design the feature to tolerate a brief staleness window.",
    difficulty: "INTERMEDIATE",
    order: 48,
  },
  {
    slug: "horizontal-vs-vertical-partitioning",
    question: "What is horizontal partitioning vs vertical partitioning?",
    answer:
      "Horizontal partitioning (sharding) splits a table by rows, so different rows live on different databases based on a key, keeping the same schema everywhere. Vertical partitioning splits a table by columns, moving some columns to a separate table or store, often to separate frequently-accessed columns from rarely-accessed ones. They solve different problems: horizontal partitioning scales overall data volume and write throughput; vertical partitioning optimizes access patterns for a single table.",
    difficulty: "INTERMEDIATE",
    order: 49,
  },
  {
    slug: "sla-slo-sli",
    question: "What is an SLA, SLO, and SLI?",
    answer:
      "An SLI (Service Level Indicator) is a measured metric, like request latency or error rate. An SLO (Service Level Objective) is an internal target for that metric, like \"99.9% of requests under 200ms.\" An SLA (Service Level Agreement) is an external, often contractual commitment to customers, usually with a stricter margin than the internal SLO and consequences if it's breached.",
    difficulty: "INTERMEDIATE",
    order: 50,
  },
  {
    slug: "what-is-idempotency",
    question: "What is idempotency, and why does it matter in APIs?",
    answer:
      "An operation is idempotent if performing it multiple times has the same effect as performing it once. It matters in APIs because clients and networks retry failed requests, and if the underlying operation isn't idempotent (like \"charge this card\"), a retry can cause a duplicate side effect, like a double charge. APIs typically solve this by having the client send an idempotency key, so the server can recognize and safely ignore a retried request.",
    difficulty: "INTERMEDIATE",
    order: 51,
  },
  {
    slug: "what-is-a-webhook",
    question: "What is a webhook?",
    answer:
      "A webhook is a callback: instead of a client repeatedly polling a server for updates, the server makes an outbound HTTP request to a URL the client registered, as soon as a relevant event happens. It inverts the usual request direction, letting the receiving system react to events in near real time without polling overhead. Payment providers, CI systems, and messaging platforms commonly use webhooks to notify integrators of events like a completed payment or a finished build.",
    difficulty: "INTERMEDIATE",
    order: 52,
  },
  {
    slug: "design-a-url-shortener",
    question: "How would you design a URL shortener?",
    answer:
      "Generate a short, unique key for each long URL (via a counter with base62 encoding, or a hash with collision handling), store the mapping in a key-value store, and redirect on lookup with an HTTP 301/302. The read path dominates traffic, so it benefits heavily from caching hot keys in front of the database. The full write-up, with data model, API design, and diagram, is available as a hands-on practice problem in this app.",
    difficulty: "INTERMEDIATE",
    order: 53,
  },
  {
    slug: "design-a-rate-limiter",
    question: "How would you design a rate limiter for an API?",
    answer:
      "Track a token bucket (or similar counter) per client in a shared, fast store like Redis, checked atomically at the API gateway before a request reaches business logic, rejecting with 429 once the bucket is empty. Shared state across servers is essential, since per-server counters would let a client exceed the intended limit by spreading requests across instances. The full write-up, with data model, API design, and diagram, is available as a hands-on practice problem in this app.",
    difficulty: "INTERMEDIATE",
    order: 54,
  },
  {
    slug: "design-a-notification-system",
    question: "How would you design a basic notification system?",
    answer:
      "Accept notification requests into a queue, decoupling the triggering event from delivery, then have worker services consume the queue and deliver via the appropriate channel (push, email, SMS), each with its own retry and rate-limiting logic for the external provider. Storing user notification preferences and delivery status lets the system respect opt-outs and support retries or read receipts. The full write-up, with data model, API design, and diagram, is available as a hands-on practice problem in this app.",
    difficulty: "INTERMEDIATE",
    order: 55,
  },

  // ---------- Advanced (56-80) ----------
  {
    slug: "distributed-transactions-two-phase-commit",
    question: "What is a distributed transaction? Explain the two-phase commit protocol.",
    answer:
      "A distributed transaction spans multiple independent systems (databases, services) and needs all of them to commit or none to, preserving atomicity across the boundary. Two-phase commit coordinates this: in the prepare phase, a coordinator asks every participant if it can commit, and each locks its resources and votes yes or no; in the commit phase, the coordinator tells everyone to commit only if all voted yes, otherwise it tells everyone to abort. Its major weakness is that it blocks all participants while waiting on the coordinator, and a coordinator failure can leave participants stuck holding locks indefinitely.",
    difficulty: "ADVANCED",
    order: 56,
  },
  {
    slug: "saga-pattern-vs-2pc",
    question: "What is the Saga pattern, and when would you use it over 2PC?",
    answer:
      "The Saga pattern breaks a distributed transaction into a sequence of local transactions, each in a different service, with a compensating transaction defined for each step to undo it if a later step fails. It avoids 2PC's blocking locks across services, since each step commits independently, but it trades strict atomicity for eventual consistency, since the system can be briefly in a partially-completed state. Sagas fit long-running, multi-service workflows like order processing, where holding distributed locks for the whole duration would be impractical.",
    difficulty: "ADVANCED",
    order: 57,
  },
  {
    slug: "paxos-consensus-algorithm",
    question: "Explain the Paxos consensus algorithm at a high level.",
    answer:
      "Paxos lets a group of nodes agree on a single value even if some nodes fail or messages are delayed, using a two-phase process: a proposer asks a majority of acceptors to promise not to accept older proposals (prepare phase), then, if enough promises come back, asks that majority to accept a specific value (accept phase). Because it only needs a majority (not all nodes) to agree, it tolerates minority failures while still guaranteeing that only one value is ultimately chosen. It's notoriously difficult to implement correctly, which is part of why Raft was designed as a more understandable alternative.",
    difficulty: "ADVANCED",
    order: 58,
  },
  {
    slug: "raft-vs-paxos",
    question: "Explain the Raft consensus algorithm and how it differs from Paxos.",
    answer:
      "Raft achieves the same goal as Paxos, getting a cluster of nodes to agree on a sequence of values, but structures it around a strong elected leader that handles all client requests and replicates a log to followers, rather than Paxos's more symmetric proposer/acceptor roles. This makes Raft's leader election and log replication easier to understand and implement correctly, which is why it's become the default choice in newer systems like etcd and CockroachDB. Both provide the same fault-tolerance guarantees; Raft mainly wins on implementability.",
    difficulty: "ADVANCED",
    order: 59,
  },
  {
    slug: "what-is-leader-election",
    question: "What is leader election, and why is it needed in distributed systems?",
    answer:
      "Leader election is the process by which a cluster of nodes picks one node to coordinate a particular task, like accepting all writes or scheduling jobs, avoiding the complexity of every node trying to coordinate simultaneously. It's needed because some operations are much simpler or safer with a single point of coordination, but that single point must be able to fail over automatically. Consensus algorithms like Raft build leader election in as a core primitive; systems like Zookeeper or etcd offer it as a reusable service other applications can build on.",
    difficulty: "ADVANCED",
    order: 60,
  },
  {
    slug: "distributed-locking",
    question: "What is distributed locking, and how can it be implemented with Redis or Zookeeper?",
    answer:
      "A distributed lock ensures that only one process across an entire cluster can hold a given lock at a time, used to serialize access to a shared resource across multiple machines. With Redis, a common approach (Redlock) sets a key with an expiry via SET NX PX, so the lock auto-releases if the holder crashes without unlocking. With Zookeeper, locks are implemented using ephemeral sequential znodes, where a client holds the lock only while its znode is the lowest-numbered one, and the znode disappears automatically if the client's session dies.",
    difficulty: "ADVANCED",
    order: 61,
  },
  {
    slug: "circuit-breaker-pattern",
    question: "What is a circuit breaker pattern, and why is it used?",
    answer:
      "A circuit breaker monitors calls to a dependency, and after enough failures, \"opens\" the circuit so further calls fail immediately (or fall back) instead of waiting on a timeout for a dependency that's already struggling. This protects the calling service from wasting resources on doomed requests, and it protects the failing dependency from being hit with even more load while it's trying to recover. After a cooldown, the breaker allows a trial request through to test if the dependency has recovered before fully closing again.",
    difficulty: "ADVANCED",
    order: 62,
  },
  {
    slug: "exponential-backoff",
    question: "What is exponential backoff, and how does it help with retries?",
    answer:
      "Exponential backoff increases the delay between retry attempts exponentially (e.g. 1s, 2s, 4s, 8s), rather than retrying immediately or at a fixed interval. It gives a struggling downstream service progressively more room to recover instead of being hit with a steady stream of retries. It's typically combined with jitter, randomizing the exact delay, so that many clients retrying after the same failure don't all retry in synchronized waves.",
    difficulty: "ADVANCED",
    order: 63,
  },
  {
    slug: "bulkhead-pattern",
    question: "What is the bulkhead pattern?",
    answer:
      "The bulkhead pattern partitions resources, like thread pools or connection pools, per dependency or tenant, so that one failing or slow dependency can't exhaust resources needed to serve the rest of the system. It's named after a ship's bulkheads, which contain flooding to one compartment instead of sinking the whole ship. Without it, a single slow downstream call can tie up every available thread, taking down unrelated functionality that shares the same pool.",
    difficulty: "ADVANCED",
    order: 64,
  },
  {
    slug: "what-is-cqrs",
    question: "Explain CQRS (Command Query Responsibility Segregation).",
    answer:
      "CQRS splits an application's write model (commands, which change state) from its read model (queries, which return data), often backed by separate data stores optimized for each. This lets the write side focus on consistency and validation, while the read side can be denormalized or cached aggressively for fast, flexible queries. It adds complexity, mainly keeping the two models in sync, so it's best applied where read and write patterns genuinely diverge, not universally.",
    difficulty: "ADVANCED",
    order: 65,
  },
  {
    slug: "what-is-event-sourcing",
    question: "What is event sourcing?",
    answer:
      "Event sourcing stores state as an append-only sequence of events (\"order placed,\" \"item shipped\") rather than storing just the current state directly. Current state is derived by replaying the events, which means the system retains a full audit trail and can reconstruct state as of any point in time. It pairs naturally with CQRS, where the event log is the write model and one or more projections built from it serve as read models.",
    difficulty: "ADVANCED",
    order: 66,
  },
  {
    slug: "what-are-crdts",
    question: "What are CRDTs (Conflict-free Replicated Data Types)?",
    answer:
      "CRDTs are data structures designed so that replicas can be updated independently and concurrently, and merged back together automatically without conflicts, because the merge operation is mathematically guaranteed to converge regardless of the order operations arrive in. Common examples include grow-only counters, last-write-wins registers, and observed-remove sets. They're used in systems that need multi-master writes without a central coordinator, like collaborative editors and offline-first mobile apps.",
    difficulty: "ADVANCED",
    order: 67,
  },
  {
    slug: "what-are-vector-clocks",
    question: "What are vector clocks, and how do they help resolve conflicts?",
    answer:
      "A vector clock is a set of counters, one per node, that a system attaches to each update so it can determine the causal ordering between two versions of the same data, whether one happened strictly before the other, or whether they happened concurrently and conflict. When two versions are concurrent, the system knows an actual conflict occurred (rather than one update simply being newer) and can apply an explicit resolution strategy instead of silently picking one. Dynamo-style databases use vector clocks specifically to detect these conflicting writes across replicas.",
    difficulty: "ADVANCED",
    order: 68,
  },
  {
    slug: "what-is-backpressure",
    question: "What is backpressure, and how do systems handle it?",
    answer:
      "Backpressure occurs when a producer generates work faster than a consumer can process it, and without handling, the excess either gets dropped, buffered until memory runs out, or crashes the consumer. Systems handle it by having the consumer signal capacity back to the producer (reactive streams), bounding queue sizes and rejecting or shedding load once full, or applying rate limiting at the producer. The right response depends on whether it's acceptable to drop, delay, or reject excess work for that particular data.",
    difficulty: "ADVANCED",
    order: 69,
  },
  {
    slug: "what-is-a-service-mesh",
    question: "What is a service mesh, and what problems does it solve (e.g., Istio)?",
    answer:
      "A service mesh is an infrastructure layer, usually implemented as a sidecar proxy next to each service instance, that handles service-to-service communication concerns: mTLS encryption, retries, circuit breaking, load balancing, and observability. It solves the problem of every microservice otherwise having to implement these concerns itself in application code, moving them into infrastructure that's configured centrally instead. The tradeoff is added operational complexity and latency overhead from the extra proxy hop.",
    difficulty: "ADVANCED",
    order: 70,
  },
  {
    slug: "microservices-vs-monolith",
    question: "Microservices vs monolith, what are the tradeoffs?",
    answer:
      "A monolith is simpler to develop, test, and deploy as a single unit, with no network overhead between components, but it forces the entire application to scale, deploy, and use the same tech stack together. Microservices let teams scale, deploy, and choose technology independently per service, but introduce network latency, distributed system failure modes, and significant operational complexity (service discovery, distributed tracing, data consistency across services). Most teams are better served starting with a monolith and splitting out services only where independent scaling or team boundaries genuinely demand it.",
    difficulty: "ADVANCED",
    order: 71,
  },
  {
    slug: "microservices-service-discovery",
    question: "How do microservices handle service discovery?",
    answer:
      "Service discovery lets a service find the current network location of another service, since instances in a dynamic environment (autoscaling, container orchestration) come and go and don't have stable addresses. In client-side discovery, the caller queries a registry (like Consul or etcd) directly and load-balances itself; in server-side discovery, the caller goes through a load balancer or service mesh that queries the registry on its behalf. Most modern setups favor server-side discovery via a service mesh or platform-level load balancer, keeping the discovery logic out of application code.",
    difficulty: "ADVANCED",
    order: 72,
  },
  {
    slug: "what-is-distributed-tracing",
    question: "What is distributed tracing, and why is it important in microservices?",
    answer:
      "Distributed tracing follows a single request as it flows across multiple services, tagging each hop with a shared trace ID and recording the time spent in each service (a span). It's essential in microservices because a slow or failing request could be caused by any one of a dozen services it passes through, and without a trace, there's no way to see which hop is actually responsible. Tools like Jaeger and Zipkin visualize these traces as a timeline, making the bottleneck immediately visible.",
    difficulty: "ADVANCED",
    order: 73,
  },
  {
    slug: "data-consistency-across-microservices",
    question: "What are the challenges of maintaining data consistency across microservices?",
    answer:
      "Once each microservice owns its own database, there's no single transaction that can atomically update data across services the way a monolith's single database transaction could. Teams instead rely on patterns like Sagas (a sequence of local transactions with compensations), eventual consistency via asynchronous events, or outbox patterns to reliably publish events alongside a local write. The core challenge is that the strong consistency guarantees available inside one database don't carry over once state is split across service boundaries.",
    difficulty: "ADVANCED",
    order: 74,
  },
  {
    slug: "design-a-distributed-cache",
    question: "How would you design a distributed cache (like Redis Cluster)?",
    answer:
      "Partition keys across multiple cache nodes using consistent hashing, so adding or removing nodes only reshuffles a small fraction of keys, and replicate each shard to a backup node for fail-over. Clients (or a proxy layer) need to know the current partition mapping to route requests directly to the right node rather than fanning out to all of them. Handling node failure gracefully, promoting a replica and updating the partition mapping, is the hard part; a naive design works fine until the first node dies.",
    difficulty: "ADVANCED",
    order: 75,
  },
  {
    slug: "design-a-distributed-job-scheduler",
    question: "How would you design a distributed job scheduler?",
    answer:
      "Store jobs with their scheduled run time in a durable store, and have a pool of scheduler nodes poll for due jobs, using distributed locking or a claim mechanism to ensure only one worker picks up a given job even with multiple schedulers running. Failed or crashed workers need their claimed-but-unfinished jobs to become visible again after a timeout, so no job silently disappears. At scale, jobs are typically partitioned (by time bucket or job type) across scheduler nodes to avoid one node becoming a bottleneck.",
    difficulty: "ADVANCED",
    order: 76,
  },
  {
    slug: "design-a-news-feed-system",
    question: "How would you design a news feed system (like Twitter/Facebook)?",
    answer:
      "The core design decision is fan-out: fan-out-on-write precomputes each follower's feed at post time (fast reads, expensive for users with huge follower counts), while fan-out-on-read assembles the feed at request time by merging the posts of everyone a user follows (cheap writes, slower reads). Most large-scale systems use a hybrid: fan-out-on-write for typical users, falling back to fan-out-on-read for celebrity accounts with millions of followers, to avoid writing one post into millions of feeds. Ranking, deduplication, and pagination are layered on top of whichever base feed-assembly strategy is chosen.",
    difficulty: "ADVANCED",
    order: 77,
  },
  {
    slug: "design-a-chat-application",
    question: "How would you design a chat application (like WhatsApp)?",
    answer:
      "Clients hold a persistent connection (WebSocket) to a chat server, which routes messages to the recipient's connection if they're online, or persists the message for delivery when they reconnect if offline. Messages need a durable store keyed by conversation, delivery/read receipts require additional state per message per recipient, and the connection layer needs to track which server a given user is connected to, since that varies with which server they most recently connected to behind the load balancer. Group chats add fan-out complexity similar to a news feed, since one message needs to reach every member's connection.",
    difficulty: "ADVANCED",
    order: 78,
  },
  {
    slug: "design-a-ride-sharing-system",
    question: "How would you design a ride-sharing system (like Uber)?",
    answer:
      "The core problem is efficient geospatial matching: drivers continuously report location, indexed using a structure like a geohash or quadtree so the system can quickly find nearby available drivers for a rider's request. Once matched, the system needs to track ride state (requested, accepted, in progress, completed) reliably even as both parties' connections come and go, and pricing/ETA calculations layer on top of the location data. At scale, location updates are extremely high-volume and write-heavy, so they're usually handled by a separate, purpose-built pipeline rather than the same database as ride and payment records.",
    difficulty: "ADVANCED",
    order: 79,
  },
  {
    slug: "design-a-video-streaming-platform",
    question: "How would you design a video streaming platform (like YouTube/Netflix)?",
    answer:
      "Uploaded video is transcoded into multiple resolutions and bitrates, then split into small chunks and distributed via a CDN, so playback can use adaptive bitrate streaming, switching quality based on the viewer's current network conditions. Metadata (titles, descriptions, view counts) lives in a separate database from the actual video bytes, which live in blob storage behind the CDN. The two biggest design challenges are the transcoding pipeline (CPU-intensive, needs to scale independently of the serving path) and making sure popular content is cached at edge locations close to viewers rather than repeatedly pulled from origin storage.",
    difficulty: "ADVANCED",
    order: 80,
  },

  // ---------- Expert / Specialized (81-100) ----------
  {
    slug: "design-for-multi-region-global-availability",
    question: "How would you design a system for multi-region/global availability?",
    answer:
      "Deploy independent stacks in multiple geographic regions, routing users to the nearest healthy region via DNS or a global load balancer, so a regional outage only affects users routed there. The hard part is data: either replicate data across regions (accepting eventual consistency and conflict resolution for concurrent writes) or partition users/data by region entirely, trading global availability of any single piece of data for simpler consistency. The right approach depends heavily on whether the data needs to be globally consistent or can be regionally scoped.",
    difficulty: "EXPERT",
    order: 81,
  },
  {
    slug: "blue-green-vs-canary-deployment",
    question: "What is blue-green deployment, and how does it differ from canary release?",
    answer:
      "Blue-green deployment runs two full identical environments, only one live at a time, and cuts over traffic entirely from the old (blue) to the new (green) version once it's verified, giving an instant rollback by simply switching back. Canary release instead shifts a small percentage of traffic to the new version, monitors it, and gradually increases the percentage if it looks healthy, catching problems before they affect all users but taking longer to fully roll out. Blue-green optimizes for a fast, clean cutover; canary optimizes for catching regressions with minimal blast radius.",
    difficulty: "EXPERT",
    order: 82,
  },
  {
    slug: "distributed-file-systems-fault-tolerance",
    question: "What is a distributed file system (e.g., GFS, HDFS), and how does it handle fault tolerance?",
    answer:
      "A distributed file system splits large files into fixed-size chunks (blocks) spread across many storage nodes, with a central metadata server (like HDFS's NameNode or GFS's master) tracking which nodes hold which chunks. Fault tolerance comes from replicating each chunk onto multiple nodes (typically 3), so a node failure just means re-replicating its chunks from the surviving copies elsewhere, verified via periodic heartbeats from storage nodes. The metadata server itself is a critical single point of failure in the original designs, which is why later systems added standby metadata nodes or split metadata across multiple servers.",
    difficulty: "EXPERT",
    order: 83,
  },
  {
    slug: "inverted-index-search-engines",
    question: "How does an inverted index work in search engines (like Elasticsearch)?",
    answer:
      "An inverted index maps each term to the list of documents (and positions within them) that contain it, the inverse of a normal document-to-terms mapping, hence the name. A search query is decomposed into terms, each term's document list (postings list) is looked up, and the lists are intersected or merged and ranked (often via a scoring function like BM25) to produce results. This structure is what makes full-text search fast: instead of scanning every document for a term, the engine does a direct lookup into the term's postings list.",
    difficulty: "EXPERT",
    order: 84,
  },
  {
    slug: "design-a-search-autocomplete-system",
    question: "How would you design a search autocomplete system?",
    answer:
      "Precompute and store the top-k most frequent completions for every relevant prefix, typically using a trie (or a trie-backed cache) so a lookup for a given prefix is fast, close to constant time relative to the length typed so far. Query frequency data is aggregated from real search logs, usually in an offline batch job that periodically rebuilds the trie rather than updating it live on every search, since freshness at the second-by-second level rarely matters for this feature. The main design tension is between freshness (how quickly new popular queries show up) and the cost of rebuilding the index frequently.",
    difficulty: "EXPERT",
    order: 85,
  },
  {
    slug: "stream-processing-kafka-streams-flink",
    question: "What is stream processing, and how do frameworks like Kafka Streams or Flink work?",
    answer:
      "Stream processing computes results continuously over an unbounded flow of events as they arrive, rather than running a batch job over a fixed dataset after the fact. Frameworks like Kafka Streams and Flink read from a source stream (often Kafka), apply transformations, aggregations, and windowing (grouping events into time-based buckets) over that stream, and write results to a sink, all while tracking progress so processing can resume correctly after a failure. The core challenges these frameworks solve are handling out-of-order events (via watermarks) and providing exactly-once processing guarantees despite failures.",
    difficulty: "EXPERT",
    order: 86,
  },
  {
    slug: "what-is-chaos-engineering",
    question: "What is chaos engineering, and why do companies practice it?",
    answer:
      "Chaos engineering deliberately injects failures, like killing instances, adding network latency, or cutting off a dependency, into a system, usually in production, to verify it actually behaves the way the design assumes it will under failure. Companies practice it because failure-handling code (retries, circuit breakers, fail-over) is exactly the code path that's least exercised in normal operation, so bugs in it often only surface during a real incident. Running controlled experiments finds those bugs on your own schedule, rather than discovering them for the first time during an actual outage.",
    difficulty: "EXPERT",
    order: 87,
  },
  {
    slug: "design-a-system-to-handle-ddos",
    question: "How would you design a system to handle DDoS attacks?",
    answer:
      "Layer defenses: a CDN or edge network absorbs and filters volumetric traffic before it reaches origin servers, rate limiting and IP reputation filtering catch application-layer attacks that get through, and auto-scaling absorbs legitimate traffic spikes that look similar to an attack. Distinguishing attack traffic from a legitimate flash crowd is the genuinely hard part, which is why most production defenses combine automated heuristics (request patterns, challenge-response like CAPTCHAs) with the ability for a human to intervene during a large-scale attack. Keeping critical infrastructure like DNS and load balancers redundant across providers also limits how much a single attack vector can take down.",
    difficulty: "EXPERT",
    order: 88,
  },
  {
    slug: "what-is-mtls",
    question: "What is mTLS, and how is it used in service-to-service communication?",
    answer:
      "mTLS (mutual TLS) extends standard TLS so that both the client and the server present certificates and verify each other's identity, rather than only the client verifying the server as in typical HTTPS. In service-to-service communication, this means one internal service can cryptographically prove its identity to another, preventing an attacker who gets network access from impersonating a trusted service. It's commonly implemented transparently by a service mesh sidecar, so individual services don't need to manage certificates themselves.",
    difficulty: "EXPERT",
    order: 89,
  },
  {
    slug: "oauth2-vs-oidc",
    question: "What is OAuth2 vs OIDC, and how do they differ?",
    answer:
      "OAuth2 is an authorization framework: it lets a user grant a third-party application limited access to their resources on another service, without sharing their password, by issuing an access token. OIDC (OpenID Connect) is built on top of OAuth2 and adds authentication: it introduces an ID token containing verified identity information about the user, letting an application know who the user actually is, not just what they're authorized to access. In short, OAuth2 answers \"what can this app do on my behalf,\" while OIDC answers \"who is this user.\"",
    difficulty: "EXPERT",
    order: 90,
  },
  {
    slug: "design-a-payment-processing-system",
    question: "How would you design a payment processing system with strong consistency guarantees?",
    answer:
      "Every state-changing operation goes through a single source of truth (typically a relational database with ACID transactions) using idempotency keys to make retries safe, since a payment must never be double-charged or silently dropped. External calls to payment providers are treated as untrusted and unreliable: the system records an intent before calling out, and reconciles the actual outcome afterward via the provider's callback or a polling job, rather than assuming the synchronous response is the final truth. Every balance-changing operation is typically modeled as an append-only ledger of transactions rather than a mutable balance field, so the full history is auditable and a balance can always be recomputed and verified independently.",
    difficulty: "EXPERT",
    order: 91,
  },
  {
    slug: "design-real-time-collaborative-editing",
    question: "How would you design a system for real-time collaborative editing (like Google Docs)?",
    answer:
      "Each edit is represented as an operation (insert, delete) rather than a full document snapshot, and the core challenge is merging concurrent operations from multiple users so every client converges to the same final document. This is typically solved with either Operational Transformation (transforms each incoming operation against concurrent ones before applying it) or CRDTs (structure operations so they merge deterministically without needing transformation). A central server usually still sequences operations and broadcasts them to all connected clients, even in CRDT-based designs, to keep latency low and give a canonical ordering for persistence.",
    difficulty: "EXPERT",
    order: 92,
  },
  {
    slug: "design-a-distributed-logging-monitoring-system",
    question: "How would you design a distributed logging/monitoring system?",
    answer:
      "Services emit logs and metrics locally, which are collected by a lightweight agent and shipped asynchronously to a centralized pipeline, usually through a buffering layer like Kafka so a slow ingestion backend doesn't block the services producing the data. From there, metrics get aggregated into a time-series database for dashboards and alerting, while logs get indexed (often via an inverted index, like Elasticsearch) for search. At scale, the ingestion and storage volume vastly exceeds the application traffic it's monitoring, so sampling, retention tiers, and log-level filtering are essential to keep costs and query latency manageable.",
    difficulty: "EXPERT",
    order: 93,
  },
  {
    slug: "design-an-ad-click-aggregation-system",
    question: "How would you design an ad click aggregation/analytics system?",
    answer:
      "Ingest raw click events into a durable, high-throughput log (like Kafka), then use a stream processing job to aggregate counts into time-windowed buckets (clicks per ad per minute/hour), writing results into a store optimized for fast aggregate reads. The two hard problems are deduplication (the same click arriving twice due to retries shouldn't be double-counted, usually solved with an idempotency key per click event) and late or out-of-order events (a click's timestamp and its arrival time can differ, requiring watermarking logic to decide when a time window is \"final\"). Raw events are also usually retained separately for reprocessing, since aggregation logic and business rules tend to change over time.",
    difficulty: "EXPERT",
    order: 94,
  },
  {
    slug: "design-duplicate-content-detection",
    question: "How would you design a system for detecting duplicate content at scale?",
    answer:
      "Exact duplicates are trivial: hash the content and compare hashes. Near-duplicates require a similarity-preserving technique like MinHash combined with Locality-Sensitive Hashing (LSH), which buckets similar (not just identical) items together so you only need to compare candidates within the same bucket instead of every pair of items in the dataset. This turns an otherwise quadratic all-pairs comparison problem into a roughly linear one, which is essential once the content set reaches millions or billions of items.",
    difficulty: "EXPERT",
    order: 95,
  },
  {
    slug: "design-a-global-unique-id-generator",
    question: "How would you design a global unique ID generator (like Twitter Snowflake)?",
    answer:
      "Snowflake-style IDs are generated locally on each node without coordination, by packing a timestamp, a machine/worker ID, and a per-millisecond sequence number into a single 64-bit integer. This guarantees uniqueness (no two nodes can produce the same combination) and rough time-ordering (IDs generated later have higher values) without any central coordinator or round trip, which is what lets it scale to massive throughput. The tradeoff is that IDs are only as time-ordered as clock synchronization across nodes allows, so clock skew needs to be actively monitored.",
    difficulty: "EXPERT",
    order: 96,
  },
  {
    slug: "optimizing-storage-costs-hot-cold-tiers",
    question: "How would you optimize storage costs at scale (hot vs cold data tiers)?",
    answer:
      "Classify data by access frequency and move it through tiers accordingly: hot data (frequently accessed, latency-sensitive) stays on fast, expensive storage like SSDs or in-memory caches; warm data moves to standard object storage; cold data (rarely accessed, like old logs or archived records) moves to cheap, high-latency archival storage. The transitions are usually automated with lifecycle policies based on age or last-access time, since manually managing this at scale isn't feasible. The key design decision is picking access-pattern thresholds that actually reflect how the data is used, not just its age, since some old data stays hot and some new data goes cold immediately.",
    difficulty: "EXPERT",
    order: 97,
  },
  {
    slug: "design-an-autoscaling-system",
    question: "How would you design an autoscaling system for compute resources?",
    answer:
      "An autoscaler continuously monitors a signal (CPU utilization, request queue depth, custom application metrics) and compares it against target thresholds, adding or removing instances to keep the signal within the target range. It needs to react conservatively to avoid thrashing (rapidly scaling up and down in response to noisy short-term spikes), typically using cooldown periods and averaging metrics over a window rather than reacting to instantaneous values. Scaling up is usually fast and aggressive to handle load quickly, while scaling down is deliberately slower and more cautious, since removing capacity too early risks a fresh spike hitting an under-provisioned system.",
    difficulty: "EXPERT",
    order: 98,
  },
  {
    slug: "schema-migrations-live-high-traffic-database",
    question: "How would you handle schema migrations in a live, high-traffic database?",
    answer:
      "The core technique is the expand-contract pattern: first expand the schema additively (add a new column or table without touching the old one), deploy application code that writes to both old and new simultaneously, backfill historical data into the new schema, then switch reads to the new schema, and only once everything is verified working, contract by removing the old column. This avoids ever having a moment where the schema and the running application code are incompatible, since each step is independently backward-compatible. Large table alterations (like adding a NOT NULL column) are also often done online via a schema-change tool that copies data in small batches, avoiding a long table-lock that would block production traffic.",
    difficulty: "EXPERT",
    order: 99,
  },
  {
    slug: "design-resilient-to-full-datacenter-outage",
    question: "How would you design a system resilient to a full data center outage?",
    answer:
      "The system needs at least one other fully independent data center capable of serving all traffic, with data replicated there continuously (not just backed up periodically), and a way to detect the outage and redirect traffic, typically via health-checked DNS or a global load balancer with automatic fail-over. The hardest part is usually the data layer: replication introduces a consistency-versus-latency tradeoff, and a fail-over needs a clear, tested policy for reconciling any writes that were in flight or not yet replicated when the outage hit. Regularly testing the fail-over itself (not just building it) is what determines whether it actually works when a real outage happens.",
    difficulty: "EXPERT",
    order: 100,
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

  for (const question of questions) {
    await prisma.interviewQuestion.upsert({
      where: { slug: question.slug },
      update: {
        question: question.question,
        answer: question.answer,
        difficulty: question.difficulty,
        order: question.order,
      },
      create: {
        slug: question.slug,
        question: question.question,
        answer: question.answer,
        difficulty: question.difficulty,
        order: question.order,
      },
    });
  }
  console.log(`Seeded ${questions.length} interview questions`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
