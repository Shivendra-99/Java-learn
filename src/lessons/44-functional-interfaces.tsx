import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const definition = `@FunctionalInterface        // optional annotation, but it makes the rule enforced
public interface Validator {
    boolean isValid(String value);      // EXACTLY ONE abstract method

    // These do not count against the limit:
    default Validator negate()  { return v -> !isValid(v); }
    static Validator alwaysOk() { return v -> true; }
    // ...nor do public methods of Object, such as equals or toString
}

Validator notBlank = v -> v != null && !v.isBlank();
notBlank.isValid("  ");     // false`

const bigFour = `Interface        Method            Shape              Typical use
--------------   ---------------   ----------------   ---------------------------
Function<T,R>    R apply(T)        T -> R             map, transform
Predicate<T>     boolean test(T)   T -> boolean       filter, match
Consumer<T>      void accept(T)    T -> ()            forEach, side effects
Supplier<T>      T get()           () -> T            lazy values, factories

Also common:
UnaryOperator<T>     T apply(T)              a Function where in and out match
BinaryOperator<T>    T apply(T, T)           reduce, min, max
BiFunction<T,U,R>    R apply(T, U)           two inputs
BiConsumer<T,U>      void accept(T, U)       Map.forEach
Runnable             void run()              a task with no input or output
Comparator<T>        int compare(T, T)       ordering`

const usage = `Function<String, Integer> length = String::length;
length.apply("hello");                       // 5

Predicate<Order> isLarge = o -> o.total() > 10_000;
isLarge.test(order);

Consumer<String> log = System.out::println;
log.accept("done");

Supplier<LocalDate> today = LocalDate::now;  // nothing runs until get() is called
today.get();

// Where they show up in the library:
list.stream().map(length)                    // Function
             .filter(isLarge)                // Predicate
             .forEach(log);                  // Consumer

map.computeIfAbsent(key, k -> new ArrayList<>());       // Function
Optional.ofNullable(x).orElseGet(() -> expensive());    // Supplier`

const composition = `// Functions compose
Function<String, String> trim = String::trim;
Function<String, String> upper = String::toUpperCase;

Function<String, String> clean = trim.andThen(upper);   // trim FIRST, then upper
Function<String, String> same  = upper.compose(trim);   // trim first as well

clean.apply("  ana  ");      // "ANA"

// Predicates combine
Predicate<Order> large = o -> o.total() > 10_000;
Predicate<Order> paid  = Order::isPaid;

Predicate<Order> both  = large.and(paid);
Predicate<Order> either = large.or(paid);
Predicate<Order> small = large.negate();
Predicate<Order> notNull = Predicate.not(Objects::isNull);

// Consumers chain
Consumer<Order> save = repository::save;
Consumer<Order> notify = mailer::send;
orders.forEach(save.andThen(notify));`

const primitives = `// Boxing costs allocation, so there are primitive specialisations
IntPredicate        boolean test(int)
IntFunction<R>      R apply(int)
ToIntFunction<T>    int applyAsInt(T)
IntUnaryOperator    int applyAsInt(int)
IntBinaryOperator   int applyAsInt(int, int)
IntSupplier         int getAsInt()
IntConsumer         void accept(int)
// ...and the Long and Double equivalents

// The difference in a hot loop:
Function<Integer, Integer> boxed = n -> n * 2;    // allocates an Integer per call
IntUnaryOperator raw = n -> n * 2;                // no allocation at all

list.stream().mapToInt(Order::quantity).sum();    // IntStream, no boxing`

const customFunctional = `// Write your own when the standard names would obscure the meaning
@FunctionalInterface
public interface RetryPolicy {
    Duration delayBefore(int attempt);
}

RetryPolicy exponential = attempt -> Duration.ofMillis((long) Math.pow(2, attempt) * 100);

// Compare with the alternative:
Function<Integer, Duration> policy = ...;   // technically identical, semantically mute

// A named interface documents intent, can carry default methods,
// and gives you somewhere to put static factories.`

export default function FunctionalInterfacesLesson() {
  return (
    <>
      <p>
        A lambda has to <em>be</em> something — Java has no standalone function type, so every lambda is an instance
        of an interface with exactly one abstract method. The <code>java.util.function</code> package supplies about
        forty of these, but nearly all real code uses the same four shapes.
      </p>

      <h2>What makes an interface functional</h2>
      <CodeBlock language="java" filename="one abstract method" code={definition} />
      <Callout variant="tip" title="Always add @FunctionalInterface">
        It doesn't change behaviour; it makes the compiler check that the interface still has exactly one abstract
        method. Without it, someone adds a second method a year later and every lambda implementing it breaks at
        once, with the error pointing at the call sites rather than the cause.
      </Callout>

      <h2>The four you'll actually use</h2>
      <CodeBlock language="text" filename="java.util.function" code={bigFour} />
      <CodeBlock language="java" filename="in practice" code={usage} />

      <AnalogyCard title="Four job descriptions.">
        A <strong>Function</strong> is a translator: give it one thing, get a different thing back. A{" "}
        <strong>Predicate</strong> is a bouncer: shows you a yes or no. A <strong>Consumer</strong> is a filing
        clerk: takes something away and gives nothing back. A <strong>Supplier</strong> is a vending machine: ask,
        and it produces. Once you can name the shape you need, finding the interface is trivial.
      </AnalogyCard>

      <h2>They compose</h2>
      <CodeBlock language="java" filename="andThen, compose, and, or, negate" code={composition} />
      <p>
        These combinators are <code>default</code> methods on the interfaces themselves — which is exactly what
        default methods were designed to enable. Note <code>andThen</code> and <code>compose</code> run in opposite
        orders: <code>f.andThen(g)</code> is f first, <code>f.compose(g)</code> is g first.
      </p>

      <h2>Primitive specialisations</h2>
      <CodeBlock language="text" filename="avoiding boxing" code={primitives} />

      <h2>Writing your own</h2>
      <CodeBlock language="java" filename="when a name adds meaning" code={customFunctional} />

      <CommonMistake
        title="a Consumer used where a Function belongs"
        wrong={`// A "transformation" that returns nothing and mutates instead
Consumer<Order> applyDiscount = order -> order.setTotal(order.total() * 0.9);
orders.forEach(applyDiscount);

// Now the pipeline has a hidden side effect, the original data is
// gone, and nothing can be tested without constructing mutable orders.`}
        right={`Function<Order, Order> applyDiscount =
        order -> order.withTotal(order.total() * 0.9);

List<Order> discounted = orders.stream()
        .map(applyDiscount)
        .toList();

// Input untouched, output explicit, function testable in isolation.`}
        explanation={
          <p>
            <code>Consumer</code> exists for genuine side effects — logging, saving, sending. When you're deriving a
            new value, use <code>Function</code> and return it. Mutating inside a pipeline makes the result depend
            on execution order and breaks entirely if the stream is ever made parallel.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            For a lambda to exist it needs an interface with one method to slot into. Java provides ready-made ones:{" "}
            <code>Function</code> (turn A into B), <code>Predicate</code> (yes or no), <code>Consumer</code> (do
            something with it), and <code>Supplier</code> (produce something). Most of the Streams API is built from
            these four.
          </p>
        }
        developer={
          <p>
            A functional interface has exactly one abstract method; default, static, private and{" "}
            <code>Object</code>-overriding methods don't count. <code>@FunctionalInterface</code> makes that a
            compile-time check. The combinators (<code>andThen</code>, <code>compose</code>, <code>and</code>,{" "}
            <code>or</code>, <code>negate</code>) are default methods. Primitive specialisations exist because
            generics can't hold primitives, so <code>Function&lt;Integer, Integer&gt;</code> boxes on every call
            where <code>IntUnaryOperator</code> doesn't.
          </p>
        }
        interview={
          <p>
            Know the four core shapes and their single method names — <code>apply</code>, <code>test</code>,{" "}
            <code>accept</code>, <code>get</code> — since being asked to write a signature from memory is common.
            Then: why default methods don't break the one-abstract-method rule, why the primitive variants exist
            (erasure means no primitive type arguments), and the <code>andThen</code> versus <code>compose</code>{" "}
            ordering.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="An interface has one abstract method, three default methods and two static methods. Is it functional?"
        options={[
          { id: "a", text: "No — it has six methods in total" },
          { id: "b", text: "Yes — only abstract methods count, and there is exactly one" },
          { id: "c", text: "Only if it is annotated with @FunctionalInterface" },
          { id: "d", text: "Only if the default methods are private" },
        ]}
        correctId="b"
        explanation="The rule counts abstract methods only, so defaults and statics are free — which is precisely how Comparator can offer comparing, thenComparing and reversed while remaining implementable by a lambda. The annotation enforces the rule but doesn't create it."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Build a validation pipeline from Predicates"
        hint={
          <p>
            <code>Predicate.and</code> combines two; to combine a whole list, reduce over them starting from{" "}
            <code>x -&gt; true</code>.
          </p>
        }
      >
        Write four small <code>Predicate&lt;String&gt;</code> rules — not null, not blank, at least eight
        characters, contains a digit — then combine them into one with <code>and</code>. Add a method that takes a{" "}
        <code>List&lt;Predicate&lt;String&gt;&gt;</code> and reduces it to a single predicate. Finally, change it so
        failures report <em>which</em> rule failed, and notice what that forces you to change about the shape.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is a functional interface, and why does Java need the concept?"
        answer={
          <p>
            It's an interface with exactly one abstract method — default, static, private and{" "}
            <code>Object</code>-overriding methods don't count. Java needs it because there is no standalone
            function type in the language: a lambda has to be an instance of <em>something</em>, and the single
            abstract method is what gives the lambda its parameter types and return type. That's also why lambdas
            are target-typed — the same lambda text can be a <code>Predicate&lt;String&gt;</code> or a{" "}
            <code>Function&lt;String, Boolean&gt;</code> depending on what's expected.{" "}
            <code>@FunctionalInterface</code> is optional but worth applying, because it makes the compiler enforce
            the constraint rather than letting someone break every implementing lambda by adding a second method.
            The standard set lives in <code>java.util.function</code>, with primitive specialisations like{" "}
            <code>IntPredicate</code> to avoid boxing, since erasure means a type argument can never be a primitive.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "One abstract method makes an interface functional; defaults, statics and Object methods don't count.",
          "Function (T to R), Predicate (T to boolean), Consumer (T to nothing), Supplier (nothing to T).",
          "Default combinators — andThen, compose, and, or, negate — let you build behaviour from pieces.",
          "Primitive specialisations (IntPredicate, ToIntFunction) exist because generics cannot hold primitives.",
          "Annotate with @FunctionalInterface so the constraint is checked rather than assumed.",
        ]}
      />
    </>
  )
}
