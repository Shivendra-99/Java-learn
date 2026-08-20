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

const problem = `// Singleton (creational): guarantee exactly ONE instance of a class,
// with a single global point of access to it.
//
// Legitimate uses: a stateless registry, a configuration holder, a
// connection pool, a logger. Anything where a second instance would
// be wrong, not merely wasteful.`

const naiveBroken = `// Eager, simple, and thread-safe — but created even if never used
public class Config {
    private static final Config INSTANCE = new Config();
    private Config() { }
    public static Config getInstance() { return INSTANCE; }
}

// Lazy but BROKEN under concurrency
public class Config {
    private static Config instance;
    private Config() { }
    public static Config getInstance() {
        if (instance == null) {            // two threads can both see null
            instance = new Config();       // ...and both create one
        }
        return instance;
    }
}`

const doubleChecked = `// Lazy, thread-safe, by hand — note every keyword is load-bearing
public class Config {
    private static volatile Config instance;   // volatile is REQUIRED here
    private Config() { }

    public static Config getInstance() {
        if (instance == null) {                    // 1st check, no lock (fast path)
            synchronized (Config.class) {
                if (instance == null) {            // 2nd check, holding the lock
                    instance = new Config();
                }
            }
        }
        return instance;
    }
}
// Without volatile, another thread could see a partially-constructed
// instance, because the write and the constructor can be reordered.`

const holder = `// The holder idiom: lazy AND thread-safe with no synchronization at all
public class Config {
    private Config() { }

    private static class Holder {
        static final Config INSTANCE = new Config();
    }

    public static Config getInstance() {
        return Holder.INSTANCE;    // Holder loads on first call, and the
    }                              // JVM guarantees class init is thread-safe
}`

const enumSingleton = `// The recommended way in Java (Effective Java, Item 3)
public enum Config {
    INSTANCE;

    private final Map<String, String> settings = new HashMap<>();

    public String get(String key) { return settings.get(key); }
    public void set(String key, String value) { settings.put(key, value); }
}

Config.INSTANCE.set("timeout", "30");
// Thread-safe, lazy at class-init, and — uniquely — safe against
// both serialization and reflection attacks, for free.`

const identityPredictor = `public class OneInstance {
    enum Counter {
        INSTANCE;
        int value = 0;
    }

    public static void main(String[] args) {
        Counter a = Counter.INSTANCE;
        Counter b = Counter.INSTANCE;
        a.value = 5;
        System.out.println(b.value + " " + (a == b));
    }
}`

export default function SingletonPatternLesson() {
  return (
    <>
      <p>
        Singleton is the most famous pattern and the most abused. The idea is simple — one instance, shared —
        but implementing it correctly by hand in a threaded program is surprisingly fiddly, and Java has a
        one-line answer that closes every loophole: the enum.
      </p>

      <CodeBlock language="text" filename="what it is for" code={problem} />

      <h2>The naive versions</h2>
      <CodeBlock language="java" filename="eager works, lazy-by-hand breaks" code={naiveBroken} />
      <p>
        The eager version is fine and often all you need. The lazy version above is the classic broken singleton:
        two threads can both pass the null check before either assigns, and you get two instances — defeating the
        entire purpose.
      </p>

      <h2>Double-checked locking</h2>
      <CodeBlock language="java" filename="the hand-rolled thread-safe version" code={doubleChecked} />
      <Callout variant="warning" title="volatile is not optional here">
        Without it, one thread can publish the reference before the constructor has finished running, so another
        thread sees a non-null but half-built object. This was actually broken in Java versions before 5, when the
        memory model didn't support the idiom at all. It's correct now — but it's also more moving parts than the
        two better options below.
      </Callout>

      <h2>The holder idiom</h2>
      <CodeBlock language="java" filename="lazy and thread-safe, no locks" code={holder} />
      <p>
        This leans on a guarantee you already know: a class is initialised lazily, on first use, and the JVM makes
        that initialisation thread-safe. The inner <code>Holder</code> class isn't loaded until{" "}
        <code>getInstance()</code> touches it, so the instance is created exactly once, on demand, with no{" "}
        <code>synchronized</code> in sight.
      </p>

      <h2>The enum singleton</h2>
      <CodeBlock language="java" filename="Config.java" code={enumSingleton} />

      <OutputPredictor
        code={identityPredictor}
        options={[
          { id: "a", text: "5 true" },
          { id: "b", text: "0 true" },
          { id: "c", text: "5 false" },
          { id: "d", text: "0 false" },
        ]}
        correctId="a"
        explanation={
          <p>
            <code>a</code> and <code>b</code> are the same single instance — an enum constant is a singleton by
            definition — so <code>a == b</code> is true and the write through <code>a</code> is visible through{" "}
            <code>b</code>. That identity is exactly why an enum makes the cleanest singleton, and why comparing
            enum constants with <code>==</code> is correct.
          </p>
        }
      />

      <AnalogyCard title="A country's official time.">
        There is one official time for a country, and everything refers to that single source — clocks don't each
        keep their own. Asking for a second official time is meaningless, not just wasteful. A singleton is for
        exactly that kind of thing: a shared reference point where a duplicate would be a bug.
      </AnalogyCard>

      <CommonMistake
        title="using a singleton as a bucket of global mutable state"
        wrong={`public enum AppState {
    INSTANCE;
    public User currentUser;      // mutable global state
    public List<Order> cart = new ArrayList<>();
}

// Anywhere in the codebase:
AppState.INSTANCE.currentUser = user;
// ...which is not thread-safe, makes every test order-dependent,
// and hides what each method actually depends on.`}
        right={`// Keep the singleton stateless (or immutable), and pass state in
public enum PricingRules {          // shared, read-only data — fine
    INSTANCE;
    public long priceOf(Item item) { ... }
}

// Per-request or per-user state belongs in a parameter or a
// short-lived object, not in a global:
public Receipt checkout(User user, Cart cart) { ... }`}
        explanation={
          <p>
            The singleton mechanism is sound; the temptation it enables is the problem. A global holding mutable
            state that changes per request or per user is a global variable, with all the thread-safety,
            testability and hidden-dependency costs that implies. Singletons are at their best when stateless or
            immutable — a set of rules, a registry, a pool — not when they're a convenient place to stash "current"
            anything.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A singleton is a class you're only ever allowed to make one of. You hide the constructor so nobody can
            call <code>new</code>, and hand out the single shared copy through one method. In Java the neatest way
            is an enum with one value.
          </p>
        }
        developer={
          <p>
            Options in increasing safety: eager static final (simple, always created); the holder idiom (lazy,
            thread-safe via class-init guarantees, no locks); double-checked locking with a{" "}
            <code>volatile</code> field (lazy, correct only from Java 5 with volatile); and the enum, which is
            thread-safe, lazy at class initialisation, and the only form immune to serialization and reflection
            creating a second instance. Testability is the recurring criticism — a hard-coded singleton is a hidden
            dependency, which is why dependency injection frameworks manage "singleton-scoped" beans instead.
          </p>
        }
        interview={
          <p>
            Be ready to write a thread-safe singleton and justify every keyword — especially why{" "}
            <code>volatile</code> is required in double-checked locking (to prevent seeing a partially constructed
            object). Know the holder idiom as the lock-free lazy option, and the enum as the recommended default
            with its serialization and reflection safety. A strong closing point: singletons are widely considered
            an anti-pattern when used as global state, and DI containers exist partly to give you single instances
            without the coupling.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is the field volatile in a double-checked-locking singleton?"
        options={[
          { id: "a", text: "To make getInstance() run faster" },
          { id: "b", text: "So a thread can't see a non-null reference to a not-yet-fully-constructed instance" },
          { id: "c", text: "Because static fields must be volatile" },
          { id: "d", text: "It isn't needed — the synchronized block is enough" },
        ]}
        correctId="b"
        explanation="Without volatile, the write that publishes the reference can be reordered ahead of the constructor finishing, so another thread on the fast path sees a non-null but incomplete object. volatile forbids that reordering and guarantees visibility. The holder idiom and the enum avoid the whole issue."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Break a hand-rolled singleton"
        hint={
          <p>
            Add a small <code>Thread.sleep</code> inside the constructor of the broken lazy version, then call{" "}
            <code>getInstance()</code> from many threads at once and compare the instances with <code>==</code>.
          </p>
        }
      >
        Implement the broken lazy singleton, slow its constructor down, and have twenty threads race to get the
        instance. Confirm you can produce more than one distinct instance. Then swap in the enum version and show
        it's always the same object. That experiment is the whole argument for not rolling your own.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the best way to implement a singleton in Java, and why?"
        answer={
          <p>
            An enum with a single constant, per <em>Effective Java</em>. The JVM creates the instance during class
            initialisation, which is thread-safe by specification, so you get lazy, safe creation with no locking
            code. Crucially it's also the only form immune to the two loopholes that break hand-written singletons:
            serialization, which would otherwise deserialize a second instance unless you write{" "}
            <code>readResolve</code>, and reflection, which can call a private constructor but explicitly refuses to
            instantiate an enum. If an enum doesn't fit — say you need lazy initialisation of something that can't
            be an enum, or must extend a class — the holder idiom is the next best: a private static nested class
            holds the instance, loaded on first access, again relying on the thread-safe class-init guarantee with
            no synchronisation. Double-checked locking with a <code>volatile</code> field also works but has more
            moving parts and is easy to get subtly wrong. Whichever you choose, keep it stateless or immutable —
            singletons holding mutable global state are an anti-pattern.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Singleton guarantees one shared instance — legitimate for registries, pools and config, not for global state.",
          "The naive lazy version is broken under concurrency: two threads can both create an instance.",
          "Double-checked locking works but needs a volatile field to avoid publishing a half-built object.",
          "The holder idiom gives lazy, lock-free safety by leaning on thread-safe class initialisation.",
          "The enum is the recommended default: thread-safe, and uniquely safe against serialization and reflection.",
        ]}
      />
    </>
  )
}
