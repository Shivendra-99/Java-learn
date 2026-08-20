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

const poolBasics = `String a = "java";                 // literal: goes into the pool
String b = "java";                 // same pool entry — a == b is true
String c = new String("java");     // explicitly a NEW object on the heap
String d = c.intern();             // returns the pooled instance — a == d is true

a == b     // true
a == c     // false
a == d     // true
a.equals(c) // true — and this is the only comparison you should write`

const concatCost = `// One expression: compiled efficiently (invokedynamic since Java 9)
String message = "Hello, " + name + "! You have " + count + " messages.";

// In a loop: a new String AND a new StringBuilder every iteration
String result = "";
for (String word : words) {
    result += word + " ";          // O(n^2) total work
}

// The same loop with an explicit builder: one buffer, resized occasionally
StringBuilder sb = new StringBuilder();
for (String word : words) {
    sb.append(word).append(' ');   // O(n) total work
}
String result = sb.toString();`

const decompiled = `// What 'result += word' actually compiles to inside the loop:
result = new StringBuilder()       // allocated fresh, every iteration
        .append(result)            // copies everything accumulated so far
        .append(word)
        .toString();               // copies it all again into a new String

// 10,000 words means ~10,000 builders and ~50,000,000 character copies.`

const builderApi = `StringBuilder sb = new StringBuilder();       // or new StringBuilder(1024) to pre-size

sb.append("id=").append(42).append(';');     // append is overloaded for every type
sb.insert(0, "prefix ");
sb.replace(0, 6, "PREFIX");
sb.deleteCharAt(sb.length() - 1);
sb.reverse();
sb.setLength(0);                             // reuse the buffer, keep the capacity

sb.length()                                  // characters written
sb.capacity()                                // buffer size — grows as (old * 2) + 2
String out = sb.toString();                  // one final copy

// StringBuffer is the same API with synchronized methods.
// You almost never want it: a builder shared across threads is
// a design problem, not a synchronization problem.`

const internPredictor = `public class Pool {
    public static void main(String[] args) {
        String a = "hello";
        String b = new String("hello");
        String c = b.intern();
        System.out.println((a == b) + " " + (a == c) + " " + a.equals(b));
    }
}`

const immutabilityWhy = `// Why immutability is worth the copying:

// 1. Safe sharing — no defensive copies, no locks
public String getName() { return name; }     // cannot be corrupted by the caller

// 2. Cached hash code — computed once, then reused
//    (which is why String is the ideal HashMap key)

// 3. Security — a validated path cannot be changed before use
void open(String path) {
    checkPermission(path);
    // a mutable String could be altered here by another thread
    doOpen(path);
}

// 4. The pool is only safe because nobody can modify a shared literal.`

export default function StringPoolAndBuildersLesson() {
  return (
    <>
      <p>
        Strings are the most allocated type in most Java programs, so the JVM does two unusual things for them: it
        shares identical literals in a pool, and it compiles concatenation into something faster than what you
        wrote. Both are helpful, and both have an edge case that will eventually cost you an afternoon.
      </p>

      <h2>The string pool</h2>
      <CodeBlock language="java" filename="pooled and not" code={poolBasics} />

      <MemoryDiagram
        title="Where each string actually lives"
        steps={[
          {
            label: 'String a = "java";',
            detail: "The literal is placed in the string pool when the class loads, and a points at it.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "a", ref: "pool@java" }] }],
            heap: [{ id: "pool@java", type: "String (pooled)", fields: [["value", '"java"']], tone: "new" }],
          },
          {
            label: 'String b = "java";',
            detail: "The identical literal resolves to the same pool entry — no new object. This is why a == b is true, and why it feels like == works on strings.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "pool@java" },
                  { name: "b", ref: "pool@java" },
                ],
              },
            ],
            heap: [{ id: "pool@java", type: "String (pooled)", fields: [["value", '"java"']] }],
          },
          {
            label: 'String c = new String("java");',
            detail: "new always allocates. The characters are equal, the object is not the pooled one — so a == c is false while a.equals(c) is true.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "pool@java" },
                  { name: "b", ref: "pool@java" },
                  { name: "c", ref: "str@2" },
                ],
              },
            ],
            heap: [
              { id: "pool@java", type: "String (pooled)", fields: [["value", '"java"']] },
              { id: "str@2", type: "String (heap)", fields: [["value", '"java"']], tone: "new" },
            ],
          },
          {
            label: "String d = c.intern();",
            detail: "intern() looks the value up in the pool and returns the shared instance — so d and a are the same object, while c still points at its own copy.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "a", ref: "pool@java" },
                  { name: "c", ref: "str@2" },
                  { name: "d", ref: "pool@java" },
                ],
              },
            ],
            heap: [
              { id: "pool@java", type: "String (pooled)", fields: [["value", '"java"']], tone: "new" },
              { id: "str@2", type: "String (heap)", fields: [["value", '"java"']] },
            ],
          },
        ]}
      />

      <OutputPredictor
        code={internPredictor}
        options={[
          { id: "a", text: "false true true" },
          { id: "b", text: "false false true" },
          { id: "c", text: "true true true" },
          { id: "d", text: "false true false" },
        ]}
        correctId="a"
        explanation={
          <p>
            <code>new String("hello")</code> deliberately allocates a distinct object, so <code>a == b</code> is
            false. <code>intern()</code> returns the pool's copy, which is what <code>a</code> already points at, so{" "}
            <code>a == c</code> is true. And the contents are identical throughout, so <code>equals</code> is true.
            The practical lesson: <code>new String(...)</code> has essentially no legitimate use, and comparing with{" "}
            <code>==</code> has none at all.
          </p>
        }
      />

      <Callout variant="info" title="Where the pool lives">
        Before Java 7 the pool sat in PermGen, which was small and fixed — interning large numbers of strings could
        exhaust it. Since Java 7 it's in the main heap, so pooled strings are garbage-collected like anything else,
        and the pool is a hash table whose size can be tuned with{" "}
        <code>-XX:StringTableSize</code>.
      </Callout>

      <h2>Why immutability is worth it</h2>
      <CodeBlock language="java" filename="four consequences" code={immutabilityWhy} />

      <h2>Concatenation in a loop</h2>
      <CodeBlock language="java" filename="the difference that matters" code={concatCost} />
      <CodeBlock language="java" filename="what the compiler produces" code={decompiled} />
      <p>
        A single concatenation expression is fine — the compiler builds it efficiently in one pass. The problem is
        specifically a loop, where each iteration allocates a new builder and copies everything accumulated so far.
        The work grows with the square of the input, which is invisible with ten items and fatal with ten thousand.
      </p>

      <AnalogyCard title="Retyping the whole letter to add one word.">
        Immutable means you can't edit the page. To add a word you retype everything and add it at the end — fine
        for a sentence, absurd for a novel. A StringBuilder is a draft you're allowed to scribble on, and{" "}
        <code>toString()</code> is typing it up once at the end.
      </AnalogyCard>

      <h2>StringBuilder</h2>
      <CodeBlock language="java" filename="the API" code={builderApi} />

      <CommonMistake
        title="using StringBuilder where + is clearer"
        wrong={`StringBuilder sb = new StringBuilder();
sb.append("Hello, ");
sb.append(name);
sb.append("! You have ");
sb.append(count);
sb.append(" messages.");
String message = sb.toString();`}
        right={`String message = "Hello, " + name + "! You have " + count + " messages.";

// Or, when the layout matters:
String message = "Hello, %s! You have %d messages.".formatted(name, count);`}
        explanation={
          <p>
            One expression is compiled into an efficient single-pass build, so the manual builder gains nothing and
            costs six lines of readability. Reach for <code>StringBuilder</code> when you're accumulating across
            iterations or branches — that's the case the compiler can't optimise for you.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Text can't be changed once created, so joining strings makes new ones. Doing that repeatedly in a loop
            gets slow, because each round copies everything again. <code>StringBuilder</code> is a scratch pad you
            can add to cheaply, and you turn it into a string once at the end.
          </p>
        }
        developer={
          <p>
            Literals are interned at class load; runtime concatenation is compiled with{" "}
            <code>invokedynamic</code> since Java 9, letting the JVM pick a strategy rather than hard-coding a
            builder chain. Loop concatenation is still quadratic because each iteration is a separate expression.{" "}
            <code>StringBuilder</code> holds a byte array that grows by <code>(old * 2) + 2</code>; pre-sizing
            avoids the copies. <code>String</code> caches its <code>hashCode</code>, and since Java 9 stores Latin-1
            text in one byte per character.
          </p>
        }
        interview={
          <p>
            Standard set: why <code>String</code> is immutable (security, thread safety, cached hash, the pool);{" "}
            <code>String</code> vs <code>StringBuilder</code> vs <code>StringBuffer</code> (immutable, mutable,
            mutable-and-synchronized); and how many objects <code>new String("java")</code> creates — up to two, the
            pooled literal plus the explicit instance. The strongest answer to the performance question names the
            quadratic behaviour and points out that a single expression is already optimised.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is building a string with += inside a loop slow?"
        options={[
          { id: "a", text: "Because the string pool fills up" },
          { id: "b", text: "Because each iteration allocates a new builder and copies everything accumulated so far, making the work quadratic" },
          { id: "c", text: "Because the garbage collector runs after every concatenation" },
          { id: "d", text: "It isn't — the compiler rewrites it into a StringBuilder automatically" },
        ]}
        correctId="b"
        explanation="The compiler does optimise each individual expression, but it cannot hoist a builder out of the loop, because the intermediate String genuinely exists after each iteration. So every round copies the whole accumulated result — n copies of an average of n/2 characters."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Measure the quadratic curve"
        hint={
          <p>
            Use <code>System.nanoTime()</code> and remember to warm up first — run each version a few thousand times
            before timing, or you'll be measuring the interpreter.
          </p>
        }
      >
        Time both approaches for 1,000, 10,000 and 100,000 appends. Confirm the <code>+=</code> version takes
        roughly a hundred times longer when the input grows ten times, while the builder version scales linearly.
        Then pre-size the builder and see whether it makes a measurable difference.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the string pool, and what does intern() do?"
        answer={
          <p>
            The string pool is a JVM-managed table of unique string values. Every string literal in your source is
            added to it at class load, and identical literals resolve to the same object — which is why{" "}
            <code>"java" == "java"</code> is true. It saves memory, since string literals are enormously repetitive,
            and it's safe only because strings are immutable. <code>intern()</code> takes a string, looks its value
            up in the pool, and returns the pooled instance (adding it first if absent). So{" "}
            <code>new String("java").intern() == "java"</code> is true while{" "}
            <code>new String("java") == "java"</code> is false. Interning is occasionally worthwhile for large
            numbers of repeated runtime-produced strings — parsed tokens, say — but it isn't free: the pool is a
            hash table, and since Java 7 it lives in the heap rather than PermGen. None of this should affect how
            you compare strings: always <code>equals</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "String literals are interned and shared; new String(...) deliberately allocates a separate object.",
          "intern() returns the pooled instance for a value, which is the only way == becomes meaningful — and still not worth relying on.",
          "Immutability buys safe sharing, a cached hash code, security, and makes the pool possible.",
          "A single concatenation expression is compiled efficiently; concatenating in a loop is quadratic.",
          "Use StringBuilder when accumulating across iterations; StringBuffer only if a builder is genuinely shared between threads.",
        ]}
      />
    </>
  )
}
