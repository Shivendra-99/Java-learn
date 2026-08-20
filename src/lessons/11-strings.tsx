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

const basics = `String name = "Priya";           // a literal
String empty = "";
String viaNew = new String("hi"); // almost always the wrong choice - see below

name.length()                     // 5  — a method, unlike array.length
name.charAt(0)                    // 'P'
name.substring(1)                 // "riya"
name.substring(1, 3)              // "ri"   (start inclusive, end exclusive)
name.indexOf("iy")                // 2      (-1 if not found)
name.contains("ya")               // true
name.toUpperCase()                // "PRIYA"  — returns a NEW string
name.replace('a', 'o')            // "Priyo"  — also a new string
name.isEmpty()                    // false  (length == 0)
name.isBlank()                    // false  (Java 11+: empty or only whitespace)
"  hi  ".trim()                   // "hi"
"a,b,,c".split(",")               // ["a", "b", "", "c"]
String.join("-", "a", "b")        // "a-b"
"ab".repeat(3)                    // "ababab"  (Java 11+)`

const immutable = `String s = "hello";
s.toUpperCase();                  // returns "HELLO" — and it is thrown away
System.out.println(s);            // "hello"  — s was never modified

s = s.toUpperCase();              // assign the result and s now points at "HELLO"
System.out.println(s);            // "HELLO"`

const comparison = `String a = "java";
String b = "java";
String c = new String("java");

a == b            // true   — both refer to the same pooled literal
a == c            // false  — new String() forces a separate object
a.equals(c)       // true   — same characters

// Case-insensitive comparison
a.equalsIgnoreCase("JAVA")        // true

// Ordering (for sorting): negative, zero, or positive
"apple".compareTo("banana")       // negative, apple sorts first

// Null-safe when the left side might be null
Objects.equals(a, c)              // true
"java".equals(input)              // safe even if input is null`

const equalityPredictor = `public class Pool {
    public static void main(String[] args) {
        String a = "java";
        String b = "ja" + "va";
        String part = "ja";
        String c = part + "va";
        System.out.println((a == b) + " " + (a == c));
    }
}`

const formatting = `// Concatenation with + — fine for a handful of pieces
String msg = "Hello, " + name + "! You have " + count + " messages.";

// formatted / String.format for anything with structure
String line = String.format("%-10s %5.2f %n", product, price);
String same = "%-10s %5.2f%n".formatted(product, price);   // Java 15+

// Text blocks (Java 15+) for multi-line content
String json = """
        {
          "name": "Priya",
          "role": "engineer"
        }
        """;`

const switchOnString = `String role = "admin";

String greeting = switch (role) {
    case "admin" -> "Welcome, administrator";
    case "user"  -> "Welcome";
    default      -> "Who are you?";
};`

export default function StringsLesson() {
  return (
    <>
      <p>
        <code>String</code> is a class, not a primitive, and it's the one you'll use more than any other. Two of its
        design decisions explain almost everything surprising about it: strings are <strong>immutable</strong>, and
        string literals are <strong>shared</strong>. Get those two ideas straight and the rest is just API.
      </p>

      <h2>The everyday API</h2>
      <CodeBlock language="java" filename="String methods" code={basics} />
      <p>
        Note <code>substring(1, 3)</code>: the start is inclusive and the end is exclusive, so the length of the
        result is <code>end - start</code>. Every range-taking method in the standard library follows this same
        convention, so it's worth internalising once.
      </p>

      <h2>Immutable means immutable</h2>
      <CodeBlock language="java" filename="nothing changes in place" code={immutable} />
      <p>
        No <code>String</code> method modifies the string it's called on. Every one of them returns a new string and
        leaves the original exactly as it was. Forgetting to assign the result is the single most common Java
        beginner bug, and it fails silently — the code compiles and simply does nothing.
      </p>

      <AnalogyCard title="A printed page, not a whiteboard.">
        You can't edit a printed page. Asking for it in capitals gets you a new page; the original is still in your
        hand, unchanged. If you don't take the new page, nothing has happened. Immutability sounds inconvenient
        until you notice what it buys: a string you pass to another method can never be altered behind your back,
        and any thread can read it safely without locking.
      </AnalogyCard>

      <h2>== versus equals</h2>
      <CodeBlock language="java" filename="comparing" code={comparison} />
      <p>
        <code>==</code> asks "are these the same object?" and <code>equals</code> asks "do these hold the same
        characters?". You almost always mean the second. The reason <code>==</code> sometimes appears to work is the{" "}
        <strong>string pool</strong>: identical literals in your source are stored once and shared, so{" "}
        <code>a == b</code> above is genuinely true. That's an implementation detail you must not rely on.
      </p>

      <OutputPredictor
        code={equalityPredictor}
        options={[
          { id: "a", text: "true true" },
          { id: "b", text: "true false" },
          { id: "c", text: "false false" },
          { id: "d", text: "false true" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>"ja" + "va"</code> is made of two constants, so the compiler folds it into the literal{" "}
            <code>"java"</code> at compile time and it lands in the pool — <code>a == b</code> is true. The second
            concatenation involves the variable <code>part</code>, so it's computed at runtime and produces a fresh
            object on the heap, making <code>a == c</code> false. Same characters, different identity. It's a neat
            illustration of why <code>equals</code> is the only comparison you should trust.
          </p>
        }
      />

      <Callout variant="warning" title="Never compare strings with ==">
        It works in tests with literals and fails in production with user input, parsed data, or anything read from a
        file or network — precisely the values you most need to compare. Use <code>equals</code>, or{" "}
        <code>Objects.equals</code> when either side could be null.
      </Callout>

      <h2>Building strings</h2>
      <CodeBlock language="java" filename="formatting" code={formatting} />
      <p>
        Concatenation with <code>+</code> is compiled into efficient code for a single expression. Inside a loop,
        it's a different story — one that gets its own lesson later, along with <code>StringBuilder</code>.
      </p>

      <h2>Switching on a string</h2>
      <CodeBlock language="java" filename="string switch" code={switchOnString} />
      <p>
        Legal since Java 7. It compiles to a switch on <code>hashCode</code> followed by an <code>equals</code>{" "}
        check, so it stays correct in the face of hash collisions while still being faster than a chain of{" "}
        <code>if</code> comparisons.
      </p>

      <CommonMistake
        title="discarding the result of a String method"
        wrong={`String input = "  Priya  ";
input.trim();
input.toLowerCase();
System.out.println("[" + input + "]");
// prints [  Priya  ] — nothing happened`}
        right={`String input = "  Priya  ";
input = input.trim().toLowerCase();
System.out.println("[" + input + "]");
// prints [priya]`}
        explanation={
          <p>
            Because strings are immutable, these methods can only return a new value — they have no way to change
            the original. Calling one and ignoring the result is a no-op, and nothing warns you. Chaining works
            nicely here: each call returns a string, so the next call operates on the result.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Text in Java can't be edited in place. Every operation gives you a new piece of text, so you have to
            store what you get back. And to check whether two pieces of text are the same, use{" "}
            <code>equals</code> — <code>==</code> asks a different question and will eventually give you the wrong
            answer.
          </p>
        }
        developer={
          <p>
            <code>String</code> is <code>final</code> and holds a private <code>byte[]</code> (since Java 9's
            compact strings, Latin-1 where possible, UTF-16 otherwise). Literals are interned in the string pool,
            which lives in the heap since Java 7. <code>hashCode</code> is cached after first computation, which is
            why strings are excellent map keys. Compile-time constant expressions are folded and interned; runtime
            concatenation produces new objects and, since Java 9, is compiled via{" "}
            <code>invokedynamic</code> to a strategy chosen by the JVM rather than a hard-coded{" "}
            <code>StringBuilder</code> chain.
          </p>
        }
        interview={
          <p>
            Be ready for "why is String immutable?" — the answers are security (a path or URL checked once cannot
            change before use), safe sharing across threads without synchronisation, cacheable{" "}
            <code>hashCode</code>, and the pool being possible at all. Then the follow-up: what makes a good{" "}
            <code>HashMap</code> key, and why an immutable type with a stable <code>hashCode</code> is exactly that.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question={`Why is it recommended to write "admin".equals(role) rather than role.equals("admin")?`}
        options={[
          { id: "a", text: "It is faster, because literals are pooled" },
          { id: "b", text: "It cannot throw NullPointerException when role is null" },
          { id: "c", text: "It performs a case-insensitive comparison" },
          { id: "d", text: "There is no difference; both are equivalent" },
        ]}
        correctId="b"
        explanation={`If role is null, role.equals(...) throws. Calling equals on the literal instead means the receiver is never null, and equals(null) simply returns false. Objects.equals(role, "admin") is the more readable modern alternative.`}
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Make == lie to you"
        hint={
          <p>
            Read a value with <code>Scanner</code> or take it from <code>args[0]</code>, then compare it to the same
            text written as a literal — first with <code>==</code>, then with <code>equals</code>.
          </p>
        }
      >
        Write a program that compares a string typed by the user against a literal using both <code>==</code> and{" "}
        <code>equals</code>, and prints both results. Then add <code>.intern()</code> to the user's input and run it
        again. Explain in one sentence why the answer changed.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why is String immutable in Java?"
        answer={
          <p>
            Several reasons reinforce each other. <strong>Security</strong>: strings are used for file paths, URLs,
            class names and database queries, and if a caller could mutate one after it had been validated, every
            check would be exploitable. <strong>Thread safety</strong>: an immutable object can be shared between
            threads with no synchronisation at all. <strong>Caching</strong>: <code>hashCode</code> can be computed
            once and stored, which is what makes <code>String</code> such a good <code>HashMap</code> key — a
            mutable key whose hash changed would become unfindable in its own map. <strong>The pool</strong>:
            sharing identical literals is only safe because nobody can change them. The cost is that building
            strings in a loop allocates repeatedly, which is what <code>StringBuilder</code> is for.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Strings are immutable: every method returns a new string, so you must assign the result.",
          "Compare with equals (or Objects.equals) — == compares identity and only accidentally works for literals.",
          "Identical literals are shared via the string pool; runtime concatenation creates new objects.",
          "substring and friends use inclusive start, exclusive end — the convention across the whole library.",
          "Put the literal on the left of equals, or use Objects.equals, to avoid NullPointerException.",
        ]}
      />
    </>
  )
}
