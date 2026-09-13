/**
 * keywords.js
 *
 * Canonical keyword list built from the actual tag vocabulary used in the
 * seeded question bank (webdev / dsa / csfundamentals).
 *
 * Each entry has:
 *   canonical  – the display name / key returned to the client
 *   variants   – all substrings that should match this keyword in JD text
 *                (lowercased, order matters: longer/more-specific first)
 */

const { getSeedKeywords } = require("../seed/loader");

const KEYWORDS = [
  // ── Frontend / HTML / CSS ──────────────────────────────────────────────────
  { canonical: "html",              variants: ["html"] },
  { canonical: "semantic-html",     variants: ["semantic html", "semantic-html"] },
  { canonical: "css",               variants: ["css"] },
  { canonical: "flexbox",           variants: ["flexbox", "flex box"] },
  { canonical: "css-grid",          variants: ["css grid", "grid layout"] },
  { canonical: "responsive-design", variants: ["responsive design", "responsive-design", "media quer"] },
  { canonical: "specificity",       variants: ["css specificity", "specificity"] },
  { canonical: "positioning",       variants: ["css position", "positioning"] },
  { canonical: "web-design",        variants: ["web design", "ui design"] },

  // ── JavaScript ────────────────────────────────────────────────────────────
  { canonical: "javascript",        variants: ["javascript", "js "] },
  { canonical: "es6",               variants: ["es6", "es2015", "ecmascript"] },
  { canonical: "closures",          variants: ["closure"] },
  { canonical: "promises",          variants: ["promise"] },
  { canonical: "async",             variants: ["async/await", "async ", "await"] },
  { canonical: "event-loop",        variants: ["event loop", "event-loop"] },
  { canonical: "dom",               variants: ["dom ", "document object model"] },
  { canonical: "events",            variants: ["event listener", "event handler", "addeventlistener"] },
  { canonical: "json",              variants: ["json"] },
  { canonical: "fetch",             variants: ["fetch api", "fetch("] },
  { canonical: "browser-storage",   variants: ["localstorage", "sessionstorage", "indexeddb", "browser storage"] },
  { canonical: "scope",             variants: ["variable scope", "lexical scope", "hoisting"] },

  // ── React ──────────────────────────────────────────────────────────────────
  { canonical: "react",             variants: ["react"] },
  { canonical: "hooks",             variants: ["usestate", "useeffect", "usememo", "usecallback", "react hook"] },
  { canonical: "state-management",  variants: ["state management", "redux", "zustand", "context api"] },
  { canonical: "components",        variants: ["react component", "reusable component"] },
  { canonical: "props",             variants: [" props", "proptype"] },
  { canonical: "performance",       variants: ["usememo", "react.memo", "code splitting", "lazy load", "web vitals", "lighthouse"] },

  // ── HTTP / API ─────────────────────────────────────────────────────────────
  { canonical: "http",              variants: ["http"] },
  { canonical: "rest-api",          variants: ["rest api", "restful", "rest-api"] },
  { canonical: "cors",              variants: ["cors", "cross-origin"] },
  { canonical: "jwt",               variants: ["jwt", "json web token"] },
  { canonical: "authentication",    variants: ["authentication", "oauth", "sso"] },
  { canonical: "web-security",      variants: ["web security", "owasp"] },
  { canonical: "xss",               variants: ["xss", "cross-site scripting"] },
  { canonical: "csrf",              variants: ["csrf", "cross-site request forgery"] },

  // ── Node.js / Backend ──────────────────────────────────────────────────────
  { canonical: "nodejs",            variants: ["node.js", "nodejs", "node "] },
  { canonical: "server-side",       variants: ["server-side", "server side", "backend", "back-end", "back end"] },
  { canonical: "web-development",   variants: ["web development", "full.?stack", "full stack"] },
  { canonical: "web-performance",   variants: ["web performance", "core web vitals", "page speed"] },
  { canonical: "rendering",         variants: ["server-side render", "ssr", "browser render", "critical render"] },

  // ── Data Structures & Algorithms ──────────────────────────────────────────
  { canonical: "data-structures",   variants: ["data structure"] },
  { canonical: "algorithms",        variants: ["algorithm"] },
  { canonical: "arrays",            variants: ["array"] },
  { canonical: "linked-list",       variants: ["linked list", "linked-list"] },
  { canonical: "stack",             variants: ["stack"], excludePattern: /(?:full|tech|front|back|mean|mern|lamp)(?:\s+|-)stack|stack\s+(?:overflow|trace|frame|developer|engineer)/i },
  { canonical: "queue",             variants: ["queue"] },
  { canonical: "trees",             variants: ["tree "] },
  { canonical: "binary-tree",       variants: ["binary tree", "bst", "avl tree", "avl-tree"] },
  { canonical: "graphs",            variants: ["graph "] },
  { canonical: "hashing",           variants: ["hash table", "hashmap", "hash map", "hashing"] },
  { canonical: "heap",              variants: ["heap ", "priority queue", "priority-queue"] },
  { canonical: "trie",              variants: ["trie"] },
  { canonical: "recursion",         variants: ["recursion", "recursive"] },
  { canonical: "sorting",           variants: ["sorting", "sort algorithm", "merge sort", "quick sort", "heap sort", "bubble sort"] },
  { canonical: "searching",         variants: ["binary search", "linear search"] },
  { canonical: "dynamic-programming", variants: ["dynamic programming", "dp "] },
  { canonical: "greedy",            variants: ["greedy algorithm", "greedy approach"] },
  { canonical: "two-pointers",      variants: ["two pointer", "two-pointer"] },
  { canonical: "sliding-window",    variants: ["sliding window", "sliding-window"] },
  { canonical: "big-o",             variants: ["big o", "big-o", "time complexity", "space complexity", "o(n)", "o(log n)"] },
  { canonical: "complexity",        variants: ["complexity analysis", "asymptotic"] },
  { canonical: "bfs",               variants: ["breadth.first", "bfs"] },
  { canonical: "dfs",               variants: ["depth.first", "dfs"] },
  { canonical: "topological-sort",  variants: ["topological sort", "topological-sort"] },
  { canonical: "dsu",               variants: ["disjoint set", "union.find", "dsu"] },
  { canonical: "dijkstra",          variants: ["dijkstra"] },
  { canonical: "shortest-path",     variants: ["shortest path", "shortest-path"] },
  { canonical: "mst",               variants: ["minimum spanning tree", "kruskal", "prim"] },

  // ── Operating Systems ──────────────────────────────────────────────────────
  { canonical: "operating-systems", variants: ["operating system"] },
  { canonical: "processes",         variants: ["process management", "process scheduling"] },
  { canonical: "threads",           variants: ["multithreading", "thread", "concurren"] },
  { canonical: "concurrency",       variants: ["concurren", "parallel", "mutex", "semaphore", "race condition"] },
  { canonical: "synchronization",   variants: ["synchronization", "synchroniz"] },
  { canonical: "memory-management", variants: ["memory management", "virtual memory", "paging", "page replacement"] },
  { canonical: "cpu-scheduling",    variants: ["cpu scheduling", "round robin", "process schedul"] },
  { canonical: "deadlocks",         variants: ["deadlock"] },
  { canonical: "virtual-memory",    variants: ["virtual memory", "paging", "page fault"] },
  { canonical: "cache",             variants: ["cache", "cpu cache", "memory hierarchy"] },

  // ── Computer Networks ──────────────────────────────────────────────────────
  { canonical: "computer-networks", variants: ["computer network", "networking"] },
  { canonical: "tcp",               variants: ["tcp/ip", "tcp "] },
  { canonical: "dns",               variants: ["dns "] },
  { canonical: "osi",               variants: ["osi model", "osi layer"] },
  { canonical: "ip",                variants: ["ip address", "ipv4", "ipv6", "subnet"] },
  { canonical: "protocols",         variants: ["protocol"] },
  { canonical: "routing",           variants: ["routing", "router"] },

  // ── Databases / SQL ────────────────────────────────────────────────────────
  { canonical: "sql",               variants: ["sql"] },
  { canonical: "dbms",              variants: ["dbms", "database management", "rdbms"] },
  { canonical: "databases",         variants: ["database", "relational", "nosql", "mongodb", "postgresql", "mysql", "sqlite"] },
  { canonical: "normalization",     variants: ["normalization", "normalisation", "normal form"] },
  { canonical: "joins",             variants: ["sql join", "inner join", "outer join", "left join"] },
  { canonical: "transactions",      variants: ["transaction", "acid"] },
  { canonical: "indexing",          variants: ["database index", "db index"] },
  { canonical: "query-optimization",variants: ["query optimiz", "query plan", "explain plan"] },
  { canonical: "data-modeling",     variants: ["data model", "entity.relation", "erd", "schema design"] },

  // ── OOP / Software Engineering ────────────────────────────────────────────
  { canonical: "oop",               variants: ["object.oriented", "oop"] },
  { canonical: "inheritance",       variants: ["inheritance"] },
  { canonical: "encapsulation",     variants: ["encapsulation"] },
  { canonical: "polymorphism",      variants: ["polymorphism"] },
  { canonical: "abstraction",       variants: ["abstraction"] },
  { canonical: "design-patterns",   variants: ["design pattern", "solid principle", "mvc", "factory", "singleton", "observer"] },
  { canonical: "software-development", variants: ["software development", "software engineering", "sdlc"] },
  { canonical: "software-testing",  variants: ["unit test", "integration test", "tdd", "bdd", "test.driven"] },
  { canonical: "debugging",         variants: ["debugging", "troubleshoot"] },
  { canonical: "exception-handling",variants: ["exception handling", "error handling", "try.catch"] },

  // ── Version Control / Tooling ─────────────────────────────────────────────
  { canonical: "git",               variants: ["git "] },
  { canonical: "version-control",   variants: ["version control", "git", "github", "gitlab", "bitbucket"] },
  { canonical: "compiler",          variants: ["compiler", "lexical analysis", "syntax analysis", "parsing"] },
  { canonical: "programming-languages", variants: ["programming language", "python", "java ", "c++", "typescript", "golang"] },

  // ── Systems / Architecture ────────────────────────────────────────────────
  { canonical: "computer-architecture", variants: ["computer architecture", "cpu design", "instruction set"] },
  { canonical: "systems",           variants: ["system design", "distributed system", "microservice"] },
  { canonical: "security",          variants: ["security", "encryption", "cryptography", "https"] },
];

// Every question bank contributes its tags, so adding a JSON file also adds
// its job-description vocabulary without another route change.
const keywordByCanonical = new Map(KEYWORDS.map((entry) => [entry.canonical, entry]));
for (const tag of getSeedKeywords()) {
  const canonical = tag.trim();
  if (!canonical) continue;

  const variants = [canonical.toLowerCase()];
  const spaced = canonical.toLowerCase().replace(/[-_]+/g, " ");
  if (spaced !== variants[0]) variants.push(spaced);

  const existing = keywordByCanonical.get(canonical);
  if (existing) {
    existing.variants = [...new Set([...existing.variants, ...variants])];
  } else {
    const entry = { canonical, variants, wordBoundary: true };
    keywordByCanonical.set(canonical, entry);
    KEYWORDS.push(entry);
  }
}

module.exports = KEYWORDS;
