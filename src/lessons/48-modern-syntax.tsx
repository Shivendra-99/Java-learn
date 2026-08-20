import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const timeline = `Java 10   var                              local type inference
Java 11   String methods, HttpClient       isBlank, strip, lines, repeat
Java 14   switch expressions               arrow labels, yield, exhaustiveness
Java 15   text blocks                      multi-line string literals
Java 16   records, pattern matching        instanceof binding
Java 17   sealed classes                   LTS
Java 21   record patterns, switch patterns LTS — pattern matching completed
Java 21   virtual threads                  see the concurrency section`

const varUsage = `// Good: the type is obvious from the right-hand side
var users = new ArrayList<User>();
var entry = map.entrySet().iterator().next();
var reader = Files.newBufferedReader(path);

// Bad: the type is now invisible
var result = process(data);       // what IS this?
var x = 0;                        // int? long? say so if it matters

// Where var is not allowed:
// - fields
// - method parameters and return types
// - without an initialiser:  var x;
// - with null:               var x = null;
// - lambda parameters: allowed, but only for annotations —
//     (var a, var b) -> ...`

const textBlocks = `// Before
String json = "{\\n" +
              "  \\"name\\": \\"Priya\\",\\n" +
              "  \\"role\\": \\"engineer\\"\\n" +
              "}";

// Java 15+
String json = """
        {
          "name": "Priya",
          "role": "engineer"
        }
        """;

// Incidental leading whitespace is stripped based on the
// LEAST-indented line (including the closing delimiter),
// so you can indent the block to match its surroundings.

String sql = """
        SELECT id, reference, total
        FROM orders
        WHERE status = ?
        ORDER BY created_at DESC""";      // no trailing newline

// \\ at end of line joins it to the next; \\s keeps a trailing space.`

const switchExpr = `// Expression form, exhaustive, no fall-through
String label = switch (status) {
    case NEW, PENDING -> "waiting";
    case PAID -> "ready";
    case SHIPPED -> {
        audit.record(order);
        yield "in transit";       // yield produces the value from a block
    }
    case CANCELLED -> "cancelled";
};`

const patternMatching = `// instanceof pattern (Java 16)
if (value instanceof String s && s.length() > 3) {
    System.out.println(s.toUpperCase());     // s is in scope and already typed
}

// switch patterns (Java 21)
String describe(Object value) {
    return switch (value) {
        case null            -> "nothing";
        case Integer i when i > 100 -> "big number: " + i;
        case Integer i       -> "number: " + i;
        case String s        -> "text of length " + s.length();
        case int[] arr       -> "int array of " + arr.length;
        default              -> "something else";
    };
}
// Order matters: the first matching case wins, so guarded
// cases must come before their unguarded versions.`

const recordPatterns = `sealed interface Shape permits Circle, Rectangle { }
record Circle(double radius) implements Shape { }
record Rectangle(double width, double height) implements Shape { }

// Record patterns (Java 21): destructure in the pattern itself
double area(Shape shape) {
    return switch (shape) {
        case Circle(double r) -> Math.PI * r * r;
        case Rectangle(double w, double h) -> w * h;
    };
}
// No default needed: the interface is sealed, so the compiler
// knows these are ALL the cases. Add a Triangle and this method
// stops compiling until you handle it.

// Nested destructuring works too:
case Order(Customer(String name, _), var total) -> name + " owes " + total;`

const sealed = `// A closed hierarchy — you control exactly who can implement it
public sealed interface Payment
        permits CardPayment, BankTransfer, Voucher { }

public record CardPayment(String last4) implements Payment { }
public record BankTransfer(String iban) implements Payment { }
public record Voucher(String code) implements Payment { }

// Each permitted subtype must be final, sealed, or non-sealed:
public non-sealed class Voucher implements Payment { }   // reopens it

// The payoff: exhaustive switches without a default, checked
// at compile time. Sealed types + records + pattern matching
// give Java algebraic data types.`

export default function ModernSyntaxLesson() {
  return (
    <>
      <p>
        Java changed more between 2017 and 2023 than in the decade before it. Six-monthly releases brought{" "}
        <code>var</code>, text blocks, records, sealed types and pattern matching — features that individually look
        like conveniences and together change how you model data.
      </p>

      <CodeBlock language="text" filename="what arrived when" code={timeline} />

      <h2>var</h2>
      <CodeBlock language="java" filename="local type inference" code={varUsage} />
      <Callout variant="info" title="var is not dynamic typing">
        The variable still has one fixed, compile-time-checked type — you've just asked the compiler to work it out
        from the initialiser. <code>var name = "Priya"</code> makes <code>name</code> a <code>String</code>{" "}
        permanently, and assigning an <code>int</code> to it afterwards is a compile error.
      </Callout>

      <h2>Text blocks</h2>
      <CodeBlock language="java" filename="multi-line strings" code={textBlocks} />

      <h2>Switch expressions</h2>
      <CodeBlock language="java" filename="arrow labels and yield" code={switchExpr} />

      <h2>Pattern matching</h2>
      <CodeBlock language="java" filename="test and bind in one step" code={patternMatching} />

      <AnalogyCard title="Sorting parcels by what's inside, not by re-checking the label.">
        The old way was: look at the label, confirm it says "book", then open it and take out the book, hoping it
        really is one. Pattern matching does both at once — "if this is a book, call it b" — so there's no separate
        cast that could disagree with the check, and no chance of forgetting it.
      </AnalogyCard>

      <h2>Sealed types and record patterns</h2>
      <CodeBlock language="java" filename="closed hierarchies" code={sealed} />
      <CodeBlock language="java" filename="destructuring" code={recordPatterns} />
      <p>
        This combination is the important one. A <code>sealed</code> interface with <code>record</code>{" "}
        implementations gives the compiler a complete list of cases, and a switch over it is checked for
        exhaustiveness. Add a subtype and every switch that doesn't handle it fails to compile — the whole point.
      </p>

      <CommonMistake
        title="var where the reader can no longer tell what they're holding"
        wrong={`var result = service.process(request);
var items = result.getItems();
var first = items.get(0);
var value = first.getValue();

// Four lines, and a reader has to open four other files
// to find out what any of them is.`}
        right={`ProcessingResult result = service.process(request);
var items = result.getItems();          // fine — obvious from the name and context
Item first = items.get(0);
BigDecimal value = first.getValue();

// Use var where the right-hand side names the type
// (new X(), a factory, a well-known method), and be explicit
// where it doesn't.`}
        explanation={
          <p>
            <code>var</code> pays off when the type appears on the right anyway —{" "}
            <code>var list = new ArrayList&lt;Order&gt;()</code> removes a duplication. It costs when the type comes
            from a method call whose name doesn't say. The test is whether a reader can tell without leaving the
            line.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Recent Java versions added shortcuts: <code>var</code> so you don't repeat the type, text blocks for
            multi-line strings, <code>switch</code> that returns a value, and pattern matching so checking a type
            and using it are one step. None of them change how the program runs — they remove ceremony.
          </p>
        }
        developer={
          <p>
            <code>var</code> is local-only inference and has no runtime effect. Text blocks strip incidental
            indentation relative to the least-indented line, including the closing delimiter. Switch expressions
            must be exhaustive and are checked over enums and sealed types. Pattern matching introduces flow
            scoping: the binding is in scope exactly where the pattern must have matched. Sealed types plus records
            give algebraic data types, which is what makes exhaustive switching without a{" "}
            <code>default</code> both possible and desirable.
          </p>
        }
        interview={
          <p>
            Be able to name the version each feature landed in, roughly, and say what problem it solved.{" "}
            <code>var</code>: less repetition, not dynamic typing. Switch expressions: no fall-through,
            exhaustiveness, produces a value. Sealed: a closed hierarchy the compiler can reason about. Records plus
            sealed plus patterns: Java's answer to algebraic data types, where adding a case breaks every switch
            that hasn't handled it — which is exactly the behaviour you want.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why does a switch expression over a sealed interface need no default branch?"
        options={[
          { id: "a", text: "Because sealed interfaces cannot have subtypes" },
          { id: "b", text: "Because the permits clause tells the compiler every possible subtype, so it can verify all cases are covered" },
          { id: "c", text: "Because default is never required in switch expressions" },
          { id: "d", text: "Because records automatically handle unmatched cases" },
        ]}
        correctId="b"
        explanation="Sealing gives the compiler a complete list of implementations, so it can prove the switch is exhaustive. Omitting default is the point: adding a new permitted subtype then breaks the build at every switch that doesn't handle it, rather than silently falling into a default branch at runtime."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Model a small domain with sealed records"
        hint={
          <p>
            <code>sealed interface Event permits ...</code>, each permitted type a <code>record</code>, then one
            switch expression with record patterns and no <code>default</code>.
          </p>
        }
      >
        Define a sealed <code>Event</code> interface with three record implementations, and write a handler that
        switches over them with record patterns and no <code>default</code>. Then add a fourth event type and
        confirm the compiler refuses to build until you handle it. Finally add a <code>default</code> and notice
        exactly what safety you just gave away.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What are sealed classes and what do they enable?"
        answer={
          <p>
            A <code>sealed</code> class or interface declares a <code>permits</code> clause listing exactly which
            types may extend or implement it; each of those must itself be <code>final</code>,{" "}
            <code>sealed</code>, or explicitly <code>non-sealed</code>. It sits between <code>final</code>{" "}
            (no subtypes at all) and open inheritance (anyone, anywhere), and it lets an API author allow extension
            while keeping the set of subtypes known. The real payoff is for the compiler: with a closed hierarchy it
            can verify that a switch covers every case, so a switch expression over a sealed type needs no{" "}
            <code>default</code> — and adding a new permitted subtype breaks every switch that hasn't been updated,
            at compile time. Combined with records and pattern matching, that gives Java algebraic data types: a
            closed set of shapes, destructured in a switch, exhaustively handled. It's also what makes the
            "instanceof chain" design smell legitimate in this one context, because the compiler is now checking it.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "var infers a local variable's type at compile time — it does not make Java dynamically typed.",
          "Text blocks strip incidental indentation relative to the least-indented line.",
          "Switch expressions produce a value, have no fall-through, and are checked for exhaustiveness.",
          "Pattern matching binds and casts in one step, with flow scoping for the binding.",
          "Sealed types + records + patterns give exhaustive, compiler-checked handling of a closed set of cases.",
        ]}
      />
    </>
  )
}
