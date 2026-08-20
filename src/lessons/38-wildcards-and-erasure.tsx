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

const invariance = `// Intuition says this should work. It does not.
List<String> strings = new ArrayList<>();
List<Object> objects = strings;        // compile error

// And here is why it must be an error:
objects.add(42);                       // legal for a List<Object>
String s = strings.get(0);             // ...and this would explode

// Generics are INVARIANT: List<String> is not a subtype of List<Object>,
// even though String is a subtype of Object.`

const covariance = `// ? extends T — "some unknown subtype of T". You can READ, not write.
static double total(List<? extends Number> numbers) {
    double sum = 0;
    for (Number n : numbers) sum += n.doubleValue();   // reading is safe: it IS a Number
    return sum;
}

total(List.of(1, 2, 3));         // List<Integer> — accepted
total(List.of(1.5, 2.5));        // List<Double>  — accepted

// But:
static void broken(List<? extends Number> numbers) {
    numbers.add(42);             // compile error
    // The list might really be a List<Double>. Adding an Integer
    // would corrupt it, and the compiler cannot know which it is.
    numbers.add(null);           // the one legal add — null fits any type
}`

const contravariance = `// ? super T — "some unknown supertype of T". You can WRITE, not read usefully.
static void addNumbers(List<? super Integer> target) {
    target.add(1);               // safe: whatever the list is, it can hold an Integer
    target.add(2);

    Integer first = target.get(0);   // compile error — it might be a List<Object>
    Object safe = target.get(0);     // only Object is guaranteed
}

addNumbers(new ArrayList<Integer>());   // accepted
addNumbers(new ArrayList<Number>());    // accepted
addNumbers(new ArrayList<Object>());    // accepted`

const pecs = `PECS — Producer Extends, Consumer Super

  The parameter PRODUCES values you read   ->  ? extends T
  The parameter CONSUMES values you write  ->  ? super T
  You do both                              ->  plain T, no wildcard

// The canonical example, straight from the JDK:
public static <T> void copy(List<? super T> dest, List<? extends T> src)
//                                ^ consumer            ^ producer

// And Collections.max, which reads from the list and writes nowhere:
public static <T extends Comparable<? super T>> T max(Collection<? extends T> coll)`

const unbounded = `// ? on its own — "some type, I don't care which"
static int size(Collection<?> collection) {
    return collection.size();          // methods that don't involve the type are fine
}

static void print(List<?> items) {
    for (Object item : items) {        // elements read as Object
        System.out.println(item);
    }
    items.add("x");                    // compile error — cannot write anything but null
}

// Collection<?> is safe. Collection (raw) is not — the raw type
// switches off checking entirely, the wildcard keeps it on.`

const erasure = `// What you write
public class Box<T extends Number> {
    private T value;
    public T get() { return value; }
}

// What the compiler produces (roughly)
public class Box {
    private Number value;              // T erased to its BOUND
    public Number get() { return value; }
}
// ...and casts are inserted at every call site:
//   Integer i = box.get();  ->  Integer i = (Integer) box.get();

// Unbounded T erases to Object:
class Holder<T> { T value; }  ->  class Holder { Object value; }`

const erasureConsequences = `// Things erasure makes impossible:

new T();                            // no: the type is gone at runtime
new T[10];                          // no: same reason
if (list instanceof List<String>)   // no: only List<?> can be tested
List<String>.class                  // no: there is one Class object, List.class

void handle(List<String> l) { }     // these two ERASE to the same signature,
void handle(List<Integer> l) { }    // so they cannot both exist

// Workarounds — pass the type as a value:
public <T> T create(Class<T> type) throws Exception {
    return type.getDeclaredConstructor().newInstance();
}
List<String> list = ...;
if (list instanceof List<?> l) { ... }     // test what survives erasure`

const erasurePredictor = `import java.util.*;

public class Erased {
    public static void main(String[] args) {
        List<String> strings = new ArrayList<>();
        List<Integer> ints = new ArrayList<>();
        System.out.println(strings.getClass() == ints.getClass());
    }
}`

export default function WildcardsAndErasureLesson() {
  return (
    <>
      <p>
        Two ideas explain almost every generics error message you'll ever see. The first is that generics are{" "}
        <strong>invariant</strong>, and wildcards are how you loosen that safely. The second is{" "}
        <strong>erasure</strong> — generics exist only at compile time — which explains everything generics
        can't do.
      </p>

      <h2>Invariance, and why it's necessary</h2>
      <CodeBlock language="java" filename="the error that surprises everyone" code={invariance} />
      <p>
        Arrays chose the other option: <code>String[]</code> <em>is</em> an <code>Object[]</code>, and the JVM pays
        for it by checking every store at runtime and throwing <code>ArrayStoreException</code>. Generics are erased
        and can't do that check, so they forbid the assignment instead.
      </p>

      <h2>? extends — read from it</h2>
      <CodeBlock language="java" filename="covariance" code={covariance} />

      <h2>? super — write to it</h2>
      <CodeBlock language="java" filename="contravariance" code={contravariance} />

      <AnalogyCard title="A crate labelled 'some kind of fruit'.">
        If the label says "contains some kind of fruit", you can safely take something out and call it a fruit — but
        you can't put an apple in, because it might be a crate of oranges and someone downstream is relying on that.
        If the label says "accepts anything at least as general as an apple", you can put apples in — but what comes
        out could be any kind of fruit, or any object at all.
      </AnalogyCard>

      <h2>PECS</h2>
      <CodeBlock language="text" filename="the rule that decides for you" code={pecs} />
      <Callout variant="tip" title="A practical shortcut">
        Take <code>? extends T</code> when your method only reads from the parameter, and <code>? super T</code>{" "}
        when it only writes to it. Applying this to your own method signatures costs nothing and makes them accept
        far more caller types — it's the single cheapest API improvement in Java.
      </Callout>

      <h2>The unbounded wildcard</h2>
      <CodeBlock language="java" filename="? on its own" code={unbounded} />

      <h2>Type erasure</h2>
      <CodeBlock language="java" filename="what the compiler actually emits" code={erasure} />

      <OutputPredictor
        code={erasurePredictor}
        options={[
          { id: "a", text: "true" },
          { id: "b", text: "false" },
          { id: "c", label: "It does not compile", text: "" },
          { id: "d", label: "It throws ClassCastException", text: "" },
        ]}
        correctId="a"
        explanation={
          <p>
            Both are <code>java.util.ArrayList</code> at runtime — the type arguments were erased by the compiler
            after it finished checking them. There's exactly one <code>ArrayList</code> class, not one per type
            argument. This is the single fact that explains why <code>new T()</code>,{" "}
            <code>instanceof List&lt;String&gt;</code>, and overloading on different type arguments are all
            impossible.
          </p>
        }
      />

      <CodeBlock language="java" filename="what erasure forbids" code={erasureConsequences} />

      <Callout variant="info" title="Why erasure at all?">
        Migration compatibility. When generics arrived in Java 5, every existing library and every compiled class
        file had to keep working, and generic code had to interoperate with non-generic code in both directions.
        Erasure achieved that — <code>List&lt;String&gt;</code> and raw <code>List</code> are the same class at
        runtime — at the cost of losing the type information. C# made the opposite choice and broke compatibility
        to get reified generics.
      </Callout>

      <CommonMistake
        title="a method signature that is needlessly restrictive"
        wrong={`public void addAll(List<Number> target, List<Number> source) {
    for (Number n : source) target.add(n);
}

List<Integer> ints = ...;
List<Number> numbers = ...;
addAll(numbers, ints);      // compile error — List<Integer> is not a List<Number>`}
        right={`public void addAll(List<? super Number> target, List<? extends Number> source) {
    for (Number n : source) target.add(n);
}

addAll(numbers, ints);      // accepted
addAll(objects, doubles);   // also accepted`}
        explanation={
          <p>
            Without wildcards the method demands exactly <code>List&lt;Number&gt;</code> on both sides, which
            excludes almost every list a caller actually has. PECS makes it accept any list that can supply Numbers
            and any list that can hold them, and the body doesn't change at all.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A <code>List&lt;String&gt;</code> is not a <code>List&lt;Object&gt;</code>, because someone could then
            put a number into your list of strings. Wildcards relax that safely: <code>? extends</code> when you
            only read, <code>? super</code> when you only add. And the angle brackets are erased when the code is
            compiled, so at runtime a list doesn't know what it holds.
          </p>
        }
        developer={
          <p>
            Generics are invariant because erasure prevents a runtime store check — the opposite trade from arrays,
            which are covariant and throw <code>ArrayStoreException</code>. <code>? extends T</code> gives a
            covariant read-only view, <code>? super T</code> a contravariant write-only one, and PECS chooses
            between them. Erasure replaces each parameter with its leftmost bound (or <code>Object</code>), inserts
            casts at call sites, and generates bridge methods to preserve polymorphism across erased signatures.
          </p>
        }
        interview={
          <p>
            The two set pieces are PECS and erasure. For PECS, quote{" "}
            <code>Collections.copy(List&lt;? super T&gt; dest, List&lt;? extends T&gt; src)</code> — it contains
            both in one signature. For erasure, list the consequences: no <code>new T()</code>, no{" "}
            <code>T[]</code>, no <code>instanceof</code> with type arguments, no overloading on them, and no
            primitives as type arguments. Naming migration compatibility as the reason shows you know it was a
            deliberate trade, not an oversight.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why can't you add anything except null to a List<? extends Number>?"
        options={[
          { id: "a", text: "Because the list is immutable" },
          { id: "b", text: "Because the actual element type is unknown — it might be List<Double>, so adding an Integer would corrupt it" },
          { id: "c", text: "Because Number is abstract" },
          { id: "d", text: "Because wildcards make the reference final" },
        ]}
        correctId="b"
        explanation="The wildcard means 'some specific but unknown subtype of Number'. Since the compiler can't tell whether it's a List<Integer> or a List<Double>, no concrete value is guaranteed to fit. null is the exception because it's assignable to every reference type."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Apply PECS to a real signature"
        hint={
          <p>
            The source is read from — a producer. The destination is written to — a consumer. Then try passing a{" "}
            <code>List&lt;Integer&gt;</code> as the source and a <code>List&lt;Object&gt;</code> as the
            destination.
          </p>
        }
      >
        Write <code>copyAll(List&lt;T&gt; dest, List&lt;T&gt; src)</code> without wildcards and find three
        reasonable calls it rejects. Add the wildcards and confirm all three now compile. Then try to add an element
        to the source inside the method and read what the compiler tells you — that message is the whole rule,
        stated by the compiler.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is type erasure and what are its consequences?"
        answer={
          <p>
            Erasure means generic type information exists only at compile time. The compiler checks your types, then
            removes them: each type parameter is replaced by its leftmost bound, or <code>Object</code> if
            unbounded, and casts are inserted at call sites. So <code>List&lt;String&gt;</code> and{" "}
            <code>List&lt;Integer&gt;</code> are the same class at runtime. It was chosen for migration
            compatibility — Java 5 generic code had to interoperate with pre-existing compiled libraries in both
            directions. The consequences are the well-known limitations: you cannot write <code>new T()</code> or{" "}
            <code>new T[n]</code>, cannot use <code>instanceof</code> with a type argument, cannot overload two
            methods that differ only in their type arguments (identical erased signatures), and cannot use
            primitives as type arguments — which is why <code>IntStream</code> exists alongside{" "}
            <code>Stream&lt;Integer&gt;</code>. The usual workaround is to pass a <code>Class&lt;T&gt;</code> token
            so the type is available as a value. Erasure also requires the compiler to generate bridge methods so
            that overriding still works across erased signatures.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Generics are invariant: List<String> is not a List<Object>, and that rule prevents heap pollution.",
          "? extends T for reading (a producer), ? super T for writing (a consumer) — PECS.",
          "You can't add anything but null to a ? extends collection, and can only read Object from a ? super one.",
          "Erasure removes type arguments at compile time; List<String> and List<Integer> are one class at runtime.",
          "Hence no new T(), no T[], no instanceof with type arguments, and no overloading on them.",
        ]}
      />
    </>
  )
}
