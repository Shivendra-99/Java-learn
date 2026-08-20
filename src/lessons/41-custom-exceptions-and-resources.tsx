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

const custom = `// Unchecked: extend RuntimeException
public class InsufficientFundsException extends RuntimeException {

    private final long shortfallPence;      // carry the data a handler needs

    public InsufficientFundsException(long shortfallPence) {
        super("Short by " + shortfallPence + "p");
        this.shortfallPence = shortfallPence;
    }

    public long shortfallPence() { return shortfallPence; }
}

// Checked: extend Exception
public class InvoiceNotFoundException extends Exception {
    public InvoiceNotFoundException(String reference, Throwable cause) {
        super("No invoice with reference " + reference, cause);
    }
}

// Always offer a constructor taking a cause — otherwise callers
// wrapping your exception have to throw the original away.`

const hierarchy = `// A small hierarchy lets callers choose their granularity
public class BillingException extends RuntimeException { ... }

public class InsufficientFundsException extends BillingException { ... }
public class CardDeclinedException      extends BillingException { ... }
public class CurrencyMismatchException  extends BillingException { ... }

// Handle one specific case:
catch (CardDeclinedException e) { offerAlternativePayment(); }

// Or everything billing-related:
catch (BillingException e) { showPaymentError(e.getMessage()); }`

const oldWay = `// Before Java 7 — and still what try-with-resources compiles to
BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader(path));
    return reader.readLine();
} catch (IOException e) {
    throw new UncheckedIOException(e);
} finally {
    if (reader != null) {
        try {
            reader.close();
        } catch (IOException e) {
            // and now what? if the try block also threw,
            // this close failure would REPLACE it
        }
    }
}`

const newWay = `// Java 7 onwards
try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
    return reader.readLine();
} catch (IOException e) {
    throw new UncheckedIOException(e);
}
// close() is called automatically, on every exit path, even on exception.

// Several resources: closed in REVERSE order of declaration
try (Connection conn = dataSource.getConnection();
     PreparedStatement stmt = conn.prepareStatement(SQL);
     ResultSet rs = stmt.executeQuery()) {
    ...
}   // rs closed, then stmt, then conn — exactly right

// Java 9+: an already-final variable can be used directly
final var reader = openReader();
try (reader) { ... }`

const autoCloseable = `// Any class can participate
public class Timer implements AutoCloseable {
    private final long start = System.nanoTime();
    private final String label;

    public Timer(String label) { this.label = label; }

    @Override
    public void close() {                        // no checked exception declared
        System.out.println(label + " took " + (System.nanoTime() - start) / 1_000_000 + "ms");
    }
}

try (var t = new Timer("import")) {
    runImport();
}   // prints the duration however the block exits

// Closeable extends AutoCloseable but narrows close() to throw IOException.
// Prefer AutoCloseable for new types, and declare no exception if you can.`

const suppressedPredictor = `public class Suppressed {
    static class Res implements AutoCloseable {
        @Override public void close() {
            throw new IllegalStateException("close failed");
        }
    }

    public static void main(String[] args) {
        try (Res r = new Res()) {
            throw new RuntimeException("body failed");
        } catch (Exception e) {
            System.out.println(e.getMessage() + " / " + e.getSuppressed().length);
        }
    }
}`

export default function CustomExceptionsAndResourcesLesson() {
  return (
    <>
      <p>
        Two practical topics that belong together. Designing your own exception types is how you give callers
        something meaningful to catch. And try-with-resources is how you guarantee cleanup — replacing a
        nine-line <code>finally</code> dance that most people got subtly wrong.
      </p>

      <h2>Writing an exception worth throwing</h2>
      <CodeBlock language="java" filename="custom exceptions" code={custom} />
      <p>
        Three rules. Extend <code>RuntimeException</code> for programming errors and{" "}
        <code>Exception</code> when the caller has a real recovery path. Always provide a constructor taking a{" "}
        <code>Throwable</code> cause. And carry structured data as fields — a handler that needs the shortfall
        shouldn't have to parse it out of the message.
      </p>

      <h2>A shallow hierarchy</h2>
      <CodeBlock language="java" filename="granularity for the caller" code={hierarchy} />

      <Callout variant="tip" title="Name the condition, not the code that failed">
        <code>InsufficientFundsException</code> tells a caller what happened and what they might do about it.{" "}
        <code>PaymentServiceException</code> tells them only which class was on the stack. Name exceptions after the
        situation, and they become part of your API rather than noise in it.
      </Callout>

      <h2>Cleanup, the old way</h2>
      <CodeBlock language="java" filename="what everyone used to write" code={oldWay} />
      <p>
        Note the flaw in the middle: if the body throws <em>and</em> <code>close()</code> throws, the second
        exception replaces the first — so you lose the one that explains the failure and keep the one about a file
        handle.
      </p>

      <h2>try-with-resources</h2>
      <CodeBlock language="java" filename="the modern form" code={newWay} />

      <AnalogyCard title="A door that locks itself behind you.">
        The old way was remembering to lock up on the way out — including on the days you left in a hurry because
        something was on fire. try-with-resources is a door that locks itself no matter how you leave, and keeps a
        note if the lock jammed, rather than making the jammed lock the only thing anyone hears about.
      </AnalogyCard>

      <h2>Suppressed exceptions</h2>
      <OutputPredictor
        question="The body throws and close() also throws — which survives?"
        code={suppressedPredictor}
        options={[
          { id: "a", text: "body failed / 1" },
          { id: "b", text: "close failed / 1" },
          { id: "c", text: "body failed / 0" },
          { id: "d", text: "close failed / 0" },
        ]}
        correctId="a"
        explanation={
          <p>
            The body's exception is the one propagated, because it's the one that explains what went wrong. The
            close failure is attached to it as a <strong>suppressed</strong> exception, retrievable via{" "}
            <code>getSuppressed()</code> and printed in the stack trace under "Suppressed:". The old{" "}
            <code>finally</code> pattern lost the primary exception entirely — this is the single best reason to use
            try-with-resources.
          </p>
        }
      />

      <h2>Making your own types closeable</h2>
      <CodeBlock language="java" filename="AutoCloseable" code={autoCloseable} />

      <CommonMistake
        title="a custom exception that discards the cause"
        wrong={`public class DataException extends RuntimeException {
    public DataException(String message) {
        super(message);        // no cause constructor at all
    }
}

try {
    ...
} catch (SQLException e) {
    throw new DataException("query failed");   // e is gone
}
// The stack trace now starts at your throw. The connection error,
// the constraint violation, the timeout — all lost.`}
        right={`public class DataException extends RuntimeException {
    public DataException(String message, Throwable cause) {
        super(message, cause);
    }
}

catch (SQLException e) {
    throw new DataException("query failed for user " + id, e);
}
// The trace now shows your exception AND "Caused by: SQLException..."`}
        explanation={
          <p>
            Losing the cause is the most expensive mistake in exception design, because you only discover it during
            an incident — when the trace tells you a query failed but nothing about why. Every custom exception
            should offer a <code>(String, Throwable)</code> constructor, and every wrap should use it.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            You can define your own exception types so callers can tell one kind of failure from another. And when
            you open something that needs closing — a file, a connection — declare it in the brackets of{" "}
            <code>try (...)</code> and Java closes it for you, whatever happens.
          </p>
        }
        developer={
          <p>
            try-with-resources requires <code>AutoCloseable</code>. Resources are closed in reverse declaration
            order, before any <code>catch</code> or <code>finally</code> attached to the same statement. If both the
            body and a <code>close()</code> throw, the body's exception propagates and the close exception is
            attached via <code>addSuppressed</code>. Custom exceptions should extend{" "}
            <code>RuntimeException</code> or <code>Exception</code> deliberately, expose a cause constructor, and
            carry structured fields rather than encoding data in the message.
          </p>
        }
        interview={
          <p>
            Be ready to write try-with-resources from memory, including two resources, and to explain suppressed
            exceptions — that's the detail that shows you understand why it exists rather than just that it's
            shorter. On custom exceptions: unchecked by default, always chain the cause, keep the hierarchy shallow,
            and name by condition. A good closing point is that <code>AutoCloseable</code> is what made deterministic
            cleanup possible after <code>finalize()</code> was abandoned.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Three resources are declared in one try-with-resources statement. In what order are they closed?"
        options={[
          { id: "a", text: "In declaration order — first declared, first closed" },
          { id: "b", text: "In reverse declaration order — last declared, first closed" },
          { id: "c", text: "In an unspecified order" },
          { id: "d", text: "Only the first one is closed automatically" },
        ]}
        correctId="b"
        explanation="Reverse order, which is what you want: a ResultSet depends on its Statement, which depends on its Connection, so each is closed while the thing it depends on is still open. It mirrors how nested try/finally blocks would unwind."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Prove suppression happens"
        hint={
          <p>
            Catch the exception and loop over <code>e.getSuppressed()</code>, printing each message. Then run the
            same scenario written with an old-style <code>finally</code> and compare what you're left with.
          </p>
        }
      >
        Write an <code>AutoCloseable</code> whose <code>close()</code> always throws, use it in a block that also
        throws, and print both the primary exception and everything it suppressed. Then write the equivalent with{" "}
        <code>try/finally</code> and confirm the primary exception disappears — that difference is the whole
        argument for the newer form.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How does try-with-resources work, and what problem does it solve?"
        answer={
          <p>
            Any resource declared in the parentheses must implement <code>AutoCloseable</code>, and the compiler
            generates a <code>finally</code> block that calls <code>close()</code> on each one — in reverse
            declaration order, on every exit path. It solves two problems with the old{" "}
            <code>try/finally</code> idiom. First, verbosity and forgetfulness: the null check and the nested
            try/catch around <code>close()</code> were easy to get wrong and easy to omit. Second, and more subtly,{" "}
            <strong>exception masking</strong>: if the body threw and then <code>close()</code> also threw, the old
            pattern propagated the close exception and silently lost the one that actually explained the failure.
            try-with-resources propagates the body's exception and attaches the close exception via{" "}
            <code>addSuppressed</code>, so both appear in the stack trace. You can use it for your own types too —
            anything with a deterministic cleanup step, such as a timer, a lock, or an MDC context.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Extend RuntimeException for bugs, Exception for genuinely recoverable conditions.",
          "Always provide a constructor taking a cause, and carry data as fields rather than in the message.",
          "Name exceptions after the condition, and keep the hierarchy shallow.",
          "try-with-resources closes everything in reverse order on every exit path.",
          "It also preserves the primary exception and attaches close failures as suppressed — the old finally idiom lost them.",
        ]}
      />
    </>
  )
}
