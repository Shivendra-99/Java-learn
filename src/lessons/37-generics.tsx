import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const before = `// Java 1.4: collections held Object, and you cast on the way out
List names = new ArrayList();
names.add("Ana");
names.add(42);                            // nothing stops this

String first = (String) names.get(0);     // fine
String second = (String) names.get(1);    // ClassCastException at runtime

// Java 5 onwards: the compiler enforces the element type
List<String> names = new ArrayList<>();
names.add("Ana");
names.add(42);                            // compile error — caught immediately
String first = names.get(0);              // no cast needed`

const genericClass = `// A type parameter is a placeholder filled in by the caller
public class Box<T> {
    private T contents;

    public void put(T item)  { this.contents = item; }
    public T get()           { return contents; }
    public boolean isEmpty() { return contents == null; }
}

Box<String> stringBox = new Box<>();
stringBox.put("hello");
String s = stringBox.get();      // no cast — the compiler knows

Box<Integer> intBox = new Box<>();
intBox.put("hello");             // compile error

// Conventional names:
//   T  type      E  element     K  key
//   V  value     R  result      N  number`

const genericMethod = `// The <T> before the return type declares the method's own parameter
public static <T> List<T> firstTwo(List<T> source) {
    return List.of(source.get(0), source.get(1));
}

List<String> pair = firstTwo(names);   // T inferred as String

// Several parameters, and a relationship between them
public static <K, V> Map<V, K> invert(Map<K, V> input) {
    Map<V, K> out = new HashMap<>();
    input.forEach((k, v) -> out.put(v, k));
    return out;
}`

const bounded = `// "T must be a Number or a subclass" — now T's Number methods are available
public static <T extends Number> double sum(List<T> numbers) {
    double total = 0;
    for (T n : numbers) total += n.doubleValue();   // legal because of the bound
    return total;
}

sum(List.of(1, 2, 3));         // Integer  — fine
sum(List.of(1.5, 2.5));        // Double   — fine
sum(List.of("a", "b"));        // compile error

// Multiple bounds: a class first (at most one), then interfaces
public static <T extends Comparable<T> & Serializable> T max(List<T> items) { ... }

// A bound can reference the parameter itself — the "recursive" idiom
public static <T extends Comparable<T>> T largest(List<T> items) {
    T best = items.get(0);
    for (T item : items) {
        if (item.compareTo(best) > 0) best = item;
    }
    return best;
}`

const inference = `// The diamond: the compiler fills in the right-hand side
Map<String, List<Order>> byCustomer = new HashMap<>();     // not HashMap<String, List<Order>>

// var and generics together
var orders = new ArrayList<Order>();      // ArrayList<Order> — the type argument is still needed
var empty = new ArrayList<>();            // ArrayList<Object> — probably not what you wanted

// Inference from the target type
List<String> empty = Collections.emptyList();     // T inferred as String
List<String> also = List.of();                    // same`

const genericInterface = `// Generic interfaces are everywhere in the JDK
public interface Repository<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    T save(T entity);
    void deleteById(ID id);
}

// Fix the parameters when implementing
public class UserRepository implements Repository<User, Long> {
    @Override public Optional<User> findById(Long id) { ... }
    @Override public User save(User entity) { ... }
}

// Or stay generic and let the subclass decide
public abstract class JpaRepository<T, ID> implements Repository<T, ID> { ... }`

export default function GenericsLesson() {
  return (
    <>
      <p>
        Generics let a class or method be written once and used with many types, with the compiler checking every
        use. They exist for one reason: to move <code>ClassCastException</code> from runtime, where it costs you an
        incident, to compile time, where it costs you thirty seconds.
      </p>

      <h2>Life before generics</h2>
      <CodeBlock language="java" filename="why they were added" code={before} />

      <h2>A generic class</h2>
      <CodeBlock language="java" filename="Box.java" code={genericClass} />
      <p>
        <code>T</code> is a parameter, exactly like a method parameter — except it takes a type rather than a value,
        and it's supplied at compile time. Everywhere <code>T</code> appears inside the class, the compiler
        substitutes whatever the caller specified.
      </p>

      <AnalogyCard title="A form with the units left blank.">
        A recipe that says "add 200 of flour" is useless without units; one that says "add 200 UNITS of flour, where
        UNITS is grams" can be reused by anyone who fixes the unit at the top. Generics do the same for types: the
        code is written against a placeholder, and the caller pins it down once so every subsequent line is checked
        against it.
      </AnalogyCard>

      <h2>A generic method</h2>
      <CodeBlock language="java" filename="method-level type parameters" code={genericMethod} />
      <p>
        The <code>&lt;T&gt;</code> before the return type is the declaration — it says this method introduces its
        own type parameter, independent of any the class might have. Callers almost never specify it explicitly,
        because inference works from the arguments.
      </p>

      <h2>Bounded type parameters</h2>
      <CodeBlock language="java" filename="extends, in a different sense" code={bounded} />
      <Callout variant="info" title="extends here means 'is a subtype of'">
        In <code>&lt;T extends Number&gt;</code>, <code>extends</code> covers interfaces too —{" "}
        <code>&lt;T extends Comparable&lt;T&gt;&gt;</code> is the common case, and{" "}
        <code>Comparable</code> is an interface. Java reuses the keyword rather than introducing a second one.
      </Callout>

      <h2>Type inference</h2>
      <CodeBlock language="java" filename="what you can leave out" code={inference} />

      <h2>Generic interfaces</h2>
      <CodeBlock language="java" filename="the repository pattern" code={genericInterface} />

      <CommonMistake
        title="using a raw type"
        wrong={`List names = new ArrayList();     // raw — no type argument at all
names.add("Ana");
names.add(42);

for (Object o : names) {
    String s = (String) o;        // ClassCastException on the second element
}

// The compiler warns — "unchecked call to add(E)" — and then obeys you.`}
        right={`List<String> names = new ArrayList<>();
names.add("Ana");
names.add(42);                    // compile error, exactly where the mistake is

// If a type genuinely could be anything, say so explicitly:
List<?> unknown = someLegacyApi();     // read-only, but type-safe
List<Object> anything = new ArrayList<>();  // holds anything, still checked`}
        explanation={
          <p>
            A raw type turns off generic checking for that reference entirely — not just for the element type, but
            for every generic method on it. Raw types exist only for compatibility with pre-Java-5 code, and every
            use is a warning the compiler is asking you to take seriously. <code>List&lt;?&gt;</code> is the safe
            way to say "I don't know the element type".
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Generics are the angle brackets in <code>List&lt;String&gt;</code>. They tell the compiler what a
            container holds, so it can stop you putting the wrong thing in and save you from casting things on the
            way out. You can write your own classes and methods that work the same way.
          </p>
        }
        developer={
          <p>
            Type parameters are declared on classes, interfaces and methods, and may be bounded with{" "}
            <code>extends</code> — one class plus any number of interfaces, and possibly referencing the parameter
            itself (<code>T extends Comparable&lt;T&gt;</code>). Inference works from arguments, from the target
            type, and through the diamond. Generics are compile-time only: they're erased in the bytecode, which is
            the subject of the next lesson and explains most of their limitations.
          </p>
        }
        interview={
          <p>
            Standard opener: why generics exist (compile-time type safety and no casts). Then: the difference
            between a generic class and a generic method, what a bounded parameter buys you (access to the bound's
            methods), and why raw types are dangerous. Type erasure is almost always the follow-up, so have{" "}
            <code>new T()</code> and <code>List&lt;String&gt;.class</code> ready as examples of what erasure
            forbids.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why does <T extends Number> let you call n.doubleValue() inside the method?"
        options={[
          { id: "a", text: "Because every object has doubleValue via Object" },
          { id: "b", text: "Because the bound guarantees T is a Number, so the compiler knows Number's methods are available" },
          { id: "c", text: "Because the JVM checks the type at runtime" },
          { id: "d", text: "It doesn't — you would need a cast" },
        ]}
        correctId="b"
        explanation="An unbounded T is treated as Object, so only Object's methods are available. Adding a bound tells the compiler the minimum capability T has, unlocking that type's API — and, as it happens, that bound is also what T is erased to in the bytecode."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Write a generic Pair"
        hint={
          <p>
            Two type parameters, <code>&lt;A, B&gt;</code>. For the swap method, note that the return type is{" "}
            <code>Pair&lt;B, A&gt;</code> — the parameters change places.
          </p>
        }
      >
        Implement a <code>Pair&lt;A, B&gt;</code> with accessors and a <code>swap()</code> that returns a{" "}
        <code>Pair&lt;B, A&gt;</code>. Then add a static generic method <code>of</code> so callers can write{" "}
        <code>Pair.of("x", 1)</code> without repeating the types. Finally, try to add a method that only works when
        both types are <code>Comparable</code> — you'll need a bounded type parameter on the method itself.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What problem do generics solve, and what do they cost?"
        answer={
          <p>
            They move type errors from runtime to compile time. Before Java 5, collections held{" "}
            <code>Object</code>, so putting the wrong type in was undetectable until a cast blew up somewhere else
            entirely — often far from the actual mistake. With <code>List&lt;String&gt;</code>, the compiler rejects
            the bad <code>add</code> at the line that made the error, and reading elements needs no cast at all. The
            secondary benefit is expressiveness: a signature like{" "}
            <code>&lt;T extends Comparable&lt;T&gt;&gt; T max(List&lt;T&gt;)</code> documents a real constraint the
            compiler enforces. The cost is that generics are implemented by <strong>erasure</strong> for backwards
            compatibility, so the type information isn't present at runtime: you can't write <code>new T()</code>,
            can't create a <code>T[]</code> safely, can't overload on <code>List&lt;String&gt;</code> versus{" "}
            <code>List&lt;Integer&gt;</code>, and can't use primitives as type arguments.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Generics give compile-time type safety and remove casts — that's the whole point.",
          "Type parameters can be declared on classes, interfaces and individual methods.",
          "Bounds (<T extends Number>) both restrict callers and unlock that type's methods inside the body.",
          "Inference handles most of it: the diamond, argument types, and the assignment target.",
          "Raw types disable checking entirely and exist only for legacy compatibility — use <?> instead.",
        ]}
      />
    </>
  )
}
