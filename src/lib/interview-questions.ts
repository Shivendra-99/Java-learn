/**
 * The standalone interview question bank powering /interview-questions.
 *
 * `answer` is a plain string rather than JSX for two reasons: it doubles as the
 * text for the FAQPage structured data, and it stays searchable. Wrap an
 * identifier in backticks to have it rendered as inline code.
 *
 * `points`, `code`, and `table` are optional extras rendered below the prose —
 * use them where a list, a snippet, or a side-by-side comparison genuinely
 * explains more than another paragraph would.
 */

export type InterviewCategory =
  | "fundamentals"
  | "oop"
  | "memory"
  | "collections"
  | "exceptions"
  | "modern"
  | "concurrency"
  | "practical"
  | "coding"
  | "patterns"

export const INTERVIEW_CATEGORIES: Record<InterviewCategory, string> = {
  fundamentals: "Fundamentals",
  oop: "OOP & Design",
  memory: "Memory & the JVM",
  collections: "Collections & Generics",
  exceptions: "Exceptions",
  modern: "Modern Java",
  concurrency: "Concurrency",
  practical: "Practical Scenarios",
  coding: "Stream Coding Problems",
  patterns: "Design Patterns",
}

export interface ComparisonTable {
  columns: [string, string]
  rows: Array<[string, string]>
}

export interface CodeSample {
  caption?: string
  snippet: string
}

export interface InterviewQuestionEntry {
  id: string
  category: InterviewCategory
  question: string
  /** the spoken answer — also used verbatim for FAQPage structured data */
  answer: string
  /** supporting bullets, shown under the prose */
  points?: string[]
  code?: CodeSample
  table?: ComparisonTable
  /** slug of the lesson that covers this in depth, if there is one */
  related?: string
}

export const interviewQuestions: InterviewQuestionEntry[] = [
  // --------------------------------------------------------------- fundamentals
  {
    id: "jdk-jre-jvm",
    category: "fundamentals",
    question: "What is the difference between the JDK, the JRE and the JVM?",
    answer:
      "They nest, largest to smallest. The `JVM` executes bytecode: it loads classes, verifies them, interprets and JIT-compiles, and manages the heap — it is a specification with several implementations such as HotSpot, OpenJ9 and GraalVM. The `JRE` is the JVM plus the standard class library, which is the minimum needed to run a Java application. The `JDK` is the JRE plus the development tools: `javac`, `jar`, `javadoc`, `jshell`, and the debugging and profiling utilities. Developers install a JDK; production only needs a runtime, which since Java 11 is usually produced with `jlink` rather than downloaded as a separate JRE.",
    points: [
      "A machine where `java` works but `javac` reports 'command not found' has a runtime-only install.",
      "The standalone JRE was discontinued after Java 8 — `jlink` builds a trimmed runtime image instead.",
      "'The JVM' in a given deployment means one specific implementation, with its own GC and JIT characteristics.",
    ],
    related: "jdk-jre-jvm",
  },
  {
    id: "compiled-or-interpreted",
    category: "fundamentals",
    question: "Is Java a compiled or an interpreted language?",
    answer:
      "Both, in sequence. `javac` compiles source to bytecode ahead of time — a real compilation step with full type checking. At runtime the JVM interprets that bytecode, and its JIT compiler translates frequently executed methods into native machine code, applying optimisations an ahead-of-time compiler cannot because they depend on how the program actually behaves. So Java gets compile-time safety and runtime-informed optimisation, at the cost of slower startup than a native binary.",
    points: [
      "Bytecode is the portable artifact; the JVM itself is very much platform-specific.",
      "HotSpot uses tiered compilation: C1 compiles quickly with light optimisation, C2 slowly with aggressive optimisation.",
      "GraalVM native-image compiles ahead of time for fast startup, giving up the JIT's runtime knowledge.",
    ],
    related: "how-java-runs",
  },
  {
    id: "platform-independence",
    category: "fundamentals",
    question: "What exactly is 'platform independent' about Java?",
    answer:
      "The bytecode. `javac` produces a `.class` file targeting an abstract stack machine defined by the JVM specification, and that same file runs anywhere a JVM exists. The JVM is the opposite of portable — you download a different build of it for Windows, macOS and Linux — and that per-platform program is precisely what makes your bytecode universal. Porting the JVM once makes every Java program ever written run on the new platform.",
    points: [
      "Bytecode is a small, simple instruction set, which is what makes implementing a JVM feasible.",
      "'Write once, run anywhere' describes the artifact you ship, not the runtime you install.",
    ],
    related: "why-java",
  },
  {
    id: "main-signature",
    category: "fundamentals",
    question: "Why must main be declared public static void main(String[] args)?",
    answer:
      "Each modifier does a job. `public` so the launcher can call it from outside your class. `static` because at startup no objects exist — a non-static main would require the JVM to choose and invoke a constructor, an arbitrary decision the language avoids. `void` because a Java program's exit status comes from `System.exit` or from terminating normally, never from main's return value. And `String[]` to receive the command-line arguments. `String... args` is also accepted, since varargs compile to an array.",
    points: [
      "A wrong signature compiles fine — it is simply an ordinary method — and fails at launch with `NoSuchMethodError: main`.",
      "`args[0]` is the first real argument; unlike C, the program name is not included.",
      "A class may overload `main`, but only the `String[]` version is an entry point.",
    ],
    related: "first-java-program",
  },
  {
    id: "jit-compiler",
    category: "fundamentals",
    question: "What is the JIT compiler and why does Java need an interpreter too?",
    answer:
      "The JIT (just-in-time) compiler translates bytecode into native machine code while the program runs. Java uses both because they fail in opposite directions: the interpreter starts instantly but executes slowly, while compilation produces fast code but costs time up front. HotSpot interprets everything at first, profiles as it goes, and compiles only methods that prove they are worth it. Because compilation happens after profiling, the JIT can inline across virtual calls and speculate on the types actually observed, guarded by checks that deoptimise back to the interpreter if an assumption is violated.",
    points: [
      "This is why microbenchmarks need a warm-up phase — the first runs measure the interpreter.",
      "The JIT knows the exact CPU, which branches actually run, and which types actually arrive.",
      "`-XX:+PrintCompilation` shows compilation decisions as they happen; `-Xint` disables the JIT entirely.",
    ],
    related: "how-java-runs",
  },
  {
    id: "primitives-and-wrappers",
    category: "fundamentals",
    question: "Why does Java have both primitives and wrapper classes?",
    answer:
      "Primitives are raw values stored directly in a variable's slot: fast, compact, and unable to be null or to have methods. But generics and collections only work with objects — `List<int>` is not legal Java — so every primitive has a wrapper class that boxes the value on the heap. Wrappers can be null, carry useful static helpers such as `Integer.parseInt` and `Integer.MAX_VALUE`, and participate in the type system. The cost is an allocation and a dereference per value, which is why the Stream API has separate `IntStream`, `LongStream` and `DoubleStream` types.",
    points: [
      "Eight primitives: byte, short, int, long, float, double, char, boolean.",
      "Type erasure is the underlying reason a type argument can never be a primitive.",
      "Prefer the primitive unless you genuinely need null or a collection.",
    ],
    related: "casting-and-wrappers",
  },
  {
    id: "autoboxing-integer-cache",
    category: "fundamentals",
    question: "Why is Integer a = 127, b = 127; a == b true, but false for 128?",
    answer:
      "Autoboxing compiles to `Integer.valueOf(...)`, which caches instances from -128 to 127 and returns the same object for repeated small values — so `==`, which compares references, is true. Above 127 each boxing allocates a distinct object, so `==` compares two different addresses and is false. The values are equal in both cases, which is exactly the point: wrappers must be compared with `equals`, or unboxed to primitives first. The really unpleasant part is that code relying on `==` passes in testing with small values and fails in production with large ones.",
    code: {
      caption: "The same values, two different answers",
      snippet: `Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);   // true  — same cached object
System.out.println(c == d);   // false — two objects
System.out.println(c.equals(d)); // true — correct comparison`,
    },
    points: [
      "The cache upper bound is tunable with `-XX:AutoBoxCacheMax`.",
      "`Boolean`, `Byte`, `Character` below 128 and `Short`/`Long` in the same range are cached too.",
      "Unboxing a null wrapper throws NullPointerException on a line with no visible method call.",
    ],
    related: "casting-and-wrappers",
  },
  {
    id: "integer-overflow",
    category: "fundamentals",
    question: "What happens when an int overflows in Java?",
    answer:
      "It wraps silently using two's complement — `Integer.MAX_VALUE + 1` is `Integer.MIN_VALUE`, with no exception and no warning. This is why counters over large ranges, millisecond arithmetic and file sizes should be `long`, and why `Math.addExact`, `multiplyExact` and friends exist: they perform the same arithmetic but throw `ArithmeticException` on overflow when you would rather fail loudly than continue with a wrong number.",
    points: [
      "The classic real-world case is `(low + high) / 2` in a binary search, fixed with `(low + high) >>> 1`.",
      "Integer division also truncates: `7 / 10` is `0` regardless of what you assign it to.",
      "`%` takes the sign of the left operand, so `n % 2 == 1` is false for every negative odd number.",
    ],
    related: "variables-and-types",
  },

  // ------------------------------------------------------------------------ oop
  {
    id: "four-pillars",
    category: "oop",
    question: "What are the four pillars of object-oriented programming in Java?",
    answer:
      "Encapsulation — bundling data with the operations that maintain its invariants, so the class is the only thing that can break its own rules. Inheritance — a subclass acquiring the state and behaviour of a parent, expressing an is-a relationship. Polymorphism — one reference type standing for many actual types, with the object deciding which implementation runs. Abstraction — exposing what something does while hiding how, via interfaces and abstract classes. The one worth emphasising is polymorphism, because it is what lets you add a new type without editing the code that consumes it.",
    points: [
      "Encapsulation means exposing operations, not fields with getters and setters attached.",
      "Inheritance is the most over-used of the four; composition is usually the better default.",
      "Abstraction is why code should depend on `List`, not on `ArrayList`.",
    ],
    related: "classes-and-objects",
  },
  {
    id: "overloading-vs-overriding",
    category: "oop",
    question: "What is the difference between method overloading and overriding?",
    answer:
      "Overloading is several methods in one class sharing a name but differing in parameter types. The compiler chooses between them at compile time from the declared argument types — static binding — and the return type plays no part. Overriding is a subclass replacing a parent method with an identical signature; the JVM chooses at runtime from the object's actual class — dynamic binding. The practical consequence: with `Base b = new Derived()`, an overridden method runs Derived's version, whereas an overloaded call, a field access, or a static method all resolve using `Base`.",
    table: {
      columns: ["Overloading", "Overriding"],
      rows: [
        ["Same class (or inherited)", "Subclass replaces a parent method"],
        ["Different parameter types", "Identical signature required"],
        ["Resolved at compile time", "Resolved at runtime"],
        ["Return type irrelevant", "Return type may be covariant"],
        ["No annotation", "`@Override` catches mistakes"],
      ],
    },
    points: [
      "Overload resolution runs in three phases: widening, then boxing, then varargs — and stops at the first that matches.",
      "You cannot overload on return type alone, because the signature excludes it.",
      "A valid override may widen access and narrow checked exceptions, never the reverse.",
    ],
    related: "polymorphism",
  },
  {
    id: "abstract-vs-interface",
    category: "oop",
    question: "When would you use an abstract class rather than an interface?",
    answer:
      "When the subtypes share state or construction logic, because only an abstract class can declare instance fields and constructors. And when you want to own an algorithm while letting parts of it vary — the template method pattern, where a `final` method calls abstract steps. Interfaces are better for describing a capability unrelated classes might have, such as `Comparable` or `Closeable`, because a class can implement many interfaces but extend only one class — so an abstract class spends the implementer's single inheritance slot. Since Java 8 interfaces can supply default implementations, so the deciding factor is usually state: if you need fields, it is an abstract class.",
    table: {
      columns: ["Abstract class", "Interface"],
      rows: [
        ["One per subclass", "Any number implemented"],
        ["Can hold instance fields", "Only `public static final` constants"],
        ["Has constructors", "No constructors"],
        ["Any access modifier", "Members implicitly public"],
        ["is-a with shared implementation", "is-capable-of"],
      ],
    },
    related: "abstract-classes",
  },
  {
    id: "default-methods",
    category: "oop",
    question: "What are default methods and why were they added in Java 8?",
    answer:
      "A default method is an interface method with an implementation, inherited by every implementer that does not override it. They were added for binary compatibility: Java 8 needed to add `stream()` and `forEach()` to `Collection` and `Iterable`, and under the old rules that would have broken every existing implementation of those interfaces everywhere. Defaults let an interface evolve without that breakage. They also enable small composable APIs — `Comparator.thenComparing`, `Predicate.and` — where the interface supplies combinators built on its single abstract method.",
    points: [
      "A class inheriting conflicting defaults from two interfaces must override the method; it can delegate with `Interface.super.method()`.",
      "A class's own methods always beat any inherited default.",
      "Default methods still cannot hold state, which is the line that keeps interfaces distinct from abstract classes.",
    ],
    related: "interfaces",
  },
  {
    id: "why-single-inheritance",
    category: "oop",
    question: "Why does Java allow only single inheritance of classes?",
    answer:
      "Because multiple inheritance of state creates unanswerable questions. If a class inherited from two parents that both declared a `name` field, or both provided `save()`, the language would need rules for which copy the object holds and which implementation runs — the diamond problem. C++ answers this with virtual inheritance and considerable complexity; Java sidestepped it. Interfaces can be implemented in any number because they carry no state. Default methods reintroduced a limited version of the problem, and Java resolves it explicitly: a class inheriting conflicting defaults must override the method.",
    related: "inheritance",
  },
  {
    id: "composition-over-inheritance",
    category: "oop",
    question: "Why is composition usually preferred over inheritance?",
    answer:
      "Because inheritance couples a subclass to the superclass's implementation, not merely its interface. If the parent calls its own overridable methods — as `HashSet.addAll` calls `add` — a subclass's overrides interact with internals it cannot see, and a future change to those internals breaks it silently. That is the fragile base class problem. Inheritance also forces a single axis of variation, exposes the parent's whole API whether it makes sense or not, and is fixed at compile time. Composition depends only on a published interface, allows several behaviours to vary independently, permits substitution at runtime and in tests, and exposes exactly the API you choose.",
    code: {
      caption: "The counting-set example: addAll calls add, so the count doubles",
      snippet: `class CountingSet<E> extends HashSet<E> {
    int addCount = 0;
    @Override public boolean add(E e) { addCount++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);      // which calls our add(), n more times
    }
}
new CountingSet<String>().addAll(List.of("a","b","c"));  // addCount == 6`,
    },
    points: [
      "Use inheritance for a genuine is-a with a class explicitly designed and documented for extension.",
      "`java.util.Stack extends Vector` is the JDK's own permanent example of getting this wrong.",
      "The usual pattern combines both: inherit type from an interface, get behaviour from a delegated field.",
    ],
    related: "composition-vs-inheritance",
  },
  {
    id: "static-override",
    category: "oop",
    question: "Can static methods be overridden?",
    answer:
      "No. A subclass can declare a static method with the same signature, but that is hiding, not overriding, and the difference is observable: overriding is resolved at runtime from the object's actual type, whereas a hidden static method is resolved at compile time from the reference's declared type. So `Parent p = new Child(); p.staticMethod();` runs the parent's version even though the object is a Child. That is also why calling a static method through an instance reference is flagged by every linter — write `ClassName.method()` so the reader can see what will actually run.",
    points: [
      "Fields behave the same way: they are hidden, not overridden, and resolve on the declared type.",
      "`private` and `final` methods cannot be overridden either — they bind statically.",
      "A static method has no `this`, which is also why it cannot touch instance state.",
    ],
    related: "static-members",
  },
  {
    id: "private-constructor",
    category: "oop",
    question: "Can a constructor be private? What would that be for?",
    answer:
      "Yes, and it is a common technique. A private constructor prevents outside code from calling `new`, which enables several patterns: static factory methods such as `Integer.valueOf` or `List.of`, which can return a cached instance or a subtype rather than always allocating; singletons, where the class controls that only one instance exists; builders, where the builder is the only thing allowed to construct the product; and utility classes such as `java.util.Collections`, where a private constructor documents that the class is never meant to be instantiated.",
    points: [
      "Constructors can be overloaded but never overridden — they are not inherited.",
      "Declaring any constructor removes the compiler-supplied no-argument default.",
      "For a singleton, an enum is safer: it is serialization-safe and reflection-safe for free.",
    ],
    related: "constructors",
  },
  {
    id: "initialization-order",
    category: "oop",
    question: "In what order does Java initialise a new object?",
    answer:
      "Static setup happens once, when the class is first actively used: static fields and static blocks run in source order, and the JVM guarantees this is thread-safe. Then, on every `new`: memory is allocated and fields zeroed; the superclass constructor runs (via an implicit or explicit `super(...)`); then this class's instance field initialisers and instance blocks run in source order; and only then does the constructor body execute. The part people get wrong is that field initialisers run before the constructor body, so a constructor assignment overwrites what an initialiser set.",
    code: {
      caption: "Both run, and the constructor wins",
      snippet: `class Order {
    static { System.out.println("static block"); }
    private String id = defaultId();          // 1st
    { System.out.println("instance block"); } // 2nd
    Order(String id) { this.id = id; }        // 3rd — overwrites the initialiser
}`,
    },
    points: [
      "With inheritance: parent statics, child statics, parent instance setup, parent constructor, child instance setup, child constructor.",
      "This is why calling an overridable method from a constructor is unsafe — the subclass's fields are still null.",
      "`this(...)` and `super(...)` must be the first statement, and only one may appear.",
    ],
    related: "constructors",
  },
  {
    id: "encapsulation-real",
    category: "oop",
    question: "Is a class with private fields and public getters and setters encapsulated?",
    answer:
      "Not meaningfully. If every field has a public setter, outside code can put the object into any state it likes — the private modifier just adds a method call in front. Real encapsulation means the class exposes operations that maintain its invariants: `markPaid()` rather than `setStatus(String)`, `deposit(amount)` rather than `setBalance(long)`. It also means not leaking internal mutable state through getters, which requires defensive copies or immutable types. The test to apply: can I name something that is always true of this object, and is that guaranteed by the class rather than by convention?",
    points: [
      "Private controls the reference, not the object — returning a mutable field leaks internals regardless.",
      "`protected` is wider than it looks: it grants access to the whole package as well as to subclasses.",
      "The strongest form of encapsulation is immutability, where there is nothing left to protect.",
    ],
    related: "encapsulation",
  },
  {
    id: "records-vs-class",
    category: "oop",
    question: "What does a record give you, and when would you not use one?",
    answer:
      "A record generates a private final field per component, a canonical constructor, an accessor per component, and correct `equals`, `hashCode` and `toString` derived from all components. It is implicitly final and extends `java.lang.Record`, so it can implement interfaces but not extend a class. You would avoid one when the type has identity distinct from its values — a JPA entity, say, where two loads of the same row should be equal by id and the fields change over time — or when you need mutable state, a hidden representation, or class inheritance. One caveat worth raising: records are only shallowly immutable, so a component holding a mutable collection still needs a defensive copy in the compact constructor.",
    code: {
      caption: "Closing the mutability hole",
      snippet: `public record Team(String name, List<String> members) {
    public Team {
        members = List.copyOf(members);   // copies AND makes it unmodifiable
    }
}`,
    },
    points: [
      "Accessors are named `x()`, not `getX()` — records deliberately dropped the JavaBeans convention.",
      "Extra instance fields are forbidden, because they would not participate in the generated equals and hashCode.",
      "Records are the natural implementations of a `sealed` interface, enabling exhaustive switches.",
    ],
    related: "records",
  },
  {
    id: "enum-singleton",
    category: "oop",
    question: "Why is an enum considered the best way to implement a singleton?",
    answer:
      "Because the JVM guarantees the properties you would otherwise hand-build. The instance is created during class initialisation, which is thread-safe by specification — no double-checked locking, no `volatile`. Serialization is handled specially: enums serialize by name and deserialize via `valueOf`, so you can never end up with a second instance, a real hazard with a classic singleton unless you write `readResolve`. And reflection explicitly refuses to instantiate enum types, closing the other loophole. The cost is that an enum singleton cannot extend a class and is initialised eagerly with its class.",
    code: {
      caption: "The whole implementation",
      snippet: `public enum Registry {
    INSTANCE;
    private final Map<String, Handler> handlers = new HashMap<>();
    public void register(String key, Handler h) { handlers.put(key, h); }
}`,
    },
    points: [
      "Enum constants are singletons, which is why `==` is correct and idiomatic for comparing them.",
      "An enum can implement interfaces and give each constant its own behaviour, but cannot extend a class.",
      "For lazy initialisation instead, use the static holder idiom.",
    ],
    related: "enums",
  },
  {
    id: "final-keyword",
    category: "oop",
    question: "What does final mean in Java?",
    answer:
      "Three different things depending on where it appears. On a variable it means assign-once: the reference or value cannot be reassigned — but if it points at a mutable object, that object can still change, so `final` is not immutability. On a method it means subclasses cannot override it, which is how you protect behaviour a constructor depends on. On a class it means nothing can extend it at all, as with `String` and `Integer`. A related concept is *effectively final*: a local variable never reassigned, which is the requirement for capture by a lambda or an inner class.",
    code: {
      caption: "final protects the reference, not the object",
      snippet: `public static final List<String> ROLES = new ArrayList<>();
ROLES.add("admin");         // perfectly legal — the list is mutable

public static final List<String> ROLES = List.of("admin", "user");  // genuinely constant`,
    },
    related: "static-members",
  },
  {
    id: "inner-vs-static-nested",
    category: "oop",
    question: "What is the difference between a static nested class and an inner class?",
    answer:
      "An inner class — one declared without `static` — holds an implicit reference to an instance of the enclosing class. That is what lets it read the outer instance's fields directly, why it must be created as `outer.new Inner()`, and why it is a memory-leak risk: if an inner-class instance is stored anywhere long-lived, it pins the entire enclosing object in memory. A static nested class has no such reference; it is an ordinary class that happens to be namespaced inside another. Make nested classes static unless you specifically need the outer instance.",
    code: {
      caption: "Visible in the bytecode",
      snippet: `// javap -p Outer$Inner
class Outer$Inner {
    final Outer this$0;              // the synthetic reference
    Outer$Inner(Outer);              // the constructor takes it
}
// javap -p Outer$Nested  — no such field, no such parameter`,
    },
    points: [
      "Local and anonymous classes capture effectively-final locals by value, copied into synthetic fields.",
      "Lambdas differ: they share the enclosing `this`, introduce no new scope, and compile via `invokedynamic`.",
      "A data-holding nested class should almost always be a static nested class or a record.",
    ],
    related: "nested-classes",
  },

  // --------------------------------------------------------------------- memory
  {
    id: "stack-vs-heap",
    category: "memory",
    question: "What is the difference between stack and heap memory?",
    answer:
      "The stack is per thread and holds a frame for each active method call: parameters, local variables and the operand stack. Frames are pushed and popped automatically, so cleanup is free and locals are inherently thread-confined. It is small — typically well under a megabyte — and exhausting it, usually through unbounded recursion, gives `StackOverflowError`. The heap is shared by all threads and holds every object and array. Its contents live as long as they are reachable, are reclaimed by the garbage collector rather than by scope, and it is sized with `-Xms`/`-Xmx`; exhausting it gives `OutOfMemoryError: Java heap space`. A local variable of a reference type sits on the stack but points into the heap, which is what makes aliasing possible.",
    table: {
      columns: ["Stack", "Heap"],
      rows: [
        ["One per thread", "One, shared by every thread"],
        ["Frames: locals and parameters", "All objects and arrays"],
        ["Popped automatically on return", "Garbage collected when unreachable"],
        ["Small, sized with `-Xss`", "Large, sized with `-Xms`/`-Xmx`"],
        ["`StackOverflowError`", "`OutOfMemoryError: Java heap space`"],
      ],
    },
    points: [
      "Class metadata and static fields live in metaspace, which is separate from both.",
      "Escape analysis lets the JIT stack-allocate or eliminate objects that provably never escape a method.",
      "Because locals are thread-confined, they never need synchronisation — shared state is always heap state.",
    ],
    related: "stack-and-heap",
  },
  {
    id: "pass-by-value",
    category: "memory",
    question: "Is Java pass-by-value or pass-by-reference?",
    answer:
      "Always pass-by-value. The confusion comes from reference types: the value being copied is the reference, so the caller and the callee end up pointing at the same heap object. That is why a method can call `list.add(...)` and the caller sees the change — the mutation happened to the shared object, not to the variable. But assigning a new object to the parameter only repoints the callee's local copy, and the caller's variable is untouched. The clinching demonstration is that you cannot write a working `swap(a, b)` in Java: in a genuinely pass-by-reference language you could, because the method would receive an alias for the caller's variables. The precise phrasing is 'Java passes references by value'.",
    code: {
      caption: "Mutation propagates; reassignment does not",
      snippet: `static void mutate(List<String> l) { l.add("new"); }      // caller sees it
static void replace(List<String> l) { l = new ArrayList<>(); }  // caller does not`,
    },
    points: [
      "A working swap needs indirection — an array, a holder object, or an AtomicReference.",
      "A `String` parameter seems immune only because String is immutable, not because of pass semantics.",
      "Out parameters are a habit from other languages; in Java, return the value or mutate a shared object.",
    ],
    related: "pass-by-value",
  },
  {
    id: "gc-eligibility",
    category: "memory",
    question: "When does an object become eligible for garbage collection, and can you force it?",
    answer:
      "An object becomes eligible when it is no longer reachable — when no chain of references leads to it from a GC root, meaning local variables in live thread stacks, static fields, JNI references, and the threads themselves. This is about reachability, not scope, and not reference counts: two objects pointing at each other with nothing else referencing them are both eligible, which is why a tracing collector handles cycles that reference counting cannot. You cannot force collection. `System.gc()` is explicitly a hint the JVM may ignore, and calling it usually hurts by triggering a full collection at an arbitrary moment. Nor can you rely on `finalize()`, which is deprecated for removal — resource cleanup belongs in `AutoCloseable` and try-with-resources.",
    points: [
      "The heap is generational because most objects die young; minor collections copy the few survivors.",
      "Collection cost is proportional to live objects, not to the amount of garbage — so short-lived allocation is nearly free.",
      "Setting a variable to null helps only if that was the last path to the object.",
    ],
    related: "garbage-collection",
  },
  {
    id: "memory-leak-java",
    category: "memory",
    question: "Can you have a memory leak in Java, and what causes one?",
    answer:
      "Yes. A leak in Java means an unintended reference — something still reachable that you no longer need, so the collector correctly refuses to reclaim it. The usual causes are a static collection or cache that only grows; listeners registered with a long-lived source and never removed, where a lambda's captured `this` keeps the whole object alive; `ThreadLocal` values set on a pooled thread and never cleared, so they survive as long as the pool does; and inner-class instances pinning their enclosing object through the hidden outer reference. The symptom is heap usage that climbs steadily and does not fall after a full collection.",
    points: [
      "Bound caches or use eviction; `WeakHashMap` or `SoftReference` when the collector should decide.",
      "Anything that registers must have a deregistration path — `AutoCloseable` is a good place for it.",
      "Diagnose with a heap dump: the dominator tree finds the retainer, the path to GC root finds the cause.",
    ],
    related: "garbage-collection",
  },
  {
    id: "string-immutable",
    category: "memory",
    question: "Why is String immutable in Java?",
    answer:
      "Several reasons reinforce each other. Security: strings are used for file paths, URLs, class names and database queries, and if a caller could mutate one after it had been validated, every check would be exploitable. Thread safety: an immutable object can be shared between threads with no synchronisation at all. Caching: `hashCode` can be computed once and stored, which is what makes `String` such a good `HashMap` key — a mutable key whose hash changed would become unfindable in its own map. The pool: sharing identical literals is only safe because nobody can change them. The cost is that building strings in a loop allocates repeatedly, which is what `StringBuilder` is for.",
    points: [
      "`String` is final, so no subclass can add mutability.",
      "Every String method returns a new string — forgetting to assign the result is a silent no-op.",
      "Since Java 9, compact strings store Latin-1 text as one byte per character.",
    ],
    related: "strings",
  },
  {
    id: "string-pool-intern",
    category: "memory",
    question: "What is the string pool, and what does intern() do?",
    answer:
      "The string pool is a JVM-managed table of unique string values. Every string literal in your source is added to it at class load, and identical literals resolve to the same object — which is why `\"java\" == \"java\"` is true. It saves memory, since string literals are enormously repetitive, and it is safe only because strings are immutable. `intern()` takes a string, looks its value up in the pool, and returns the pooled instance, adding it first if absent. So `new String(\"java\").intern() == \"java\"` is true while `new String(\"java\") == \"java\"` is false. None of this should affect how you compare strings: always use `equals`.",
    code: {
      caption: "Compile-time folding versus runtime concatenation",
      snippet: `String a = "java";
String b = "ja" + "va";        // folded by the compiler, so pooled: a == b is true
String part = "ja";
String c = part + "va";        // computed at runtime, so a new object: a == c is false`,
    },
    points: [
      "Since Java 7 the pool lives in the heap rather than PermGen, so pooled strings can be collected.",
      "Interning is occasionally useful for large numbers of repeated runtime-produced strings — but it is not free.",
      "`new String(\"x\")` deliberately allocates a distinct object and has essentially no legitimate use.",
    ],
    related: "string-pool-and-builders",
  },
  {
    id: "stringbuilder",
    category: "memory",
    question: "Why is concatenating strings in a loop slow, and what should you use instead?",
    answer:
      "Because strings are immutable, `result += word` cannot modify anything — it builds a new string containing everything accumulated so far plus the new piece, and discards the old one. Each iteration therefore copies the whole accumulated result, making the total work quadratic in the number of appends. The compiler does optimise each individual expression, but it cannot hoist a builder out of the loop, because the intermediate `String` genuinely exists after each iteration. Use `StringBuilder`, which holds one growable buffer and appends into it, then call `toString()` once at the end. A single concatenation expression is fine as it is.",
    table: {
      columns: ["String", "StringBuilder / StringBuffer"],
      rows: [
        ["Immutable", "Mutable buffer"],
        ["Every change allocates", "Appends into existing capacity"],
        ["Thread-safe by immutability", "`StringBuffer` is synchronized; `StringBuilder` is not"],
        ["Fine for a single expression", "Use when accumulating across iterations"],
      ],
    },
    points: [
      "Pre-size with `new StringBuilder(n)` when you know roughly how much you will write.",
      "`StringBuffer` is rarely wanted — a builder shared across threads is a design problem, not a synchronization problem.",
      "Since Java 9, runtime concatenation compiles via `invokedynamic`, letting the JVM choose the strategy.",
    ],
    related: "string-pool-and-builders",
  },
  // ---------------------------------------------------------------- collections
  {
    id: "arraylist-vs-linkedlist",
    category: "collections",
    question: "When would you use LinkedList instead of ArrayList?",
    answer:
      "Honestly, almost never. The textbook answer is heavy insertion and removal in the middle, where `LinkedList` is O(1) against `ArrayList`'s O(n) shift — but that only holds if you already have an `Iterator` positioned there. If you reach the position by index, walking the chain is O(n) and the advantage is gone. In practice `ArrayList` usually wins anyway: its elements are contiguous, so iteration is cache-friendly and a shift is one bulk memory move, whereas each `LinkedList` node is a separate object with a header and two pointers scattered across the heap. `LinkedList` also implements `Deque`, but `ArrayDeque` is faster for that too. Default to `ArrayList` and switch only with a measurement in hand.",
    table: {
      columns: ["ArrayList", "LinkedList"],
      rows: [
        ["`get(i)` is O(1)", "`get(i)` is O(n) — must walk"],
        ["Append amortised O(1)", "Append O(1)"],
        ["Insert at front O(n)", "Insert at front O(1)"],
        ["Contiguous, cache-friendly", "Scattered nodes, pointer chasing"],
        ["One slot per element", "Header, two pointers and value per element"],
      ],
    },
    points: [
      "`ArrayList` grows by about 50% and copies with `System.arraycopy` — pre-size it when you know the count.",
      "For stacks and queues use `ArrayDeque`, not `LinkedList` and certainly not the legacy `Stack`.",
      "`remove(int)` and `remove(Object)` are different methods — a real hazard with `List<Integer>`.",
    ],
    related: "lists",
  },
  {
    id: "hashmap-internals",
    category: "collections",
    question: "How does HashMap work internally?",
    answer:
      "It is an array of buckets, default 16 and always a power of two. On `put`, the key's `hashCode` is spread with `h ^ (h >>> 16)` — mixing high bits down, because the index is taken as `(capacity - 1) & hash`, which uses only the low bits. That index selects a bucket. If it is empty, a node is stored. If not, the chain is walked, comparing hashes and then `equals`: a match replaces the value, otherwise a node is appended. Since Java 8, a chain reaching 8 entries in a table of at least 64 converts to a red-black tree, bounding the worst case at O(log n) instead of O(n) — which was also a mitigation for hash-collision denial-of-service attacks. When size exceeds capacity times 0.75 the table doubles and entries are redistributed, so `put` is amortised O(1).",
    points: [
      "Capacity is a power of two so the index can be a bitmask rather than a modulo.",
      "The three constants to remember: initial capacity 16, load factor 0.75, treeify threshold 8.",
      "It permits one null key and any number of null values, and is not thread-safe.",
    ],
    related: "hashmap-internals",
  },
  {
    id: "equals-hashcode",
    category: "collections",
    question: "What is the contract between equals and hashCode, and what breaks if you ignore it?",
    answer:
      "The contract is: objects equal by `equals` must return the same `hashCode`; unequal objects may share one; and an object's hash must stay stable while it is used as a key. What breaks is every hash-based collection. `HashMap` and `HashSet` locate entries by hash first, so if you override `equals` alone, two equal objects get identity-based hashes, land in different buckets, and `equals` is never invoked — `contains` returns false for an element that is definitely in the set, and `put` creates a duplicate key. The same failure occurs if a field used in the hash is mutated after insertion, since the collection filed the entry under the old value. The fix in both cases is to derive both methods from the same immutable fields, or to use a record.",
    code: {
      caption: "Overriding only equals loses the element",
      snippet: "Set<Point> set = new HashSet<>();\nset.add(new Point(1, 2));\nset.contains(new Point(1, 2));   // false - different bucket, equals never called",
    },
    points: [
      "Collisions are explicitly allowed and only cost lookup time; the violation is equal objects with different hashes.",
      "Use `Objects.hash(a, b)` for several fields, or the type-specific `hashCode` for one to avoid the array allocation.",
      "A constant `hashCode` is legal and correct — and degrades every bucket to a scan.",
    ],
    related: "object-methods",
  },
  {
    id: "hashmap-vs-hashtable",
    category: "collections",
    question: "How does ConcurrentHashMap differ from Hashtable and Collections.synchronizedMap?",
    answer:
      "`Hashtable` and `synchronizedMap` both take a single lock covering the entire map for every operation, so concurrent readers serialise behind each other and throughput collapses as threads are added. `ConcurrentHashMap` locks at the granularity of a single bin — and only for writes; reads proceed with no locking at all. That means readers never block readers or writers. It also offers atomic compound operations — `putIfAbsent`, `computeIfAbsent`, `merge` — which matters because a check-then-act sequence is a race no matter how thread-safe the individual methods are. Two behavioural differences worth naming: it forbids null keys and values, so a null return unambiguously means absent; and its iterators are weakly consistent rather than fail-fast.",
    table: {
      columns: ["synchronizedMap / Hashtable", "ConcurrentHashMap"],
      rows: [
        ["One lock for the whole map", "Per-bin locking for writes"],
        ["Reads block each other", "Reads never lock"],
        ["Nulls allowed (synchronizedMap)", "No null keys or values"],
        ["Fail-fast iterators", "Weakly consistent iterators"],
        ["Compound operations still race", "`merge` and `computeIfAbsent` are atomic"],
      ],
    },
    related: "concurrent-collections",
  },
  {
    id: "good-hashmap-key",
    category: "collections",
    question: "What makes a good HashMap key?",
    answer:
      "Three things. First, correct `equals` and `hashCode`, overridden together from the same fields — otherwise two logically identical keys land in different buckets and lookups fail. Second, immutability, or at least immutability of the fields the hash uses: the map files an entry by its hash at insertion time and never re-checks, so mutating a key afterwards leaves the entry unreachable by `get` while still counting towards `size()`. Third, a well-distributed hash, so entries spread across buckets instead of collapsing into one. In practice that means `String`, boxed primitives, enums and records are the natural choices, and a mutable entity keyed on changeable fields is what to avoid.",
    points: [
      "`String` caches its hash after first computation, which is part of why it is such a good key.",
      "A mutated key is present in `size()` and visible when iterating, but unreachable by `get` — a genuinely confusing bug.",
      "`TreeMap` keys need `Comparable` or a `Comparator` instead, and use comparison rather than equals.",
    ],
    related: "sets-and-maps",
  },
  {
    id: "comparable-vs-comparator",
    category: "collections",
    question: "What is the difference between Comparable and Comparator?",
    answer:
      "`Comparable` is implemented by the class and defines its single natural ordering through `compareTo(T other)` — it is what `Collections.sort(list)`, `TreeSet` and `TreeMap` use by default. `Comparator` is a separate object defining an ordering for a type through `compare(T a, T b)`, so you can have as many as you like, choose one per call site, and write one for a class you do not control. In modern code you rarely implement either by hand: `Comparator.comparing(...).thenComparing(...)` composes key extractors and handles tie-breaking. Both must obey the same contract — antisymmetric, transitive, consistent — and should ideally agree with `equals`, because a sorted collection treats a zero result as a duplicate.",
    code: {
      caption: "Composition beats a hand-written compare",
      snippet: "employees.sort(Comparator\n        .comparing(Employee::department)\n        .thenComparing(Employee::salary, Comparator.reverseOrder())\n        .thenComparing(Employee::name));",
    },
    points: [
      "Never compare by subtraction — `a - b` overflows and inverts the result for large or opposite-signed values.",
      "Object sorts in Java are stable (TimSort); primitive sorts use dual-pivot quicksort and are not.",
      "'Comparison method violates its general contract!' means the comparator is inconsistent, usually from overflow.",
    ],
    related: "sorting-and-comparators",
  },
  {
    id: "fail-fast",
    category: "collections",
    question: "Why does removing an element inside a for-each loop throw ConcurrentModificationException?",
    answer:
      "The enhanced for loop over a collection compiles into an `Iterator` loop. Collections such as `ArrayList` keep a `modCount` that increments on every structural change, and the iterator records that value when created. Calling `list.remove(...)` bumps the collection's count without touching the iterator's copy, so the next call to `next()` sees a mismatch and fails fast — the design assumes a stale iterator means a bug, and that failing immediately beats returning unpredictable results. The fixes are `Iterator.remove()`, which updates both counters, or `Collection.removeIf(...)` for a simple predicate. Note it is explicitly best-effort: a bug detector, not a guarantee.",
    points: [
      "Despite the name it usually has nothing to do with threads — one thread modifying while iterating is enough.",
      "`ConcurrentHashMap` and `CopyOnWriteArrayList` have weakly consistent iterators and never throw it.",
      "`removeIf` is both clearer and, on `ArrayList`, faster than repeated `remove` calls.",
    ],
    related: "loops",
  },
  {
    id: "generics-why",
    category: "collections",
    question: "What problem do generics solve, and what do they cost?",
    answer:
      "They move type errors from runtime to compile time. Before Java 5, collections held `Object`, so putting the wrong type in was undetectable until a cast blew up somewhere else entirely — often far from the actual mistake. With `List<String>`, the compiler rejects the bad `add` at the line that made the error, and reading elements needs no cast. The secondary benefit is expressiveness: a signature like `<T extends Comparable<T>> T max(List<T>)` documents a real constraint the compiler enforces. The cost is that generics are implemented by erasure for backwards compatibility, so the type information is not present at runtime.",
    points: [
      "Bounded parameters such as `<T extends Number>` both restrict callers and unlock that type's methods inside the body.",
      "A raw type disables generic checking entirely for that reference — use `List<?>` to say 'unknown element type'.",
      "Erasure is why there is no `new T()`, no `T[]`, and no overloading on different type arguments.",
    ],
    related: "generics",
  },
  {
    id: "type-erasure",
    category: "collections",
    question: "What is type erasure and what are its consequences?",
    answer:
      "Erasure means generic type information exists only at compile time. The compiler checks your types, then removes them: each type parameter is replaced by its leftmost bound, or `Object` if unbounded, and casts are inserted at call sites. So `List<String>` and `List<Integer>` are the same class at runtime. It was chosen for migration compatibility — Java 5 generic code had to interoperate with pre-existing compiled libraries in both directions. The consequences are the well-known limitations: no `new T()` or `new T[n]`, no `instanceof` with a type argument, no overloading two methods that differ only in type arguments, and no primitives as type arguments. The usual workaround is to pass a `Class<T>` token so the type is available as a value.",
    code: {
      caption: "One class, whatever the type argument",
      snippet: "new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()   // true",
    },
    points: [
      "Erasure also requires bridge methods so that overriding still works across erased signatures.",
      "It is the reason `IntStream` exists alongside `Stream<Integer>`.",
      "C# made the opposite choice and broke compatibility to get reified generics.",
    ],
    related: "wildcards-and-erasure",
  },
  {
    id: "pecs",
    category: "collections",
    question: "What does PECS mean, and why can't you add to a List of ? extends Number?",
    answer:
      "PECS is 'Producer Extends, Consumer Super'. If a parameter produces values you read, declare it `? extends T`; if it consumes values you write, declare it `? super T`; if it does both, use a plain `T`. You cannot add anything except null to a `List<? extends Number>` because the wildcard means 'some specific but unknown subtype of Number' — the compiler cannot tell whether it is really a `List<Integer>` or a `List<Double>`, so no concrete value is guaranteed to fit. Conversely you can only read `Object` from a `List<? super Integer>`, because it might be a `List<Object>`. The canonical example is in the JDK itself: `Collections.copy(List<? super T> dest, List<? extends T> src)`.",
    points: [
      "Generics are invariant — `List<String>` is not a `List<Object>` — precisely to prevent heap pollution.",
      "Arrays chose covariance instead and pay for it with a runtime check and `ArrayStoreException`.",
      "Applying PECS to your own signatures costs nothing and makes them accept far more caller types.",
    ],
    related: "wildcards-and-erasure",
  },
  {
    id: "array-covariance",
    category: "collections",
    question: "Arrays are covariant and generics are invariant. Why the difference?",
    answer:
      "Covariant means `String[]` is a subtype of `Object[]`, so you can assign one to the other. That is convenient but unsound: through the `Object[]` reference you can attempt to store an `Integer` into what is really a `String[]`. Java accepts this at compile time and throws `ArrayStoreException` at runtime, because arrays carry their component type and the JVM checks every store. Generics are invariant — `List<String>` is not a `List<Object>` — because generic type information is erased, so no runtime check is possible. Invariance moves the error to compile time, and wildcards restore the flexibility safely.",
    related: "arrays",
  },
  {
    id: "treeset-duplicates",
    category: "collections",
    question: "Why might a TreeSet reject an element that equals() says is distinct?",
    answer:
      "Because `TreeSet` and `TreeMap` decide duplicates using `compareTo` or the supplied `Comparator`, not `equals`. If the comparator returns 0 for two elements, the set treats them as the same element regardless of what `equals` says. That is a documented and deliberate deviation from the `Set` contract, and it is why the contract strongly recommends that a natural ordering be consistent with equals. A comparator comparing only string length, for instance, will silently keep just one of 'cat' and 'dog'.",
    code: {
      caption: "Two elements in, one element out",
      snippet: "Set<String> set = new TreeSet<>(Comparator.comparing(String::length));\nset.add(\"cat\");\nset.add(\"dog\");     // compareTo == 0, so treated as already present\nset.size();         // 1",
    },
    related: "sets-and-maps",
  },

  // ----------------------------------------------------------------- exceptions
  {
    id: "checked-vs-unchecked",
    category: "exceptions",
    question: "What is the difference between checked and unchecked exceptions?",
    answer:
      "Structurally: everything under `Exception` is checked except the `RuntimeException` subtree, and `Error` is unchecked too. Checked means the compiler requires each one to be caught or declared in the `throws` clause. The intended distinction is recoverability — a checked exception is a condition a caller might reasonably handle, like a missing file, whereas an unchecked one signals a programming error, like passing null. In practice I use unchecked for anything caused by a bug and reserve checked exceptions for genuine decision points where a caller has an alternative action. The criticism is real: checked exceptions leak through every layer, cannot propagate through lambdas, and are often rethrown mechanically, which is why frameworks like Spring translate them to unchecked at the boundary.",
    code: {
      caption: "The hierarchy decides it, not how far down you are",
      snippet: "Throwable\n |-- Error                    unchecked  (OutOfMemoryError, StackOverflowError)\n |-- Exception                CHECKED    (IOException, SQLException)\n       |-- RuntimeException   unchecked  (NullPointerException, IllegalArgumentException)",
    },
    points: [
      "An overriding method may narrow the checked exceptions it declares, never widen them.",
      "`throws Exception` tells a caller nothing and forces them to catch every runtime exception too.",
      "`Error` should never be caught, which is the main argument against `catch (Throwable)`.",
    ],
    related: "checked-vs-unchecked",
  },
  {
    id: "finally-always",
    category: "exceptions",
    question: "Does finally always execute?",
    answer:
      "In practice yes, and that is what you should rely on: it runs whether the `try` completes normally, throws, or returns — the return value is computed first, then `finally` runs, then the method returns. The genuine exceptions are cases where the JVM never gets the chance: `System.exit()`, a fatal JVM error or crash, the thread being killed at OS level, or an infinite loop or deadlock inside the `try`. There is also a trap worth naming: a `return` or `throw` inside a `finally` block replaces whatever the `try` was doing, silently discarding the original return value or exception — which is why static analysers flag it.",
    code: {
      caption: "The return value is held, then finally runs",
      snippet: "static int compute() {\n    try { return 1; }\n    finally { System.out.println(\"finally\"); }\n}\n// prints \"finally\", then returns 1",
    },
    related: "exceptions-basics",
  },
  {
    id: "try-with-resources",
    category: "exceptions",
    question: "How does try-with-resources work, and what problem does it solve?",
    answer:
      "Any resource declared in the parentheses must implement `AutoCloseable`, and the compiler generates a `finally` block that calls `close()` on each one — in reverse declaration order, on every exit path. It solves two problems with the old try/finally idiom. First, verbosity and forgetfulness: the null check and the nested try/catch around `close()` were easy to get wrong and easy to omit. Second, exception masking: if the body threw and then `close()` also threw, the old pattern propagated the close exception and silently lost the one that actually explained the failure. try-with-resources propagates the body's exception and attaches the close exception via `addSuppressed`, so both appear in the stack trace.",
    code: {
      caption: "Reverse order closing, which is exactly what you want",
      snippet: "try (Connection conn = dataSource.getConnection();\n     PreparedStatement stmt = conn.prepareStatement(SQL);\n     ResultSet rs = stmt.executeQuery()) {\n    ...\n}   // rs closed, then stmt, then conn",
    },
    points: [
      "You can use it for your own types — a timer, a lock, an MDC context — by implementing `AutoCloseable`.",
      "Since Java 9 an already-final variable can be used directly: `try (reader) { ... }`.",
      "Streams from `Files.lines`, `list`, `walk` and `find` hold file handles and must be closed this way.",
    ],
    related: "custom-exceptions-and-resources",
  },
  {
    id: "suppressed-exceptions",
    category: "exceptions",
    question: "What is a suppressed exception?",
    answer:
      "When a try-with-resources block throws and the automatic `close()` also throws, the body's exception is the one propagated — because it is the one that explains what went wrong — and the close failure is attached to it via `addSuppressed`. You retrieve them with `getSuppressed()`, and they appear in the stack trace under a 'Suppressed:' heading. This exists because the old try/finally pattern did the opposite: the close exception replaced the primary one, so you were left with a message about a file handle and no information about the actual failure.",
    related: "custom-exceptions-and-resources",
  },
  {
    id: "custom-exception-design",
    category: "exceptions",
    question: "How do you design a good custom exception?",
    answer:
      "Extend `RuntimeException` for programming errors and `Exception` when the caller has a real recovery path. Always provide a constructor that takes a `Throwable` cause, and always use it when wrapping — losing the cause is the most expensive mistake in exception design, because you only discover it during an incident, when the trace says a query failed but nothing about why. Carry structured data as fields rather than encoding it in the message, so a handler that needs the shortfall does not have to parse it out of a string. Name the exception after the condition, such as `InsufficientFundsException`, not after the class that failed, and keep the hierarchy shallow so callers can choose their granularity.",
    related: "custom-exceptions-and-resources",
  },

  // --------------------------------------------------------------------- modern
  {
    id: "functional-interface",
    category: "modern",
    question: "What is a functional interface?",
    answer:
      "An interface with exactly one abstract method — default, static, private and `Object`-overriding methods do not count. Java needs the concept because there is no standalone function type in the language: a lambda has to be an instance of something, and the single abstract method is what gives the lambda its parameter types and return type. That is also why lambdas are target-typed — the same lambda text can be a `Predicate<String>` or a `Function<String, Boolean>` depending on what is expected. `@FunctionalInterface` is optional but worth applying, because it makes the compiler enforce the constraint rather than letting someone break every implementing lambda by adding a second method.",
    table: {
      columns: ["Interface", "Method and shape"],
      rows: [
        ["`Function<T,R>`", "`R apply(T)` — transform"],
        ["`Predicate<T>`", "`boolean test(T)` — filter"],
        ["`Consumer<T>`", "`void accept(T)` — side effect"],
        ["`Supplier<T>`", "`T get()` — produce"],
        ["`UnaryOperator<T>`", "`T apply(T)` — a Function where in and out match"],
      ],
    },
    points: [
      "Primitive specialisations like `IntPredicate` exist because a type argument can never be a primitive.",
      "The combinators — `andThen`, `compose`, `and`, `or`, `negate` — are default methods on these interfaces.",
      "`f.andThen(g)` runs f first; `f.compose(g)` runs g first.",
    ],
    related: "functional-interfaces",
  },
  {
    id: "lambda-vs-anonymous",
    category: "modern",
    question: "How does a lambda differ from an anonymous inner class?",
    answer:
      "Four differences that matter. Scope: a lambda does not introduce a new scope, so `this` refers to the enclosing instance and you cannot shadow an enclosing variable; an anonymous class has its own `this` and can shadow freely. Compilation: an anonymous class produces a separate class file and a new object at every evaluation, whereas a lambda compiles to an `invokedynamic` instruction linked by `LambdaMetafactory` — a non-capturing lambda is typically instantiated once and reused, so it can allocate nothing. Applicability: a lambda requires a functional interface; an anonymous class works with any interface or class and can hold state. Readability: a lambda is an expression. Both capture effectively-final locals by value.",
    related: "lambdas",
  },
  {
    id: "effectively-final",
    category: "modern",
    question: "Why must a local variable captured by a lambda be effectively final?",
    answer:
      "Because the capture is by value, not by reference. Local variables live in the enclosing method's stack frame, which disappears when the method returns — but the lambda may outlive it, so the compiler copies the value into the capturing instance. If the variable could then be reassigned, you would have two copies that silently disagree, and it would be impossible to say which one the variable means. Requiring it to be effectively final — assigned once, never reassigned — makes the copy indistinguishable from the original. Fields have no such restriction because they live on the heap and are read through the object reference each time.",
    points: [
      "The classic workaround is a one-element array or an `AtomicInteger` — usually a sign the code wants restructuring.",
      "The same rule applies to local and anonymous classes, for the same reason.",
      "'Effectively final' means it could be declared final without changing anything, not that it is declared final.",
    ],
    related: "lambdas",
  },
  {
    id: "intermediate-vs-terminal",
    category: "modern",
    question: "What is the difference between intermediate and terminal stream operations?",
    answer:
      "Intermediate operations — `filter`, `map`, `sorted`, `limit` — return a new `Stream` and are lazy: calling one performs no work, it just adds a stage to the pipeline. Terminal operations — `collect`, `forEach`, `count`, `findFirst`, `reduce` — produce a result or a side effect and are what actually drive execution. The distinction matters for three reasons. A pipeline with no terminal operation does nothing at all, silently. Laziness enables short-circuiting, so `findFirst` after a `filter` can stop after a handful of elements, and it makes infinite streams usable with `limit`. And elements are pushed through the whole pipeline one at a time rather than stage by stage, so no intermediate collections are allocated — except for stateful operations such as `sorted` and `distinct`, which must buffer.",
    points: [
      "A stream is single-use: reusing one throws `IllegalStateException`.",
      "`peek` may not run for every element, which is why it is a debugging tool and not a place for side effects.",
      "Accumulate with `collect` or `toList`, never by mutating an external collection from `forEach`.",
    ],
    related: "streams",
  },
  {
    id: "map-vs-flatmap",
    category: "modern",
    question: "What is the difference between map and flatMap?",
    answer:
      "`map` is one-to-one: each element is transformed into exactly one new element, so a stream of n elements stays a stream of n elements. `flatMap` is one-to-many followed by flattening: the mapper returns a stream for each element, and those streams are concatenated into a single flat stream. So mapping a list of orders to their item lists with `map` gives you a `Stream<List<Item>>`, whereas `flatMap` gives you a `Stream<Item>`. The same distinction applies to `Optional.map` versus `Optional.flatMap`: use flatMap when the mapper itself returns an `Optional`, or you end up with a nested Optional.",
    code: {
      caption: "Flattening nested structure",
      snippet: "orders.stream().map(Order::items)                   // Stream<List<Item>>\norders.stream().flatMap(o -> o.items().stream())    // Stream<Item>",
    },
    related: "streams",
  },
  {
    id: "optional-purpose",
    category: "modern",
    question: "What problem does Optional solve, and how is it commonly misused?",
    answer:
      "It makes the possibility of no result part of a method's type, so a caller cannot overlook it the way they can overlook a null return. It also composes: `map`, `flatMap`, `filter` and `orElseThrow` flatten nested null checks into a chain. The misuses are well known. As a field — it is not `Serializable` and adds an allocation per instance. As a parameter — the caller must wrap, and can still pass a null Optional, so you have added ceremony without safety. Inside a collection — an empty list already expresses absence. And calling `get()` after `isPresent()`, which is a null check with extra steps. It was designed for one job: a return type where no result is a normal outcome.",
    points: [
      "`orElse` evaluates its argument eagerly even when the Optional is present; `orElseGet` defers it.",
      "Prefer `orElseThrow(() -> new MeaningfulException(...))` to `get()`.",
      "`Optional.stream()` (Java 9) makes it compose with the Streams API.",
    ],
    related: "optional",
  },
  {
    id: "orelse-vs-orelseget",
    category: "modern",
    question: "What is the difference between orElse and orElseGet?",
    answer:
      "`orElse` takes a value, so its argument is evaluated before the call happens — regardless of whether the Optional is present. `orElseGet` takes a `Supplier` and only invokes it when the Optional is empty. With a constant the difference is invisible, but `Optional.of(cached).orElse(loadFromDatabase())` runs that query on every call and throws the result away. The rule of thumb: `orElse` for a constant, `orElseGet` for anything that costs something or has a side effect.",
    related: "optional",
  },
  {
    id: "groupingby",
    category: "modern",
    question: "How does Collectors.groupingBy work, and what is a downstream collector?",
    answer:
      "`groupingBy` takes a classifier function, applies it to every element, and builds a `Map` from each distinct classifier result to the elements that produced it. With one argument the values are `List`s, because the default downstream collector is `toList()`. The second argument lets you replace that: `counting()` gives group sizes, `summingLong(...)` gives totals, `mapping(fn, toList())` transforms elements before collecting, and another `groupingBy` produces a nested map. A three-argument form additionally takes a map factory, so you can get a `TreeMap` for sorted keys. The downstream mechanism is what makes collectors compose — each one is a supplier, accumulator, combiner and finisher, so they nest arbitrarily and still work in parallel.",
    code: {
      caption: "Classifier plus downstream",
      snippet: "Map<Status, Long> countByStatus = orders.stream()\n        .collect(groupingBy(Order::status, counting()));\n\nMap<String, Map<Status, List<Order>>> nested = orders.stream()\n        .collect(groupingBy(Order::customerId, groupingBy(Order::status)));",
    },
    points: [
      "`partitioningBy` is the boolean special case and always populates both true and false keys.",
      "`toMap` throws `IllegalStateException` on duplicate keys without a merge function, and NPE on null values.",
      "`collectingAndThen` post-processes a result — making lists immutable, or unwrapping an Optional.",
    ],
    related: "collectors",
  },
  {
    id: "sealed-classes",
    category: "modern",
    question: "What are sealed classes and what do they enable?",
    answer:
      "A `sealed` class or interface declares a `permits` clause listing exactly which types may extend or implement it; each of those must itself be `final`, `sealed`, or explicitly `non-sealed`. It sits between `final` and open inheritance, letting an API author allow extension while keeping the set of subtypes known. The real payoff is for the compiler: with a closed hierarchy it can verify that a switch covers every case, so a switch expression over a sealed type needs no `default` — and adding a new permitted subtype breaks every switch that has not been updated, at compile time. Combined with records and pattern matching, that gives Java algebraic data types.",
    code: {
      caption: "Exhaustive without a default branch",
      snippet: "sealed interface Shape permits Circle, Rectangle { }\nrecord Circle(double radius) implements Shape { }\nrecord Rectangle(double w, double h) implements Shape { }\n\ndouble area(Shape s) {\n    return switch (s) {\n        case Circle(double r) -> Math.PI * r * r;\n        case Rectangle(double w, double h) -> w * h;\n    };\n}",
    },
    related: "modern-syntax",
  },
  {
    id: "localdatetime-vs-instant",
    category: "modern",
    question: "What is the difference between LocalDateTime, ZonedDateTime and Instant?",
    answer:
      "`LocalDateTime` is a date and a time with no zone, so it does not identify a unique moment — 2026-08-20 09:00 is a different instant in Tokyo than in London. It is right when the zone genuinely does not matter, like a shop's opening time. `ZonedDateTime` adds a `ZoneId`, so it does identify a moment and understands daylight-saving rules including gaps and overlaps — use it when you must schedule or display local wall-clock time. `Instant` is a point on the UTC timeline with no calendar concepts; it is what you persist, log and compare, because it is unambiguous everywhere. The usual architecture is to store `Instant`, convert to `ZonedDateTime` at the edges, and keep the originating zone alongside if you need the user's local time back.",
    points: [
      "`Duration` is exact elapsed time; `Period` is calendar time — they differ across daylight-saving boundaries.",
      "All `java.time` types are immutable and thread-safe, unlike `Date` and `SimpleDateFormat`.",
      "`plusDays(1)` and `plus(Duration.ofDays(1))` can differ by an hour, and both are correct answers to different questions.",
    ],
    related: "date-and-time",
  },

  // ----------------------------------------------------------------- concurrency
  {
    id: "start-vs-run",
    category: "concurrency",
    question: "What is the difference between calling start() and run() on a Thread?",
    answer:
      "`run()` is an ordinary method call: the body executes on the current thread and nothing concurrent happens at all. `start()` asks the JVM to create a new thread, which then calls `run()`. It is the most common beginner mistake in Java concurrency precisely because it fails silently — the code works, just sequentially. A thread object is also not reusable: calling `start()` twice throws `IllegalThreadStateException`.",
    points: [
      "Prefer implementing `Runnable` to extending `Thread` — the task stays separate from the mechanism.",
      "In practice, prefer an `ExecutorService` to creating threads by hand at all.",
      "`setDaemon(true)` must be called before `start()`, and daemon threads do not keep the JVM alive.",
    ],
    related: "threads",
  },
  {
    id: "stop-a-thread",
    category: "concurrency",
    question: "How do you stop a running thread?",
    answer:
      "You ask it to stop; you cannot make it. `Thread.stop()` existed, was deprecated almost immediately and is now removed, because it threw an asynchronous exception at an arbitrary point — potentially while the thread held a lock with a shared object half-updated. The supported mechanism is interruption: `thread.interrupt()` sets a flag, and the thread is expected to check `Thread.currentThread().isInterrupted()` in its loop and return cleanly. Blocking methods like `sleep`, `wait` and `join` respond by throwing `InterruptedException` — which clears the flag, so a handler must either restore it with `Thread.currentThread().interrupt()` and stop, or let the exception propagate. Swallowing it is the classic bug: the cancellation request disappears and shutdown hangs.",
    code: {
      caption: "Restoring the flag",
      snippet: "try {\n    Thread.sleep(1000);\n} catch (InterruptedException e) {\n    Thread.currentThread().interrupt();   // restore\n    return;                               // and actually stop\n}",
    },
    related: "threads",
  },
  {
    id: "synchronized-vs-volatile",
    category: "concurrency",
    question: "What is the difference between synchronized and volatile?",
    answer:
      "They solve different halves of the problem. `volatile` guarantees visibility and ordering for a single field: every read sees the most recent write, and reads and writes are not reordered across it. It does not provide atomicity, so a `volatile int` incremented with `count++` is still a race, because the read and the write are separate steps another thread can interleave between. `synchronized` provides mutual exclusion as well as visibility: only one thread holds the monitor at a time, and releasing it happens-before the next acquisition. So: `volatile` for a flag one thread publishes and others read; `synchronized`, a `Lock`, or an atomic class for anything that reads a value and writes back a value derived from it.",
    table: {
      columns: ["volatile", "synchronized"],
      rows: [
        ["Visibility and ordering", "Visibility, ordering and mutual exclusion"],
        ["No blocking", "Threads block waiting for the monitor"],
        ["One field", "A block or method"],
        ["`count++` still races", "`count++` is safe"],
      ],
    },
    points: [
      "Atomics sit between them: lock-free atomicity for one variable via hardware compare-and-swap.",
      "Without a happens-before edge the JIT may hoist a field read out of a loop, producing an infinite spin.",
      "`synchronized` is reentrant, so a thread can re-acquire a lock it already holds.",
    ],
    related: "synchronization",
  },
  {
    id: "count-not-atomic",
    category: "concurrency",
    question: "Why is count++ not thread-safe?",
    answer:
      "Because it is three operations, not one: read the current value, add one, write it back. Two threads can both read 5, both compute 6, and both write 6 — two increments, one net change. That is a lost update, and it becomes more frequent the more contention there is. Any of three fixes works: wrap it in a `synchronized` block or a `ReentrantLock` so the sequence is indivisible; use `AtomicInteger.incrementAndGet()`, which performs the whole read-modify-write atomically via compare-and-swap; or use `LongAdder` under very high contention, which spreads updates across cells and sums them on demand.",
    points: [
      "Making the field `volatile` does not help — it fixes visibility, not the interleaving.",
      "The same shape appears in check-then-act, which is a race even on a ConcurrentHashMap.",
      "`computeIfAbsent`, `merge` and `putIfAbsent` exist to make those sequences atomic.",
    ],
    related: "synchronization",
  },
  {
    id: "deadlock",
    category: "concurrency",
    question: "What is a deadlock and how do you prevent it?",
    answer:
      "A deadlock is two or more threads each holding a lock the other needs, so none can proceed and none will time out. The classic case is two locks acquired in opposite orders: thread one holds A and wants B, thread two holds B and wants A. The four necessary conditions are mutual exclusion, hold-and-wait, no preemption, and circular wait — breaking any one prevents it. The practical fix is to break circular wait by always acquiring locks in the same global order. Alternatives are `tryLock` with a timeout so a thread can back off and retry, or restructuring so only one lock is needed. To diagnose one, take a thread dump with `jstack`: it detects and reports deadlocks explicitly, naming the threads and the monitors involved.",
    related: "synchronization",
  },
  {
    id: "executor-benefits",
    category: "concurrency",
    question: "Why use an ExecutorService instead of creating threads directly?",
    answer:
      "Because a thread is expensive — roughly a megabyte of stack plus an OS scheduling entity — and creating one per task puts no ceiling on how many exist, so a burst of work can exhaust memory. A pool reuses a fixed set of threads pulling from a queue, which caps concurrency, amortises creation cost, and separates the work from the machinery running it. It also gives you a `Future` for each task, lifecycle control through `shutdown` and `shutdownNow`, and a single place to configure queueing and rejection. One caveat: `Executors.newFixedThreadPool` uses an unbounded queue, so under sustained overload the queue grows until the heap is exhausted — construct `ThreadPoolExecutor` directly with a bounded queue and a rejection policy for anything production-facing.",
    points: [
      "A task submitted with `submit()` that throws is silent unless someone calls `get()`; `execute()` reaches the uncaught handler.",
      "Always shut the pool down — a non-daemon pool keeps the JVM alive indefinitely.",
      "Since Java 19 `ExecutorService` is `AutoCloseable`, so try-with-resources shuts it down and waits.",
    ],
    related: "executors-and-futures",
  },
  {
    id: "future-vs-completablefuture",
    category: "concurrency",
    question: "What is the difference between Future and CompletableFuture?",
    answer:
      "`Future` is a handle on a result that may not exist yet, and its only way to obtain that result is `get()`, which blocks. You can check `isDone()` or cancel it, but you cannot say 'when this completes, do that' — so composing two asynchronous operations means a thread sitting idle. `CompletableFuture` implements `Future` and adds a callback-based, composable API: `thenApply` to transform, `thenCompose` to chain another async call, `thenCombine` to merge two independent futures, `allOf` and `anyOf` to wait on many, and `exceptionally` or `handle` for errors. It can also be completed manually with `complete()`, making it a bridge from callback-based APIs.",
    code: {
      caption: "Two calls running concurrently, combined without blocking",
      snippet: "CompletableFuture<Profile> profile = supplyAsync(() -> loadProfile(id));\nCompletableFuture<Orders> orders = supplyAsync(() -> loadOrders(id));\nCompletableFuture<Dashboard> dash = profile.thenCombine(orders, Dashboard::new);",
    },
    points: [
      "`thenApply` versus `thenCompose` is the same distinction as `map` versus `flatMap`.",
      "Pass an explicit executor rather than relying on the common ForkJoinPool for blocking work.",
    ],
    related: "executors-and-futures",
  },
  {
    id: "virtual-threads",
    category: "concurrency",
    question: "What are virtual threads and what problem do they solve?",
    answer:
      "Virtual threads, finalised in Java 21, are threads managed by the JVM rather than the operating system. A platform thread costs about a megabyte of stack and an OS scheduling entity, so thread-per-request stopped scaling and the industry moved to asynchronous, callback-heavy code that is much harder to read and debug. A virtual thread starts at a few hundred bytes and is mounted onto a carrier thread only while running — when it blocks on I/O it is unmounted and the carrier picks up another task. The practical effect is that simple blocking code scales like asynchronous code, and thread-per-request becomes viable again with millions of threads.",
    points: [
      "Do not pool virtual threads — create one per task; `Executors.newVirtualThreadPerTaskExecutor()` does exactly that.",
      "They do not make CPU-bound work faster; there are still only N cores.",
      "`synchronized` blocks could pin a virtual thread to its carrier — improved in later releases, but `ReentrantLock` is the safe choice.",
    ],
    related: "concurrent-collections",
  },
  {
    id: "concurrent-compound",
    category: "concurrency",
    question: "If ConcurrentHashMap is thread-safe, why is check-then-put still a bug?",
    answer:
      "Because thread safety is per method, not per sequence. Between the `containsKey` check and the `put`, another thread can run exactly the same code, so both see the key as absent, both compute a value, and one silently overwrites the other. Every individual call is atomic; the pair is not. That is precisely why `putIfAbsent`, `computeIfAbsent` and `merge` exist — each performs the whole read-modify-write as one atomic operation. The same trap applies to any collection wrapped with `Collections.synchronizedMap`, and there iteration additionally needs external locking.",
    code: {
      caption: "Two calls versus one",
      snippet: "if (!map.containsKey(k)) map.put(k, compute());     // race\nmap.computeIfAbsent(k, key -> compute());          // atomic",
    },
    related: "concurrent-collections",
  },

  // ------------------------------------------------------------------ practical
  {
    id: "debug-memory",
    category: "practical",
    question: "How would you investigate a Java service using too much memory?",
    answer:
      "First establish whether it is a leak or just load: enable GC logging with `-Xlog:gc` or run `jcmd <pid> GC.heap_info` and look at whether used heap drops after full collections. Steadily climbing usage that survives GC means objects are still reachable, which is a leak; high but stable usage means the application genuinely needs that much. For a leak, take a heap dump with `jmap -dump:live,format=b,file=heap.hprof <pid>` and open it in Eclipse MAT. The dominator tree shows which objects retain the most memory, and the path to GC root for the biggest retainer identifies the reference that should not exist. In my experience that is almost always a static collection with no eviction, unremoved listeners, a `ThreadLocal` on a pooled thread, or an inner class pinning its enclosing instance.",
    points: [
      "Increasing `-Xmx` only postpones a leak — it is a diagnostic step, not a fix.",
      "`jps -l` first, to find the process id.",
      "For a live look without a dump, `jcmd <pid> GC.class_histogram` shows instance counts by class.",
    ],
    related: "java-best-practices",
  },
  {
    id: "debug-deadlock",
    category: "practical",
    question: "A production service has stopped responding but the CPU is idle. How do you diagnose it?",
    answer:
      "Idle CPU with no progress points at blocking rather than a busy loop, so the first step is a thread dump: `jstack <pid>`, or `jcmd <pid> Thread.print`, taken two or three times a few seconds apart so you can see what is stuck versus what is merely slow. Look for threads in `BLOCKED` state and read which monitor they are waiting on — many threads blocked on the same lock is contention, and `jstack` explicitly reports a deadlock section if it finds a cycle. Threads in `WAITING` on a connection pool or queue suggest resource exhaustion rather than a lock. If everything is waiting on an external call, the problem is downstream, and the fix is usually timeouts and a circuit breaker rather than anything in your code.",
    points: [
      "Compare two dumps: threads on the same stack frame in both are genuinely stuck.",
      "A full thread pool with a full queue looks identical to a hang from the outside.",
      "Always set timeouts on external calls — an unbounded wait turns one slow dependency into an outage.",
    ],
    related: "java-best-practices",
  },
  {
    id: "dependency-conflict",
    category: "practical",
    question: "Your build compiles but throws NoSuchMethodError at runtime. What happened?",
    answer:
      "You compiled against one version of a library and ran against a different one. This is almost always a transitive dependency conflict: two of your dependencies each require a different version of the same library, only one can be on the classpath, and the build tool picked the one that lacks the method you compiled against. Maven resolves conflicts by nearest-wins — fewest steps from your project — while Gradle picks the highest version, and both are heuristics rather than correct answers. Diagnose with `mvn dependency:tree -Dverbose` or `./gradlew dependencies`, find which version won and why, then pin it explicitly with `dependencyManagement`, a BOM, or a Gradle constraint.",
    points: [
      "`NoClassDefFoundError` has the same root cause and the same diagnosis.",
      "The classpath is searched in order and first-match-wins, silently, which is why duplicate classes are so confusing.",
      "A BOM is the cleanest fix when a whole family of libraries must stay in step.",
    ],
    related: "build-tools",
  },
  {
    id: "good-unit-test",
    category: "practical",
    question: "What makes a good unit test?",
    answer:
      "It tests one behaviour, and its name says which — so a failure identifies the bug without anyone opening the file. It is independent: no shared mutable state and no reliance on running after another test, which is why JUnit 5 builds a fresh instance per method. It is deterministic: no real clock, no network, no random values, no ordering assumptions over a `HashMap`. It actually asserts something specific rather than merely confirming nothing threw. And it is fast, because a suite people wait for is a suite people stop running. The structure that gets you most of this is arrange-act-assert with a single act.",
    points: [
      "Mock what is slow, external or non-deterministic — never the class under test, and not value objects.",
      "`assertEquals` takes expected first; getting it backwards makes every failure message misleading.",
      "Coverage measures which lines ran, not whether anything was verified — a smell detector, not a goal.",
    ],
    related: "testing-with-junit",
  },
  {
    id: "slow-code",
    category: "practical",
    question: "A method is too slow. How do you approach it?",
    answer:
      "In order: first check the algorithm and data structures, because turning a quadratic nested scan into a map lookup beats every micro-optimisation combined — the classic case is calling `list.contains` inside a loop when a `HashSet` would make it O(1). Second, see whether the work can be avoided entirely: cache, batch, filter earlier in the pipeline, or fetch less. Third, measure before changing anything else, with a profiler or JMH — and with a warm-up, because timing the first few runs measures the interpreter rather than the JIT-compiled code. Only then optimise the hot path. Most slow Java turns out to be an N+1 query, an unindexed lookup, or an accidental quadratic loop rather than anything about the language.",
    code: {
      caption: "The accidental quadratic loop",
      snippet: "for (Order o : orders)\n    if (customerList.contains(o.customerId())) { ... }    // O(n) inside O(n)\n\nSet<String> customers = new HashSet<>(customerList);      // once\nfor (Order o : orders)\n    if (customers.contains(o.customerId())) { ... }       // O(1) each",
    },
    related: "java-best-practices",
  },
  {
    id: "immutability-benefits",
    category: "practical",
    question: "Why prefer immutable objects?",
    answer:
      "Four concrete benefits. Thread safety for free: an object that never changes can be shared between any number of threads with no synchronisation. Safe sharing: you can hand one to another method without defensive copies, because nobody can alter it behind your back. Valid by construction: if the constructor enforces the invariants and nothing can change afterwards, the object is correct for its whole life. And usable as a map key, since the hash cannot drift. The cost is allocating a new object per change, which is usually irrelevant and occasionally matters — that is when you introduce a mutable builder or a mutable internal representation with a narrow window.",
    points: [
      "Records make immutable value types a one-liner — but only shallowly, so copy mutable components defensively.",
      "`final` on a field prevents reassignment, not mutation of the object it points at.",
      "`java.time` and `String` are immutable for exactly these reasons.",
    ],
    related: "records",
  },
  // ------------------------------------------------------------- extra concepts
  {
    id: "method-reference-vs-lambda",
    category: "modern",
    question: "What is a method reference, and when is it better than a lambda?",
    answer:
      "A method reference is shorthand for a lambda that does nothing but call one existing method. `String::length` is exactly `s -> s.length()`, and `System.out::println` is exactly `x -> System.out.println(x)`. Use one when the lambda only forwards its argument straight to a method — it reads better and says the intent plainly. Write the lambda instead the moment the body does anything else, even a null check or reordering the arguments, because contorting code to fit a method reference is a poor trade.",
    table: {
      columns: ["Kind", "Example — and the lambda it replaces"],
      rows: [
        ["Static method", "`Integer::parseInt`  ⇢  `s -> Integer.parseInt(s)`"],
        ["Instance of a specific object", "`out::println`  ⇢  `x -> out.println(x)`"],
        ["Instance of an arbitrary object", "`String::toUpperCase`  ⇢  `s -> s.toUpperCase()`"],
        ["Constructor", "`ArrayList::new`  ⇢  `() -> new ArrayList<>()`"],
      ],
    },
    points: [
      "The third kind is the surprising one: the receiver becomes the first argument.",
      "Both compile the same way — a method reference is not faster, just shorter.",
    ],
    related: "lambdas",
  },
  {
    id: "lambda-checked-exception",
    category: "modern",
    question: "Can a lambda throw a checked exception?",
    answer:
      "Only if the functional interface's single abstract method declares it. `Runnable.run()` and `Function.apply()` declare no checked exceptions, so a lambda targeting them cannot let one escape — which is exactly why `stream().map(...)` is awkward around `IOException`. The usual options are to catch and wrap the checked exception in an unchecked one inside the lambda, to declare your own functional interface whose method `throws` the checked type, or to extract a helper method that handles it. A lambda is not a new kind of method with its own rules: it must honour the `throws` clause of the interface it implements.",
    code: {
      caption: "The stream that won't compile, and the wrap that fixes it",
      snippet: `// paths.stream().map(Files::readString)  // won't compile: readString throws IOException

paths.stream().map(p -> {
    try { return Files.readString(p); }
    catch (IOException e) { throw new UncheckedIOException(e); }
}).toList();`,
    },
    related: "lambdas",
  },
  {
    id: "deep-vs-shallow-copy",
    category: "memory",
    question: "What is the difference between a shallow copy and a deep copy?",
    answer:
      "A shallow copy makes a new outer object but reuses the same nested objects — the two copies share whatever their fields point at, so mutating a nested object through one copy is visible through the other. A deep copy duplicates the whole graph, so the copy is fully independent and no change to it can ever reach the original. `array.clone()`, `new ArrayList<>(other)` and a record's default copy are all shallow: you get new slots holding the same objects. The distinction only matters when the elements are mutable — for a list of `String` or a record of immutable components, shallow and deep are indistinguishable, which is another reason to prefer immutable types.",
    code: {
      caption: "Shallow copy shares the inner object",
      snippet: `List<StringBuilder> original = List.of(new StringBuilder("a"));
List<StringBuilder> shallow = new ArrayList<>(original);   // new list, same builders

shallow.get(0).append("X");            // mutating the shared inner object...
original.get(0);                       // ...is visible here too: "aX"`,
    },
    points: [
      "To deep-copy you copy each element yourself, or serialize and deserialize the whole graph.",
      "`clone()` on an array of objects is shallow — new array, same element references.",
      "Immutable elements make the whole question disappear.",
    ],
    related: "arrays",
  },

  // -------------------------------------------------------- stream coding problems
  {
    id: "second-largest",
    category: "coding",
    question: "Find the second largest number in a list with streams.",
    answer:
      "Drop duplicates first, then sort descending, skip one, and take what is left. The `distinct()` is the part interviewers watch for: without it, `[40, 40, 30]` returns 40 as the 'second largest', because you have merely skipped the first copy of the top value. Keep the result as an `Optional` — the list might have fewer than two distinct values — and never call `.get()` blindly. Sorting is O(n log n); if it matters, a single O(n) pass tracking the top two beats it.",
    code: {
      caption: "The distinct() matters",
      snippet: `List<Integer> nums = List.of(10, 40, 40, 30, 20);

Optional<Integer> secondLargest = nums.stream()
        .distinct()                        // drop the duplicate 40s FIRST
        .sorted(Comparator.reverseOrder())
        .skip(1)
        .findFirst();                      // empty if fewer than 2 distinct values

secondLargest.ifPresent(System.out::println);   // 30`,
    },
    points: [
      "Without distinct(), duplicated top values make skip(1) return the largest again.",
      "findFirst() returns an Optional — handle the 'too short' case rather than calling get().",
    ],
    related: "streams",
  },
  {
    id: "sort-by-field",
    category: "coding",
    question: "Sort a list of employees by a field, with a tie-breaker.",
    answer:
      "Build the ordering with `Comparator.comparing(getter)`, add `.reversed()` for descending and `.thenComparing(...)` for tie-breaks. Then decide in place or new list: `list.sort(cmp)` and `Collections.sort(list, cmp)` mutate the original, while `stream().sorted(cmp).toList()` leaves it untouched and returns a new one. Never write a subtraction comparator like `(a, b) -> a.getSalary() - b.getSalary()` — it overflows for large or opposite-signed values and inverts the order.",
    code: {
      caption: "Compose the comparator; choose in-place or new list",
      snippet: `// In place, ascending by name
emps.sort(Comparator.comparing(Emp::getName));

// Descending by salary, then by name to break ties
emps.sort(Comparator.comparing(Emp::getSalary).reversed()
                    .thenComparing(Emp::getName));

// New list, original untouched
List<Emp> sorted = emps.stream()
        .sorted(Comparator.comparing(Emp::getName))
        .toList();`,
    },
    points: [
      "`comparingInt`/`comparingLong`/`comparingDouble` avoid boxing for primitive keys.",
      "Object sorts are stable, so a second sort preserves the first's order within ties.",
    ],
    related: "sorting-and-comparators",
  },
  {
    id: "elements-appearing-once",
    category: "coding",
    question: "Find the numbers that appear exactly once, keeping input order.",
    answer:
      "Count occurrences with `groupingBy(identity(), counting())`, then filter the entries whose count is 1 and take their keys. The detail that matters is the map factory: plain `groupingBy` produces an unordered `HashMap`, so pass `LinkedHashMap::new` if the output must follow first-seen order. For `[1, 2, 3, 2, 4, 3]` this yields `[1, 4]`.",
    code: {
      caption: "LinkedHashMap::new preserves first-seen order",
      snippet: `List<Integer> nums = List.of(1, 2, 3, 2, 4, 3);

List<Integer> once = nums.stream()
        .collect(Collectors.groupingBy(Function.identity(),
                 LinkedHashMap::new, Collectors.counting()))
        .entrySet().stream()
        .filter(e -> e.getValue() == 1)
        .map(Map.Entry::getKey)
        .toList();                          // [1, 4]`,
    },
    points: [
      "Change the filter to `> 1` to get the duplicates instead.",
      "Default groupingBy is a HashMap — order is not guaranteed without the factory.",
    ],
    related: "collectors",
  },
  {
    id: "frequency-map",
    category: "coding",
    question: "Build a frequency map, and list only the duplicates with their counts.",
    answer:
      "`groupingBy(identity(), counting())` gives you a `Map` from each value to how many times it appeared, in one line. To keep only the ones that repeated, stream the entry set, filter on the count, and collect back into a map with `toMap`. This is the same shape as a word count and is worth having ready, because the older `get`/null-check/`put` version is three times the code.",
    code: {
      caption: "Count, then keep the repeats",
      snippet: `List<Integer> nums = List.of(1, 2, 3, 2, 4, 5, 1, 6, 1);

Map<Integer, Long> counts = nums.stream()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
// {1=3, 2=2, 3=1, 4=1, 5=1, 6=1}

Map<Integer, Long> duplicates = counts.entrySet().stream()
        .filter(e -> e.getValue() > 1)
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
// {1=3, 2=2}`,
    },
    related: "collectors",
  },
  {
    id: "find-duplicates",
    category: "coding",
    question: "Find the values that appear more than once (each listed once).",
    answer:
      "Use a `HashSet` as a seen-set: `add` returns false when the element is already present, so `filter(n -> !seen.add(n))` keeps only repeats, and `distinct()` collapses each duplicate to a single entry. It is neat and O(n), but note it is a stateful lambda — it mutates the set outside the stream — so it is not safe to make parallel. The stateless alternative is the `groupingBy` count with a `> 1` filter.",
    code: {
      caption: "The seen-set trick",
      snippet: `List<Integer> nums = List.of(1, 2, 3, 2, 4, 5, 1, 6, 1);

Set<Integer> seen = new HashSet<>();
List<Integer> dups = nums.stream()
        .filter(n -> !seen.add(n))          // false = already seen = duplicate
        .distinct()                         // list each duplicate only once
        .toList();                          // [2, 1]`,
    },
    points: [
      "Stateful predicate — do not add `.parallel()` to this pipeline.",
      "The groupingBy-count version is stateless and parallel-safe.",
    ],
    related: "streams",
  },
  {
    id: "sum-of-evens",
    category: "coding",
    question: "Sum the even numbers in a list — and why mapToInt?",
    answer:
      "Filter to the evens, then convert to an `IntStream` with `mapToInt` and call `sum()`. The conversion is the point of the question: a `Stream<Integer>` holds boxed objects and has no `sum()` method at all — arithmetic terminals like `sum`, `average` and `summaryStatistics` live only on the primitive streams. `mapToInt` also unboxes, so the addition happens on primitives with no per-element allocation.",
    code: {
      caption: "Stream<Integer> has no sum() — IntStream does",
      snippet: `List<Integer> nums = List.of(1, 2, 5, 3, 8, 4);

int total = nums.stream()
        .filter(n -> n % 2 == 0)
        .mapToInt(Integer::intValue)        // -> IntStream, unboxed
        .sum();                             // 14`,
    },
    points: [
      "`average()` returns an OptionalDouble, because an empty stream has no average.",
      "`summaryStatistics()` gives count, sum, min, max and average in one pass.",
    ],
    related: "streams",
  },
  {
    id: "filter-map-collect",
    category: "coding",
    question: "Keep the names starting with a letter and upper-case them.",
    answer:
      "The canonical three-step pipeline: `filter` to keep what you want, `map` to transform each survivor, `collect` (or `toList`) to gather the result. Each element flows through all three stages before the next begins, and nothing runs until the terminal operation — so with no `collect`, `toList` or `forEach` at the end, the pipeline does nothing at all.",
    code: {
      caption: "filter, map, collect",
      snippet: `List<String> names = List.of("Alice", "Bob", "Charlie", "Adam");

List<String> result = names.stream()
        .filter(n -> n.startsWith("A"))
        .map(String::toUpperCase)
        .toList();                          // [ALICE, ADAM]`,
    },
    points: [
      "`toList()` (Java 16+) returns an immutable list; `collect(Collectors.toList())` is the older, mutable form.",
      "Swap the last line for `.forEach(System.out::println)` to print instead of collect.",
    ],
    related: "streams",
  },
  {
    id: "partition-even-odd",
    category: "coding",
    question: "Split a list into evens and odds in one pass.",
    answer:
      "`partitioningBy` with a boolean predicate is exactly this: it returns a `Map<Boolean, List<T>>` with the trues under `true` and the falses under `false`. Prefer it over `groupingBy` with a boolean classifier, because it guarantees both keys are present even when one group is empty — so `result.get(true)` never surprises you with null.",
    code: {
      caption: "Both keys always present",
      snippet: `List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

Map<Boolean, List<Integer>> parts = nums.stream()
        .collect(Collectors.partitioningBy(n -> n % 2 == 0));

List<Integer> evens = parts.get(true);    // [2, 4, 6]
List<Integer> odds  = parts.get(false);   // [1, 3, 5]`,
    },
    related: "collectors",
  },
  // -------------------------------------------------------------- design patterns
  {
    id: "what-is-a-pattern",
    category: "patterns",
    question: "What is a design pattern, and are they still relevant in modern Java?",
    answer:
      "A design pattern is a named, reusable solution to a problem that recurs across programs — a shape for structuring code, not a library you import. The Gang of Four grouped them into creational (how objects are made), structural (how they're composed) and behavioural (how they collaborate). They stay relevant for two reasons: shared vocabulary, so 'wrap it in a decorator' conveys a whole design in a phrase during review; and the standard library is built from them, so reading the JDK or Spring means recognising them. How you implement several has changed, though — lambdas turned Strategy, Command and simple Observer callbacks into one-liners. The anti-pattern to avoid is applying them where the problem they solve isn't present, which just adds indirection.",
    points: [
      "The JDK is a catalogue: Comparator is Strategy, BufferedReader is Decorator, StringBuilder is Builder.",
      "Over-applied patterns are a recognised code smell — a factory that only ever makes one class earns nothing.",
    ],
    related: "design-patterns-overview",
  },
  {
    id: "best-singleton",
    category: "patterns",
    question: "What is the best way to implement a singleton in Java?",
    answer:
      "An enum with a single constant. The JVM creates the instance during class initialisation, which is thread-safe by specification, so you get lazy, safe creation with no locking code. It's also the only form immune to the two loopholes that break hand-written singletons: serialization, which would otherwise deserialize a second instance unless you write `readResolve`, and reflection, which can call a private constructor but explicitly refuses to instantiate an enum. If an enum doesn't fit, the holder idiom is next best — a private static nested class holds the instance, loaded on first access, again relying on the thread-safe class-init guarantee with no synchronisation. Double-checked locking with a `volatile` field also works but has more moving parts. Whichever you choose, keep it stateless or immutable — singletons holding mutable global state are an anti-pattern.",
    code: {
      caption: "The whole thing",
      snippet: "public enum Registry {\n    INSTANCE;\n    private final Map<String, Handler> handlers = new HashMap<>();\n    public void register(String key, Handler h) { handlers.put(key, h); }\n}",
    },
    points: [
      "The naive lazy singleton is broken under concurrency: two threads can both pass the null check.",
      "In double-checked locking, `volatile` is required to avoid publishing a half-constructed object.",
    ],
    related: "singleton-pattern",
  },
  {
    id: "factory-method-vs-abstract-factory",
    category: "patterns",
    question: "What is the difference between Factory Method and Abstract Factory?",
    answer:
      "Factory Method defers the creation of a single product to a subclass that overrides the method — the base class's algorithm calls the factory method without knowing the concrete type, using inheritance. Abstract Factory bundles several factory methods so a client obtains a whole matched family of products — a button AND a checkbox AND a menu that all belong to one look — by selecting one factory object, using composition. One creates one product via subclassing; the other creates a family via a factory object. Separately, the static factory method (`Integer.valueOf`, `List.of`, `getInstance`) is the everyday form: a named creator that can cache instances, return a subtype, or fail gracefully — things a constructor can't do.",
    points: [
      "Static factory methods pervade the JDK and are Effective Java's Item 1.",
      "A factory earns its place only when the concrete class actually varies — don't wrap a single constructor.",
    ],
    related: "factory-pattern",
  },
  {
    id: "builder-when",
    category: "patterns",
    question: "When would you use the Builder pattern over a constructor?",
    answer:
      "When a class has many construction parameters, particularly optional ones or several of the same type. The telescoping constructor produces unreadable positional call sites and a combinatorial explosion of overloads; the JavaBeans set-everything approach leaves the object mutable and temporarily invalid during construction. A builder gives readable, self-documenting construction where each value names itself, optional parameters get defaults, the product can be immutable because it's built in one shot, and `build()` is a single validation point that guarantees no invalid instance escapes. The three mechanics: each setter returns the builder for chaining, the product's constructor is private, and validation lives in `build()`. It's overkill below about four parameters, where a constructor or record is clearer — `StringBuilder` and `HttpRequest.newBuilder` are the JDK's builders.",
    related: "builder-pattern",
  },
  {
    id: "strategy-vs-state",
    category: "patterns",
    question: "What is the difference between the Strategy and State patterns?",
    answer:
      "Structurally they're near-identical — a context delegates to an interface with interchangeable implementations — but the intent differs. Strategy is about choosing an algorithm: the client picks which strategy the context uses, the strategies are independent and unaware of each other, and the choice typically doesn't change on its own. A `Comparator` is the model. State is about an object's behaviour changing with its internal condition: the states are chosen internally rather than by the client, and crucially they transition between themselves — a draft-order state moves the order to a submitted-order state, which strategies never do. Same shape, different questions: Strategy asks 'which algorithm?', State asks 'how should I behave given what I am, and what should I become next?'. In modern Java a stateless Strategy is usually just a lambda.",
    points: [
      "Strategy is the pattern lambdas most directly express — Comparator, Predicate and Collector are all strategies.",
      "A strategy interface with one permanent implementation is speculative generality — add it when the second algorithm appears.",
    ],
    related: "strategy-pattern",
  },
  {
    id: "observer-leak",
    category: "patterns",
    question: "How does the Observer pattern work, and what is its main pitfall?",
    answer:
      "A subject keeps a list of observers and notifies each one through a common interface whenever its state changes, knowing nothing about them beyond that interface — so you can add or remove listeners without changing the subject. Observers can be pushed the changed data or just told that something changed and left to query the subject. Java realises it as listener APIs and, reactively with backpressure, as `java.util.concurrent.Flow`. The main pitfall is memory leaks: because the subject holds a strong reference to every observer, an observer that never unsubscribes lives as long as the subject and keeps everything it references alive. This bites hardest when the observer is a lambda capturing `this`, since nothing visibly points back. The fixes are a reliable deregistration path — often tied to a lifecycle hook like `AutoCloseable` — holding a reference to the exact observer so it can be removed, or having the subject store weak references.",
    related: "observer-pattern",
  },
  {
    id: "decorator-vs-inheritance",
    category: "patterns",
    question: "What is the Decorator pattern, and where does the JDK use it?",
    answer:
      "Decorator adds responsibilities to an object dynamically by wrapping it in another object that shares its interface. The wrapper implements the component type and holds an instance of it, so it's usable anywhere the component is and delegates to the wrapped object while adding behaviour around the call. Because every decorator is the same type as what it wraps, they stack in any order and combination — replacing inheritance's combinatorial subclass explosion (N features can mean up to 2^N subclasses) with N small classes composed at runtime. The JDK's flagship example is `java.io`: `new BufferedReader(new InputStreamReader(new FileInputStream(f)))` is three decorators — a raw byte stream, a bytes-to-characters wrapper, and a buffering wrapper. It differs from Adapter (which changes the interface) and Proxy (same interface, but controls access rather than enhancing).",
    points: [
      "The defining property is that a decorator shares the component's interface, which is what lets them stack.",
      "Collections.unmodifiableList and the synchronized wrappers are decorators too.",
    ],
    related: "decorator-pattern",
  },
  {
    id: "adapter-vs-decorator-vs-proxy",
    category: "patterns",
    question: "Adapter, Decorator and Proxy all wrap an object. How do they differ?",
    answer:
      "All three hold a wrapped object; the difference is what the wrapper presents and why. Adapter changes the interface — it translates between two incompatible ones so a caller expecting interface A can use an object that only offers interface B; `InputStreamReader` adapting bytes to characters is the JDK example. Decorator keeps the same interface and adds behaviour, which is precisely what lets decorators stack — `BufferedReader` wrapping a `Reader` is still a `Reader`. Proxy also keeps the same interface but controls access to the real object rather than enhancing it: lazy creation, permission checks, caching, remoting. So the quick test is: does the wrapper present a different interface (Adapter), the same interface with more behaviour (Decorator), or the same interface gating access (Proxy)?",
    related: "adapter-pattern",
  },
  {
    id: "template-vs-strategy",
    category: "patterns",
    question: "What is the Template Method pattern, and how does it differ from Strategy?",
    answer:
      "Template Method defines the skeleton of an algorithm in a base-class method that runs steps in a fixed order, deferring some steps to subclasses. Steps come in three kinds: concrete (shared), abstract (each subclass supplies), and hooks (overridable defaults). The template method is declared `final`, which guarantees the order and the always-run steps — a subclass can change what a step does but never whether or when it runs. Both Template Method and Strategy let a step vary, but Template Method uses inheritance and fixes structure at compile time (one algorithm with pluggable holes), while Strategy uses composition and injects the entire varying algorithm as an object chosen at runtime. So Template Method suits a fixed process with a few variable steps and a guaranteed order — imports, request handling — while Strategy suits swapping a whole algorithm. `AbstractList`, `InputStream.read`, `HttpServlet.service` and Spring's `*Template` classes use it.",
    points: [
      "It follows the Hollywood principle: the framework calls your code, not the reverse.",
      "Leaving the template method non-final defeats the pattern — a subclass could reorder or drop a step.",
    ],
    related: "template-method-pattern",
  },
  {
    id: "proxy-spring",
    category: "patterns",
    question: "What is the Proxy pattern, and why does @Transactional not fire on an internal method call?",
    answer:
      "A proxy is a stand-in that implements the same interface as a real subject and controls access to it — creating it lazily (virtual), checking permissions (protection), hiding a network hop (remote), caching, or logging. It keeps the interface but governs access, unlike Decorator (adds behaviour) or Adapter (changes the interface). Spring implements declarative concerns like `@Transactional`, `@Cacheable` and `@Async` by wrapping your bean in a proxy that runs the cross-cutting logic around your method — that is what AOP is. It generates these at runtime with `java.lang.reflect.Proxy` for interfaces or CGLIB subclassing for classes. The famous consequence is self-invocation: because the behaviour lives in the proxy, a call from a bean to another of its own methods (`this.method()`) doesn't pass through the proxy, so `@Transactional` silently doesn't apply. The fix is to move the annotated method into a separate bean so the call crosses the proxy boundary.",
    points: [
      "Hibernate uses virtual proxies for lazy-loaded associations; mocking libraries proxy interfaces to stub calls.",
      "This is the single most common Spring surprise, and it's pure Proxy-pattern mechanics.",
    ],
    related: "proxy-pattern",
  },
]

/** Strips the backtick markers used for inline code, for plain-text contexts. */
export function toPlainText(text: string): string {
  return text.replace(/`/g, "").replace(/\*\*/g, "")
}

/** Concatenated searchable text for a question entry. */
export function searchableText(entry: InterviewQuestionEntry): string {
  return [entry.question, entry.answer, ...(entry.points ?? [])].join(" ").toLowerCase()
}
