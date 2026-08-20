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

const modifiers = `Modifier      Same class   Same package   Subclass    Anywhere
-----------   ----------   ------------   ---------   --------
private          yes            no            no          no
(none)           yes           yes            no          no      <- "package-private"
protected        yes           yes           yes          no
public           yes           yes           yes         yes

// Applies to fields, methods, constructors and nested types.
// Top-level classes can only be public or package-private.`

const badGood = `// Exposed: any code anywhere can put this object into an impossible state
public class Temperature {
    public double celsius;
}

t.celsius = -500;      // colder than absolute zero. Nothing stopped it.

// Encapsulated: the class owns its invariant
public class Temperature {
    private double celsius;

    public void setCelsius(double celsius) {
        if (celsius < -273.15) {
            throw new IllegalArgumentException("below absolute zero");
        }
        this.celsius = celsius;
    }

    public double celsius()    { return celsius; }
    public double fahrenheit() { return celsius * 9 / 5 + 32; }
}`

const notEncapsulation = `// Getters and setters for every field is not encapsulation —
// it is a public field with extra steps.
public class Order {
    private List<Item> items;
    private String status;

    public List<Item> getItems()  { return items; }
    public void setItems(List<Item> items) { this.items = items; }
    public String getStatus()     { return status; }
    public void setStatus(String status) { this.status = status; }
}

order.setStatus("SHIPPED");   // was it paid? does anyone check?

// Encapsulation means exposing OPERATIONS, not fields
public class Order {
    private final List<Item> items = new ArrayList<>();
    private Status status = Status.NEW;

    public void addItem(Item item) { items.add(item); }

    public void markPaid() {
        if (status != Status.NEW) throw new IllegalStateException(status.name());
        status = Status.PAID;
    }

    public void ship() {
        if (status != Status.PAID) throw new IllegalStateException("not paid");
        status = Status.SHIPPED;
    }

    public List<Item> items() { return List.copyOf(items); }   // unmodifiable view
}`

const leakPredictor = `import java.util.*;

public class Leak {
    static class Team {
        private final List<String> members = new ArrayList<>();
        Team(String... names) { members.addAll(List.of(names)); }
        List<String> getMembers() { return members; }
        int size() { return members.size(); }
    }

    public static void main(String[] args) {
        Team team = new Team("Ana", "Ben");
        team.getMembers().add("Intruder");
        System.out.println(team.size());
    }
}`

const defensive = `public class Booking {
    private final Date start;              // Date is mutable — dangerous
    private final List<String> guests;

    public Booking(Date start, List<String> guests) {
        this.start = new Date(start.getTime());   // defensive copy IN
        this.guests = List.copyOf(guests);        // immutable copy
    }

    public Date getStart() {
        return new Date(start.getTime());         // defensive copy OUT
    }

    public List<String> getGuests() {
        return guests;                            // already immutable, safe to share
    }
}

// Better still: use immutable types and the problem disappears
private final LocalDate start;    // java.time types are immutable by design`

export default function EncapsulationLesson() {
  return (
    <>
      <p>
        Encapsulation is usually taught as "make fields private and add getters". That's the mechanism, not the
        point. The point is that a class should be the only thing able to break its own rules — so that when
        something is wrong, there's exactly one file to look in.
      </p>

      <h2>The four access levels</h2>
      <CodeBlock language="text" filename="visibility" code={modifiers} />
      <p>
        The one people forget is the default: writing no modifier at all gives <strong>package-private</strong>{" "}
        access, not public. And note <code>protected</code> is wider than it looks — it includes the whole package,
        not just subclasses.
      </p>

      <h2>Why private fields matter</h2>
      <CodeBlock language="java" filename="an invariant worth protecting" code={badGood} />
      <p>
        The second version can state something the first cannot: <em>a Temperature is never below absolute zero</em>
        . That guarantee holds for every instance, forever, because the only code that can assign to the field lives
        inside the class. This is what an <strong>invariant</strong> is, and protecting invariants is the entire
        job.
      </p>

      <AnalogyCard title="A cash machine, not an open till.">
        A bank doesn't hand you the drawer and trust you to take the right amount. It gives you a slot, a keypad and
        a set of operations, each of which checks the rules before touching the money. The drawer is still there —
        it's just that every path to it goes through something that can say no. Public fields are the open till.
      </AnalogyCard>

      <h2>Getters and setters are not automatically encapsulation</h2>
      <CodeBlock language="java" filename="two Order classes" code={notEncapsulation} />
      <p>
        A setter for every field re-creates the open till with more typing. The improvement isn't hiding the field —
        it's replacing "set this value" with "do this thing", so the class gets to enforce that shipping requires
        payment. Ask what operations the object supports, then write only those.
      </p>

      <h2>Private fields can still leak</h2>
      <OutputPredictor
        code={leakPredictor}
        options={[
          { id: "a", text: "2" },
          { id: "b", text: "3" },
          { id: "c", label: "It does not compile — members is private", text: "" },
          { id: "d", label: "It throws UnsupportedOperationException", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            The field is private, but the getter hands out the actual list, so the caller can modify the team's
            internals without ever touching the field. Private controls access to the <em>reference</em>, not to the
            object it points at. Return <code>List.copyOf(members)</code> or{" "}
            <code>Collections.unmodifiableList(members)</code>, or better, expose an <code>addMember</code> method
            and no getter at all.
          </p>
        }
      />

      <h2>Defensive copies</h2>
      <CodeBlock language="java" filename="copy in, copy out" code={defensive} />
      <Callout variant="tip" title="Immutable types make this unnecessary">
        Every defensive copy is a symptom of a mutable type crossing a boundary. Use <code>LocalDate</code> instead
        of <code>Date</code>, <code>List.of</code> instead of a shared <code>ArrayList</code>, and records instead
        of mutable holders, and most of the copying simply disappears.
      </Callout>

      <CommonMistake
        title="using protected as a default for fields"
        wrong={`public class Base {
    protected List<String> items = new ArrayList<>();
    protected int count;
}

// Every subclass — including ones written by other teams —
// can now assign to these directly. You can never change
// the representation without breaking them.`}
        right={`public class Base {
    private final List<String> items = new ArrayList<>();

    protected void addItem(String item) {   // a controlled extension point
        items.add(item);
    }

    protected int count() {
        return items.size();
    }
}`}
        explanation={
          <p>
            A protected field is part of your public API for every subclass ever written, which means the field's
            type, name and meaning are frozen. Protected <em>methods</em> give subclasses what they need while
            leaving you free to change how it's stored. Keep fields private by default and open up deliberately.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Keep the data inside the class private, and let the outside world ask the class to do things rather than
            reach in and change values. That way, rules like "a balance can't go negative" are checked in one place
            instead of being everyone's responsibility.
          </p>
        }
        developer={
          <p>
            Access modifiers are compile-time and enforced by the JVM's access checks — though reflection can bypass
            them unless the module system says otherwise. Package-private is the default and is genuinely useful for
            collaborating classes within one package. Watch for representation exposure: returning a mutable field
            or storing a caller-supplied mutable object defeats private access entirely, which is why defensive
            copying and immutable types matter.
          </p>
        }
        interview={
          <p>
            Expect to be pushed past the definition. Good material: getters and setters on every field is not
            encapsulation; <code>protected</code> also grants package access; private fields still leak through
            mutable getters; and the strongest form of encapsulation is immutability, where there's nothing to
            protect. Being able to name an invariant your class maintains is the most convincing answer available.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Which code can access a field declared with no modifier at all?"
        options={[
          { id: "a", text: "Only the declaring class" },
          { id: "b", text: "Any class in the same package" },
          { id: "c", text: "Any subclass, in any package" },
          { id: "d", text: "Any class anywhere — no modifier means public" },
        ]}
        correctId="b"
        explanation="No modifier means package-private: visible within the same package, invisible outside it, including to subclasses in other packages. It sits between private and protected, and it is the default people most often get wrong."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Break encapsulation, then repair it"
        hint={
          <p>
            Try <code>List.copyOf</code>, <code>Collections.unmodifiableList</code>, and removing the getter
            entirely in favour of purposeful methods. Note which of the three still lets a caller see later
            additions.
          </p>
        }
      >
        Write a class with a private <code>List</code> and a getter that returns it. Show from{" "}
        <code>main</code> that outside code can modify the internals. Then fix it three different ways and, for
        each, say what a caller can and can't do afterwards. One of them returns a live view — find out which, and
        decide whether that's a feature or a trap.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Is a class with private fields and public getters and setters encapsulated?"
        answer={
          <p>
            Not meaningfully. If every field has a public setter, outside code can put the object into any state it
            likes — the private modifier just adds a method call in front. Real encapsulation means the class
            exposes <em>operations</em> that maintain its invariants: <code>markPaid()</code> rather than{" "}
            <code>setStatus(String)</code>, <code>deposit(amount)</code> rather than{" "}
            <code>setBalance(long)</code>. It also means not leaking internal mutable state through getters, which
            requires defensive copies or immutable types. The test I'd apply: can I name something that is always
            true of this object, and is that guaranteed by the class rather than by convention?
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Four levels: private, package-private (the default), protected, public — and protected includes the package.",
          "The goal is protecting invariants, so the class is the only thing that can break its own rules.",
          "A setter per field is a public field with extra steps; expose operations instead.",
          "Private controls the reference, not the object — returning a mutable field leaks internals.",
          "Immutable types remove the need for defensive copying altogether.",
        ]}
      />
    </>
  )
}
