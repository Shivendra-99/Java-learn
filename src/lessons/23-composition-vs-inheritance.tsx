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

const fragileBase = `// A HashSet that counts everything ever added
public class CountingSet<E> extends HashSet<E> {
    private int addCount = 0;

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);
    }

    public int addCount() { return addCount; }
}`

const fragilePredictor = `import java.util.*;

public class Fragile {
    static class CountingSet<E> extends HashSet<E> {
        int addCount = 0;

        @Override public boolean add(E e) {
            addCount++;
            return super.add(e);
        }

        @Override public boolean addAll(Collection<? extends E> c) {
            addCount += c.size();
            return super.addAll(c);
        }
    }

    public static void main(String[] args) {
        CountingSet<String> set = new CountingSet<>();
        set.addAll(List.of("a", "b", "c"));
        System.out.println(set.addCount);
    }
}`

const composed = `// The same idea, using composition — a field instead of a parent
public class CountingSet<E> {
    private final Set<E> delegate = new HashSet<>();
    private int addCount = 0;

    public boolean add(E e) {
        addCount++;
        return delegate.add(e);
    }

    public boolean addAll(Collection<? extends E> c) {
        boolean changed = false;
        for (E e : c) changed |= add(e);   // OUR add, deliberately
        return changed;
    }

    public boolean contains(Object o) { return delegate.contains(o); }
    public int size() { return delegate.size(); }
    public int addCount() { return addCount; }
}

// Nothing HashSet does internally can surprise us: we only
// call its public API, and we decide what to expose.`

const strategy = `// Inheritance: one behaviour, fixed at compile time, one axis of variation
abstract class Exporter { abstract void export(Report r); }
class PdfExporter extends Exporter { ... }
class CsvExporter extends Exporter { ... }
// Now add compression, and encryption. PdfGzipExporter?
// PdfGzipEncryptedExporter? The class count multiplies.

// Composition: behaviours are objects, combined at runtime
class Exporter {
    private final Format format;
    private final Compression compression;
    private final Encryption encryption;

    Exporter(Format f, Compression c, Encryption e) { ... }

    void export(Report r) {
        byte[] bytes = format.render(r);
        bytes = compression.apply(bytes);
        bytes = encryption.apply(bytes);
        write(bytes);
    }
}

new Exporter(new Pdf(), new Gzip(), new None());   // any combination, no new classes`

const checklist = `Choose inheritance when ALL of these hold:
  - The subclass genuinely IS-A kind of the superclass.
  - Every public method of the parent makes sense on the child.
  - You control the parent, or it was explicitly designed for extension
    (documented self-use, or abstract with clear extension points).
  - The relationship will not change at runtime.

Otherwise choose composition:
  - The relationship is HAS-A or USES-A.
  - You want to expose only part of the other type's API.
  - You want to vary along more than one axis.
  - You want to swap the collaborator at runtime, or in a test.`

export default function CompositionVsInheritanceLesson() {
  return (
    <>
      <p>
        "Favour composition over inheritance" is the most repeated advice in object-oriented design, and it's
        usually delivered without the reason. The reason is concrete: inheritance couples you to a superclass's{" "}
        <em>implementation details</em>, not just its interface — and those details can change under you.
      </p>

      <h2>The fragile base class problem</h2>
      <CodeBlock language="java" filename="a reasonable-looking subclass" code={fragileBase} />
      <p>
        This looks careful: both methods that add elements are overridden and both update the count. Run it and see.
      </p>

      <OutputPredictor
        question="How many additions does it count?"
        code={fragilePredictor}
        options={[
          { id: "a", text: "3" },
          { id: "b", text: "6" },
          { id: "c", text: "0" },
          { id: "d", label: "It throws ConcurrentModificationException", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>HashSet.addAll</code> is implemented by calling <code>add</code> for each element. So our{" "}
            <code>addAll</code> adds 3, then <code>super.addAll</code> calls our overridden <code>add</code> three
            more times — 6. Nothing in <code>HashSet</code>'s documented contract told us it works that way, and a
            future JDK could change it. That's the fragile base class problem: we depended on an implementation
            detail we couldn't see.
          </p>
        }
      />

      <h2>The same feature, composed</h2>
      <CodeBlock language="java" filename="delegation instead" code={composed} />
      <p>
        The count is now correct and stays correct regardless of how <code>HashSet</code> is implemented, because we
        only ever call its public methods. We also chose which methods to expose — no{" "}
        <code>removeIf</code> or <code>retainAll</code> sneaking in behaviours we haven't thought about.
      </p>

      <AnalogyCard title="Employing a specialist versus becoming one.">
        A builder who needs wiring can either retrain as an electrician — inheriting every obligation and
        restriction of that trade — or hire one. Hiring means you can swap electricians, use two, or stop using one;
        retraining means you're stuck with the qualification and every rule that comes with it. Most of the time,
        you just want the wiring done.
      </AnalogyCard>

      <h2>Composition varies along several axes</h2>
      <CodeBlock language="java" filename="why the class count explodes" code={strategy} />
      <p>
        Inheritance forces one hierarchy. The moment two independent things vary — format and compression — the
        class count becomes their product. Composition turns each axis into a field, and combinations become
        constructor arguments rather than new classes.
      </p>

      <Callout variant="info" title="Interfaces plus composition is the usual answer">
        Composition is often taught as opposed to inheritance, but the practical pattern uses both: inherit{" "}
        <em>type</em> from an interface so callers can treat things uniformly, and get behaviour from fields you
        delegate to. You get polymorphism without coupling to an implementation.
      </Callout>

      <h2>A checklist</h2>
      <CodeBlock language="text" filename="which one?" code={checklist} />

      <CommonMistake
        title="extending a class purely to reuse its helper methods"
        wrong={`public class ReportService extends JsonUtils {
    // now has access to toJson(), fromJson()...
    public String export(Report r) {
        return toJson(r);
    }
}`}
        right={`public class ReportService {
    private final JsonMapper json;    // or a static utility call

    public ReportService(JsonMapper json) { this.json = json; }

    public String export(Report r) {
        return json.toJson(r);
    }
}`}
        explanation={
          <p>
            Extending for reuse burns the class's one inheritance slot, publicly claims{" "}
            <code>ReportService IS-A JsonUtils</code> (which is nonsense), and exposes every helper as part of the
            service's own API. A field says exactly what's true — this service uses a JSON mapper — and can be
            swapped in a test.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Inheritance means "this new thing is a kind of that thing, and gets everything it has". Composition
            means "this new thing contains one of those and asks it to do the work". The second is more flexible,
            because you can change or swap the part you're holding, and you only expose what you want.
          </p>
        }
        developer={
          <p>
            Inheritance is compile-time and static: coupling to the superclass's implementation, one axis of
            variation, and a subclass can be broken by a superclass change (self-use, added methods clashing with
            yours, or a widened contract). Composition is runtime and swappable, supports multiple axes, and keeps
            the exposed API deliberate. The cost is boilerplate delegation, which is why Java's own decorators —{" "}
            <code>BufferedInputStream</code>, <code>Collections.unmodifiableList</code> — are composition wearing an
            interface.
          </p>
        }
        interview={
          <p>
            Name the fragile base class problem and give the <code>HashSet</code> counting example — it's from
            Effective Java and is the most convincing thirty seconds available on this topic. Then the summary:
            inheritance for a genuine IS-A with a class designed for extension; composition for HAS-A, for partial
            API exposure, for multi-axis variation, and for anything you'd want to substitute in a test.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What is the 'fragile base class problem'?"
        options={[
          { id: "a", text: "Base classes are slower because of virtual dispatch" },
          { id: "b", text: "A subclass can break when the superclass changes its internal implementation, even if its public contract is unchanged" },
          { id: "c", text: "Abstract classes cannot be instantiated" },
          { id: "d", text: "A base class with too many fields uses too much memory" },
        ]}
        correctId="b"
        explanation="Subclasses often depend on how the parent implements things — such as addAll calling add. Those details aren't part of the contract, so changing them is legal for the parent's author and breaks subclasses silently. Composition avoids it by depending only on the public API."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Reproduce the double count"
        hint={
          <p>
            Extend <code>ArrayList</code> instead and override both <code>add</code> and <code>addAll</code> — then
            check whether that class has the same self-use behaviour as <code>HashSet</code>.
          </p>
        }
      >
        Build the counting collection twice — once with <code>extends</code> and once by delegating to a field — and
        call <code>addAll</code> on both. Confirm the counts differ. Then look up whether the JDK documents this
        self-use anywhere: the answer tells you how much you can safely assume about a class you didn't write.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why is composition usually preferred over inheritance?"
        answer={
          <p>
            Because inheritance couples a subclass to the superclass's implementation, not merely its interface. If
            the parent calls its own overridable methods — as <code>HashSet.addAll</code> calls <code>add</code> —
            then a subclass's overrides interact with internals it can't see, and a future change to those internals
            breaks it silently. Inheritance also forces a single axis of variation, exposes the parent's whole API
            whether it makes sense or not, and is fixed at compile time. Composition depends only on a published
            interface, lets several behaviours vary independently, allows substitution at runtime and in tests, and
            exposes exactly the API you choose. Inheritance is still right for a genuine IS-A relationship with a
            class explicitly designed and documented for extension — but that's the exception, not the default.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Inheritance couples you to a superclass's implementation details, which are free to change.",
          "The fragile base class problem: HashSet.addAll calls add, so naive counting subclasses double-count.",
          "Composition exposes only the API you choose and can be swapped at runtime or in tests.",
          "Multiple independent variations multiply classes under inheritance and become fields under composition.",
          "Use inheritance for a genuine IS-A with a class designed for extension; otherwise, delegate.",
        ]}
      />
    </>
  )
}
