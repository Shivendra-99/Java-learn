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

const widening = `// Widening — automatic, because no information can be lost
byte  b = 42;
int   i = b;        // fine
long  l = i;        // fine
double d = l;       // fine

// The full chain:
// byte -> short -> int -> long -> float -> double
//          char -> int -> ...

// Watch out: long -> float and int -> float can lose PRECISION
// even though they widen, because floats have only ~7 digits.
int big = 123_456_789;
float f = big;              // allowed
System.out.println((int) f); // 123456792  — not what went in`

const narrowing = `// Narrowing — needs an explicit cast, because data can be lost
double price = 9.99;
int rounded = (int) price;      // 9   — truncates towards zero, does NOT round

int large = 300;
byte small = (byte) large;      // 44  — the extra bits are simply discarded

// Rounding properly:
int correct = (int) Math.round(price);   // 10`

const wrappers = `Primitive   Wrapper      Notes
---------   ---------    ------------------------------------------
byte        Byte
short       Short
int         Integer      <- note the name, not "Int"
long        Long
float       Float
double      Double
char        Character    <- note the name, not "Char"
boolean     Boolean

// Wrappers are objects: they can be null, they have methods,
// and they can go into collections. Primitives can do none of these.
List<int> bad;         // does not compile
List<Integer> good;    // fine`

const boxing = `// Autoboxing: primitive -> wrapper, inserted by the compiler
Integer boxed = 42;              // really Integer.valueOf(42)
List<Integer> ids = new ArrayList<>();
ids.add(7);                      // Integer.valueOf(7)

// Unboxing: wrapper -> primitive
int raw = boxed;                 // really boxed.intValue()
int sum = ids.get(0) + 1;        // unboxes, adds, result is an int

// The trap: unboxing null throws
Map<String, Integer> scores = new HashMap<>();
int score = scores.get("missing");   // NullPointerException, not 0`

const cachePredictor = `public class Cache {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println((a == b) + " " + (c == d));
    }
}`

const parsing = `// String -> primitive
int n = Integer.parseInt("42");
double d = Double.parseDouble("3.14");
boolean flag = Boolean.parseBoolean("true");

// String -> wrapper object
Integer boxed = Integer.valueOf("42");

// primitive -> String
String s1 = String.valueOf(42);
String s2 = Integer.toString(42);
String s3 = 42 + "";              // works, but says nothing about intent

// Useful constants and helpers
Integer.MAX_VALUE                 // 2147483647
Integer.MIN_VALUE                 // -2147483648
Integer.toBinaryString(10)        // "1010"
Integer.compare(a, b)             // -1, 0 or 1 — no overflow, unlike a - b`

export default function CastingAndWrappersLesson() {
  return (
    <>
      <p>
        Java has two parallel worlds: primitives, which are raw values, and objects, which live on the heap and can
        be null. Moving between them — and between differently sized primitives — is something you'll do constantly.
        Most of it is automatic, and the places where it isn't are exactly where the bugs live.
      </p>

      <h2>Widening: safe, automatic</h2>
      <CodeBlock language="java" filename="widening" code={widening} />

      <h2>Narrowing: lossy, explicit</h2>
      <CodeBlock language="java" filename="narrowing" code={narrowing} />
      <p>
        A cast to <code>int</code> <strong>truncates</strong> — <code>(int) 9.99</code> is 9 and{" "}
        <code>(int) -9.99</code> is -9. It never rounds. Requiring an explicit cast is the language making you
        acknowledge that you're prepared to lose data.
      </p>

      <AnalogyCard title="Pouring between measuring jugs.">
        Tipping a small jug into a large one is always safe — that's widening, and Java does it without asking.
        Tipping a large jug into a small one might spill, so the language makes you say out loud that you accept the
        spill. What it doesn't do is warn you afterwards about how much went on the floor.
      </AnalogyCard>

      <h2>The eight wrapper classes</h2>
      <CodeBlock language="text" filename="primitives and their wrappers" code={wrappers} />
      <p>
        Wrappers exist because generics and collections only work with objects. <code>List&lt;int&gt;</code> is not
        legal Java; <code>List&lt;Integer&gt;</code> is. Everything else about wrappers follows from that decision.
      </p>

      <h2>Autoboxing and its costs</h2>
      <CodeBlock language="java" filename="boxing both ways" code={boxing} />
      <Callout variant="warning" title="Unboxing null throws NullPointerException">
        <code>map.get(key)</code> returns <code>null</code> for a missing key. Assigning that to an{" "}
        <code>int</code> calls <code>intValue()</code> on <code>null</code>. The stack trace points at a line with
        no visible method call on it, which makes this one of the most confusing NPEs in Java. Use{" "}
        <code>getOrDefault(key, 0)</code>, or keep the variable as an <code>Integer</code> and check it.
      </Callout>

      <h2>The Integer cache</h2>
      <OutputPredictor
        code={cachePredictor}
        options={[
          { id: "a", text: "true true" },
          { id: "b", text: "true false" },
          { id: "c", text: "false false" },
          { id: "d", text: "false true" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>Integer.valueOf</code> caches boxed values from -128 to 127, so <code>a</code> and <code>b</code>{" "}
            are the same cached object and <code>==</code> is true. 128 is outside the cache, so two separate
            objects are allocated and <code>==</code> is false. The values are equal either way — which is the whole
            point: never compare wrappers with <code>==</code>. Use <code>equals</code>, or unbox to primitives
            first. The cache exists because small integers dominate real programs, and reusing them saves a great
            deal of allocation.
          </p>
        }
      />

      <h2>Converting to and from text</h2>
      <CodeBlock language="java" filename="parsing and printing" code={parsing} />
      <p>
        <code>parseInt</code> returns a primitive; <code>valueOf</code> returns a wrapper. Both throw{" "}
        <code>NumberFormatException</code> on bad input — an unchecked exception, so the compiler won't remind you
        that user input can be nonsense.
      </p>

      <CommonMistake
        title="comparing wrappers with =="
        wrong={`Integer expected = 1000;
Integer actual = service.count();

if (expected == actual) {      // false even when both are 1000
    System.out.println("match");
}`}
        right={`Integer expected = 1000;
Integer actual = service.count();

if (expected.equals(actual)) { ... }
// or, when neither can be null:
if (expected.intValue() == actual.intValue()) { ... }
// or use primitives in the first place:
int expected = 1000;`}
        explanation={
          <p>
            Above 127 (and below -128) each boxing produces a distinct object, so <code>==</code> compares two
            different addresses. The really unpleasant part is that the same code <em>works</em> during testing with
            small values and fails in production with large ones. If a value can't be null, prefer the primitive
            type and the problem disappears entirely.
          </p>
        }
      />

      <h2>Performance: don't box in hot loops</h2>
      <p>
        Every autobox is potentially an object allocation. A loop summing a million <code>Integer</code> values
        allocates a million objects and does a million pointer dereferences, where the <code>int</code> version does
        none. It rarely matters — until it's in the middle of something that runs constantly, at which point it
        matters a lot. That's why the Stream API has <code>IntStream</code>, <code>LongStream</code> and{" "}
        <code>DoubleStream</code> as separate types.
      </p>

      <DifficultyLevels
        simple={
          <p>
            Small numbers fit into big containers automatically. Going the other way, you have to say explicitly
            that you accept losing part of the value — and it chops rather than rounds. Each primitive also has an
            object version (<code>int</code> has <code>Integer</code>) for use in lists and maps, and those object
            versions can be null, which is where surprises come from.
          </p>
        }
        developer={
          <p>
            Widening conversions are implicit; narrowing requires a cast and truncates bits (or the fractional part
            for float-to-integer). Autoboxing compiles to <code>valueOf</code> and unboxing to{" "}
            <code>intValue()</code> and friends. <code>Integer.valueOf</code> caches -128..127 (the upper bound is
            tunable with <code>-XX:AutoBoxCacheMax</code>), <code>Boolean</code> and <code>Character</code> below
            128 are likewise cached. Boxed arithmetic allocates and defeats cache locality, hence the primitive
            stream specialisations.
          </p>
        }
        interview={
          <p>
            Three classics: why <code>Integer a = 127, b = 127; a == b</code> is true but the same with 128 is false
            (the valueOf cache); why <code>int x = map.get(missingKey)</code> throws NPE (unboxing null); and the
            difference between <code>parseInt</code> and <code>valueOf</code> (primitive vs wrapper, and valueOf
            consults the cache). Being able to say "prefer primitives unless you need null or a collection" is the
            practical conclusion they're listening for.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What does (int) -7.9 evaluate to?"
        options={[
          { id: "a", text: "-8" },
          { id: "b", text: "-7" },
          { id: "c", text: "7" },
          { id: "d", text: "It does not compile without Math.round" },
        ]}
        correctId="b"
        explanation="Casting a floating-point value to an integer type truncates towards zero — it discards the fractional part rather than rounding. Use Math.round for rounding, and note it rounds half up, so Math.round(-7.5) is -7."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Reproduce the null-unboxing NPE"
        hint={
          <p>
            Put a few entries in a <code>Map&lt;String, Integer&gt;</code>, then assign{" "}
            <code>map.get("nothere")</code> to an <code>int</code> variable and read the stack trace closely.
          </p>
        }
      >
        Trigger a NullPointerException that has no visible method call on the failing line, then fix it three
        different ways: with <code>getOrDefault</code>, by keeping the variable as an <code>Integer</code> and
        null-checking it, and with <code>Optional.ofNullable</code>. Decide which reads best — you'll be making that
        call regularly.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Explain autoboxing and one problem it causes."
        answer={
          <p>
            Autoboxing is the compiler automatically converting between primitives and their wrapper classes —{" "}
            <code>Integer x = 5</code> becomes <code>Integer.valueOf(5)</code>, and <code>int y = x</code> becomes{" "}
            <code>x.intValue()</code>. It exists so primitives can be used with generics and collections, which only
            accept objects. The main problem is that it hides two things: allocation, so a loop over boxed values is
            far slower than over primitives; and nullability, so unboxing a <code>null</code> throws a
            NullPointerException on a line that appears to contain nothing but an assignment. A secondary gotcha is
            the <code>valueOf</code> cache making <code>==</code> true for small values and false for large ones,
            which is why wrappers must be compared with <code>equals</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Widening is automatic; narrowing needs a cast and truncates rather than rounding.",
          "Each primitive has a wrapper class, needed because generics and collections only hold objects.",
          "Autoboxing hides both allocation and nullability — unboxing null throws NullPointerException.",
          "Integer.valueOf caches -128..127, which is why == on wrappers works for small values and fails for large ones.",
          "Prefer primitives unless you genuinely need null or a collection.",
        ]}
      />
    </>
  )
}
