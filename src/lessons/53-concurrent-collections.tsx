import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const options = `Not thread-safe            Wrapper (locks everything)          Purpose-built
------------------         ---------------------------         ----------------------
HashMap                    Collections.synchronizedMap(...)     ConcurrentHashMap
ArrayList                  Collections.synchronizedList(...)    CopyOnWriteArrayList
HashSet                    Collections.synchronizedSet(...)     ConcurrentHashMap.newKeySet()
TreeMap                    —                                    ConcurrentSkipListMap
ArrayDeque                 —                                    ConcurrentLinkedDeque / LinkedBlockingQueue

// The wrappers take one lock for the whole collection on every call,
// so concurrent reads serialise. The purpose-built classes let
// readers proceed without locking at all.`

const concurrentHashMap = `Map<String, Integer> counts = new ConcurrentHashMap<>();

// Atomic compound operations — this is the main reason to use it
counts.merge(word, 1, Integer::sum);              // read+modify+write, atomically
counts.computeIfAbsent(key, k -> loadExpensive(k));
counts.putIfAbsent(key, 0);
counts.compute(key, (k, v) -> v == null ? 1 : v + 1);

// Reads never lock. Writes lock only the affected bin.
// size() and isEmpty() are approximations under concurrent modification —
// they are consistent, just not a global snapshot.

// No nulls allowed, for either keys or values:
counts.get(missing);      // null unambiguously means "absent",
                          // because a null value cannot be stored`

const notAtomic = `// Thread-safe methods do NOT make a sequence of them thread-safe
if (!map.containsKey(key)) {        // thread A checks: absent
    map.put(key, compute());        // thread B does the same, both compute, one wins
}

// Atomic equivalent:
map.computeIfAbsent(key, k -> compute());

// The same trap with a synchronized wrapper:
List<String> list = Collections.synchronizedList(new ArrayList<>());
if (!list.contains(x)) list.add(x);      // still a race

// And iteration needs external locking on a wrapper:
synchronized (list) {
    for (String s : list) { ... }
}`

const copyOnWrite = `// Every write copies the whole array; reads never lock and never
// throw ConcurrentModificationException.
List<Listener> listeners = new CopyOnWriteArrayList<>();

listeners.add(listener);          // O(n): allocates a new array
for (Listener l : listeners) {    // iterates a snapshot taken at the start
    l.onEvent(event);             // safe even if another thread adds mid-loop
}

// Right for: listener lists, configuration, caches of rarely-changing data
//            — read constantly, written occasionally.
// Wrong for: anything write-heavy or large.`

const queues = `// BlockingQueue: the standard producer-consumer channel
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(1000);   // bounded

// Producer
queue.put(task);            // BLOCKS when full — natural backpressure
queue.offer(task, 1, TimeUnit.SECONDS);

// Consumer
Task next = queue.take();   // BLOCKS when empty
Task maybe = queue.poll(500, TimeUnit.MILLISECONDS);

// Implementations:
ArrayBlockingQueue      bounded, array-backed, fair option
LinkedBlockingQueue     optionally bounded, higher throughput
SynchronousQueue        no capacity — a handoff between two threads
PriorityBlockingQueue   ordered by priority, unbounded
DelayQueue              elements become available at a time you set`

const virtualThreads = `// Java 21: virtual threads — cheap, managed by the JVM, not the OS
Thread.startVirtualThread(() -> handle(request));

try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (Request r : requests) {
        executor.submit(() -> handle(r));      // a million of these is fine
    }
}

// A platform thread is ~1MB of stack and an OS scheduling entity.
// A virtual thread starts at a few hundred bytes and is mounted onto
// a carrier thread only while running — when it blocks on I/O, it is
// unmounted and the carrier picks up another.
//
// The practical effect: thread-per-request becomes viable again, and
// simple blocking code scales like asynchronous code.

// Pitfalls:
// - do not POOL virtual threads; create one per task
// - synchronized blocks could pin a virtual thread to its carrier
//   (much improved in Java 24, but ReentrantLock is the safe choice)
// - they don't make CPU-bound work faster — there are still N cores`

export default function ConcurrentCollectionsLesson() {
  return (
    <>
      <p>
        Sharing a plain <code>HashMap</code> between threads corrupts it — not theoretically, but in ways that
        produce lost entries and, before Java 8, infinite loops. The <code>java.util.concurrent</code> collections
        exist so you don't have to hand-roll locking, and they're consistently faster than wrapping the
        single-threaded versions.
      </p>

      <h2>Three levels of thread safety</h2>
      <CodeBlock language="text" filename="what to use instead" code={options} />

      <h2>ConcurrentHashMap</h2>
      <CodeBlock language="java" filename="the default concurrent map" code={concurrentHashMap} />
      <Callout variant="info" title="Why it forbids null">
        In a <code>HashMap</code>, <code>get</code> returning null is ambiguous — absent, or present-with-null? You
        resolve it with <code>containsKey</code>. In a concurrent map that two-call check is itself a race, so the
        ambiguity would be unfixable. Banning null values removes the problem entirely.
      </Callout>

      <h2>Thread-safe methods, unsafe sequences</h2>
      <CodeBlock language="java" filename="the check-then-act trap" code={notAtomic} />
      <p>
        This is the single most important idea in this lesson. Each individual method is atomic; a sequence of them
        is not. <code>computeIfAbsent</code>, <code>merge</code> and <code>putIfAbsent</code> exist precisely to
        make the common sequences atomic.
      </p>

      <AnalogyCard title="A supermarket with one till versus many.">
        Wrapping a collection in a lock is a supermarket with a single till: perfectly correct, and everyone queues
        even to ask a question. <code>ConcurrentHashMap</code> is a shop where browsing needs no queue at all and
        only the aisle you're restocking is closed off. Same guarantees, vastly less waiting.
      </AnalogyCard>

      <h2>CopyOnWriteArrayList</h2>
      <CodeBlock language="java" filename="read-mostly collections" code={copyOnWrite} />

      <h2>Blocking queues</h2>
      <CodeBlock language="java" filename="producer-consumer" code={queues} />
      <p>
        A <code>BlockingQueue</code> is how you connect producers to consumers without writing any coordination
        code: <code>put</code> blocks when full, <code>take</code> blocks when empty, and a bounded queue gives you
        backpressure for free. It's also the queue inside every <code>ThreadPoolExecutor</code>.
      </p>

      <h2>Virtual threads</h2>
      <CodeBlock language="java" filename="Java 21" code={virtualThreads} />

      <CommonMistake
        title="a synchronized wrapper used as if it were fully safe"
        wrong={`Map<String, List<Order>> byCustomer =
        Collections.synchronizedMap(new HashMap<>());

// Two calls: each is synchronized, the pair is not
List<Order> orders = byCustomer.get(id);
if (orders == null) {
    orders = new ArrayList<>();
    byCustomer.put(id, orders);      // another thread may have just done this
}
orders.add(order);                   // ...and the ArrayList itself is not safe`}
        right={`Map<String, List<Order>> byCustomer = new ConcurrentHashMap<>();

byCustomer.computeIfAbsent(id, k -> Collections.synchronizedList(new ArrayList<>()))
          .add(order);

// computeIfAbsent is atomic, so exactly one list is ever created
// per key — and the list itself is made safe too.`}
        explanation={
          <p>
            Two threads can both see <code>null</code>, both create a list, and one overwrites the other — losing
            whatever was added to it. The nested collection is a second, separate problem: making the map
            thread-safe says nothing about the lists inside it. <code>computeIfAbsent</code> fixes the first, and
            choosing a safe inner collection fixes the second.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Normal collections break when several threads change them at once. Use{" "}
            <code>ConcurrentHashMap</code> instead of <code>HashMap</code>, and a{" "}
            <code>BlockingQueue</code> when one thread produces work for another. Remember that even with a safe
            collection, doing two operations in a row isn't safe — use the combined methods like{" "}
            <code>computeIfAbsent</code>.
          </p>
        }
        developer={
          <p>
            <code>ConcurrentHashMap</code> locks per bin rather than globally, and readers never lock — its
            aggregate methods are weakly consistent, and <code>size()</code> is an estimate under concurrent
            modification. <code>CopyOnWriteArrayList</code> gives snapshot iteration at the cost of an O(n) copy per
            write. <code>BlockingQueue</code> underpins thread pools and producer-consumer designs. Virtual threads
            make blocking cheap by unmounting from a carrier thread on block, which changes the calculus for
            thread-per-request servers.
          </p>
        }
        interview={
          <p>
            High-value answers: how <code>ConcurrentHashMap</code> differs from{" "}
            <code>Hashtable</code> and <code>synchronizedMap</code> (bin-level locking versus one global lock, and
            lock-free reads); why check-then-act is still a race on a thread-safe collection; and what virtual
            threads change (cheap blocking, thread-per-request at scale, no help for CPU-bound work, don't pool
            them).
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is 'if (!map.containsKey(k)) map.put(k, v);' unsafe on a ConcurrentHashMap?"
        options={[
          { id: "a", text: "containsKey is not thread-safe" },
          { id: "b", text: "Each call is atomic, but another thread can insert between the check and the put" },
          { id: "c", text: "put is not thread-safe on a concurrent map" },
          { id: "d", text: "It is safe — ConcurrentHashMap handles this" },
        ]}
        correctId="b"
        explanation="Thread safety is per method, not per sequence. Between the check and the put, another thread can do exactly the same thing, so both proceed and one overwrites. That is precisely why putIfAbsent, computeIfAbsent and merge exist — each performs the whole sequence atomically."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Break a HashMap, then fix it"
        hint={
          <p>
            Use an <code>ExecutorService</code> with several threads and enough iterations that the race is
            reliable. Compare the final <code>size()</code> against the number of insertions you performed.
          </p>
        }
      >
        Have eight threads insert a million entries into a shared <code>HashMap</code> and check whether the final
        size matches. Repeat with <code>ConcurrentHashMap</code>, and with{" "}
        <code>Collections.synchronizedMap</code>, timing all three. Then implement a word count with{" "}
        <code>get</code>/<code>put</code> and again with <code>merge</code>, and show that only one of them gives
        the right total.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How does ConcurrentHashMap differ from Hashtable and Collections.synchronizedMap?"
        answer={
          <p>
            <code>Hashtable</code> and <code>synchronizedMap</code> both take a single lock covering the entire map
            for every operation, so concurrent readers serialise behind each other and throughput collapses as
            threads are added. <code>ConcurrentHashMap</code> locks at the granularity of a single bin — and only
            for writes; reads proceed with no locking at all, using volatile reads of the table. That means readers
            never block readers or writers. It also offers atomic compound operations —{" "}
            <code>putIfAbsent</code>, <code>computeIfAbsent</code>, <code>merge</code> — which is important because
            a check-then-act sequence is a race no matter how thread-safe the individual methods are. Two behavioural
            differences worth naming: it forbids null keys and values, so that a null return unambiguously means
            "absent"; and its iterators are weakly consistent rather than fail-fast, so they never throw{" "}
            <code>ConcurrentModificationException</code> but may or may not reflect concurrent updates.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "ConcurrentHashMap locks per bin and never locks reads — far better than a synchronized wrapper.",
          "Thread-safe methods don't make sequences safe: use putIfAbsent, computeIfAbsent and merge.",
          "It forbids nulls so that a null return unambiguously means absent.",
          "CopyOnWriteArrayList suits read-mostly data; BlockingQueue is the producer-consumer channel.",
          "Virtual threads (Java 21) make blocking cheap — one per task, never pooled, no help for CPU-bound work.",
        ]}
      />
    </>
  )
}
