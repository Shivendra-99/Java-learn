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

const table = `Type      Size     Range / notes                                Default
--------  -------  ------------------------------------------  -------
byte       8 bit   -128 .. 127                                  0
short     16 bit   -32,768 .. 32,767                            0
int       32 bit   -2,147,483,648 .. 2,147,483,647              0     <- the default choice
long      64 bit   about +/- 9.2 quintillion   (suffix: 100L)   0L
float     32 bit   ~7 decimal digits           (suffix: 1.5f)   0.0f
double    64 bit   ~15 decimal digits                           0.0   <- the default choice
char      16 bit   a single UTF-16 code unit: 'A', '\\u00e9'      '\\u0000'
boolean   1 bit*   true or false  (*JVM-dependent in practice)  false`

const declarations = `int count = 10;            // declare and assign
int a, b, c;               // three ints, all unassigned
final int MAX_USERS = 500; // final: assign once, never reassign

long fileSize = 3_000_000_000L;  // underscores are legal and ignored
double rate   = 0.05;
char  initial = 'S';       // single quotes = char, double quotes = String
boolean ready = true;

var name = "Priya";        // Java 10+: type inferred as String
var totals = new ArrayList<Integer>();  // inferred as ArrayList<Integer>`

const trace = `public class Types {
    public static void main(String[] args) {
        int count = 10;
        double price = 2.5;
        char grade = 'A';
        boolean active = true;
        count = count + 5;
        long total = count * 1000L;
        System.out.println(count + " items, " + total + "p");
    }
}`

const overflow = `public class Overflow {
    public static void main(String[] args) {
        int big = Integer.MAX_VALUE;
        System.out.println(big + 1);
    }
}`

const money = `// Wrong: binary floating point cannot represent 0.1 exactly
double total = 0.1 + 0.2;
System.out.println(total);              // 0.30000000000000004

// Right for money: whole units of the smallest denomination
long totalPence = 10 + 20;              // 30

// Or BigDecimal, constructed from strings (never from a double)
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));           // 0.3`

export default function VariablesAndTypesLesson() {
  return (
    <>
      <p>
        A variable in Java is a named box with a declared type, and the type is a promise the compiler enforces
        everywhere. There are exactly eight types that aren't objects — the <strong>primitives</strong> — and
        knowing their sizes explains two of the most common surprises in the language: silent overflow and
        floating-point money.
      </p>

      <h2>The eight primitives</h2>
      <CodeBlock language="text" filename="primitive types" code={table} />
      <p>
        In practice you'll use <code>int</code>, <code>long</code>, <code>double</code> and <code>boolean</code>{" "}
        almost exclusively. <code>byte</code> and <code>short</code> exist for memory-tight arrays and binary
        protocols; using them for ordinary counters saves nothing, because the JVM widens them to{" "}
        <code>int</code> for arithmetic anyway.
      </p>

      <h2>Declaring things</h2>
      <CodeBlock language="java" filename="declarations" code={declarations} />
      <p>
        Three details worth fixing now. <code>final</code> means the variable can be assigned once — Java's version
        of a constant. Numeric literals can contain underscores for readability. And single quotes make a{" "}
        <code>char</code> while double quotes make a <code>String</code>; they are not interchangeable.
      </p>

      <h2>Watch the values change</h2>
      <ExecutionTrace
        title="Eight lines, four types"
        filename="Types.java"
        code={trace}
        steps={[
          { line: 3, vars: { count: "10" }, note: "count is declared and assigned in one statement. Its type is fixed forever." },
          { line: 4, vars: { price: "2.5" }, note: "A decimal literal is a double by default — you would need 2.5f for a float." },
          { line: 5, vars: { grade: "'A'" }, note: "A char holds one UTF-16 code unit. Internally it is the number 65." },
          { line: 6, vars: { active: "true" }, note: "boolean has exactly two values. It is not 1 and 0, and Java will not let you treat it as a number." },
          { line: 7, vars: { count: "15" }, note: "Reassignment: the right-hand side is evaluated first, then stored back into count." },
          { line: 8, vars: { total: "15000" }, note: "count is widened from int to long automatically, because no information can be lost going up in size." },
          {
            line: 9,
            output: "15 items, 15000p",
            note: "Inside a string concatenation, numbers are converted to text automatically.",
          },
        ]}
      />

      <h2>Overflow is silent</h2>
      <p>
        An <code>int</code> has 32 bits. Add one to the largest value it can hold and it doesn't error — it wraps
        around to the smallest.
      </p>
      <OutputPredictor
        code={overflow}
        options={[
          { id: "a", text: "2147483648" },
          { id: "b", text: "-2147483648" },
          { id: "c", label: "It throws ArithmeticException", text: "" },
          { id: "d", label: "It does not compile", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            Integer arithmetic in Java wraps silently using two's complement: one past the maximum is the minimum.
            No exception, no warning. This is why counters over large ranges, millisecond arithmetic, and file sizes
            should be <code>long</code> — and why <code>Math.addExact</code> exists, which does throw{" "}
            <code>ArithmeticException</code> on overflow when you'd rather fail loudly.
          </p>
        }
      />

      <Callout variant="warning" title="Never use double for money">
        <code>0.1</code> cannot be represented exactly in binary, any more than one third can be in decimal. Errors
        accumulate, and eventually a total is out by a penny in a way nobody can reproduce.
      </Callout>
      <CodeBlock language="java" filename="money" code={money} />

      <AnalogyCard title="A car odometer with five digits.">
        Drive past 99,999 miles and the display rolls to 00,000 — the car doesn't refuse to move, and it doesn't
        warn you. It has run out of digits and quietly wrapped. That's exactly what an <code>int</code> does at
        2,147,483,647, and the fix is the same: get a bigger display before you need it.
      </AnalogyCard>

      <h2>var: inference, not dynamic typing</h2>
      <p>
        Since Java 10, <code>var</code> lets the compiler infer a local variable's type from its initialiser. The
        type is still fixed and still checked — <code>var name = "Priya"</code> makes <code>name</code> a{" "}
        <code>String</code> permanently, and assigning an <code>int</code> to it afterwards is a compile error. It
        works only for local variables with an initialiser, never for fields, parameters, or return types.
      </p>

      <CommonMistake
        title="integer division truncating without warning"
        wrong={`int scored = 7;
int total  = 10;
double percent = scored / total * 100;
System.out.println(percent);   // 0.0`}
        right={`int scored = 7;
int total  = 10;
double percent = (double) scored / total * 100;
System.out.println(percent);   // 70.0`}
        explanation={
          <p>
            <code>7 / 10</code> is int division, so it evaluates to <code>0</code> — the remainder is discarded
            before anything is assigned to a <code>double</code>. Converting one operand to <code>double</code>{" "}
            first forces the whole expression into floating point. The rule: the type of an expression depends on
            its operands, never on where the result is being stored.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Every variable has to say what kind of value it holds, and it can never change kind afterwards. Whole
            numbers are usually <code>int</code>, decimals are <code>double</code>, yes/no is{" "}
            <code>boolean</code>, and text is <code>String</code>. Whole numbers have a maximum, and going past it
            wraps around to the bottom instead of failing.
          </p>
        }
        developer={
          <p>
            Primitives are values, not objects: they live directly in the variable's slot rather than as a reference
            to the heap, they cannot be null, and they have no methods. Integer arithmetic is two's complement and
            wraps silently; <code>Math.addExact</code> and friends throw instead. <code>float</code> and{" "}
            <code>double</code> are IEEE 754 binary, so decimal fractions are approximations — use{" "}
            <code>BigDecimal</code> (from a String) or integer minor units for money.
          </p>
        }
        interview={
          <p>
            Common questions: how many primitives (eight), why <code>char</code> is 16 bits (UTF-16 code unit, a
            legacy of when Unicode fitted in 16 bits — so an emoji needs two chars), and why{" "}
            <code>0.1 + 0.2 != 0.3</code>. A strong answer to the last one names IEEE 754 and finishes with the
            practical rule: <code>BigDecimal</code> or minor units for money, and never compare doubles with{" "}
            <code>==</code>.
          </p>
        }
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Find the wrap-around point"
        hint={
          <p>
            Start from <code>Integer.MAX_VALUE</code> and print <code>Math.addExact(big, 1)</code> alongside{" "}
            <code>big + 1</code>. Then try the same with <code>long</code> and <code>Long.MAX_VALUE</code>.
          </p>
        }
      >
        Write a loop that doubles an <code>int</code> starting from 1 and prints each value. Find where it goes
        negative, and explain what happened in terms of bits. Then convert the same loop to <code>long</code> and
        see how much further it gets — the answer is a good instinct to build for choosing types later.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why does 0.1 + 0.2 not equal 0.3 in Java?"
        answer={
          <p>
            <code>double</code> is IEEE 754 binary floating point, which stores values as a sign, an exponent, and a
            fraction in base two. One tenth is a repeating fraction in binary, exactly as one third is in decimal, so
            it is stored as the nearest representable value. Adding two such approximations yields{" "}
            <code>0.30000000000000004</code>. This is not a Java bug — every language using IEEE 754 behaves the
            same. For money, use <code>BigDecimal</code> constructed from a <code>String</code>, or hold whole minor
            units in a <code>long</code>. For general comparisons, test that the difference is smaller than a chosen
            epsilon rather than using <code>==</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Eight primitives; in practice you'll use int, long, double and boolean.",
          "Types are declared and permanent — var infers the type, it does not make Java dynamic.",
          "Integer overflow wraps silently; use long, or Math.addExact when you want it to throw.",
          "Integer division truncates: 7 / 10 is 0 regardless of what you assign it to.",
          "double is approximate. Money means BigDecimal from a String, or whole pence in a long.",
        ]}
      />
    </>
  )
}
