import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { MemoryDiagram } from "@/components/diagram/memory-diagram"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"

const basics = `public class Employee {
    private static int headcount = 0;      // ONE copy, shared by the class
    private final String name;             // one copy PER OBJECT

    public Employee(String name) {
        this.name = name;
        headcount++;                       // every new employee updates the shared count
    }

    public static int headcount() {        // callable without an instance
        return headcount;
    }
}

new Employee("Ana");
new Employee("Ben");
Employee.headcount();      // 2  — called on the CLASS, not an object`

const rules = `class Example {
    int instanceField;
    static int staticField;

    static void staticMethod() {
        staticField = 1;        // fine
        instanceField = 1;      // compile error: which object's field?
        this.toString();        // compile error: there is no 'this'
        instanceMethod();       // compile error: needs an instance
    }

    void instanceMethod() {
        staticField = 1;        // fine — an instance can see class-level state
        instanceField = 1;      // fine
    }
}`

const constants = `public class Physics {
    // The constant idiom: static final, SCREAMING_SNAKE_CASE
    public static final double SPEED_OF_LIGHT = 299_792_458;
    public static final int MAX_RETRIES = 3;

    private Physics() { }      // a utility class is never instantiated
}

// Careful: final protects the REFERENCE, not the object
public static final List<String> ROLES = new ArrayList<>();
ROLES.add("admin");            // perfectly legal — the list is mutable!

// Genuinely constant:
public static final List<String> ROLES = List.of("admin", "user");`

const utility = `// A utility class: only static members, never instantiated
public final class StringUtils {
    private StringUtils() {
        throw new AssertionError("no instances");
    }

    public static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}

StringUtils.isBlank(input);   // no object needed`

const staticPredictor = `public class Counter {
    static int shared = 0;
    int own = 0;

    void bump() {
        shared++;
        own++;
    }

    public static void main(String[] args) {
        Counter a = new Counter();
        Counter b = new Counter();
        a.bump();
        a.bump();
        b.bump();
        System.out.println(a.own + " " + b.own + " " + Counter.shared);
    }
}`

export default function StaticMembersLesson() {
  return (
    <>
      <p>
        <code>static</code> means "belongs to the class, not to any object". One copy exists, it's created when the
        class loads, and it's shared by everything. That makes it perfect for constants and stateless helpers, and
        genuinely dangerous for anything else.
      </p>

      <h2>Class state versus instance state</h2>
      <CodeBlock language="java" filename="one copy versus many" code={basics} />

      <MemoryDiagram
        title="Where static lives"
        steps={[
          {
            label: "The class is loaded",
            detail:
              "Before any object exists, the JVM loads Employee and creates one home for its static fields — conceptually attached to the class itself, not to any instance.",
            stack: [{ id: "main", label: "main()", vars: [] }],
            heap: [{ id: "Employee.class", type: "class Employee", fields: [["headcount", "0"]], tone: "new" }],
          },
          {
            label: "new Employee(\"Ana\")",
            detail: "The object gets its own name field. headcount is not copied into it — the constructor increments the single shared one.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "a", ref: "emp@1" }] }],
            heap: [
              { id: "Employee.class", type: "class Employee", fields: [["headcount", "1"]] },
              { id: "emp@1", type: "Employee", fields: [["name", "\"Ana\""]], tone: "new" },
            ],
          },
          {
            label: "new Employee(\"Ben\")",
            detail: "A second object, a second name field — and the same single headcount, now 2. Every instance sees the same value because there is only one.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "emp@1" },
                  { name: "b", ref: "emp@2" },
                ],
              },
            ],
            heap: [
              { id: "Employee.class", type: "class Employee", fields: [["headcount", "2"]], tone: "new" },
              { id: "emp@1", type: "Employee", fields: [["name", "\"Ana\""]] },
              { id: "emp@2", type: "Employee", fields: [["name", "\"Ben\""]] },
            ],
          },
        ]}
      />

      <OutputPredictor
        code={staticPredictor}
        options={[
          { id: "a", text: "2 1 3" },
          { id: "b", text: "2 1 1" },
          { id: "c", text: "3 3 3" },
          { id: "d", text: "2 1 2" },
        ]}
        correctId="a"
        explanation={
          <p>
            <code>own</code> is per object: <code>a</code> was bumped twice and <code>b</code> once. Both{" "}
            <code>bump()</code> calls also incremented the single shared <code>shared</code> field, so it counts
            every call across every instance — three. That's the whole distinction in one line of output.
          </p>
        }
      />

      <h2>What static code can and can't do</h2>
      <CodeBlock language="java" filename="the rules" code={rules} />
      <p>
        A static method has no <code>this</code>, so it can't touch instance state. The reverse is fine: an instance
        method can read and write static fields, because the class is always available. This asymmetry is why{" "}
        <code>main</code> must be static and why everything it calls directly must be static too — until it creates
        an object.
      </p>

      <AnalogyCard title="The shop's opening hours versus your receipt.">
        Every customer gets their own receipt with their own total — that's instance state. The opening hours are a
        property of the shop: one value, the same for everyone, and it exists before any customer walks in. Asking
        "what's on the shop's receipt?" is meaningless, which is exactly why a static method can't read an instance
        field.
      </AnalogyCard>

      <h2>Constants</h2>
      <CodeBlock language="java" filename="static final" code={constants} />
      <Callout variant="warning" title="final does not mean immutable">
        <code>final</code> means the variable can't be reassigned. If it points at a mutable object, the{" "}
        <em>object</em> can still change — a <code>public static final ArrayList</code> is a globally shared,
        globally writable list, which is one of the more effective ways to create a hard-to-find bug. Use{" "}
        <code>List.of</code>, <code>Map.of</code>, or an unmodifiable wrapper.
      </Callout>

      <h2>Utility classes</h2>
      <CodeBlock language="java" filename="StringUtils.java" code={utility} />
      <p>
        A class of pure functions with no state is a reasonable use of <code>static</code>:{" "}
        <code>Math</code>, <code>Collections</code> and <code>Objects</code> are all built this way. Mark the class{" "}
        <code>final</code> and give it a private constructor so nobody instantiates it by accident.
      </p>

      <CommonMistake
        title="static mutable state as a shortcut"
        wrong={`public class Session {
    public static User currentUser;    // "it's convenient"
}

// Anywhere in the codebase:
Session.currentUser = user;
...
doSomething(Session.currentUser.getId());`}
        right={`// Pass what you need, or inject it
public void process(User user, Order order) { ... }

// Or hold it per-request/per-thread, with a defined lifetime
public class RequestContext {
    private final User user;
    public RequestContext(User user) { this.user = user; }
}`}
        explanation={
          <p>
            Static mutable state is a global variable. Three concrete costs: it isn't thread-safe, so a web server
            handling two requests will interleave them; it makes tests order-dependent, because one test's writes
            survive into the next; and it hides dependencies, so a method's signature no longer tells you what it
            needs. Constants are fine — it's mutability at class scope that causes the damage.
          </p>
        }
      />

      <h2>Static blocks</h2>
      <p>
        A <code>{"static { ... }"}</code> block runs once, when the class is initialised, and is used for setup too
        complex for a single expression. Class initialisation is guaranteed thread-safe by the JVM, which is the
        mechanism behind the holder-class idiom for lazy singletons.
      </p>

      <DifficultyLevels
        simple={
          <p>
            Normally each object has its own copy of a field. Marking it <code>static</code> makes a single copy
            shared by all of them and attached to the class itself. Static methods likewise belong to the class, so
            you call them as <code>ClassName.method()</code> without creating anything.
          </p>
        }
        developer={
          <p>
            Statics are initialised during class initialisation, which happens lazily on first active use and is
            thread-safe by specification. Static fields live with the class metadata in the metaspace, and are roots
            for garbage collection — a static collection that only grows is a classic leak. Static methods are
            dispatched statically, so they're hidden rather than overridden by subclasses; calling one via an
            instance reference resolves using the declared type.
          </p>
        }
        interview={
          <p>
            Reliable questions: why <code>main</code> is static; whether static methods can be overridden (no — they
            are <em>hidden</em>, and which one runs is decided by the reference's compile-time type); and why static
            mutable state is a problem (thread safety, testability, hidden dependencies, and it's a GC root). Adding
            that <code>static final</code> on a mutable object still allows mutation shows attention to detail.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why can't a static method access an instance field directly?"
        options={[
          { id: "a", text: "Because instance fields are private" },
          { id: "b", text: "Because a static method has no 'this' — there is no particular object to read the field from" },
          { id: "c", text: "Because static methods run before objects are created" },
          { id: "d", text: "It can; only the reverse is forbidden" },
        ]}
        correctId="b"
        explanation="A static method is invoked on the class, so there is no receiver. The field exists once per object, and with no object in hand the question 'whose field?' has no answer. Pass the object in as a parameter if the method needs it."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Watch shared state cause a bug"
        hint={
          <p>
            Give the class a <code>static StringBuilder</code>, append to it from an instance method, then create
            several instances in a loop and print the result.
          </p>
        }
      >
        Write a class that accumulates into a static field and create several instances that each add something.
        Show that the result mixes contributions from all of them. Then change the field to an instance field and
        confirm the objects become independent. Finally, describe what would happen if two threads did this at once
        — you'll meet the real answer in the concurrency section.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Can static methods be overridden?"
        answer={
          <p>
            No. A subclass can declare a static method with the same signature, but that's <strong>hiding</strong>,
            not overriding, and the difference is observable: overriding is resolved at runtime from the object's
            actual type, whereas a hidden static method is resolved at compile time from the reference's declared
            type. So <code>Parent p = new Child(); p.staticMethod();</code> runs the <em>parent's</em> version, even
            though the object is a <code>Child</code>. That's also why calling a static method through an instance
            reference is a bad idea and why most linters flag it — write <code>ClassName.method()</code> so the
            reader can see what will actually run.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "static means one copy per class, created at class load and shared by every instance.",
          "Static code has no 'this', so it cannot touch instance state; instance code can freely use statics.",
          "static final in SCREAMING_SNAKE_CASE is the constant idiom — but final protects the reference, not the object.",
          "Utility classes of pure static functions are fine; static mutable state is a global variable.",
          "Static methods are hidden, not overridden — resolution uses the compile-time type.",
        ]}
      />
    </>
  )
}
