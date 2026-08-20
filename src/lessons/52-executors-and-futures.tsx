import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const why = `// Creating a thread per task: about 1MB of stack each, plus
// OS scheduling overhead, and no limit on how many exist.
for (Request request : requests) {
    new Thread(() -> handle(request)).start();     // 10,000 requests, 10,000 threads
}

// A pool: a fixed number of threads pulling from a queue
ExecutorService pool = Executors.newFixedThreadPool(8);
for (Request request : requests) {
    pool.submit(() -> handle(request));
}
pool.shutdown();`

const kinds = `Executors.newFixedThreadPool(n)          n threads, unbounded queue
Executors.newCachedThreadPool()          grows as needed, idle threads die after 60s
Executors.newSingleThreadExecutor()      one thread, tasks run in order
Executors.newScheduledThreadPool(n)      delayed and periodic tasks
Executors.newVirtualThreadPerTaskExecutor()   Java 21: a virtual thread per task

// For production, prefer constructing it yourself so the queue is bounded:
new ThreadPoolExecutor(
        4, 8,                                  // core and max threads
        60L, TimeUnit.SECONDS,                 // idle timeout for extra threads
        new ArrayBlockingQueue<>(1000),        // BOUNDED — this matters
        new ThreadPoolExecutor.CallerRunsPolicy());   // what to do when full

// newFixedThreadPool uses an UNBOUNDED queue, so a burst of work
// becomes an ever-growing queue and eventually OutOfMemoryError.`

const futures = `// Runnable returns nothing; Callable returns a value and may throw
Callable<Report> task = () -> generateReport(month);

Future<Report> future = pool.submit(task);

future.isDone();
Report report = future.get();               // BLOCKS until it finishes
Report r = future.get(5, TimeUnit.SECONDS); // ...or throws TimeoutException
future.cancel(true);                        // true = interrupt if already running

// Exceptions surface at get(), wrapped:
try {
    future.get();
} catch (ExecutionException e) {
    Throwable cause = e.getCause();          // the exception the task threw
}`

const invokeAll = `List<Callable<Price>> lookups = suppliers.stream()
        .map(s -> (Callable<Price>) () -> s.quote(item))
        .toList();

// Runs all of them, blocks until every one finishes
List<Future<Price>> results = pool.invokeAll(lookups);

// Returns as soon as ONE succeeds, cancelling the rest
Price fastest = pool.invokeAny(lookups);`

const completableFuture = `// The problem with Future: get() blocks, and you cannot chain
CompletableFuture<User> user = CompletableFuture.supplyAsync(() -> loadUser(id), pool);

user.thenApply(User::email)                       // transform the result
    .thenApply(String::toLowerCase)
    .thenAccept(email -> log.info("email {}", email))    // consume it
    .exceptionally(ex -> { log.error("failed", ex); return null; });

// Combining two independent calls that run concurrently
CompletableFuture<Profile> profile = CompletableFuture.supplyAsync(() -> loadProfile(id));
CompletableFuture<Orders> orders   = CompletableFuture.supplyAsync(() -> loadOrders(id));

CompletableFuture<Dashboard> dashboard =
        profile.thenCombine(orders, Dashboard::new);

// Waiting for several
CompletableFuture.allOf(a, b, c).join();
CompletableFuture.anyOf(a, b, c).join();

// thenApply vs thenCompose: the same distinction as map vs flatMap
future.thenCompose(user -> loadOrdersAsync(user));   // when the fn returns a future`

const shutdown = `pool.shutdown();                    // stop accepting new tasks, finish the queued ones
boolean done = pool.awaitTermination(30, TimeUnit.SECONDS);
if (!done) {
    List<Runnable> abandoned = pool.shutdownNow();   // interrupt running tasks
}

// Or with try-with-resources — ExecutorService is AutoCloseable in Java 19+
try (var pool = Executors.newFixedThreadPool(4)) {
    pool.submit(task);
}   // close() shuts down and waits

// Forgetting to shut down a non-daemon pool keeps the JVM alive forever.`

export default function ExecutorsAndFuturesLesson() {
  return (
    <>
      <p>
        Creating threads by hand doesn't scale: each one costs about a megabyte of stack, and nothing stops you
        creating ten thousand. An <code>ExecutorService</code> separates <em>what</em> work to do from{" "}
        <em>how many threads</em> do it — and gives you a handle on the result.
      </p>

      <h2>Why pools exist</h2>
      <CodeBlock language="java" filename="thread per task versus a pool" code={why} />

      <h2>Choosing a pool</h2>
      <CodeBlock language="java" filename="the factory methods, and the honest version" code={kinds} />
      <Callout variant="warning" title="newFixedThreadPool has an unbounded queue">
        Under sustained overload the queue grows without limit until the heap is exhausted — a failure that looks
        like a memory leak rather than a capacity problem. A bounded queue plus a rejection policy turns it into
        backpressure, which is something you can reason about and monitor.
      </Callout>

      <h2>Callable and Future</h2>
      <CodeBlock language="java" filename="getting a result back" code={futures} />
      <CodeBlock language="java" filename="running several" code={invokeAll} />

      <AnalogyCard title="A kitchen ticket rail.">
        Orders go on the rail; a fixed number of chefs take the next one when they're free. Nobody hires a chef per
        order, and the rail getting long tells you exactly what's wrong. The ticket stub you keep is a{" "}
        <code>Future</code> — it isn't the meal, it's a claim on one, and asking for the meal before it's ready
        means standing at the counter waiting.
      </AnalogyCard>

      <h2>CompletableFuture</h2>
      <p>
        <code>Future.get()</code> blocks, which means composing two async calls with plain futures gets you a thread
        sitting idle. <code>CompletableFuture</code> lets you describe what should happen{" "}
        <em>when</em> the result arrives, so nothing waits.
      </p>
      <CodeBlock language="java" filename="composing async work" code={completableFuture} />

      <h2>Shutting down</h2>
      <CodeBlock language="java" filename="the part everyone forgets" code={shutdown} />

      <CommonMistake
        title="submitting a task and never checking the Future"
        wrong={`pool.submit(() -> {
    riskyOperation();      // throws
});
// Nothing is printed. Nothing is logged. The exception is
// captured in a Future nobody looks at, and the task simply
// appears not to have happened.`}
        right={`Future<?> future = pool.submit(() -> riskyOperation());
try {
    future.get();
} catch (ExecutionException e) {
    log.error("task failed", e.getCause());
}

// Or use execute(), where an uncaught exception reaches the
// thread's UncaughtExceptionHandler and gets logged:
pool.execute(() -> riskyOperation());

// Or handle it explicitly with CompletableFuture:
CompletableFuture.runAsync(this::riskyOperation, pool)
        .exceptionally(ex -> { log.error("failed", ex); return null; });`}
        explanation={
          <p>
            <code>submit</code> captures any exception in the returned <code>Future</code> rather than letting it
            propagate, so a task that throws is completely silent unless someone calls <code>get()</code>. This is
            one of the most common ways a background failure goes unnoticed for months.{" "}
            <code>execute</code> behaves differently: it lets the exception reach the uncaught handler.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Instead of making a thread for every job, you create a pool of a few threads and hand it your jobs. It
            runs them as threads become free. If a job produces a value, you get a <code>Future</code> — a receipt
            you can use to collect the result later.
          </p>
        }
        developer={
          <p>
            <code>ThreadPoolExecutor</code> is defined by core size, max size, keep-alive, a queue and a rejection
            policy — and the queue choice determines behaviour under load far more than the thread count does.{" "}
            <code>submit</code> wraps exceptions in the <code>Future</code>; <code>execute</code> lets them reach
            the uncaught handler. <code>CompletableFuture</code> adds non-blocking composition —{" "}
            <code>thenApply</code>, <code>thenCompose</code>, <code>thenCombine</code>,{" "}
            <code>allOf</code> — with the usual map/flatMap distinction between apply and compose.
          </p>
        }
        interview={
          <p>
            Likely: why a pool beats a thread per task; the <code>ThreadPoolExecutor</code> parameters and what
            happens when the queue fills; <code>Runnable</code> versus <code>Callable</code>;{" "}
            <code>shutdown</code> versus <code>shutdownNow</code>; and <code>Future</code> versus{" "}
            <code>CompletableFuture</code> (blocking retrieval versus composition). The submitted-and-swallowed
            exception is a good real-world detail to raise unprompted.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="A task submitted with submit() throws an exception. Where does it go?"
        options={[
          { id: "a", text: "It is printed to stderr by the pool's thread" },
          { id: "b", text: "It is captured in the returned Future and only surfaces, wrapped in ExecutionException, when get() is called" },
          { id: "c", text: "It kills the pool thread and shrinks the pool" },
          { id: "d", text: "It propagates to the thread that called submit" },
        ]}
        correctId="b"
        explanation="submit deliberately captures the exception so the task's failure can be reported through the Future. If nobody calls get(), nothing is ever reported. execute() behaves differently — the exception reaches the thread's UncaughtExceptionHandler and is logged."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Make failures visible, then make them fast"
        hint={
          <p>
            For the timing comparison, give each fake service a <code>Thread.sleep</code> and run the sequential
            version first so you have a baseline.
          </p>
        }
      >
        Submit a task that throws, with <code>submit</code> and with <code>execute</code>, and confirm only one of
        them reports anything. Then write a method that calls three slow services and combines the results —
        sequentially first, then with <code>CompletableFuture</code> and <code>thenCombine</code> — and measure the
        difference. Finally, add <code>exceptionally</code> and make one service fail.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between Future and CompletableFuture?"
        answer={
          <p>
            <code>Future</code> is a handle on a result that may not exist yet, and its only way to obtain that
            result is <code>get()</code>, which <strong>blocks</strong>. You can check <code>isDone()</code> or
            cancel it, but you cannot say "when this completes, do that" — so composing two asynchronous operations
            means a thread sitting idle waiting for the first.{" "}
            <code>CompletableFuture</code> implements <code>Future</code> and adds a callback-based, composable API:{" "}
            <code>thenApply</code> to transform, <code>thenCompose</code> to chain another async call (the flatMap
            of the pair), <code>thenCombine</code> to merge two independent futures, <code>allOf</code>/
            <code>anyOf</code> to wait on many, and <code>exceptionally</code>/<code>handle</code> for errors. It
            can also be completed manually with <code>complete()</code>, which makes it usable as a bridge from
            callback-based APIs. In short: <code>Future</code> is a value you wait for;{" "}
            <code>CompletableFuture</code> is a pipeline you describe, and nothing blocks until you choose to{" "}
            <code>join()</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Pools separate the work from the threads, and cap how many threads exist.",
          "newFixedThreadPool uses an unbounded queue — construct ThreadPoolExecutor with a bounded one for production.",
          "Callable returns a value; submit gives a Future whose get() blocks and wraps exceptions in ExecutionException.",
          "A task submitted with submit() that throws is silent unless someone calls get().",
          "CompletableFuture composes async work without blocking: thenApply, thenCompose, thenCombine, allOf.",
        ]}
      />
    </>
  )
}
