import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { ExecutionTrace } from "@/components/lesson/execution-trace"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"

const arithmetic = `int a = 17, b = 5;

a + b     // 22
a - b     // 12
a * b     // 85
a / b     // 3    integer division: the remainder is discarded
a % b     // 2    modulo: what integer division threw away

17.0 / 5  // 3.4  one double operand promotes the whole expression

-17 % 5   // -2   the result takes the sign of the LEFT operand
17 % -5   // 2`

const precedence = `Highest
  ()  [] .                      grouping, indexing, member access
  ++ -- ! ~ (cast)              unary
  * / %                         multiplicative
  + -                           additive  (+ is also string concatenation)
  << >> >>>                     shifts
  < <= > >= instanceof          relational
  == !=                         equality
  &  ^  |                       bitwise AND, XOR, OR
  &&                            logical AND (short-circuit)
  ||                            logical OR  (short-circuit)
  ?:                            ternary
  =  +=  -=  *=  /=  %=         assignment (right-associative)
Lowest`

const shortCircuit = `// && stops as soon as it knows the answer is false
if (user != null && user.isActive()) { ... }
//   ^ if user is null, isActive() is never called - no NullPointerException

// || stops as soon as it knows the answer is true
if (cached() || expensiveLookup()) { ... }
//              ^ skipped entirely when cached() returns true

// & and | do NOT short-circuit: both sides always evaluate
if (user != null & user.isActive()) { ... }   // NullPointerException`

const ternary = `// A compact if/else that produces a value
String label = count == 1 ? "1 item" : count + " items";

// Nesting more than once is where readability dies
String size = n < 10 ? "small" : n < 100 ? "medium" : "large";  // borderline`

const incrementTrace = `public class Counting {
    public static void main(String[] args) {
        int i = 5;
        int pre = ++i;
        int post = i++;
        System.out.println(pre + " " + post + " " + i);
    }
}`

const predictor = `public class Tricky {
    public static void main(String[] args) {
        int i = 5;
        int j = i++ + ++i;
        System.out.println(i + " " + j);
    }
}`

const bitwise = `int flags = 0b1010;      // 10

flags & 0b0010          // 2   AND: bits set in both
flags | 0b0101          // 15  OR:  bits set in either
flags ^ 0b1111          // 5   XOR: bits set in exactly one
~flags                  // -11 NOT: every bit flipped

flags << 1              // 20  shift left  = multiply by 2
flags >> 1              // 5   shift right, keeping the sign
-16 >> 2                // -4  arithmetic shift: sign bit copied in
-16 >>> 28              // 15  logical shift: zeros shifted in`

export default function OperatorsLesson() {
  return (
    <>
      <p>
        Operators are the part of a language everyone assumes they already know, and then loses an afternoon to.
        The arithmetic is unsurprising; what catches people is integer division, the difference between{" "}
        <code>i++</code> and <code>++i</code>, and the fact that <code>&amp;&amp;</code> deliberately refuses to
        evaluate its right-hand side.
      </p>

      <h2>Arithmetic, including the two surprises</h2>
      <CodeBlock language="java" filename="arithmetic" code={arithmetic} />
      <p>
        Integer division truncates towards zero and modulo takes the sign of the left operand. That second rule
        matters: <code>-1 % 2</code> is <code>-1</code>, not <code>1</code>, so the common "is it even" check{" "}
        <code>n % 2 == 1</code> is false for every negative odd number. Use <code>n % 2 != 0</code> instead.
      </p>

      <h2>Increment and decrement</h2>
      <p>
        <code>++i</code> increments and gives you the new value. <code>i++</code> increments and gives you the{" "}
        <em>old</em> one. When the result is discarded — as in a <code>for</code> loop header — they're identical.
        When it isn't, the difference is everything.
      </p>
      <ExecutionTrace
        title="Pre versus post"
        filename="Counting.java"
        code={incrementTrace}
        steps={[
          { line: 3, vars: { i: "5" }, note: "Starting point." },
          {
            line: 4,
            vars: { i: "6", pre: "6" },
            note: "++i increments first, then yields the new value — so both i and pre are 6.",
          },
          {
            line: 5,
            vars: { i: "7", post: "6" },
            note: "i++ yields the old value (6) and then increments, so post is 6 while i has moved on to 7.",
          },
          { line: 6, output: "6 6 7", note: "Same operator, opposite order of effects." },
        ]}
      />

      <OutputPredictor
        question="Now combine them — what does this print?"
        code={predictor}
        options={[
          { id: "a", text: "7 12" },
          { id: "b", text: "7 11" },
          { id: "c", text: "6 12" },
          { id: "d", text: "7 14" },
        ]}
        correctId="a"
        explanation={
          <p>
            Java evaluates left to right. <code>i++</code> yields <strong>5</strong> and leaves i at 6. Then{" "}
            <code>++i</code> makes i <strong>7</strong> and yields 7. So <code>j = 5 + 7 = 12</code> and i is 7 —
            printing "7 12". Real code should never look like this; the point of the exercise is that Java's
            evaluation order is fully specified, unlike C where this expression is undefined behaviour.
          </p>
        }
      />

      <h2>Short-circuiting is a feature, not an optimisation</h2>
      <CodeBlock language="java" filename="short-circuit" code={shortCircuit} />
      <p>
        The null check idiom above works <em>because</em> <code>&amp;&amp;</code> guarantees it won't evaluate the
        right side once the left is false. That's a language guarantee you can rely on, not an optimisation that
        might not happen.
      </p>

      <AnalogyCard title="Checking a shopping list at the door.">
        "Do we have milk AND do we have bread?" — the moment you find no milk, you stop; walking to the bread aisle
        can't change the answer. "Do we have milk OR bread?" — the moment you find milk, you stop. Short-circuit
        operators do exactly this, which is why the second condition can safely assume the first one held.
      </AnalogyCard>

      <h2>The ternary operator</h2>
      <CodeBlock language="java" filename="ternary" code={ternary} />
      <p>
        <code>condition ? whenTrue : whenFalse</code> is an expression, so unlike <code>if</code> it produces a
        value you can assign or pass. Both branches must produce compatible types. One level reads well; three
        levels nested is a code review comment waiting to happen.
      </p>

      <h2>Bitwise operators</h2>
      <p>
        Rare in business code, common in protocols, hashing, and any API with flag constants. The one worth
        remembering is <code>&gt;&gt;&gt;</code>, which has no counterpart in most languages.
      </p>
      <CodeBlock language="java" filename="bitwise" code={bitwise} />
      <Callout variant="info" title="Why &gt;&gt;&gt; exists">
        <code>&gt;&gt;</code> preserves the sign by shifting copies of the sign bit in from the left, so a negative
        number stays negative. <code>&gt;&gt;&gt;</code> shifts in zeros, treating the value as unsigned. Java has
        no unsigned integer types, so this operator is how you get unsigned behaviour when you need it — it appears
        inside <code>HashMap</code>, <code>Arrays.binarySearch</code>, and anywhere a midpoint is calculated safely.
      </Callout>

      <h2>Precedence</h2>
      <CodeBlock language="text" filename="highest to lowest" code={precedence} />
      <p>
        You don't need to memorise this. You need to know that it exists and that parentheses cost nothing — an
        expression a reader has to look up is worse than one with redundant brackets.
      </p>

      <CommonMistake
        title="using == to compare objects"
        wrong={`String a = new String("hello");
String b = new String("hello");

if (a == b) {           // false!
    System.out.println("same");
}`}
        right={`String a = new String("hello");
String b = new String("hello");

if (a.equals(b)) {      // true
    System.out.println("same");
}

// Null-safe alternative:
if (Objects.equals(a, b)) { ... }`}
        explanation={
          <p>
            For primitives, <code>==</code> compares values. For objects it compares <em>references</em> — whether
            both variables point at the same object in memory. Two separately created strings with identical
            contents are two objects, so <code>==</code> is false. Use <code>equals</code> for content, and{" "}
            <code>==</code> only when identity is genuinely what you mean (or for <code>enum</code> constants, where
            identity and equality coincide).
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Most operators do what you'd expect from maths. The exceptions: dividing two whole numbers throws away
            the remainder, <code>++</code> before and after a variable give different results when you use the
            value, and <code>&amp;&amp;</code> skips the second check if the first already decided the answer.
          </p>
        }
        developer={
          <p>
            Operands are promoted before evaluation: anything narrower than <code>int</code> becomes{" "}
            <code>int</code>, and mixing widths promotes to the wider type. Compound assignment includes an implicit
            cast, so <code>byte b = 10; b += 300;</code> compiles and silently truncates. Java specifies evaluation
            order strictly left to right, so expressions with side effects are well-defined — unlike C. Bitwise{" "}
            <code>&amp;</code> and <code>|</code> also work on booleans, without short-circuiting, which is
            occasionally deliberate and usually a typo.
          </p>
        }
        interview={
          <p>
            Expect one puzzle question (<code>i++ + ++i</code>) and one conceptual one (why{" "}
            <code>&amp;&amp;</code> matters for null checks). Two extra facts that impress: compound assignment
            hides a narrowing cast, and <code>&gt;&gt;&gt;</code> exists because Java has no unsigned types — which
            is also why <code>(low + high) / 2</code> in a binary search was famously replaced with{" "}
            <code>(low + high) &gt;&gt;&gt; 1</code> to avoid overflow.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why can the second half of a null-guard such as 'user != null AND user.isActive()' safely assume the first half held?"
        options={[
          { id: "a", text: "Java checks for null automatically inside if statements" },
          { id: "b", text: "&& is guaranteed not to evaluate its right operand when the left is false" },
          { id: "c", text: "length() returns 0 for null strings" },
          { id: "d", text: "It can throw — the idiom is unsafe" },
        ]}
        correctId="b"
        explanation="Short-circuit evaluation is part of the language specification, not an optimisation. Once the left operand is false the result is already known, so the right operand is never evaluated. Swap the short-circuit operator for the bitwise one and the same line does throw."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Make compound assignment lose data"
        hint={
          <p>
            Try <code>byte b = 10; b += 300;</code> and print <code>b</code>. Then try the same thing written out
            as <code>b = b + 300;</code> and see which one the compiler rejects.
          </p>
        }
      >
        Find a pair of statements that mean the same thing to a reader but behave differently to the compiler:
        one using <code>+=</code> and one using <code>= ... +</code>. Explain why only one of them compiles, and
        what the other one printed.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between & and &&?"
        answer={
          <p>
            Both compute logical AND on booleans, but <code>&amp;&amp;</code> short-circuits: if the left operand is
            false it never evaluates the right one. <code>&amp;</code> always evaluates both. That matters whenever
            the right side has a side effect or could throw — <code>user != null &amp; user.isActive()</code> throws
            a NullPointerException where the <code>&amp;&amp;</code> version returns false safely. Additionally,{" "}
            <code>&amp;</code> is overloaded for integer types, where it performs a bitwise AND;{" "}
            <code>&amp;&amp;</code> works on booleans only.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Integer division truncates and modulo takes the sign of the left operand — n % 2 == 1 fails for negatives.",
          "++i yields the new value, i++ the old one; identical only when the result is discarded.",
          "&& and || short-circuit by specification, which is what makes null-check idioms safe. & and | do not.",
          "== compares references for objects; use equals (or Objects.equals) for content.",
          "Compound assignment hides a cast: b += 300 compiles on a byte and silently truncates.",
        ]}
      />
    </>
  )
}
