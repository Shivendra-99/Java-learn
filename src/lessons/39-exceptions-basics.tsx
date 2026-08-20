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
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { ArrowUp, Play, Search, ShieldAlert, Skull } from "lucide-react"

const basics = `try {
    int result = divide(a, b);
    System.out.println(result);
} catch (ArithmeticException e) {
    System.out.println("Cannot divide: " + e.getMessage());
} catch (IllegalArgumentException | NullPointerException e) {   // multi-catch
    System.out.println("Bad input: " + e.getMessage());
} finally {
    // Runs whether or not an exception was thrown, and even if
    // the try block returns. Use it for cleanup.
    System.out.println("done");
}`

const stackTrace = `Exception in thread "main" java.lang.NullPointerException:
        Cannot invoke "String.length()" because "name" is null
    at com.example.UserService.validate(UserService.java:42)   <- WHERE it broke
    at com.example.UserService.register(UserService.java:28)
    at com.example.SignupController.post(SignupController.java:15)
    at com.example.Main.main(Main.java:9)                      <- WHERE it started
Caused by: java.sql.SQLException: connection refused           <- the ROOT cause
    at ...
    ... 12 more

// Read it: the exception type and message first, then the TOP frame
// for where it happened, then scan down for the first line in YOUR code.
// "Caused by" at the bottom is usually the real problem.`

const propagation = `void a() {
    b();                        // no try/catch: the exception passes straight through
}

void b() {
    c();
}

void c() {
    throw new IllegalStateException("nothing to process");
}

// The exception unwinds a -> b -> c in reverse, popping each stack frame,
// until it finds a matching catch. If nothing catches it, the thread dies
// and the JVM prints the stack trace.`

const finallyPredictor = `public class Finally {
    static int compute() {
        try {
            return 1;
        } finally {
            System.out.println("finally");
        }
    }

    public static void main(String[] args) {
        System.out.println(compute());
    }
}`

const catchOrder = `// Order matters: the FIRST matching catch wins
try {
    riskyOperation();
} catch (FileNotFoundException e) {     // most specific first
    ...
} catch (IOException e) {               // the parent
    ...
} catch (Exception e) {                 // the catch-all
    ...
}

// Reversing this is a compile error:
//   catch (IOException e) { }
//   catch (FileNotFoundException e) { }   <- already caught by the above`

const chaining = `// Wrap, don't discard — always pass the cause
try {
    return repository.load(id);
} catch (SQLException e) {
    throw new UserLoadException("Could not load user " + id, e);
    //                                                     ^ becomes "Caused by"
}

// Without the cause, the stack trace stops at your wrapper and the
// real problem — a refused connection, a missing column — is gone.`

export default function ExceptionsBasicsLesson() {
  return (
    <>
      <p>
        An exception is Java's way of saying "I can't finish this, and I'm not going to pretend otherwise". It stops
        the current path of execution and travels up the call stack until something takes responsibility — which
        beats the alternative of returning <code>-1</code> and hoping someone checks.
      </p>

      <h2>try, catch, finally</h2>
      <CodeBlock language="java" filename="the shape" code={basics} />

      <h2>How an exception travels</h2>
      <StepFlowDiagram
        title="From throw to handled — or to a dead thread"
        steps={[
          {
            id: "throw",
            label: "throw",
            detail:
              "An exception object is created — capturing the current stack trace, which is the expensive part — and normal execution stops immediately.",
            icon: Play,
          },
          {
            id: "search",
            label: "Search this frame",
            detail: "Is the throwing statement inside a try whose catch clauses match this type? If so, that block runs and execution continues after it.",
            icon: Search,
          },
          {
            id: "finally",
            label: "Run finally",
            detail: "Before leaving any frame, its finally blocks execute — which is why they're the reliable place for cleanup, and why try-with-resources is built on them.",
            icon: ShieldAlert,
          },
          {
            id: "unwind",
            label: "Pop the frame, try the caller",
            detail:
              "No match means this frame is discarded, its locals lost, and the search repeats in the caller. This is 'unwinding', and it is why an exception can be handled far from where it happened.",
            icon: ArrowUp,
            tone: "warning",
          },
          {
            id: "uncaught",
            label: "Nobody catches it",
            detail:
              "The thread's default handler prints the stack trace to stderr and the thread terminates. If that thread was main and no others are running, the JVM exits with a non-zero status.",
            icon: Skull,
            tone: "warning",
          },
        ]}
      />
      <CodeBlock language="java" filename="unwinding" code={propagation} />

      <AnalogyCard title="Passing a problem up the management chain.">
        You hit something you can't resolve, so you stop and escalate. Your manager either deals with it or escalates
        further. Each person who passes it on stops what they were doing — that work is abandoned. If it reaches the
        top with nobody able to act, the whole department stops and the incident report is what everyone sees. The
        report is the stack trace, and it lists everyone it passed through.
      </AnalogyCard>

      <h2>Reading a stack trace</h2>
      <CodeBlock language="text" filename="the most useful skill in this lesson" code={stackTrace} />
      <Callout variant="tip" title="Read from the bottom for the cause, from the top for the location">
        The topmost frame is where the exception was thrown, which is often library code. Scan down to the first
        line in <em>your</em> package — that's usually where the bug is. And when there's a "Caused by" section, the
        deepest one is the actual failure; everything above it is wrapping.
      </Callout>

      <h2>Catch order</h2>
      <CodeBlock language="java" filename="specific before general" code={catchOrder} />

      <h2>finally always runs</h2>
      <OutputPredictor
        code={finallyPredictor}
        options={[
          { id: "a", text: "finally\n1" },
          { id: "b", text: "1\nfinally" },
          { id: "c", text: "1" },
          { id: "d", text: "finally" },
        ]}
        correctId="a"
        explanation={
          <p>
            The return value is computed and held, then the <code>finally</code> block runs, then the method
            actually returns. So "finally" prints first and 1 is still returned. The dangerous variant is a{" "}
            <code>return</code> <em>inside</em> the <code>finally</code> block — that one discards the original
            return value and swallows any in-flight exception, which is why linters flag it.
          </p>
        }
      />

      <h2>Chaining causes</h2>
      <CodeBlock language="java" filename="never lose the cause" code={chaining} />

      <CommonMistake
        title="swallowing an exception"
        wrong={`try {
    processOrder(order);
} catch (Exception e) {
    // nothing here, or worse:
    e.printStackTrace();
}
// Execution continues as if the order had been processed.
// The next failure will be somewhere unrelated, hours later.`}
        right={`try {
    processOrder(order);
} catch (OrderException e) {
    log.error("Failed to process order {}", order.id(), e);
    throw new ProcessingFailedException("order " + order.id(), e);
}

// Or, if continuing really is correct, say so explicitly:
} catch (OptionalEnrichmentException e) {
    log.warn("Enrichment unavailable, continuing without it", e);
}`}
        explanation={
          <p>
            An empty catch block asserts that the failure doesn't matter — almost never true, and impossible for the
            next reader to verify. <code>printStackTrace</code> is barely better: it writes to stderr with no
            context, no severity, and nothing your log aggregation will pick up. Either handle it, or rethrow with
            context; if you genuinely intend to continue, log it at the right level and write down why.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            When something goes wrong, Java throws an exception: the current work stops and the problem travels back
            up through whoever called you until someone catches it. If nobody does, the program stops and prints a
            trace showing the whole path.
          </p>
        }
        developer={
          <p>
            Throwing captures a stack trace, which is the main cost — hundreds of nanoseconds to microseconds — so
            exceptions shouldn't drive ordinary control flow. Unwinding runs each frame's{" "}
            <code>finally</code> blocks on the way out. Multi-catch (<code>A | B e</code>) types the variable as the
            common supertype and makes it implicitly final. Always chain the cause when wrapping; and be aware that
            a <code>return</code> or <code>throw</code> inside <code>finally</code> discards whatever was in flight.
          </p>
        }
        interview={
          <p>
            Common ground: the difference between <code>throw</code> and <code>throws</code>; whether{" "}
            <code>finally</code> always runs (yes, except on <code>System.exit</code>, a JVM crash, or an infinite
            loop); and what happens when both <code>try</code> and <code>finally</code> return — the{" "}
            <code>finally</code> wins and the original is lost. Being able to read a "Caused by" chain aloud and say
            which line you'd investigate first is worth more than any of it.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="In which order should catch blocks for IOException and FileNotFoundException appear?"
        options={[
          { id: "a", text: "IOException first, since it is more common" },
          { id: "b", text: "FileNotFoundException first — the more specific type must precede its supertype" },
          { id: "c", text: "The order does not matter" },
          { id: "d", text: "They cannot appear in the same try statement" },
        ]}
        correctId="b"
        explanation="Catches are tested top to bottom and the first match wins, so a supertype listed first would swallow everything below it. The compiler rejects that as unreachable code, which is a rare and welcome case of it catching a logic error for you."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Follow an exception up three levels"
        hint={
          <p>
            Put the <code>try</code> in the outermost method and print something at the start and end of each
            method, so you can see which lines never execute.
          </p>
        }
      >
        Write three methods that call each other, with the innermost throwing. Catch it in the outermost and print
        the stack trace. Confirm that the code after the call in the middle methods never runs, then add a{" "}
        <code>finally</code> to each and watch them all execute on the way out. Finally, wrap and rethrow from the
        middle with the cause attached and compare the two traces.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Does finally always execute?"
        answer={
          <p>
            In practice yes, and that's what you should rely on: it runs whether the <code>try</code> completes
            normally, throws, or returns — the return value is computed first, then <code>finally</code> runs, then
            the method returns. The genuine exceptions are cases where the JVM never gets the chance:{" "}
            <code>System.exit()</code>, a fatal JVM error or crash, the thread being killed at the OS level, or an
            infinite loop or deadlock inside the <code>try</code>. There's also a trap worth naming: a{" "}
            <code>return</code> or <code>throw</code> <em>inside</em> a <code>finally</code> block replaces whatever
            the <code>try</code> was doing, silently discarding the original return value or exception — which is
            why static analysers flag it. In modern code, most uses of <code>finally</code> for cleanup are better
            written as try-with-resources.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "An exception unwinds the stack frame by frame until a matching catch is found.",
          "Read a stack trace top-down for where it broke, and check 'Caused by' for why.",
          "Catch blocks are tested in order — specific types must come before their supertypes.",
          "finally runs on every exit path; never return or throw from inside one.",
          "Never swallow an exception, and always pass the cause when wrapping.",
        ]}
      />
    </>
  )
}
