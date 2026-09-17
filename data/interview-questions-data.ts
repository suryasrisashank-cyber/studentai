export interface InterviewQuestion {
  id: string;
  category:
    | 'Python'
    | 'SQL'
    | 'Web Development'
    | 'AI/ML'
    | 'Cybersecurity'
    | 'SOC Analyst'
    | 'Networking'
    | 'Linux'
    | 'HR & Behavioral';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  modelAnswer: string;
  keyPoints: string[];
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // 1. Python (6 questions)
  {
    id: 'py-1',
    category: 'Python',
    difficulty: 'Beginner',
    question: 'What is the difference between a list and a tuple in Python?',
    modelAnswer:
      'Lists are mutable, ordered sequences enclosed in square brackets `[]`, allowing elements to be added, removed, or modified in place. Tuples are immutable, ordered sequences enclosed in parentheses `()`, meaning their elements cannot be changed after creation. Because tuples are immutable, they are hashable (can be used as dictionary keys) and have lower memory overhead than lists.',
    keyPoints: [
      'Lists are mutable; tuples are immutable',
      'Tuples can be dictionary keys if elements are hashable',
      'Tuples use less memory and offer slight performance benefits for fixed collections',
    ],
  },
  {
    id: 'py-2',
    category: 'Python',
    difficulty: 'Beginner',
    question: 'How does memory management work in Python?',
    modelAnswer:
      'Python manages memory automatically via private heap space managed by the Python memory manager. It uses reference counting as its primary mechanism (deallocating objects when their reference count drops to 0) combined with a generational cyclical garbage collector that detects and cleans up circular reference cycles.',
    keyPoints: [
      'Private heap managed by Python runtime',
      'Primary mechanism: reference counting',
      'Generational cyclic garbage collector handles circular dependencies',
    ],
  },
  {
    id: 'py-3',
    category: 'Python',
    difficulty: 'Intermediate',
    question: 'What are Python decorators and how do they work?',
    modelAnswer:
      'A decorator is a callable (usually a function) that takes another function as an argument, extends or modifies its behavior without modifying the original source code, and returns the modified function. They are syntactic sugar using the `@decorator_name` syntax over `func = decorator_name(func)`.',
    keyPoints: [
      'First-class functions: functions can be passed as arguments and returned',
      'Wraps target function using closure',
      'Common uses: logging, authentication, caching, rate limiting',
    ],
  },
  {
    id: 'py-4',
    category: 'Python',
    difficulty: 'Intermediate',
    question: 'Explain Python generators and the yield keyword.',
    modelAnswer:
      'Generators are iterator-producing functions written with `yield` instead of `return`. Unlike normal functions that compute and return all values at once in memory, a generator pauses execution at `yield`, remembers its local state, and produces the next value on demand (`lazy evaluation`). This provides O(1) memory efficiency when iterating over massive data streams.',
    keyPoints: [
      'Generates values lazily on demand',
      'Yield pauses execution preserving internal state',
      'Saves memory when processing large files or endless sequences',
    ],
  },
  {
    id: 'py-5',
    category: 'Python',
    difficulty: 'Advanced',
    question: 'What is the Global Interpreter Lock (GIL) and how does it affect concurrency?',
    modelAnswer:
      'The GIL is a mutex used by CPython to ensure that only one native thread executes Python bytecode at any given moment. This simplifies CPython memory management and protects C extension libraries from thread safety issues. While the GIL restricts CPU-bound multithreading to a single core, I/O-bound multithreading still benefits from concurrency because threads release the GIL during I/O wait. For CPU-bound tasks, multiprocessing or process pools are preferred.',
    keyPoints: [
      'CPython mutex ensuring only 1 thread runs Python bytecode at a time',
      'Prevents multicore acceleration for CPU-bound multi-threaded code',
      'Multiprocessing or asyncio/IO-threading avoids GIL limitations',
    ],
  },
  {
    id: 'py-6',
    category: 'Python',
    difficulty: 'Advanced',
    question: 'What is the difference between __new__ and __init__ in Python?',
    modelAnswer:
      '`__new__` is the actual constructor method responsible for creating and returning a new instance of the class (it takes `cls` as its first argument). `__init__` is the initializer method called immediately after `__new__` returns the instance, responsible for initializing attributes on the instance (`self`). `__new__` is overridden in singletons, immutable type subclasses, or metaclasses.',
    keyPoints: [
      '__new__ creates and returns the instance (takes cls)',
      '__init__ initializes attributes on the created instance (takes self)',
      '__new__ is used when implementing Singletons or subclassing immutables',
    ],
  },

  // 2. SQL (6 questions)
  {
    id: 'sql-1',
    category: 'SQL',
    difficulty: 'Beginner',
    question: 'What is the difference between WHERE and HAVING clauses in SQL?',
    modelAnswer:
      'The `WHERE` clause filters individual rows before any aggregations or groupings occur. The `HAVING` clause filters aggregated groups after the `GROUP BY` clause has been computed. `HAVING` can use aggregate functions like `COUNT()`, `SUM()`, and `AVG()`, whereas `WHERE` cannot.',
    keyPoints: [
      'WHERE filters rows before aggregation',
      'HAVING filters groups after aggregation',
      'Aggregate functions are valid in HAVING, not WHERE',
    ],
  },
  {
    id: 'sql-2',
    category: 'SQL',
    difficulty: 'Beginner',
    question: 'Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN.',
    modelAnswer:
      '`INNER JOIN` returns only rows that have matching values in both tables. `LEFT JOIN` returns all rows from the left table, plus matched rows from the right table (filling NULL for non-matches). `FULL OUTER JOIN` returns all rows when there is a match in either the left or right table, filling NULL for unmatched sides.',
    keyPoints: [
      'INNER JOIN: Intersection of both tables',
      'LEFT JOIN: All left rows + matched right rows',
      'FULL OUTER JOIN: All rows from both sides with NULL for non-matches',
    ],
  },
  {
    id: 'sql-3',
    category: 'SQL',
    difficulty: 'Intermediate',
    question: 'What are database indexes and what are their trade-offs?',
    modelAnswer:
      'An index is a data structure (commonly B-Trees or Hash tables) that allows the database engine to locate specific rows quickly without performing a full table scan. Trade-offs: While indexes accelerate `SELECT` read queries and `WHERE`/`JOIN` conditions, they consume disk space and slow down write operations (`INSERT`, `UPDATE`, `DELETE`) because indexes must be updated on every modification.',
    keyPoints: [
      'Accelerates SELECT queries from O(N) to O(log N)',
      'Implemented using B-Tree, B+ Tree, or Hash structures',
      'Trade-off: Extra storage and slower write operations (INSERT/UPDATE/DELETE)',
    ],
  },
  {
    id: 'sql-4',
    category: 'SQL',
    difficulty: 'Intermediate',
    question: 'Explain ACID properties in relational database transactions.',
    modelAnswer:
      'ACID guarantees transaction reliability: Atomicity (all operations succeed or entire transaction rolls back), Consistency (data transitions from one valid state to another, upholding constraints), Isolation (concurrent transactions execute independently without interference), and Durability (committed changes persist even during system failure or power loss).',
    keyPoints: [
      'Atomicity: All or nothing',
      'Consistency: Data constraints always preserved',
      'Isolation: Concurrent execution without race conditions',
      'Durability: Committed transactions survive system crashes',
    ],
  },
  {
    id: 'sql-5',
    category: 'SQL',
    difficulty: 'Advanced',
    question: 'What are Window Functions in SQL and how do they differ from GROUP BY?',
    modelAnswer:
      'Window functions perform calculations across a set of rows related to the current row using the `OVER (PARTITION BY ... ORDER BY ...)` clause. Unlike `GROUP BY`, which collapses multiple rows into a single aggregated row, window functions retain individual row identity and return results alongside the original row data (e.g. `ROW_NUMBER()`, `RANK()`, `LAG()`, `LEAD()`).',
    keyPoints: [
      'Calculates aggregates over sliding or partitioned row windows',
      'Does not collapse individual rows into a single summary row',
      'Examples: ROW_NUMBER(), DENSE_RANK(), LAG(), LEAD(), SUM() OVER()',
    ],
  },
  {
    id: 'sql-6',
    category: 'SQL',
    difficulty: 'Advanced',
    question: 'What is database normalization and what are the first three normal forms?',
    modelAnswer:
      'Normalization organizes table schemas to minimize data redundancy and prevent update anomalies. 1NF requires atomic (indivisible) column values and unique primary keys. 2NF requires 1NF plus all non-key attributes must be fully functionally dependent on the primary key (no partial dependencies). 3NF requires 2NF plus no transitive dependencies (non-key attributes cannot depend on other non-key attributes).',
    keyPoints: [
      'Reduces data redundancy and modification anomalies',
      '1NF: Atomic values, no repeating groups',
      '2NF: 1NF + no partial dependency on composite keys',
      '3NF: 2NF + no transitive dependency between non-key columns',
    ],
  },

  // 3. Web Development (6 questions)
  {
    id: 'web-1',
    category: 'Web Development',
    difficulty: 'Beginner',
    question: 'What is the DOM and how does JavaScript interact with it?',
    modelAnswer:
      'The Document Object Model (DOM) is a tree-like object representation of an HTML document created by the browser. JavaScript interacts with the DOM using APIs like `document.querySelector()`, `addEventListener()`, and `createElement()` to dynamically inspect, update, add, or remove elements and styles in response to user events.',
    keyPoints: [
      'Hierarchical tree representation of HTML in browser memory',
      'Provides API for programming languages to manipulate structure, style, and content',
      'Event-driven manipulation responds to clicks, inputs, and scrolls',
    ],
  },
  {
    id: 'web-2',
    category: 'Web Development',
    difficulty: 'Intermediate',
    question: 'What is the difference between client-side rendering (CSR) and server-side rendering (SSR)?',
    modelAnswer:
      'In CSR, the server returns minimal HTML shell and a large JavaScript bundle; the browser downloads the JS, runs it, and builds the UI. In SSR, the server renders the full HTML on every request and returns fully formed HTML to the browser, which then hydrates with JavaScript. SSR provides faster First Contentful Paint (FCP) and superior SEO, while CSR offers rich app-like interactions without page reloads after initial load.',
    keyPoints: [
      'CSR: HTML rendered in browser via JS bundle; fast client navigations',
      'SSR: HTML generated on server per request; faster initial display and SEO',
      'Static Site Generation (SSG): HTML pre-rendered at build time',
    ],
  },
  {
    id: 'web-3',
    category: 'Web Development',
    difficulty: 'Intermediate',
    question: 'Explain CORS (Cross-Origin Resource Sharing) and why browsers enforce it.',
    modelAnswer:
      'CORS is a browser security mechanism enforced by the Same-Origin Policy. It restricts web pages in one origin (domain, protocol, port) from requesting resources from a different origin unless the target server explicitly sends HTTP response headers like `Access-Control-Allow-Origin`. It protects users by preventing malicious websites from making unauthorized authenticated requests to other services on behalf of the user.',
    keyPoints: [
      'Browser security feature based on Same-Origin Policy',
      'Protects against unauthorized cross-site requests',
      'Configured on server via Access-Control-Allow-Origin headers',
    ],
  },
  {
    id: 'web-4',
    category: 'Web Development',
    difficulty: 'Intermediate',
    question: 'How does the JavaScript Event Loop work?',
    modelAnswer:
      'JavaScript is single-threaded with a single call stack. When asynchronous operations (such as `fetch`, `setTimeout`, or DOM events) finish, their callbacks are queued in task queues (Microtask Queue for Promises, Macrotask Queue for timers). The Event Loop continuously checks if the Call Stack is empty; when empty, it pushes microtasks first, then macrotasks onto the stack for execution.',
    keyPoints: [
      'Single-threaded execution with non-blocking concurrency',
      'Call stack executes synchronous code',
      'Event loop pushes tasks from microtask (Promises) and macrotask (timers) queues when stack is clear',
    ],
  },
  {
    id: 'web-5',
    category: 'Web Development',
    difficulty: 'Advanced',
    question: 'Explain React reconciliation and the Virtual DOM.',
    modelAnswer:
      'React creates a lightweight in-memory representation of the real DOM called the Virtual DOM. When state or props change, React generates a new Virtual DOM tree and performs a "diffing" algorithm (reconciliation) comparing it against the previous tree. React calculates the minimum number of mutations needed and batches those changes to the real DOM in a commit phase, maximizing rendering efficiency.',
    keyPoints: [
      'Virtual DOM is a lightweight JavaScript object tree representation',
      'Diffing algorithm detects changes in O(N) using key heuristics',
      'Batches updates to real DOM to minimize expensive browser repaints',
    ],
  },
  {
    id: 'web-6',
    category: 'Web Development',
    difficulty: 'Advanced',
    question: 'What are Web Workers and when should you use them?',
    modelAnswer:
      'Web Workers allow JavaScript code to run in background background threads separate from the browser’s main execution thread. Because the main thread handles user UI interactions and rendering, long-running CPU calculations (like large file hashing, image compression, or matrix math) on the main thread cause UI freezes. Web Workers run scripts in the background and communicate via asynchronous `postMessage()`.',
    keyPoints: [
      'True multi-threading for browser client-side JavaScript',
      'Prevents UI jank and blocking on the main thread',
      'Cannot access window or DOM directly; communicates via message passing',
    ],
  },

  // 4. AI/ML (6 questions)
  {
    id: 'ai-1',
    category: 'AI/ML',
    difficulty: 'Beginner',
    question: 'What is the difference between Supervised, Unsupervised, and Reinforcement Learning?',
    modelAnswer:
      'Supervised learning trains models on labeled input-output pairs (e.g. classification and regression). Unsupervised learning finds latent patterns or clusters in unlabeled data without target ground truth (e.g. K-Means clustering, PCA). Reinforcement learning trains autonomous agents to maximize cumulative rewards through trial-and-error interaction with an environment.',
    keyPoints: [
      'Supervised: Labeled training data (features + labels)',
      'Unsupervised: Unlabeled data (pattern discovery, clustering)',
      'Reinforcement: Agent learns policies through rewards and penalties',
    ],
  },
  {
    id: 'ai-2',
    category: 'AI/ML',
    difficulty: 'Beginner',
    question: 'Explain Overfitting and Underfitting, and how to mitigate them.',
    modelAnswer:
      'Overfitting occurs when a model learns training noise and specific sample details too closely, resulting in high training accuracy but poor generalization to unseen test data (high variance). Underfitting occurs when a model is too simplistic to capture underlying patterns, performing poorly on both training and test data (high bias). Mitigation for overfitting: regularization (L1/L2), dropout, cross-validation, pruning, and collecting more training data.',
    keyPoints: [
      'Overfitting: High variance, memorizes training noise, fails on test data',
      'Underfitting: High bias, model too simple to learn underlying signal',
      'Remedies: L1/L2 regularization, dropout, early stopping, cross-validation',
    ],
  },
  {
    id: 'ai-3',
    category: 'AI/ML',
    difficulty: 'Intermediate',
    question: 'What is the difference between Precision, Recall, and F1-Score?',
    modelAnswer:
      'Precision is the ratio of true positives to all predicted positives (`TP / (TP + FP)`), answering "Of all cases predicted positive, how many were actually positive?". Recall is the ratio of true positives to all actual positives (`TP / (TP + FN)`), answering "Of all true cases, how many did we find?". The F1-score is the harmonic mean of precision and recall, balancing false positives and false negatives on imbalanced datasets.',
    keyPoints: [
      'Precision: TP / (TP + FP) — minimizes false alarms',
      'Recall: TP / (TP + FN) — minimizes missed cases',
      'F1-Score: 2 * (Precision * Recall) / (Precision + Recall)',
    ],
  },
  {
    id: 'ai-4',
    category: 'AI/ML',
    difficulty: 'Intermediate',
    question: 'What is Gradient Descent and what are its variants?',
    modelAnswer:
      'Gradient Descent is a first-order iterative optimization algorithm used to minimize the loss function by taking steps proportional to the negative gradient of the loss with respect to parameters. Variants: Batch Gradient Descent (computes gradient over entire dataset per step), Stochastic Gradient Descent (SGD, updates per single sample, noisy but fast), and Mini-Batch Gradient Descent (balances stability and computational efficiency over batches of 32-256 samples).',
    keyPoints: [
      'Optimizes model weights by following the negative gradient of loss',
      'Batch: Accurate but slow on massive datasets',
      'SGD: Fast, noisy updates that escape local minima',
      'Mini-Batch: Standard modern approach balancing vectorization and stability',
    ],
  },
  {
    id: 'ai-5',
    category: 'AI/ML',
    difficulty: 'Advanced',
    question: 'Explain the Transformer architecture and the Self-Attention mechanism.',
    modelAnswer:
      'Transformers replace recurrence (RNNs) with Self-Attention mechanisms that allow the model to weight the significance of every word in a sequence relative to all other words simultaneously in parallel. Self-Attention computes Query (Q), Key (K), and Value (V) vectors: `Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V`. Multi-head attention allows the model to attend to information from different representation subspaces concurrently.',
    keyPoints: [
      'Replaces sequential RNN recurrence with parallel self-attention',
      'Scaled Dot-Product Attention: Softmax((Q * K^T) / sqrt(d)) * V',
      'Positional encodings inject sequence order without step-by-step looping',
    ],
  },
  {
    id: 'ai-6',
    category: 'AI/ML',
    difficulty: 'Advanced',
    question: 'What is Retrieval-Augmented Generation (RAG) and why is it used with LLMs?',
    modelAnswer:
      'RAG combines an information retrieval system with a generative LLM. When a user asks a question, external documents or vector databases are queried for relevant context chunks via semantic embedding similarity. These retrieved passages are injected into the prompt context for the LLM. RAG prevents hallucinations, provides citations, and allows models to access private or up-to-date proprietary data without expensive model fine-tuning.',
    keyPoints: [
      'Retrieves external context chunks via vector search and injects into LLM prompt',
      'Mitigates hallucinations and knowledge cutoff limitations',
      'Significantly cheaper and more maintainable than continuous fine-tuning',
    ],
  },

  // 5. Cybersecurity (6 questions)
  {
    id: 'sec-1',
    category: 'Cybersecurity',
    difficulty: 'Beginner',
    question: 'What is the CIA Triad in Information Security?',
    modelAnswer:
      'The CIA Triad represents the foundational pillars of information security: Confidentiality (ensuring data is accessible only to authorized entities through encryption, access controls, and authentication), Integrity (maintaining the accuracy and trustworthiness of data by preventing unauthorized modifications via hashing and digital signatures), and Availability (ensuring systems and data are reliably accessible to authorized users when needed via redundancy and DDoS mitigation).',
    keyPoints: [
      'Confidentiality: Protecting data from unauthorized viewing',
      'Integrity: Ensuring data is not altered or corrupted',
      'Availability: Ensuring systems remain accessible to authorized users',
    ],
  },
  {
    id: 'sec-2',
    category: 'Cybersecurity',
    difficulty: 'Beginner',
    question: 'What is the difference between Symmetric and Asymmetric Encryption?',
    modelAnswer:
      'Symmetric encryption uses a single shared secret key for both encryption and decryption (e.g. AES-256, ChaCha20). It is fast and computationally efficient for large data transfers. Asymmetric encryption uses a mathematically linked key pair: a public key for encryption and a private key for decryption (e.g. RSA, ECC). It solves key distribution challenges and powers digital signatures and TLS handshakes.',
    keyPoints: [
      'Symmetric: Single shared key for encrypt/decrypt (fast, bulk data)',
      'Asymmetric: Public key encrypts, private key decrypts (key exchange, signatures)',
      'Hybrid approach: TLS uses asymmetric handshake to exchange symmetric session key',
    ],
  },
  {
    id: 'sec-3',
    category: 'Cybersecurity',
    difficulty: 'Intermediate',
    question: 'What is Cross-Site Scripting (XSS) and how is it prevented?',
    modelAnswer:
      'XSS is an injection vulnerability where malicious client-side scripts are injected into trusted websites. Types: Stored XSS (injected into database), Reflected XSS (reflected off URL parameters), and DOM-based XSS (manipulation of DOM in JS). Prevention: Context-aware output encoding/escaping, validating input, avoiding `dangerouslySetInnerHTML`/`eval`, implementing strict Content Security Policy (CSP) headers, and using `HttpOnly` cookie flags.',
    keyPoints: [
      'Injection of malicious scripts executed in victim’s browser',
      'Stored, Reflected, and DOM-based variants',
      'Mitigation: Contextual output encoding, Content Security Policy (CSP), HttpOnly cookies',
    ],
  },
  {
    id: 'sec-4',
    category: 'Cybersecurity',
    difficulty: 'Intermediate',
    question: 'Explain SQL Injection (SQLi) and how parameterized queries prevent it.',
    modelAnswer:
      "SQLi occurs when untrusted user input is directly concatenated into a dynamic SQL query string, allowing an attacker to manipulate query logic (e.g. ' OR '1'='1). Parameterized queries (prepared statements) prevent SQLi by pre-compiling the SQL statement on the database engine. User input is treated strictly as data literals and parameters, never interpreted as executable SQL syntax.",
    keyPoints: [
      'Attackers inject malicious SQL fragments to alter query execution',
      'Prepared statements pre-compile SQL structure prior to parameter binding',
      'Input is strictly treated as data values, rendering code injection impossible',
    ],
  },
  {
    id: 'sec-5',
    category: 'Cybersecurity',
    difficulty: 'Advanced',
    question: 'What is the MITRE ATT&CK framework and how is it used in defensive operations?',
    modelAnswer:
      'MITRE ATT&CK is a globally accessible, curated knowledge base of adversary tactics, techniques, and procedures (TTPs) based on real-world threat observations. Defensive teams use it to map detection coverage, design threat-hunting hypotheses, identify telemetry blind spots, validate security controls through adversary emulation, and prioritize defensive engineering.',
    keyPoints: [
      'Comprehensive matrix of adversary tactics, techniques, and procedures (TTPs)',
      'Provides common taxonomy for SOC analysts, incident responders, and threat hunters',
      'Helps identify detection coverage gaps and prioritize SIEM/EDR rules',
    ],
  },
  {
    id: 'sec-6',
    category: 'Cybersecurity',
    difficulty: 'Advanced',
    question: 'Explain the Zero Trust architecture principle.',
    modelAnswer:
      'Zero Trust is a security paradigm rooted in the principle of "Never trust, always verify". It abandons traditional perimeter-based security ("castle-and-moat") which assumes internal network traffic is trustworthy. Core tenets include continuous verification of identity and device posture, least privilege access (JIT/JEA), microsegmentation, and assuming breach at all times.',
    keyPoints: [
      'Core philosophy: "Never trust, always verify"',
      'Eliminates implicit trust for internal network entities',
      'Principles: Explicit verification, least-privilege access, assume breach, microsegmentation',
    ],
  },

  // 6. SOC Analyst (6 questions)
  {
    id: 'soc-1',
    category: 'SOC Analyst',
    difficulty: 'Beginner',
    question: 'What is a SIEM and what is its role in a Security Operations Center?',
    modelAnswer:
      'A Security Information and Event Management (SIEM) system ingests, aggregates, normalizes, and correlates log data from servers, endpoints, firewalls, network devices, and identity systems across an enterprise. It triggers real-time correlation alerts for suspicious events and provides centralized search, dashboards, and compliance reporting for SOC analysts.',
    keyPoints: [
      'Aggregates and normalizes log telemetry across enterprise assets',
      'Executes correlation rules to detect multi-stage anomalies',
      'Provides investigation workbench for triage and compliance audits',
    ],
  },
  {
    id: 'soc-2',
    category: 'SOC Analyst',
    difficulty: 'Beginner',
    question: 'What are Indicators of Compromise (IoCs) and Indicators of Attack (IoAs)?',
    modelAnswer:
      'IoCs are forensic artifacts that indicate a system or network has already been breached or infected (e.g. known malicious file hashes, suspicious IP addresses, domains, registry modifications). IoAs focus on proactive behavioral indicators representing an attacker’s active attempts to gain access or move laterally (e.g. unusual PowerShell executions, privilege escalation attempts, credential dumping).',
    keyPoints: [
      'IoC: Evidence of past compromise (file hashes, known bad IPs/domains)',
      'IoA: Behavioral patterns of an attack in progress (lateral movement, persistence techniques)',
    ],
  },
  {
    id: 'soc-3',
    category: 'SOC Analyst',
    difficulty: 'Intermediate',
    question: 'What are the 6 stages of the NIST Incident Response lifecycle?',
    modelAnswer:
      'The NIST SP 800-61 incident handling lifecycle consists of: 1) Preparation (tools, policy, training), 2) Detection and Analysis (triage alerts, identify scope, determine false/true positive), 3) Containment (isolate infected hosts, block network traffic), 4) Eradication (remove malware, close vulnerabilities), 5) Recovery (restore systems from clean backups, monitor for recurrence), and 6) Post-Incident Activity (Lessons Learned review).',
    keyPoints: [
      '1. Preparation',
      '2. Detection & Analysis',
      '3. Containment',
      '4. Eradication',
      '5. Recovery',
      '6. Post-Incident Review / Lessons Learned',
    ],
  },
  {
    id: 'soc-4',
    category: 'SOC Analyst',
    difficulty: 'Intermediate',
    question: 'How do you triage a potential phishing email alert?',
    modelAnswer:
      '1) Inspect email headers: verify Sender Policy Framework (SPF), DKIM, and DMARC alignment, inspect return-path and originating IP. 2) Examine links and attachments in a secure sandbox without opening directly. 3) Check URL reputation on threat intel feeds (VirusTotal, AlienVault OTX). 4) Search SIEM/mail logs to see if other internal recipients received or clicked the link. 5) If malicious, purge from all inboxes, block sender and domains on mail gateway, reset user credentials if compromised.',
    keyPoints: [
      'Check email authentication headers (SPF, DKIM, DMARC)',
      'Analyze attachments and hyperlinks safely in sandbox environments',
      'Scope enterprise exposure across mail logs and block indicators',
    ],
  },
  {
    id: 'soc-5',
    category: 'SOC Analyst',
    difficulty: 'Advanced',
    question: 'What is the Cyber Kill Chain and how does a defender disrupt it?',
    modelAnswer:
      'Developed by Lockheed Martin, the Cyber Kill Chain defines the 7 phases of a cyberattack: Reconnaissance, Weaponization, Delivery, Exploitation, Installation, Command & Control (C2), and Actions on Objectives. Defenders aim to detect and break the chain as early as possible. For example, blocking phishing emails stops Delivery; endpoint EDR stops Exploitation and Installation; firewall egress filtering disrupts C2 communication.',
    keyPoints: [
      '7 sequential attack phases from Recon to Actions on Objectives',
      'Breaking any single link prevents the adversary from achieving their objective',
      'Enables defense-in-depth alignment across network and endpoint sensors',
    ],
  },
  {
    id: 'soc-6',
    category: 'SOC Analyst',
    difficulty: 'Advanced',
    question: 'How do you differentiate between a True Positive, False Positive, and Benign Positive?',
    modelAnswer:
      'A True Positive is an alert that correctly detected actual malicious adversary activity requiring containment. A False Positive is an alert triggered by non-malicious normal activity due to flawed detection logic (e.g. a vulnerability scanner script triggering brute-force alerts). A Benign Positive is an alert where the detected activity was technically real and matched the rule, but was authorized and expected (e.g. IT admin running approved network discovery scripts).',
    keyPoints: [
      'True Positive: Real malicious threat detected',
      'False Positive: Incorrect alert caused by over-broad detection rules',
      'Benign Positive: Alert triggered by legitimate, authorized administrative actions',
    ],
  },

  // 7. Networking (6 questions)
  {
    id: 'net-1',
    category: 'Networking',
    difficulty: 'Beginner',
    question: 'Explain the 7 layers of the OSI Model.',
    modelAnswer:
      'The OSI model standardizes network communication into 7 abstraction layers: 1) Physical (bits over cable/radio), 2) Data Link (frames, MAC addresses, switches), 3) Network (packets, IP addressing, routers), 4) Transport (segments, TCP/UDP, ports), 5) Session (connection dialogues), 6) Presentation (formatting, compression, encryption), and 7) Application (HTTP, DNS, SSH user-facing protocols).',
    keyPoints: [
      'Physical, Data Link, Network, Transport, Session, Presentation, Application',
      'Easy mnemonic: Please Do Not Throw Sausage Pizza Away',
      'Layer 3 handles IP routing; Layer 4 handles end-to-end transport (TCP/UDP)',
    ],
  },
  {
    id: 'net-2',
    category: 'Networking',
    difficulty: 'Beginner',
    question: 'What is the difference between TCP and UDP?',
    modelAnswer:
      'TCP (Transmission Control Protocol) is connection-oriented, reliable, and provides ordered data delivery with error checking, flow control, and retransmission of lost packets via a 3-way handshake. UDP (User Datagram Protocol) is connectionless, lightweight, and unordered without delivery guarantees or retransmissions, making it ideal for low-latency streaming, VoIP, and gaming.',
    keyPoints: [
      'TCP: Connection-oriented, reliable, guarantees packet ordering and delivery',
      'UDP: Connectionless, lightweight, fast, no delivery guarantees',
      'TCP used for web/files (HTTP, SSH); UDP used for streaming/DNS/gaming',
    ],
  },
  {
    id: 'net-3',
    category: 'Networking',
    difficulty: 'Intermediate',
    question: 'How does the TCP 3-Way Handshake establish a connection?',
    modelAnswer:
      '1) SYN: The client sends a packet with the SYN flag set and a random client Sequence Number (ISN) to the server. 2) SYN-ACK: The server responds with SYN and ACK flags set, acknowledging the client’s sequence number (`ACK = Client_ISN + 1`) and providing its own sequence number. 3) ACK: The client sends an ACK packet confirming receipt (`ACK = Server_ISN + 1`). The connection is now ESTABLISHED and data transfer begins.',
    keyPoints: [
      'Step 1: Client -> SYN',
      'Step 2: Server -> SYN-ACK',
      'Step 3: Client -> ACK',
      'Synchronizes sequence numbers for reliable bidirectional communication',
    ],
  },
  {
    id: 'net-4',
    category: 'Networking',
    difficulty: 'Intermediate',
    question: 'How does DNS resolution work step-by-step?',
    modelAnswer:
      'When you request `example.com`: 1) The browser checks local cache, OS resolver cache, and hosts file. 2) If not cached, it queries the Recursive DNS Resolver (e.g. ISP or 8.8.8.8). 3) Recursive resolver queries Root Nameserver (`.`), which points to the TLD Nameserver (`.com`). 4) TLD server points to the Authoritative Nameserver for `example.com`. 5) Authoritative server returns the A record (IP address), which is cached and returned to the browser.',
    keyPoints: [
      'Recursive query from browser to local resolver',
      'Iterative lookup: Root -> TLD (.com) -> Authoritative nameserver',
      'DNS records cached at multiple levels with Time-To-Live (TTL)',
    ],
  },
  {
    id: 'net-5',
    category: 'Networking',
    difficulty: 'Advanced',
    question: 'What is Subnetting and how do CIDR masks determine network capacity?',
    modelAnswer:
      'Subnetting divides a large network into smaller, distinct logical network segments to optimize routing efficiency, conserve IP space, and enforce security isolation. CIDR (Classless Inter-Domain Routing) notation like `/24` denotes the number of leading bits dedicated to the network identifier. The remaining `32 - prefix` bits are available for host addresses (`2^(32-prefix) - 2` usable hosts, subtracting network and broadcast addresses).',
    keyPoints: [
      'Partitions IP networks into isolated logical segments',
      'CIDR prefix indicates number of network bits (e.g. /24 = 256 IPs)',
      'Usable hosts = 2^(host bits) - 2 (reserving network and broadcast IPs)',
    ],
  },
  {
    id: 'net-6',
    category: 'Networking',
    difficulty: 'Advanced',
    question: 'What is the difference between asymmetric and symmetric network routing?',
    modelAnswer:
      'Symmetric routing means packets traveling between two endpoints follow the exact same physical and logical path in both directions (forward and reverse). Asymmetric routing occurs when packets from A to B take one path (e.g. via ISP 1), while return packets from B to A take an alternate path (e.g. via ISP 2). While common on the internet due to BGP policies, asymmetric routing can break stateful firewalls and NAT gateways that expect to see both directions of a TCP flow.',
    keyPoints: [
      'Symmetric: Inbound and outbound traffic traverse identical path',
      'Asymmetric: Inbound and outbound packets traverse distinct paths',
      'Can cause connection drops on stateful inspection firewalls',
    ],
  },

  // 8. Linux (6 questions)
  {
    id: 'lin-1',
    category: 'Linux',
    difficulty: 'Beginner',
    question: 'Explain Linux file permissions and what chmod 755 means.',
    modelAnswer:
      'Linux assigns permissions to three groups: User (Owner), Group, and Others. Permissions include Read (4), Write (2), and Execute (1). `chmod 755` sets User = 7 (4+2+1 = rwx), Group = 5 (4+0+1 = r-x), and Others = 5 (4+0+1 = r-x). This allows the owner to read, write, and execute, while everyone else can only read and execute.',
    keyPoints: [
      'Permission octets: Read = 4, Write = 2, Execute = 1',
      'Applied to Owner, Group, and Others in sequence',
      '755 = rwxr-xr-x (owner has full control; others can read and execute)',
    ],
  },
  {
    id: 'lin-2',
    category: 'Linux',
    difficulty: 'Beginner',
    question: 'What is the difference between hard links and symbolic (soft) links in Linux?',
    modelAnswer:
      'A hard link is an additional directory pointer directly referencing the existing file’s inode on the same filesystem. If the original file name is deleted, the data remains accessible through the hard link until all links are removed. A symbolic link (`symlink`) is a separate small file containing the filesystem path to the target file. If the target is moved or deleted, the symlink becomes broken.',
    keyPoints: [
      'Hard link shares identical inode; cannot cross filesystem boundaries',
      'Symlink stores path to target file; can cross filesystems and point to directories',
      'Deleting original file breaks symlink, but hard link retains data',
    ],
  },
  {
    id: 'lin-3',
    category: 'Linux',
    difficulty: 'Intermediate',
    question: 'How do standard Linux streams and redirection work (stdin, stdout, stderr)?',
    modelAnswer:
      'Linux processes have three default POSIX file descriptors: File Descriptor 0 is standard input (`stdin`), FD 1 is standard output (`stdout`), and FD 2 is standard error (`stderr`). You can redirect output using `>` (overwrite) or `>>` (append). The syntax `2>&1` redirects stderr into stdout, while piping `|` sends the stdout of one program directly into the stdin of the next.',
    keyPoints: [
      'FD 0 = stdin, FD 1 = stdout, FD 2 = stderr',
      '`>` overwrites stdout; `>>` appends to file',
      '`2>&1` merges error stream into standard output stream',
    ],
  },
  {
    id: 'lin-4',
    category: 'Linux',
    difficulty: 'Intermediate',
    question: 'What are Zombie and Orphan processes in Linux?',
    modelAnswer:
      'An Orphan process is a running child process whose parent terminated before it. The init/systemd daemon (PID 1) adopts the orphan and reaps it upon completion. A Zombie process is a child process that has finished execution but still has an entry in the process table because its parent has not yet read its exit status code using `wait()`. Zombies consume process table slots (PIDs) but no CPU or memory.',
    keyPoints: [
      'Orphan: Parent terminated; adopted by init (PID 1)',
      'Zombie: Terminated child awaiting parent to read exit status code',
      'Zombies consume PID slots; resolved by signaling or terminating parent',
    ],
  },
  {
    id: 'lin-5',
    category: 'Linux',
    difficulty: 'Advanced',
    question: 'What are Linux Namespaces and cgroups, and how do they enable containerization?',
    modelAnswer:
      'Namespaces and cgroups are the core Linux kernel features enabling Docker and containers without virtual machines. Namespaces provide isolation of system resources (Process IDs `pid`, Network interfaces `net`, Mount points `mnt`, Users `user`, IPC), giving containers the illusion of being an independent OS. Control Groups (`cgroups`) allocate and enforce resource quotas (CPU cores, RAM limits, disk I/O, network bandwidth).',
    keyPoints: [
      'Namespaces: Isolate system visibility (pid, net, mnt, ipc, user)',
      'cgroups: Meter and restrict resource utilization (CPU, memory, I/O)',
      'Foundation of Docker, Podman, and Kubernetes container runtimes',
    ],
  },
  {
    id: 'lin-6',
    category: 'Linux',
    difficulty: 'Advanced',
    question: 'How does the Linux Virtual File System (VFS) and inode architecture function?',
    modelAnswer:
      'The VFS is an abstraction kernel layer that presents a unified filesystem interface (`open()`, `read()`, `write()`) to applications regardless of the underlying concrete filesystem (ext4, XFS, NFS, btrfs). Inodes (index nodes) are metadata data structures storing file attributes (size, permissions, timestamps, owner, pointer to data disk blocks) without storing the filename. Filenames are stored in directory entries mapping names to inode numbers.',
    keyPoints: [
      'VFS provides uniform POSIX API abstraction over diverse filesystems',
      'Inodes store file metadata and data block pointers, but NOT filenames',
      'Directories map human-readable filenames to inode numbers',
    ],
  },

  // 9. HR & Behavioral (6 questions)
  {
    id: 'hr-1',
    category: 'HR & Behavioral',
    difficulty: 'Beginner',
    question: 'How do you answer: "Tell me about yourself"?',
    modelAnswer:
      'Use the Present-Past-Future framework: 1) Present: Mention your current student status, major, and primary technical focus. 2) Past: Highlight 1-2 impactful projects, internships, or achievements that demonstrate your technical passion and problem-solving. 3) Future: Articulate why you are excited about this specific opportunity and how your foundational skills align with the team’s mission.',
    keyPoints: [
      'Structure with Present -> Past -> Future formula',
      'Keep response concise (60-90 seconds)',
      'Connect academic projects directly to the target role requirements',
    ],
  },
  {
    id: 'hr-2',
    category: 'HR & Behavioral',
    difficulty: 'Beginner',
    question: 'How do you answer: "What are your strengths and weaknesses?"',
    modelAnswer:
      'For strengths, pick a relevant capability (e.g. rapid self-directed learning or meticulous debugging), backed by a concise concrete example. For weakness, choose a genuine professional skill (not a fake virtue like "I work too hard") that is not disqualified for the role, explain how you became aware of it, and highlight the concrete actions you are actively taking to improve.',
    keyPoints: [
      'Strengths: Back claim with specific project evidence',
      'Weakness: Genuine area of improvement coupled with actionable progress',
      'Demonstrates self-awareness and continuous growth mindset',
    ],
  },
  {
    id: 'hr-3',
    category: 'HR & Behavioral',
    difficulty: 'Intermediate',
    question: 'How should you structure answers to behavioral questions (The STAR Method)?',
    modelAnswer:
      'Use the STAR Method: 1) Situation: Set the scene and provide necessary background context. 2) Task: Clearly define your specific responsibility or the challenge faced. 3) Action: Describe the exact steps YOU personally took to solve the problem (using "I" rather than vague "we"). 4) Result: Share the quantifiable outcome, what you delivered, and what you learned.',
    keyPoints: [
      'S: Situation (brief context)',
      'T: Task (the problem or goal)',
      'A: Action (specific steps you took)',
      'R: Result (quantified metrics and lessons learned)',
    ],
  },
  {
    id: 'hr-4',
    category: 'HR & Behavioral',
    difficulty: 'Intermediate',
    question: 'Tell me about a time you had a conflict with a team member on a group project.',
    modelAnswer:
      'State the situation objectively without disparaging teammates (e.g. differing technical opinions on architecture or uneven task distribution). Focus on how you initiated a private, constructive conversation to understand their perspective, aligned around the project objectives, found a collaborative compromise, and successfully delivered the assignment on time.',
    keyPoints: [
      'Never insult or blame team members',
      'Demonstrate emotional intelligence and professional communication',
      'Focus on shared project goals and reaching mutually agreed compromises',
    ],
  },
  {
    id: 'hr-5',
    category: 'HR & Behavioral',
    difficulty: 'Advanced',
    question: 'Describe a project that failed or did not go according to plan. What did you learn?',
    modelAnswer:
      'Select a real project where unforeseen challenges arose (e.g. underestimated technical complexity, tight deadline, or technical roadblocks). Own your part in the setback, explain how you diagnosed the root cause, adapted your approach, and extracted valuable lessons that permanently improved how you scope, test, and execute engineering work.',
    keyPoints: [
      'Take personal accountability for setbacks',
      'Highlight root-cause diagnosis over finger-pointing',
      'Demonstrate resilience and lessons applied to subsequent projects',
    ],
  },
  {
    id: 'hr-6',
    category: 'HR & Behavioral',
    difficulty: 'Advanced',
    question: 'What questions should you ask the interviewer at the end of the interview?',
    modelAnswer:
      'Avoid questions answered on the website. Instead ask insightful questions: 1) "What does success look like in the first 90 days for someone in this role?" 2) "How does the team handle code reviews and technical mentoring for junior engineers?" 3) "What is the biggest engineering or operational challenge the team is currently tackling?"',
    keyPoints: [
      'Asking good questions signals genuine curiosity and preparation',
      'Inquire about day-to-day team culture, mentorship, and engineering processes',
      'Ask about immediate 90-day expectations',
    ],
  },
];
