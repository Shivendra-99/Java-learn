import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { Layers, ArrowDown, Package, Lock, FileArchive } from "lucide-react"

const problem = `// The problem: too many combinations to make one subclass each
class DataSource { ... }
class EncryptedDataSource extends DataSource { ... }
class CompressedDataSource extends DataSource { ... }
class EncryptedCompressedDataSource extends ... { ... }   // and gzip? and base64?

// Every combination of features is a new subclass. Two features = four
// classes; three = eight. This is the class explosion inheritance causes.

// Decorator (structural): wrap an object in another of the SAME type to
// add behaviour, and stack the wrappers in any combination.`

const decorator = `interface DataSource {
    void write(String data);
    String read();
}

// The concrete component — the thing being decorated
class FileDataSource implements DataSource {
    public void write(String data) { /* write to file */ }
    public String read() { return /* read from file */ ""; }
}

// The base decorator: implements the interface AND holds one
abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrapped;
    protected DataSourceDecorator(DataSource wrapped) { this.wrapped = wrapped; }
}

// Each decorator adds behaviour around the wrapped object's call
class EncryptionDecorator extends DataSourceDecorator {
    EncryptionDecorator(DataSource ds) { super(ds); }
    public void write(String data)  { wrapped.write(encrypt(data)); }
    public String read()            { return decrypt(wrapped.read()); }
}
class CompressionDecorator extends DataSourceDecorator {
    CompressionDecorator(DataSource ds) { super(ds); }
    public void write(String data)  { wrapped.write(compress(data)); }
    public String read()            { return decompress(wrapped.read()); }
}`

const stacking = `// Stack them in any order, at runtime, no new classes
DataSource source = new EncryptionDecorator(
                        new CompressionDecorator(
                            new FileDataSource()));

source.write("secret");
// compress, then encrypt, then write to file — the layers run outermost-in

// Want just compression? Drop a wrapper. Different order? Reorder them.
// Every combination is available without a single subclass.`

const javaIo = `// The pattern you use every time you read a file
BufferedReader reader = new BufferedReader(     // adds buffering + readLine()
                            new InputStreamReader(  // adapts bytes -> chars
                                new FileInputStream("data.txt")));  // the raw source

// Each wrapper is a Reader/InputStream that holds another one. That's why
// java.io looks like Russian dolls — it's Decorator, all the way down.

// Collections use the same idea for read-only views:
List<String> readOnly = Collections.unmodifiableList(list);   // a decorating wrapper`

const decoratorVsInheritance = `Inheritance                        Decorator
--------------------------------   ------------------------------------------
combinations chosen at COMPILE     combinations chosen at RUNTIME
time (one subclass each)           (stack wrappers as needed)
N features -> up to 2^N classes    N features -> N decorator classes
fixed for the object's lifetime    can wrap/unwrap dynamically
'is-a' the enhanced type           'has-a' the wrapped object, same interface`

export default function DecoratorPatternLesson() {
  return (
    <>
      <p>
        Decorator adds behaviour to an object by <strong>wrapping</strong> it in another object of the same type,
        rather than subclassing. Stack the wrappers and you get any combination of features from a handful of
        classes — which is exactly why <code>java.io</code> looks the way it does.
      </p>

      <CodeBlock language="text" filename="the class-explosion problem" code={problem} />

      <h2>A decorator</h2>
      <CodeBlock language="java" filename="component and decorators" code={decorator} />
      <p>
        The key move: each decorator both <strong>implements</strong> the interface and <strong>holds</strong> an
        instance of it. So a decorator is usable anywhere the component is, and it delegates to the thing it wraps —
        doing its extra work before or after. That "same type as what it wraps" property is what makes them
        stackable.
      </p>

      <h2>Stacking</h2>
      <CodeBlock language="java" filename="any combination, at runtime" code={stacking} />

      <StepFlowDiagram
        title={`write("secret") through two decorators`}
        steps={[
          {
            id: "call",
            label: "Call the outermost",
            detail: "You hold an EncryptionDecorator and call write(\"secret\"). It's the outermost layer, so it runs first.",
            icon: Layers,
          },
          {
            id: "encrypt",
            label: "Encryption does its bit, then delegates",
            detail: "It encrypts the data and calls wrapped.write(...) — passing the encrypted bytes down to the next layer. It doesn't know or care what that layer is.",
            icon: Lock,
            tone: "warning",
          },
          {
            id: "compress",
            label: "Compression does its bit, then delegates",
            detail: "The CompressionDecorator compresses what it received and calls its own wrapped.write(...), passing down again.",
            icon: FileArchive,
          },
          {
            id: "file",
            label: "The real component acts",
            detail: "Innermost is the FileDataSource — the actual work. It writes the fully compressed, encrypted bytes to disk. There's no further wrapped object.",
            icon: Package,
          },
          {
            id: "chain",
            label: "The call unwinds",
            detail: "Reading reverses it: read at the file, decompress, decrypt, outermost-last. Reorder or drop wrappers and the behaviour changes with no new classes.",
            icon: ArrowDown,
            tone: "success",
          },
        ]}
      />

      <h2>java.io is Decorator</h2>
      <CodeBlock language="java" filename="the pattern you already use" code={javaIo} />
      <Callout variant="info" title="Why streams nest like that">
        <code>new BufferedReader(new InputStreamReader(new FileInputStream(...)))</code> is three decorators: a raw
        byte source, a wrapper that decodes bytes to characters, and a wrapper that adds buffering and{" "}
        <code>readLine()</code>. Each is a <code>Reader</code> or <code>InputStream</code> holding another one. Once
        you see it as Decorator, the nesting stops looking arbitrary.
      </Callout>

      <h2>Decorator versus inheritance</h2>
      <CodeBlock language="text" filename="the trade" code={decoratorVsInheritance} />

      <AnalogyCard title="Layering clothes, not owning an outfit per weather.">
        You don't buy a separate garment for every combination of cold, rain and wind. You layer a jumper, then a
        coat, then a waterproof, adding and removing as needed — same you underneath, different behaviour on top.
        Decorator is layering: each wrapper adds one capability, and you stack whichever ones the moment calls for.
      </AnalogyCard>

      <CommonMistake
        title="a decorator that isn't the same type as what it wraps"
        wrong={`class LoggingWriter {                 // note: does NOT implement Writer
    private final Writer wrapped;
    LoggingWriter(Writer w) { wrapped = w; }
    void writeLogged(String s) { ... }    // a new method name
}

// Now it can't be passed where a Writer is expected, and can't be
// wrapped by another decorator. It's not a decorator — it's just a wrapper
// with a different API, i.e. closer to an Adapter or a plain helper.`}
        right={`class LoggingWriter extends Writer {   // IS-A Writer
    private final Writer wrapped;
    LoggingWriter(Writer w) { wrapped = w; }

    @Override public void write(char[] c, int off, int len) {
        log("writing " + len + " chars");
        wrapped.write(c, off, len);        // same method, delegates
    }
    // ...delegate the rest to wrapped
}
// Now it's a drop-in Writer and can be stacked with other decorators.`}
        explanation={
          <p>
            The defining property of a decorator is that it shares the component's interface, so it's substitutable
            for it and can be wrapped by further decorators. A wrapper that exposes a <em>different</em> API is a
            different pattern — usually an Adapter (which changes the interface) — and loses the stackability that
            makes Decorator worthwhile.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Decorator adds features by wrapping. Instead of making a subclass for every combination of options, you
            build small wrappers that each add one thing, and stack them. Each wrapper looks like the thing it wraps
            from the outside, so you can keep wrapping. Reading a file in Java does exactly this.
          </p>
        }
        developer={
          <p>
            A decorator implements the component interface and composes an instance of it, delegating and adding
            behaviour around the call. Because it's the same type, decorators stack in any order and combination,
            trading inheritance's compile-time 2^N class explosion for N runtime-composable classes. It favours
            composition over inheritance and satisfies open/closed. <code>java.io</code> and{" "}
            <code>Collections.unmodifiableXxx</code> are canonical. The costs are many small objects and stack
            traces that thread through the layers.
          </p>
        }
        interview={
          <p>
            The reliable framing is Decorator versus inheritance: inheritance fixes combinations at compile time and
            explodes the class count, while Decorator composes them at runtime from N classes. Name{" "}
            <code>java.io</code> as the example — <code>BufferedReader</code> wrapping{" "}
            <code>InputStreamReader</code> wrapping <code>FileInputStream</code>. Be ready to distinguish it from
            Adapter (Decorator keeps the same interface and adds behaviour; Adapter changes the interface) and Proxy
            (same interface, but controls access rather than enhancing).
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What property lets decorators be stacked in any combination?"
        options={[
          { id: "a", text: "They all extend the same abstract class with final methods" },
          { id: "b", text: "Each decorator implements the same interface as the object it wraps, so it's substitutable and can itself be wrapped" },
          { id: "c", text: "They share a static registry of wrappers" },
          { id: "d", text: "They are all singletons" },
        ]}
        correctId="b"
        explanation="Because a decorator is the same type as its component, it fits anywhere the component does — including inside another decorator. That substitutability is what makes them stack. A wrapper with a different interface can't be chained, and would be an Adapter instead."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Build a two-decorator stack"
        hint={
          <p>
            Start from a simple interface with one method, a concrete implementation, and a base decorator holding a
            reference to the interface. Then write two decorators and nest them.
          </p>
        }
      >
        Write a <code>Coffee</code> interface with a <code>cost()</code> method, a <code>SimpleCoffee</code>, and two
        decorators — <code>WithMilk</code> and <code>WithSugar</code> — each adding to the cost of what it wraps.
        Stack them both ways and confirm the totals. Then count how many subclasses the same feature set would need
        without the pattern.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the Decorator pattern, and where does the JDK use it?"
        answer={
          <p>
            Decorator adds responsibilities to an object dynamically by wrapping it in another object that shares
            its interface. The wrapper implements the component type and holds an instance of it, so it's usable
            anywhere the component is and delegates to the wrapped object while adding behaviour before or after.
            Because every decorator is the same type as what it wraps, they stack in any order and combination —
            which is the whole point: it replaces inheritance's combinatorial subclass explosion (N features can
            mean up to 2^N subclasses) with N small classes composed at runtime. The JDK's flagship example is{" "}
            <code>java.io</code>: <code>new BufferedReader(new InputStreamReader(new FileInputStream(f)))</code> is
            three decorators — a raw byte stream, a bytes-to-characters wrapper, and a buffering-and-<code>readLine</code>{" "}
            wrapper. <code>Collections.unmodifiableList</code> and the synchronized wrappers are decorators too. The
            costs are a proliferation of small objects and deeper stack traces, and it's important not to confuse it
            with Adapter, which changes the interface rather than preserving it, or Proxy, which preserves the
            interface but controls access rather than enhancing behaviour.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Decorator adds behaviour by wrapping an object in another of the same type — not by subclassing.",
          "Each decorator implements the interface AND holds an instance of it, so wrappers stack.",
          "N features become N decorator classes composed at runtime, versus up to 2^N subclasses.",
          "java.io is Decorator throughout: BufferedReader wrapping InputStreamReader wrapping FileInputStream.",
          "Adapter changes the interface, Proxy controls access — Decorator keeps the interface and adds behaviour.",
        ]}
      />
    </>
  )
}
