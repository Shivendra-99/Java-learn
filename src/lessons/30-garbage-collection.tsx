import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { MemoryDiagram } from "@/components/diagram/memory-diagram"
import { Quiz } from "@/components/lesson/quiz"
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { Anchor, Recycle, Search, Timer, Trash2 } from "lucide-react"

const roots = `An object is REACHABLE if a chain of references leads to it from a GC root.
Everything else is garbage, whether or not you meant to discard it.

GC roots include:
  - local variables and parameters in every live thread's stack frames
  - static fields of loaded classes
  - JNI references from native code
  - the threads themselves

Note what is NOT a root: an object referencing another object does not
keep it alive unless that first object is itself reachable. Two objects
referencing each other, with nothing else pointing at either, are both
garbage — which is why Java's collector handles cycles and reference
counting would not.`

const generations = `Young generation                    Old generation
----------------                    --------------
Eden + two survivor spaces          long-lived objects
almost every object born here       promoted after surviving N collections
collected often, very fast          collected rarely, more expensively
"minor GC"                          "major / full GC"

The weak generational hypothesis: most objects die young.
That empirical observation is why splitting the heap this way works —
a minor GC only walks the small set of objects that survived.`

const leakExample = `// A cache that never forgets is a memory leak with a nicer name
public class UserCache {
    private static final Map<String, User> CACHE = new HashMap<>();

    public static User get(String id) {
        return CACHE.computeIfAbsent(id, UserCache::load);
    }
}
// CACHE is a static field, so it is a GC root. Every user ever
// loaded stays reachable forever.

// Bounded, with eviction:
private static final Map<String, User> CACHE =
        Collections.synchronizedMap(new LinkedHashMap<>(16, 0.75f, true) {
            @Override protected boolean removeEldestEntry(Map.Entry<String, User> e) {
                return size() > 1000;
            }
        });

// Or let the collector decide, with weak keys:
private static final Map<String, User> CACHE = new WeakHashMap<>();`

const referenceTypes = `Strong    User u = new User();       normal reference; never collected while held
Soft      SoftReference<User>        collected only when memory is tight — caches
Weak      WeakReference<User>        collected at the next GC if nothing strong holds it
Phantom   PhantomReference<User>     for cleanup notification after collection

// WeakHashMap uses weak keys: an entry disappears once nothing
// else references its key. Useful for metadata keyed by object
// identity, where you don't want the map to keep them alive.`

const gcFlags = `# Which collector am I using?  (G1 is the default since Java 9)
java -XX:+PrintFlagsFinal -version | grep Use.*GC

# The main options
-XX:+UseSerialGC      one thread, tiny heaps, containers with 1 CPU
-XX:+UseParallelGC    throughput-oriented, longer pauses
-XX:+UseG1GC          default: balanced, region-based, pause-time target
-XX:+UseZGC           very large heaps, sub-millisecond pauses
-XX:MaxGCPauseMillis=200

# Watch it work
java -Xlog:gc Main
[0.213s][info][gc] GC(0) Pause Young (Normal) 24M->4M(256M) 3.201ms`

export default function GarbageCollectionLesson() {
  return (
    <>
      <p>
        Java's garbage collector frees you from manual memory management, which removes an entire class of bugs. It
        does not free you from thinking about memory — it changes the question from "did I free this?" to "is
        something still holding on to this?".
      </p>

      <h2>Reachability, not scope</h2>
      <CodeBlock language="text" filename="what keeps an object alive" code={roots} />
      <p>
        This is the central idea. An object isn't collected because you finished with it; it's collected because
        nothing can find it any more. Setting a variable to <code>null</code> helps only if that was the last path
        to the object.
      </p>

      <MemoryDiagram
        title="Reachability in action"
        steps={[
          {
            label: "Two objects, both reachable",
            detail: "main holds a reference to the session, and the session holds one to the user. Both are reachable from a GC root — the stack frame.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "session", ref: "ses@1" }] }],
            heap: [
              { id: "ses@1", type: "Session", fields: [["user", "-> usr@1"]] },
              { id: "usr@1", type: "User", fields: [["name", "\"Ana\""]] },
            ],
          },
          {
            label: "session = null;",
            detail: "The only root-level reference is gone. The Session is now unreachable — and so is the User, even though the Session still points at it, because the Session itself cannot be found.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "session", isNull: true }] }],
            heap: [
              { id: "ses@1", type: "Session", fields: [["user", "-> usr@1"]], tone: "garbage" },
              { id: "usr@1", type: "User", fields: [["name", "\"Ana\""]], tone: "garbage" },
            ],
          },
          {
            label: "...but a static cache also held the user",
            detail: "Add one static reference and the User survives while the Session is collected. A static field is a GC root, which is exactly why a static cache that never evicts is a leak.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "session", isNull: true }] }],
            heap: [
              { id: "Cache.class", type: "static CACHE", fields: [["\"ana\"", "-> usr@1"]] },
              { id: "ses@1", type: "Session", fields: [["user", "-> usr@1"]], tone: "garbage" },
              { id: "usr@1", type: "User", fields: [["name", "\"Ana\""]] },
            ],
          },
        ]}
      />

      <h2>How a collection actually runs</h2>
      <StepFlowDiagram
        title="A mark-and-sweep cycle, roughly"
        steps={[
          {
            id: "roots",
            label: "Find the roots",
            detail: "Enumerate every stack frame of every thread, plus static fields and native references. These are the starting points, and finding them requires briefly stopping the threads.",
            icon: Anchor,
          },
          {
            id: "mark",
            label: "Mark",
            detail: "Walk the object graph from the roots, marking everything reachable. Cost is proportional to the number of LIVE objects, not to the size of the heap — which is why cheap garbage is genuinely cheap.",
            icon: Search,
          },
          {
            id: "sweep",
            label: "Sweep or copy",
            detail: "Anything unmarked is garbage. Young collections copy the survivors into a survivor space and declare the rest of Eden free in one step; old collections typically mark and compact.",
            icon: Trash2,
            tone: "warning",
          },
          {
            id: "compact",
            label: "Compact",
            detail: "Survivors are moved together so free space is contiguous. This is what makes Java allocation a pointer bump — very nearly free — at the cost of moving objects around.",
            icon: Recycle,
          },
          {
            id: "promote",
            label: "Promote and resume",
            detail: "Objects that have survived enough cycles move to the old generation, and the application resumes. Modern collectors do most of this concurrently to keep the stop-the-world portion short.",
            icon: Timer,
            tone: "success",
          },
        ]}
      />

      <h2>Generations</h2>
      <CodeBlock language="text" filename="why the heap is split" code={generations} />

      <AnalogyCard title="Clearing a desk by keeping, not by binning.">
        At the end of a project you don't inspect every scrap of paper to decide what to throw away. You pick up the
        few things you're keeping, move them to a clean desk, and sweep everything else off in one go. The work is
        proportional to what you keep — so a desk covered in rubbish clears just as fast as an empty one. That's a
        copying collector, and it's why short-lived objects in Java are close to free.
      </AnalogyCard>

      <h2>You can still leak memory</h2>
      <CodeBlock language="java" filename="the classic leak" code={leakExample} />
      <p>
        A "memory leak" in Java means an unintended reference: something reachable that you no longer need. The
        usual suspects are static collections that only grow, listeners that are registered and never removed,{" "}
        <code>ThreadLocal</code> values in a pooled thread, and inner classes pinning their enclosing instance.
      </p>

      <h2>Reference strengths</h2>
      <CodeBlock language="text" filename="java.lang.ref" code={referenceTypes} />

      <Callout variant="warning" title="Do not call System.gc(), and never rely on finalize()">
        <code>System.gc()</code> is a suggestion the JVM may ignore, and when it doesn't, it typically forces a full
        collection at the worst possible moment. <code>finalize()</code> is deprecated for removal: it runs at an
        unpredictable time, on an unspecified thread, possibly never. For cleanup, use{" "}
        <code>try-with-resources</code> and <code>AutoCloseable</code>.
      </Callout>

      <CodeBlock language="bash" filename="observing GC" code={gcFlags} />

      <CommonMistake
        title="a listener that is registered and never removed"
        wrong={`public class Dashboard {
    public Dashboard(EventBus bus) {
        bus.subscribe(event -> this.refresh(event));
    }
}

// The lambda captures 'this'. The bus holds the lambda.
// The bus outlives the dashboard, so every dashboard ever
// opened stays in memory — along with everything it references.`}
        right={`public class Dashboard implements AutoCloseable {
    private final EventBus bus;
    private final Subscription subscription;

    public Dashboard(EventBus bus) {
        this.bus = bus;
        this.subscription = bus.subscribe(this::refresh);
    }

    @Override public void close() {
        subscription.cancel();     // the last reference goes away
    }
}`}
        explanation={
          <p>
            This is the most common leak in long-running Java applications, and it's invisible in the source: the
            lambda's captured <code>this</code> doesn't appear anywhere. Any registry that outlives the objects
            registering with it needs an explicit deregistration path — or weak references, if you can't guarantee
            callers will use it.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            You never free memory yourself. The JVM periodically works out which objects can still be reached from
            your running code and reclaims the rest. You can still run out of memory if you accidentally keep hold
            of things — a list that only ever grows is the usual culprit.
          </p>
        }
        developer={
          <p>
            Collectors are tracing, not reference-counting, so cycles are handled correctly. The heap is
            generational because most objects die young: minor collections copy the few survivors out of Eden,
            making allocation a pointer bump and collection proportional to live data. G1 is the default since Java
            9 and works on regions with a pause-time target; ZGC and Shenandoah trade throughput for sub-millisecond
            pauses on large heaps. Leaks are unintended reachability — static collections, unremoved listeners,{" "}
            <code>ThreadLocal</code> in pooled threads, inner-class references.
          </p>
        }
        interview={
          <p>
            Be precise that eligibility is about <em>reachability from GC roots</em>, not scope, and that this is
            why cycles aren't a problem. Know that <code>System.gc()</code> is advisory and{" "}
            <code>finalize()</code> is deprecated. Then be able to name three real leak patterns and how to diagnose
            one: heap dump with <code>jmap</code>, analyse in Eclipse MAT, look for the dominator tree and the path
            to the GC root.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Two objects reference each other and nothing else references either of them. What happens?"
        options={[
          { id: "a", text: "Neither is collected — this is a reference cycle leak" },
          { id: "b", text: "Both are collected, because neither is reachable from a GC root" },
          { id: "c", text: "Only the older one is collected" },
          { id: "d", text: "The JVM throws an error about circular references" },
        ]}
        correctId="b"
        explanation="Java uses tracing collection: it starts from roots and marks what it can reach. A mutually referencing island with no path from a root is unreachable, so both objects are collected. Reference counting — as used by CPython — is what struggles with cycles."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Watch a leak grow"
        hint={
          <p>
            Run with <code>-Xlog:gc</code> and <code>-Xmx64m</code>. Then swap the <code>HashMap</code> for a{" "}
            <code>WeakHashMap</code> keyed by an object you don't retain, and compare.
          </p>
        }
      >
        Write a loop that adds entries to a static map forever, and run it with a small heap and GC logging. Watch
        the collections get more frequent and reclaim less each time before it finally fails. Then take a heap dump
        with <code>jmap -dump</code> and find which object is holding everything — that's the exact workflow for a
        real production leak.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="When does an object become eligible for garbage collection, and can you force it?"
        answer={
          <p>
            An object becomes eligible when it is no longer <strong>reachable</strong> — when no chain of references
            leads to it from a GC root, meaning local variables in live thread stacks, static fields, JNI
            references, and the threads themselves. Note this is about reachability, not scope, and not about
            reference counts: two objects pointing at each other with nothing else referencing them are both
            eligible, which is why a tracing collector handles cycles that reference counting cannot. You cannot
            force collection. <code>System.gc()</code> is explicitly a hint the JVM is free to ignore, and calling
            it usually hurts by triggering a full collection at an arbitrary moment. Nor can you rely on{" "}
            <code>finalize()</code>, which is deprecated for removal and may never run — resource cleanup belongs in{" "}
            <code>AutoCloseable</code> and <code>try-with-resources</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Eligibility is about reachability from GC roots, not about scope — and cycles are handled correctly.",
          "The heap is generational because most objects die young; minor collections copy the few survivors.",
          "Collection cost is proportional to live objects, which makes short-lived allocation nearly free.",
          "Leaks in Java are unintended references: growing static collections, unremoved listeners, ThreadLocals in pooled threads.",
          "System.gc() is advisory and finalize() is deprecated — use try-with-resources for cleanup.",
        ]}
      />
    </>
  )
}
