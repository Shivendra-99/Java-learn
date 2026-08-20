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

const before = `// The class this replaces — about 40 lines to hold two values
public final class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) { this.x = x; this.y = y; }

    public int getX() { return x; }
    public int getY() { return y; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }

    @Override public int hashCode() { return Objects.hash(x, y); }

    @Override public String toString() { return "Point[x=" + x + ", y=" + y + "]"; }
}`

const after = `// The same thing (Java 16+)
public record Point(int x, int y) { }

Point p = new Point(3, 4);
p.x();                       // 3   — the accessor is x(), not getX()
p.equals(new Point(3, 4));   // true
p.toString();                // "Point[x=3, y=4]"
new HashSet<>(List.of(p, new Point(3, 4))).size();   // 1`

const generated = `A record automatically gets:
  - a private final field per component
  - a canonical constructor taking every component, in order
  - an accessor per component, named exactly like the component: x(), not getX()
  - equals, comparing every component
  - hashCode, derived from every component
  - toString, listing every component

And it is implicitly:
  - final           (records cannot be extended)
  - extending java.lang.Record  (so it cannot extend anything else)`

const validation = `public record Booking(String reference, LocalDate date, int guests) {

    // Compact constructor: validation and normalisation, no assignments needed
    public Booking {
        Objects.requireNonNull(reference, "reference required");
        if (guests < 1) throw new IllegalArgumentException("guests must be positive");
        reference = reference.trim().toUpperCase();   // reassigning the parameter
                                                      // is what gets stored
    }

    // Extra constructors must delegate to the canonical one
    public Booking(String reference, LocalDate date) {
        this(reference, date, 1);
    }

    // Derived values and behaviour are perfectly normal
    public boolean isGroup() { return guests >= 8; }
}`

const mutablePredictor = `import java.util.*;

public class Shallow {
    record Team(String name, List<String> members) { }

    public static void main(String[] args) {
        List<String> members = new ArrayList<>(List.of("Ana"));
        Team team = new Team("Core", members);
        members.add("Intruder");
        System.out.println(team.members().size());
    }
}`

const defensive = `public record Team(String name, List<String> members) {
    public Team {
        members = List.copyOf(members);   // immutable snapshot, taken on construction
    }
}
// Now the record really is immutable: List.copyOf both copies
// and returns an unmodifiable list, so neither the caller's
// later changes nor a caller of members() can affect it.`

const whenNot = `Use a record when:
  - the type is a transparent carrier for its data
  - all components are part of its identity
  - immutability is correct (DTOs, value objects, map keys, tuples,
    events, query results, coordinates, money amounts)

Use a class when:
  - the object has identity separate from its values (a database entity
    with an id, an open connection, anything with a lifecycle)
  - you need mutable state
  - you want to hide or transform how the data is stored
  - you need to extend another class`

export default function RecordsLesson() {
  return (
    <>
      <p>
        A great deal of Java code exists only to carry data from one place to another, and until Java 16 that meant
        writing forty lines of constructor, getters, <code>equals</code>, <code>hashCode</code> and{" "}
        <code>toString</code> — every one of them a chance to make a mistake. A record is that class, declared in
        one line, generated correctly.
      </p>

      <h2>Before and after</h2>
      <CodeBlock language="java" filename="the long way" code={before} />
      <CodeBlock language="java" filename="the same thing" code={after} />

      <h2>What the compiler generates</h2>
      <CodeBlock language="text" filename="for free" code={generated} />
      <p>
        Note the accessor naming: a component <code>x</code> gets a method <code>x()</code>, not{" "}
        <code>getX()</code>. Records deliberately dropped the JavaBeans convention, which occasionally matters when
        an older framework expects getters.
      </p>

      <AnalogyCard title="A receipt, not a shopping trolley.">
        A receipt records what happened: it's complete, it's identified entirely by what's printed on it, and two
        identical receipts are interchangeable. Nobody expects to edit one. A trolley is the opposite — it has
        identity, it changes constantly, and two trolleys holding the same items are still two trolleys. Records are
        for receipts.
      </AnalogyCard>

      <h2>Validation with a compact constructor</h2>
      <CodeBlock language="java" filename="Booking.java" code={validation} />
      <p>
        The compact constructor has no parameter list and no field assignments — you're handed the parameters,
        you validate or reassign them, and the compiler assigns the final values to the fields afterwards. It's the
        right place for every invariant the type needs.
      </p>

      <h2>Records are shallowly immutable</h2>
      <OutputPredictor
        code={mutablePredictor}
        options={[
          { id: "a", text: "1" },
          { id: "b", text: "2" },
          { id: "c", label: "It does not compile — records cannot hold a List", text: "" },
          { id: "d", label: "It throws UnsupportedOperationException", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            The record's field is final, so it always points at the same list — but the list itself is mutable and
            the caller kept a reference to it. Immutability of a record means its <em>components</em> can't be
            reassigned, not that the objects they point at are frozen. Take a defensive copy in the compact
            constructor.
          </p>
        }
      />
      <CodeBlock language="java" filename="the fix" code={defensive} />

      <Callout variant="info" title="Records and pattern matching are designed together">
        Because a record's components are public and complete, the compiler can deconstruct one:{" "}
        <code>if (shape instanceof Circle(double r))</code> binds <code>r</code> directly. Combined with{" "}
        <code>sealed</code> interfaces, this gives Java exhaustive, compiler-checked handling of a closed set of
        shapes — covered in the modern-syntax lesson.
      </Callout>

      <h2>When not to use one</h2>
      <CodeBlock language="text" filename="the decision" code={whenNot} />

      <CommonMistake
        title="using a record for a mutable entity"
        wrong={`// A database entity whose status changes over time
public record Order(Long id, Status status, List<Item> items) { }

// Every change means constructing a whole new object...
order = new Order(order.id(), Status.PAID, order.items());

// ...and equality now depends on status, so an order that
// was PAID is "not equal" to the same order once SHIPPED.`}
        right={`public class Order {
    private final Long id;          // identity
    private Status status;          // state that changes

    public void markPaid() { ... }

    @Override public boolean equals(Object o) {
        return o instanceof Order other && Objects.equals(id, other.id);
    }
    @Override public int hashCode() { return Objects.hashCode(id); }
}`}
        explanation={
          <p>
            A record says "I am my values". An entity says "I have an identity, and my values change" — an order is
            the same order before and after shipping. Using a record forces value equality onto something that
            needs identity equality, which breaks caches, sets, and any code comparing "the same" entity across two
            points in time.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A record is a short way to declare a class that just holds values. You write the name and the fields,
            and Java writes the constructor, the getters, and the code for comparing and printing. The values can't
            be changed after the object is created.
          </p>
        }
        developer={
          <p>
            Records are implicitly final and extend <code>java.lang.Record</code>, so no other inheritance is
            possible — though they may implement interfaces. The canonical constructor can be written compactly for
            validation and normalisation; any other constructor must delegate to it. You may override the generated
            accessors, <code>equals</code>, <code>hashCode</code> and <code>toString</code>, but doing so usually
            signals the type isn't really a record. Static fields are allowed; instance fields beyond the components
            are not.
          </p>
        }
        interview={
          <p>
            Know what's generated and that accessors are <code>x()</code> rather than <code>getX()</code>. Be able
            to state that records are shallowly immutable and how to fix that with <code>List.copyOf</code> in a
            compact constructor. The design question — record versus class — has a clean answer: value semantics
            versus identity semantics. Mentioning record patterns with sealed interfaces shows you're current.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which of these can a record do?"
        options={[
          { id: "a", text: "Extend an abstract class to share behaviour" },
          { id: "b", text: "Implement one or more interfaces" },
          { id: "c", text: "Declare additional instance fields beyond its components" },
          { id: "d", text: "Be extended by another class" },
        ]}
        correctId="b"
        explanation="Records already extend java.lang.Record, so no other superclass is possible, and they are implicitly final so nothing can extend them. Extra instance fields are forbidden because they wouldn't participate in the generated equals and hashCode. Interfaces are fine, and are how records join sealed hierarchies."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Make a record genuinely immutable"
        hint={
          <p>
            <code>List.copyOf</code> in the compact constructor handles the way in. Also check what a caller can do
            with the list returned by the accessor.
          </p>
        }
      >
        Write a record with a <code>List</code> component and show two ways a caller can mutate its contents: by
        keeping the list they passed in, and by modifying the one the accessor returns. Then close both holes with
        a single line. Finally decide whether a component of type <code>Date</code> could be protected the same way.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What does a record give you, and when would you not use one?"
        answer={
          <p>
            A record generates a private final field per component, a canonical constructor, an accessor per
            component, and correct <code>equals</code>, <code>hashCode</code> and <code>toString</code> derived from
            all components. It's implicitly final and extends <code>java.lang.Record</code>, so it can implement
            interfaces but not extend a class. You'd avoid one when the type has identity distinct from its values —
            a JPA entity, say, where two loads of the same row should be equal by id and the fields change over
            time — or when you need mutable state, hidden representation, or class inheritance. One caveat worth
            raising: records are only <em>shallowly</em> immutable, so a component holding a mutable collection
            still needs a defensive copy in the compact constructor.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A record declares a transparent data carrier in one line and generates the boilerplate correctly.",
          "Accessors are named after the component — x(), not getX().",
          "Compact constructors are where validation and normalisation go.",
          "Records are shallowly immutable: copy mutable components defensively.",
          "Records are final and can't extend a class, but can implement interfaces and join sealed hierarchies.",
        ]}
      />
    </>
  )
}
