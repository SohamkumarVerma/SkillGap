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
 *   excludePattern – optional RegExp; matches that overlap this are subtracted
 */

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
  { canonical: "closures",          variants: ["closure"], excludePattern: /timing\s+closure/i },
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
  { canonical: "stack",             variants: ["stack"], excludePattern: /(?:full|tech|front|back|mean|mern|lamp|across\s+the|our|modern|current|the\s+whole|software|open)(?:\s+|-)stack|stack\s+(?:overflow|trace|frame|developer|engineer|includes|of\s+choice)|(?:full|tech|front|back)-stack/i },
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

  // ── Aerospace Engineering ─────────────────────────────────────────────────
  { canonical: "aerospace",                   variants: ["aerospace engineering", "aeronautical engineering", "aerospace systems engineering"] },
  { canonical: "aerodynamics",                variants: ["aerodynamics", "aerodynamic analysis", "aerodynamic performance"] },
  { canonical: "fluid-mechanics",             variants: ["computational fluid dynamics", "cfd analysis", "cfd simulation", "fluid mechanics", "fluid flow"] },
  { canonical: "flight-control",              variants: ["flight dynamics", "flight control", "aircraft dynamics", "flight controls"] },
  { canonical: "aircraft",                    variants: ["aircraft design", "airframe design", "aircraft configuration"] },
  { canonical: "propulsion",                  variants: ["propulsion systems", "aircraft propulsion", "aerospace propulsion", "rocket propulsion"] },
  { canonical: "jet-engines",                 variants: ["jet engine", "turbofan engine", "turbojet engine", "gas turbine"] },
  { canonical: "rockets",                     variants: ["rocket engine", "liquid rocket engine", "solid rocket motor", "rocket propulsion"] },
  { canonical: "orbital-mechanics",           variants: ["orbital mechanics", "orbit mechanics", "spacecraft trajectory"] },
  { canonical: "spacecraft",                  variants: ["spacecraft systems", "spacecraft system", "spacecraft subsystems"] },
  { canonical: "structural-design",           variants: ["finite element analysis", "fea analysis", "aerospace structural", "aircraft structural"] },
  { canonical: "aeronautical",                variants: ["catia", "catia v5", "ansys fluent", "fluent cfd", "matlab simulink"] },
  { canonical: "aircraft-stability",          variants: ["aerospace safety", "flight safety", "aircraft safety", "aircraft stability"] },

  // ── Chemical Engineering ──────────────────────────────────────────────────
  { canonical: "chemical-engineering",        variants: ["chemical engineering", "chemical process engineering"] },
  { canonical: "process-engineering",         variants: ["process engineering", "process development", "process design"] },
  { canonical: "process-control",             variants: ["process control", "chemical process control", "pid control", "pid controller"] },
  { canonical: "process",                     variants: ["process simulation", "chemical process simulation", "aspen plus", "aspenplus", "hysys", "process modeling"] },
  { canonical: "heat-transfer",               variants: ["heat transfer", "heat exchanger", "thermal design"] },
  { canonical: "mass-transfer",               variants: ["mass transfer", "separation processes", "separation operations"] },
  { canonical: "thermodynamics",              variants: ["chemical thermodynamics", "engineering thermodynamics", "process thermodynamics"] },
  { canonical: "reaction-engineering",        variants: ["reaction engineering", "chemical reaction engineering", "reactor design", "reactor engineering"] },
  { canonical: "distillation",                variants: ["distillation", "distillation column", "distillation design"] },
  { canonical: "process-safety",              variants: ["process safety", "hazop", "hazard and operability", "industrial safety"] },
  { canonical: "process-optimization",        variants: ["process optimization", "chemical process optimization"] },

  // ── CPU Design ─────────────────────────────────────────────────────────────
  { canonical: "cpu",                         variants: ["cpu design", "processor design", "microprocessor design"] },
  { canonical: "microarchitecture",           variants: ["microarchitecture", "cpu microarchitecture", "processor microarchitecture"] },
  { canonical: "isa",                         variants: ["instruction set architecture", "isa design", "instruction set"] },
  { canonical: "pipelining",                  variants: ["instruction pipeline", "cpu pipeline", "processor pipeline", "pipelined processor"] },
  { canonical: "out-of-order",                variants: ["out-of-order execution", "out of order execution", "ooo execution"] },
  { canonical: "branch-prediction",           variants: ["branch prediction", "branch predictor"] },
  { canonical: "memory-hierarchy",            variants: ["memory hierarchy", "processor memory hierarchy", "cache hierarchy"] },
  { canonical: "superscalar",                 variants: ["superscalar architecture", "superscalar processor", "superscalar design"] },
  { canonical: "rtl",                         variants: ["rtl design", "rtl coding", "register transfer level", "rtl implementation"] },
  { canonical: "verilog",                     variants: ["verilog", "verilog hdl", "verilog hardware description language"] },
  { canonical: "systemverilog",               variants: ["systemverilog", "system verilog", "systemverilog rtl", "systemverilog hdl", "systemverilog verification"] },
  { canonical: "verification",                variants: ["cpu verification", "processor verification", "functional verification", "rtl verification", "formal verification", "formal hardware verification"] },
  { canonical: "timing",                      variants: ["timing closure", "cpu timing closure", "processor timing closure", "timing analysis"] },

  // ── Electrical Engineering ────────────────────────────────────────────────
  { canonical: "electrical",                  variants: ["electrical engineering", "electrical systems engineering"] },
  { canonical: "power-systems",               variants: ["power systems", "electrical power systems", "power system engineering"] },
  { canonical: "power-electronics",           variants: ["power electronics", "power converter design"] },
  { canonical: "circuits",                    variants: ["circuit analysis", "electrical circuit analysis", "circuit simulation", "rlc circuit"] },
  { canonical: "analog",                      variants: ["analog circuits", "analogue circuits", "analog circuit design", "op-amp"] },
  { canonical: "digital",                     variants: ["digital circuits", "digital circuit design", "digital logic circuits"] },
  { canonical: "control-systems",             variants: ["control systems", "control system engineering", "feedback control", "pid control"] },
  { canonical: "machines",                    variants: ["electrical machines", "electric machines", "induction motor", "synchronous motor"] },
  { canonical: "drives",                      variants: ["motor drives", "motor control", "electric motor drives"] },
  { canonical: "transformers",                variants: ["power transformers", "transformer design", "electrical transformers"] },
  { canonical: "protection",                  variants: ["power system protection", "protective relaying", "switchgear", "circuit breakers"] },
  { canonical: "plc",                         variants: ["plc", "programmable logic controller", "plc programming"] },
  { canonical: "scada",                       variants: ["scada", "scada systems", "supervisory control and data acquisition"] },
  { canonical: "automation",                  variants: ["industrial automation", "electrical automation", "industrial control"] },
  { canonical: "power",                       variants: ["power quality", "power distribution", "power factor", "electrical power"] },

  // ── Game Dev (Unity) ───────────────────────────────────────────────────────
  { canonical: "unity",                       variants: ["unity engine", "unity3d", "unity 3d", "unity game"] },
  { canonical: "csharp",                      variants: ["unity c#", "c# unity", "c# game development", "c# scripting"] },
  { canonical: "monobehaviour",               variants: ["monobehaviour", "mono behaviour"] },
  { canonical: "prefabs",                     variants: ["unity prefabs", "prefab system", "prefab workflow", "prefab variants"] },
  { canonical: "scriptableobject",            variants: ["scriptable objects", "unity scriptableobject", "scriptable object pattern"] },
  { canonical: "addressables",               variants: ["unity addressables", "addressables system"] },
  { canonical: "animation",                  variants: ["unity animation", "unity animator", "animation system", "animation blueprint"] },
  { canonical: "physics",                    variants: ["unity physics", "rigidbody", "unity physics engine", "physics simulation"] },
  { canonical: "ui",                         variants: ["unity ui", "unity ui toolkit", "canvas ui", "hud", "umg"] },
  { canonical: "shaders",                    variants: ["unity shaders", "shader graph", "universal render pipeline", "high definition render pipeline", "urp", "hdrp"] },
  { canonical: "multiplayer",               variants: ["unity netcode", "unity multiplayer", "netcode for gameobjects", "unreal multiplayer"] },
  { canonical: "optimization",              variants: ["unity optimization", "unity profiling", "unity performance", "unreal optimization", "game optimization"] },
  { canonical: "game development",          variants: ["unity game development", "unity gameplay programming", "game developer", "unreal game development"] },

  // ── Game Dev (Unreal) ──────────────────────────────────────────────────────
  { canonical: "unreal engine",              variants: ["unreal engine", "unreal engine 5", "ue5", "ue4"] },
  { canonical: "blueprints",                 variants: ["unreal blueprints", "blueprint visual scripting", "visual scripting unreal"] },
  { canonical: "gameplay framework",         variants: ["unreal gameplay framework", "ue gameplay framework", "gameplay programming"] },
  { canonical: "actors",                     variants: ["unreal actor", "ue actor", "actor component"] },
  { canonical: "lumen",                      variants: ["unreal lumen", "lumen global illumination"] },
  { canonical: "nanite",                     variants: ["unreal nanite", "nanite virtualized geometry"] },
  { canonical: "replication",               variants: ["unreal replication", "actor replication", "network replication"] },

  // ── GPU Design ─────────────────────────────────────────────────────────────
  { canonical: "gpu",                         variants: ["gpu design", "graphics processor design", "gpu architecture", "gpu computing"] },
  { canonical: "cuda",                        variants: ["cuda", "cuda programming", "nvidia cuda", "cuda kernels"] },
  { canonical: "parallel-computing",          variants: ["parallel computing", "parallel processing", "massively parallel"] },
  { canonical: "memory-coalescing",           variants: ["memory coalescing", "coalesced memory access"] },
  { canonical: "tensor-cores",               variants: ["tensor cores", "tensor core architecture", "nvidia tensor cores"] },
  { canonical: "ray-tracing",               variants: ["ray tracing hardware", "hardware ray tracing", "ray tracing acceleration", "ray tracing"] },
  { canonical: "vulkan",                     variants: ["vulkan", "vulkan api", "vulkan graphics api"] },
  { canonical: "opengl",                     variants: ["opengl", "opengl api", "opengl graphics programming"] },
  { canonical: "directx",                    variants: ["directx", "directx 12", "direct3d"] },
  { canonical: "opencl",                     variants: ["opencl", "opencl programming", "opencl kernels"] },
  { canonical: "warp",                       variants: ["warp divergence", "warp scheduler", "gpu warp", "simt"] },
  { canonical: "gpgpu",                      variants: ["gpgpu", "general purpose gpu", "gpu accelerated computing"] },

  // ── Microprocessors & Controllers ─────────────────────────────────────────
  { canonical: "microprocessor",             variants: ["microprocessors", "microprocessor architecture", "microprocessor programming", "microprocessor design"] },
  { canonical: "microcontroller",            variants: ["microcontrollers", "microcontroller development", "microcontroller programming", "embedded microcontroller"] },
  { canonical: "embedded-systems",           variants: ["embedded systems", "embedded system development", "embedded software development"] },
  { canonical: "embedded",                   variants: ["embedded c", "embedded c programming", "embedded c++", "bare metal programming", "bare-metal embedded", "firmware development"] },
  { canonical: "rtos",                       variants: ["rtos", "real-time operating system", "embedded rtos", "freertos"] },
  { canonical: "uart",                       variants: ["uart", "uart communication", "serial uart"] },
  { canonical: "spi",                        variants: ["spi", "spi communication", "serial peripheral interface"] },
  { canonical: "i2c",                        variants: ["i2c", "i2c communication", "inter-integrated circuit"] },
  { canonical: "interrupts",                variants: ["interrupt handling", "interrupt programming", "microcontroller interrupts", "interrupt latency"] },
  { canonical: "timers",                     variants: ["microcontroller timers", "timer peripherals", "hardware timers"] },
  { canonical: "pwm",                        variants: ["pwm", "pulse width modulation", "pwm microcontroller"] },
  { canonical: "gpio",                       variants: ["gpio", "general purpose io", "digital io"] },
  { canonical: "real-time",                  variants: ["real-time systems", "real-time embedded", "real time programming"] },

  // ── ML Engineering ────────────────────────────────────────────────────────
  { canonical: "machine-learning",           variants: ["machine learning", "ml engineering", "machine learning engineer", "machine learning development"] },
  { canonical: "deep-learning",              variants: ["deep learning", "deep learning models", "deep neural networks"] },
  { canonical: "neural-networks",            variants: ["neural networks", "neural network architecture", "cnn", "rnn"] },
  { canonical: "python",                     variants: ["pytorch", "torch", "tensorflow", "scikit-learn", "scikit learn", "sklearn", "numpy", "pandas", "python machine learning"] },
  { canonical: "mlops",                      variants: ["mlops", "machine learning operations", "ml operations", "mlflow", "kubeflow"] },
  { canonical: "model-serving",              variants: ["model serving", "model deployment", "ml inference serving", "ml model deployment"] },
  { canonical: "feature-engineering",        variants: ["feature engineering", "feature scaling", "data preprocessing"] },
  { canonical: "training",                   variants: ["model training", "ml training pipelines", "model evaluation", "training pipeline"] },
  { canonical: "ml",                         variants: ["ml pipelines", "machine learning pipelines", "ml pipeline", "ml workflow"] },
  { canonical: "nlp",                        variants: ["nlp", "natural language processing", "hugging face", "huggingface", "transformer models"] },
  { canonical: "computer-vision",            variants: ["computer vision", "image classification", "object detection"] },

  // ── VLSI ──────────────────────────────────────────────────────────────────
  { canonical: "vlsi",                        variants: ["vlsi", "very large scale integration", "vlsi design"] },
  { canonical: "asic",                        variants: ["asic design", "asic development", "application specific integrated circuit"] },
  { canonical: "floorplanning",               variants: ["floorplanning", "floor planning", "asic floorplanning"] },
  { canonical: "placement",                   variants: ["place and route", "placement and routing", "pnr", "physical placement"] },
  { canonical: "vlsi-routing",               variants: ["signal routing", "asic routing", "metal routing"] },
  { canonical: "sta",                         variants: ["static timing analysis", "sta analysis", "timing analysis", "setup time", "hold time"] },
  { canonical: "cts",                         variants: ["clock tree synthesis", "clock tree design", "clock distribution"] },
  { canonical: "synthesis",                   variants: ["logic synthesis", "rtl synthesis", "logic synthesis tools"] },
  { canonical: "physical design",             variants: ["physical design", "asic physical design", "physical implementation"] },
  { canonical: "timing closure",              variants: ["timing closure", "vlsi timing closure", "asic timing closure"] },
  { canonical: "power integrity",             variants: ["power integrity", "vlsi power analysis", "ir drop", "power integrity analysis"] },
  { canonical: "standard cells",             variants: ["standard cell library", "standard-cell library", "standard cell characterization", "standard cells"] },
  { canonical: "digital design",             variants: ["digital ic design", "digital integrated circuit design", "digital design"] },
  { canonical: "drc",                        variants: ["drc", "design rule check", "drc verification"] },
  { canonical: "lvs",                        variants: ["lvs", "layout versus schematic"] },
  { canonical: "cmos",                       variants: ["cmos design", "cmos technology", "cmos circuits"] },
];

module.exports = KEYWORDS;
