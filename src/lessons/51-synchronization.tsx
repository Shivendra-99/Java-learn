import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { ArrowDown, ArrowUp, Cpu, TriangleAlert, Plus } from "lucide-react"

const racePredictor = `public class Race {
    static int counter = 0;

    public static void main(String[] args) throws InterruptedException {
        Runnable task = () -> {
            for (int i = 0; i < 100_000; i++) counter++;
        };
        Thread a = new Thread(task);
        Thread b = new Thread(task);
        a.start(); b.start();
        a.join();  b.join();
        System.out.println(counter);
    }
}`

const notAtomic = `// counter++ is not one operation. It is three:
//   1. read counter
//   2. add 1
//   3. write counter back
//
// Thread A: read 5 .......... add 1 ..... write 6
// Thread B: ......... read 5 ...... add 1 ...... write 6
//
// Two increments, one net change. This is a LOST UPDATE, and it
// happens more often the more contention there is.`

const synchronized = `// A synchronized method locks on 'this'
public synchronized void increment() {
    counter++;
}

// A synchronized static method locks on the CLASS object
public static synchronized void bump() { ... }

// A synchronized block locks on whatever object you name —
// preferable, because you control the scope and the lock
private final Object lock = new Object();

public void increment() {
    synchronized (lock) {
        counter++;          // hold the lock for as little as possible
    }
}`

const memoryVisibility = `// The other half of the problem: visibility, not just atomicity
class Flag {
    private boolean running = true;      // no volatile

    void stop() { running = false; }

    void loop() {
        while (running) { }              // may NEVER see the update
    }
}

// The JIT can hoist the read out of the loop, since nothing in
// the loop body changes it — turning it into 'while (true)'.
// The thread then spins forever even after stop() is called.

private volatile boolean running = true;   // fixes it
// volatile guarantees: every read sees the latest write, and
// reads/writes are not reordered around it. It does NOT make
// compound operations like count++ atomic.`

const atomics = `import java.util.concurrent.atomic.*;

AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();          // atomic read-modify-write, no lock
counter.addAndGet(5);
counter.compareAndSet(5, 10);       // CAS: the primitive underneath everything

AtomicLong  total = new AtomicLong();
AtomicReference<Config> config = new AtomicReference<>(initial);
config.updateAndGet(c -> c.withTimeout(30));

LongAdder busy = new LongAdder();   // better than AtomicLong under HIGH contention
busy.increment();
busy.sum();

// Atomics use hardware compare-and-swap instructions, so they avoid
// the cost of blocking — but only for single-variable updates.`

const locks = `import java.util.concurrent.locks.*;

ReentrantLock lock = new ReentrantLock();

lock.lock();
try {
    // critical section
} finally {
    lock.unlock();          // ALWAYS in finally, or a failure deadlocks everything
}

// What ReentrantLock gives you over synchronized:
lock.tryLock();                             // don't block if it's taken
lock.tryLock(1, TimeUnit.SECONDS);          // give up after a timeout
lock.lockInterruptibly();                   // respond to cancellation
new ReentrantLock(true);                    // fair ordering (slower)

// ReadWriteLock: many readers OR one writer
ReadWriteLock rw = new ReentrantReadWriteLock();
rw.readLock().lock();      // concurrent with other readers`

const deadlock = `// The classic deadlock: two locks, two threads, opposite order
Thread one = new Thread(() -> {
    synchronized (lockA) {
        synchronized (lockB) { ... }
    }
});

Thread two = new Thread(() -> {
    synchronized (lockB) {          // <- opposite order
        synchronized (lockA) { ... }
    }
});

// Thread one holds A and wants B; thread two holds B and wants A.
// Neither will ever proceed, and neither will time out.

// Prevention: always acquire locks in the same global order,
// use tryLock with a timeout, or restructure so only one lock is needed.`

export default function SynchronizationLesson() {
  return (
    <>
      <p>
        Two threads sharing mutable data will eventually corrupt it — not usually, not reproducibly, but eventually.
        There are two distinct problems to solve: <strong>atomicity</strong> (operations interleaving halfway) and{" "}
        <strong>visibility</strong> (one thread never seeing another's write). They need different tools.
      </p>

      <h2>The problem, in eight lines</h2>
      <OutputPredictor
        question="Two threads each increment 100,000 times — what prints?"
        code={racePredictor}
        options={[
          { id: "a", text: "200000" },
          { id: "b", label: "Some number less than 200000, varying between runs", text: "e.g. 137482" },
          { id: "c", text: "100000" },
          { id: "d", label: "It throws ConcurrentModificationException", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>counter++</code> is read, add, write — three separate steps. When two threads interleave between
            the read and the write, one increment is silently lost. The result is under 200,000 and different every
            run, which is what makes race conditions so unpleasant: the code passes your test on a quiet machine and
            fails in production under load.
          </p>
        }
      />
      <CodeBlock language="text" filename="why ++ is not atomic" code={notAtomic} />

      <StepFlowDiagram
        title="A lost update, step by step"
        steps={[
          {
            id: "read-a",
            label: "Thread A reads 5",
            detail: "The value is loaded from memory into A's working copy. Nothing is locked, so nothing prevents B from doing the same.",
            icon: ArrowDown,
          },
          {
            id: "read-b",
            label: "Thread B reads 5",
            detail: "B loads the same value. Both threads now believe the counter is 5 — and both are about to be right for the last time.",
            icon: ArrowDown,
            tone: "warning",
          },
          {
            id: "add-a",
            label: "A computes 6",
            detail: "A adds one to its own copy. Nothing has been written back yet, so B still has no way of knowing.",
            icon: Plus,
          },
          {
            id: "write-a",
            label: "A writes 6",
            detail: "The counter is now 6 in memory. Correct so far.",
            icon: ArrowUp,
          },
          {
            id: "write-b",
            label: "B writes 6",
            detail: "B adds one to its stale 5 and stores 6, overwriting A's result. Two increments happened; the counter moved by one.",
            icon: TriangleAlert,
            tone: "warning",
          },
          {
            id: "fix",
            label: "The fix",
            detail:
              "Make read-modify-write indivisible — a synchronized block, a lock, or an atomic class. Any of the three prevents the interleaving entirely.",
            icon: Cpu,
            tone: "success",
          },
        ]}
      />

      <h2>synchronized</h2>
      <CodeBlock language="java" filename="mutual exclusion" code={synchronized} />
      <p>
        Every Java object has a monitor lock. <code>synchronized</code> acquires it on entry and releases it on exit
        — including when an exception is thrown. It's <strong>reentrant</strong>, so a thread already holding a lock
        can acquire it again without deadlocking itself, which is what makes calling one synchronized method from
        another safe.
      </p>

      <AnalogyCard title="A single toilet key on a hook.">
        Anyone can use the room, but only with the key, and there's exactly one. Take the key, use the room, put it
        back. Everyone else waits at the door. It's simple, correct, and inherently a bottleneck — which is the
        trade-off with every lock: correctness bought with contention.
      </AnalogyCard>

      <h2>The other half: visibility</h2>
      <CodeBlock language="java" filename="volatile" code={memoryVisibility} />
      <Callout variant="warning" title="volatile fixes visibility, not atomicity">
        <code>volatile int count; count++;</code> is still broken — the read and the write are each visible, but
        another thread can still interleave between them. Use <code>volatile</code> for a flag that one thread
        writes and others read; use an atomic class or a lock for anything read-modify-write.
      </Callout>

      <h2>Atomics: locking without locks</h2>
      <CodeBlock language="java" filename="java.util.concurrent.atomic" code={atomics} />

      <h2>Explicit locks</h2>
      <CodeBlock language="java" filename="ReentrantLock" code={locks} />

      <h2>Deadlock</h2>
      <CodeBlock language="java" filename="two locks, opposite order" code={deadlock} />

      <CommonMistake
        title="synchronizing on the wrong object"
        wrong={`private Integer lock = 0;

public void increment() {
    synchronized (lock) {      // Integer is immutable and CACHED
        counter++;
        lock++;                // creates a NEW Integer — the lock identity changed!
    }
}

// Also wrong for the same reason:
synchronized ("myLock") { }    // string literals are shared JVM-wide
synchronized (Boolean.TRUE) { }`}
        right={`private final Object lock = new Object();

public void increment() {
    synchronized (lock) {
        counter++;
    }
}

// final so it can never be reassigned, private so no outside
// code can lock on the same object and cause surprise contention.`}
        explanation={
          <p>
            A lock must be a stable, private object. Boxed values and interned strings are shared across the whole
            JVM, so unrelated code can accidentally contend with you — or, worse, deadlock with you. And if the lock
            variable is reassigned, threads end up synchronising on different objects and the mutual exclusion
            silently disappears.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            If two threads change the same variable at once, updates get lost, because "add one" is really "read,
            add, write" and they can interleave. <code>synchronized</code> lets only one thread into a section at a
            time. <code>volatile</code> is different: it makes sure one thread's change is actually seen by the
            others.
          </p>
        }
        developer={
          <p>
            The Java Memory Model defines happens-before: releasing a monitor happens-before acquiring it, and a{" "}
            <code>volatile</code> write happens-before a subsequent read of that field. Without such an edge, the
            JIT and the CPU may reorder or cache freely, which is how the infinite-loop-on-a-flag bug arises.{" "}
            <code>synchronized</code> gives atomicity and visibility; <code>volatile</code> gives visibility and
            ordering only; atomics give lock-free atomicity for a single variable via compare-and-swap;{" "}
            <code>ReentrantLock</code> adds tryLock, timeouts, interruptibility and fairness.
          </p>
        }
        interview={
          <p>
            Have crisp answers for: why <code>count++</code> isn't atomic; the difference between{" "}
            <code>synchronized</code> and <code>volatile</code> (atomicity plus visibility versus visibility alone);
            what <code>ReentrantLock</code> adds; and the four conditions for deadlock, with prevention by
            consistent lock ordering. Mentioning happens-before by name, and that the flag bug is a JIT hoisting
            optimisation rather than a caching myth, marks out a strong answer.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="A boolean flag is written by one thread and read in another thread's loop. What is the minimum fix?"
        options={[
          { id: "a", text: "Make the field volatile" },
          { id: "b", text: "Wrap every access in synchronized" },
          { id: "c", text: "Use AtomicBoolean" },
          { id: "d", text: "Nothing — boolean writes are always visible" },
        ]}
        correctId="a"
        explanation="A single write and reads of one field need visibility, not mutual exclusion, so volatile is exactly the right tool and the cheapest. synchronized and AtomicBoolean would also work but add unnecessary cost. Doing nothing risks the reader never observing the write, because the JIT may hoist the read out of the loop."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Reproduce a race, then fix it three ways"
        hint={
          <p>
            Use more threads and more iterations to make the race reliable. For the flag experiment, run with{" "}
            <code>-server</code> and a long-running loop so the JIT has time to optimise it.
          </p>
        }
      >
        Build the lost-update counter and confirm it produces the wrong total. Fix it with{" "}
        <code>synchronized</code>, then with <code>AtomicInteger</code>, then with <code>LongAdder</code>, and time
        all three under heavy contention. Separately, write the non-volatile flag loop and see whether you can make
        it hang — then add <code>volatile</code> and watch it stop.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between synchronized and volatile?"
        answer={
          <p>
            They solve different halves of the problem. <code>volatile</code> guarantees{" "}
            <strong>visibility and ordering</strong> for a single field: every read sees the most recent write, and
            reads and writes aren't reordered across it. It does <em>not</em> provide atomicity, so{" "}
            <code>volatile int count; count++;</code> is still a race, because the read and the write are separate
            steps another thread can interleave between. <code>synchronized</code> provides{" "}
            <strong>mutual exclusion as well as visibility</strong>: only one thread holds the monitor at a time, and
            releasing it happens-before the next acquisition, so everything done inside is both indivisible and
            visible afterwards. So the rule is: <code>volatile</code> for a flag or a reference that one thread
            publishes and others read; <code>synchronized</code>, a <code>Lock</code>, or an atomic class for
            anything that reads a value and writes back a value derived from it. Atomics sit between them —
            lock-free atomicity for one variable, via hardware compare-and-swap.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "count++ is read-modify-write, so two threads can lose an update — this is the canonical race condition.",
          "synchronized gives mutual exclusion plus visibility; volatile gives visibility and ordering only.",
          "Atomic classes give lock-free atomicity for a single variable via compare-and-swap.",
          "ReentrantLock adds tryLock, timeouts, interruptibility and fairness — always unlock in a finally.",
          "Deadlock comes from inconsistent lock ordering; fix it by always acquiring locks in the same order.",
        ]}
      />
    </>
  )
}
