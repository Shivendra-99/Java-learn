import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TypeHierarchyDiagram } from "@/components/diagram/type-hierarchy-diagram"

const rule = `Checked        must be declared or caught — the compiler enforces it
Unchecked      no obligation at all

The rule is purely structural:
  Throwable
    ├── Error              unchecked   — JVM problems, do not catch
    ├── Exception          CHECKED
    │     └── RuntimeException  unchecked  — the one exempt subtree
    └── (nothing else)

So: anything under RuntimeException or Error is unchecked.
Everything else under Exception is checked.`

const checkedExample = `// Checked: the compiler will not let you ignore it
public void save(String path) throws IOException {     // declare it...
    Files.writeString(Path.of(path), data);
}

// ...or handle it
public void save(String path) {
    try {
        Files.writeString(Path.of(path), data);
    } catch (IOException e) {
        throw new StorageException("could not write " + path, e);
    }
}

// Omitting both is a compile error:
//   unreported exception IOException; must be caught or declared to be thrown`

const uncheckedExample = `// Unchecked: no declaration required, no compiler involvement
public int parse(String input) {
    return Integer.parseInt(input);      // throws NumberFormatException
}

// These are all unchecked, and all indicate a programming error:
NullPointerException
IllegalArgumentException        // and IllegalStateException
IndexOutOfBoundsException
ClassCastException
ArithmeticException
NumberFormatException           // extends IllegalArgumentException
ConcurrentModificationException
UnsupportedOperationException`

const guidance = `Throw UNCHECKED when the caller could have prevented it:
  - a null argument that should never be null       IllegalArgumentException
  - a method called in the wrong order              IllegalStateException
  - an index the caller controls                    IndexOutOfBoundsException
  These are bugs. The fix is a code change, not a catch block.

Throw CHECKED when the caller can reasonably RECOVER:
  - the file might genuinely not be there
  - the network might genuinely be down
  - the user's input might genuinely be wrong
  ...and there is a sensible alternative action available.

The honest test: "would every caller do anything other than
rethrow this?" If not, a checked exception is just noise.`

const wrapping = `// The standard way to cross an API boundary
public User load(long id) {
    try {
        return jdbc.query(...);
    } catch (SQLException e) {                 // checked, and specific to JDBC
        throw new DataAccessException(e);      // unchecked, and specific to YOUR domain
    }
}

// Callers are no longer coupled to JDBC. This is exactly what
// Spring's DataAccessException hierarchy does, and why.`

const errors = `// Errors mean the JVM is in trouble. Do not catch these.
OutOfMemoryError          the heap is exhausted
StackOverflowError        runaway recursion
NoClassDefFoundError      a class present at compile time is missing at runtime
ExceptionInInitializerError   a static initialiser threw

// catch (Throwable t) catches Errors too, which is why it is
// almost always wrong — you cannot meaningfully recover from
// OutOfMemoryError, and pretending to makes diagnosis harder.`

export default function CheckedVsUncheckedLesson() {
  return (
    <>
      <p>
        Java is one of the very few languages where the compiler forces you to acknowledge certain exceptions. It's
        the most argued-about feature in the language: proponents say it makes failure visible, critics say it
        produces thousands of pointless <code>catch</code> blocks. Both camps are describing real experience.
      </p>

      <h2>The rule</h2>
      <CodeBlock language="text" filename="which is which" code={rule} />

      <TypeHierarchyDiagram
        title="The Throwable hierarchy"
        initialSelected="exception"
        nodes={[
          {
            id: "throwable",
            name: "Throwable",
            kind: "class",
            tag: "the root",
            detail: "The only type Java can throw or catch. Holds the message, the cause, and the captured stack trace.",
          },
          {
            id: "error",
            name: "Error",
            kind: "class",
            parent: "throwable",
            tag: "unchecked",
            detail:
              "Serious problems with the JVM itself — OutOfMemoryError, StackOverflowError, NoClassDefFoundError. Unchecked because no caller could sensibly recover. Do not catch these.",
          },
          {
            id: "exception",
            name: "Exception",
            kind: "class",
            parent: "throwable",
            tag: "CHECKED",
            detail:
              "Conditions an application might reasonably want to handle. Everything here is checked — the compiler requires it to be caught or declared — except the RuntimeException subtree.",
          },
          {
            id: "ioexception",
            name: "IOException",
            kind: "class",
            parent: "exception",
            tag: "checked",
            detail: "The archetypal checked exception, along with SQLException and InterruptedException. The file might genuinely be missing; that isn't a bug in your code.",
          },
          {
            id: "runtime",
            name: "RuntimeException",
            kind: "class",
            parent: "exception",
            tag: "unchecked",
            detail:
              "The exempt subtree. Extends Exception but the compiler doesn't require handling. These conventionally signal programming errors rather than recoverable conditions.",
          },
          {
            id: "npe",
            name: "NullPointerException",
            kind: "class",
            parent: "runtime",
            tag: "a bug",
            detail: "Along with IllegalArgumentException, IllegalStateException and IndexOutOfBoundsException — all signalling that the caller did something it shouldn't have.",
          },
        ]}
      />

      <h2>Checked in practice</h2>
      <CodeBlock language="java" filename="declare or handle" code={checkedExample} />

      <h2>Unchecked in practice</h2>
      <CodeBlock language="java" filename="no obligation" code={uncheckedExample} />

      <AnalogyCard title="A signed form versus a burglar alarm.">
        A checked exception is a form the compiler makes you sign: "I acknowledge this delivery might fail". Useful
        when there's a genuine decision to make — do we retry, use a backup, tell the user? An unchecked exception
        is the alarm going off because someone did something they shouldn't have. You don't plan for it in every
        room; you fix the behaviour that triggered it.
      </AnalogyCard>

      <h2>Choosing when you throw</h2>
      <CodeBlock language="text" filename="the practical guidance" code={guidance} />
      <Callout variant="info" title="Where the industry landed">
        Modern Java frameworks lean heavily unchecked. Spring wraps <code>SQLException</code> in an unchecked{" "}
        <code>DataAccessException</code>; Kotlin removed checked exceptions entirely; the Streams API can't
        propagate them through lambdas at all. The reasoning: a checked exception every caller merely rethrows adds
        noise without adding safety. Checked exceptions still earn their place at genuine recovery points.
      </Callout>

      <h2>Wrapping at a boundary</h2>
      <CodeBlock language="java" filename="translating exceptions" code={wrapping} />

      <h2>Errors are not your problem</h2>
      <CodeBlock language="java" filename="do not catch these" code={errors} />

      <CommonMistake
        title="declaring throws Exception on everything"
        wrong={`public void process() throws Exception { ... }
public void save()    throws Exception { ... }

// Callers learn nothing, and must either catch Exception —
// which also catches every RuntimeException — or declare
// throws Exception themselves, spreading it further.`}
        right={`public void process() throws OrderValidationException { ... }
public void save()    throws IOException { ... }

// Or convert to unchecked at the boundary where nobody can recover:
public void process() {
    try { ... }
    catch (IOException e) { throw new UncheckedIOException(e); }
}`}
        explanation={
          <p>
            <code>throws Exception</code> is the checked-exception equivalent of returning <code>Object</code>: it
            technically satisfies the compiler while telling the caller nothing. Worse, catching{" "}
            <code>Exception</code> to satisfy it also catches every runtime exception, so real bugs get swallowed
            alongside the expected failure. Declare the specific types, or translate them.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Some exceptions the compiler forces you to deal with — you must either catch them or say your method
            might throw them. Those are for things that can genuinely go wrong, like a missing file. The rest are
            for programming mistakes, like using a null, and the compiler stays out of your way because the fix is
            to correct the code.
          </p>
        }
        developer={
          <p>
            Checked means "everything under <code>Exception</code> except the <code>RuntimeException</code>
            subtree", and the compiler enforces catch-or-declare. An overriding method may narrow the checked
            exceptions it declares but never widen them, which is why interfaces designed without{" "}
            <code>throws</code> can't have implementations that throw checked exceptions — the reason lambdas and
            streams are so awkward with them. <code>UncheckedIOException</code> exists specifically to bridge that
            gap.
          </p>
        }
        interview={
          <p>
            Know the hierarchy exactly and be able to place any exception in it. Then have an opinion, with reasons:
            checked exceptions make recoverable failure visible in the signature, but they leak through every layer,
            don't compose with lambdas, and are frequently rethrown mechanically — which is why most modern
            frameworks translate them to unchecked at a boundary. Mentioning that overrides can narrow but not
            widen the <code>throws</code> clause is a good detail.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="NumberFormatException extends IllegalArgumentException, which extends RuntimeException. Is it checked?"
        options={[
          { id: "a", text: "Yes — it extends Exception further up the chain" },
          { id: "b", text: "No — anything under RuntimeException is unchecked" },
          { id: "c", text: "Only when thrown from a method that declares it" },
          { id: "d", text: "It depends on the compiler settings" },
        ]}
        correctId="b"
        explanation="The rule is positional in the hierarchy, not about how far down you are. RuntimeException and everything beneath it is unchecked, as is Error and its descendants. Everything else under Exception is checked."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Make the compiler complain, then satisfy it three ways"
        hint={
          <p>
            <code>Files.readString(Path.of("x"))</code> throws a checked <code>IOException</code>;{" "}
            <code>Integer.parseInt("x")</code> throws an unchecked <code>NumberFormatException</code>.
          </p>
        }
      >
        Write a method that reads a file and parses a number from it. Confirm that the compiler demands you handle
        one exception and says nothing about the other. Then satisfy it three ways — declare it, catch it, and wrap
        it in an <code>UncheckedIOException</code> — and decide which you'd actually ship, and why.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between checked and unchecked exceptions, and which should you use?"
        answer={
          <p>
            Structurally: everything under <code>Exception</code> is checked <em>except</em> the{" "}
            <code>RuntimeException</code> subtree, and <code>Error</code> is unchecked too. Checked means the
            compiler requires each one to be caught or declared in the <code>throws</code> clause. The intended
            distinction is recoverability — a checked exception is a condition a caller might reasonably handle,
            like a missing file, whereas an unchecked one signals a programming error, like passing null. In
            practice I use unchecked for anything caused by a bug (<code>IllegalArgumentException</code>,{" "}
            <code>IllegalStateException</code>) and reserve checked exceptions for genuine decision points where a
            caller has an alternative action. The criticism of checked exceptions is real: they leak through every
            layer, they can't propagate through lambdas, and they're often rethrown mechanically, which is why
            frameworks like Spring translate them to unchecked at the boundary. And <code>Error</code> should never
            be caught, which is the main argument against <code>catch (Throwable)</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Checked = under Exception but not under RuntimeException; the compiler enforces catch-or-declare.",
          "Unchecked = RuntimeException and Error subtrees; conventionally programming errors and JVM failures.",
          "Throw unchecked when the caller had a bug; checked when the caller has a real recovery option.",
          "Translate library-specific checked exceptions at your API boundary, always keeping the cause.",
          "Never catch Error, and avoid catch (Throwable) and throws Exception.",
        ]}
      />
    </>
  )
}
