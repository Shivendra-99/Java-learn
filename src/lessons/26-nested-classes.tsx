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

const staticNested = `public class Order {
    private final List<Line> lines = new ArrayList<>();

    // Static nested class: a normal class that happens to live inside Order.
    // No reference to any Order instance.
    public static class Line {
        private final String sku;
        private final int quantity;

        public Line(String sku, int quantity) {
            this.sku = sku;
            this.quantity = quantity;
        }
    }
}

// Created without an Order:
Order.Line line = new Order.Line("ABC-1", 2);`

const inner = `public class Order {
    private final List<Line> lines = new ArrayList<>();

    // Inner class (no 'static'): every instance belongs to one Order
    // and holds an implicit reference to it.
    public class Summary {
        public int totalItems() {
            return lines.size();      // reaching into the enclosing instance's field
        }
    }
}

// Created FROM an existing Order — note the unusual syntax:
Order order = new Order();
Order.Summary summary = order.new Summary();`

const local = `public List<String> report(List<Order> orders) {
    // Local class: declared inside a method, visible only there
    class Row {
        final String label;
        final int count;
        Row(String label, int count) { this.label = label; this.count = count; }
        String render() { return label + ": " + count; }
    }

    List<String> out = new ArrayList<>();
    for (Order order : orders) {
        out.add(new Row(order.reference(), order.size()).render());
    }
    return out;
}`

const anonymous = `// Anonymous class: declare and instantiate in one expression
Comparator<String> byLength = new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return Integer.compare(a.length(), b.length());
    }
};

// For a functional interface, a lambda says the same thing:
Comparator<String> byLength2 = (a, b) -> Integer.compare(a.length(), b.length());

// Anonymous classes are still needed when the interface has
// several methods, or when you need state or a named field:
server.addListener(new ConnectionListener() {
    private int reconnects = 0;
    @Override public void onConnect()    { reconnects = 0; }
    @Override public void onDisconnect() { reconnects++; }
});`

const leak = `public class Cache {
    private final byte[] hugeBuffer = new byte[100_000_000];

    // Inner class: every Entry holds a hidden reference to its Cache,
    // and therefore keeps hugeBuffer alive.
    public class Entry { ... }

    // Static nested: no such reference, so an Entry can outlive the Cache.
    public static class Entry2 { ... }
}

// If entries are stored somewhere long-lived, the inner version
// leaks 100 MB per Cache that would otherwise be collectable.`

export default function NestedClassesLesson() {
  return (
    <>
      <p>
        Java has four ways to declare a class inside something else, and the difference between two of them —
        static nested versus inner — has real consequences for memory. The others, local and anonymous classes, are
        about keeping a small helper close to where it's used.
      </p>

      <TypeHierarchyDiagram
        title="Four kinds of nested class"
        initialSelected="static-nested"
        nodes={[
          {
            id: "nested",
            name: "Nested types",
            kind: "class",
            detail: "Any class declared inside another class, or inside a method. Which kind you have depends on where it's declared and whether it's static.",
          },
          {
            id: "static-nested",
            name: "static class Inner",
            kind: "class",
            parent: "nested",
            tag: "no outer reference",
            detail:
              "A top-level class that happens to be namespaced inside another. Cannot see the outer instance's fields. This is the default choice — use it unless you specifically need the outer instance.",
          },
          {
            id: "inner",
            name: "class Inner",
            kind: "class",
            parent: "nested",
            tag: "holds outer reference",
            detail:
              "Each instance is tied to one instance of the enclosing class and can read its fields directly. Created with outer.new Inner(). The hidden reference is what makes these a memory-leak risk.",
          },
          {
            id: "local",
            name: "class inside a method",
            kind: "class",
            parent: "nested",
            tag: "method-scoped",
            detail:
              "Visible only inside the method that declares it. Can capture effectively-final local variables. Useful when a method needs a small named type that nothing else should see.",
          },
          {
            id: "anonymous",
            name: "new Interface() { ... }",
            kind: "class",
            parent: "nested",
            tag: "declared and created at once",
            detail:
              "An unnamed class implementing an interface or extending a class, instantiated on the spot. Largely replaced by lambdas for single-method interfaces, still useful when you need multiple methods or a field.",
          },
        ]}
      />

      <h2>Static nested: the default</h2>
      <CodeBlock language="java" filename="Order.Line" code={staticNested} />
      <p>
        A static nested class is just a class whose name happens to be <code>Order.Line</code>. Use it when the type
        only makes sense in the context of the outer class — an entry, a node, a builder — and doesn't need to reach
        into an instance of it.
      </p>

      <h2>Inner: tied to an instance</h2>
      <CodeBlock language="java" filename="Order.Summary" code={inner} />
      <p>
        Dropping <code>static</code> changes the meaning entirely. Every <code>Summary</code> belongs to one{" "}
        <code>Order</code>, can read its private fields directly, and can only be created from an existing instance
        — hence the unusual <code>order.new Summary()</code> syntax.
      </p>

      <AnalogyCard title="A room in a specific house versus a room design.">
        "The kitchen at number 12" only exists because number 12 exists, and you reach it through that house — an
        inner class. "A kitchen layout" is a design you can talk about, copy and build anywhere; it happens to be
        filed in the house plans folder, but it needs no particular house — a static nested class.
      </AnalogyCard>

      <h2>The hidden reference is a real cost</h2>
      <CodeBlock language="java" filename="an accidental memory leak" code={leak} />
      <Callout variant="warning" title="Make nested classes static unless you need the outer instance">
        The implicit reference isn't visible in your source, so the leak isn't visible either. If an inner-class
        instance is stored anywhere long-lived — a cache, a listener registry, a static map — it pins the entire
        enclosing object in memory. This is the single most common reason to prefer <code>static</code>.
      </Callout>

      <h2>Local classes</h2>
      <CodeBlock language="java" filename="declared inside a method" code={local} />
      <p>
        A local class can use local variables from the enclosing method, provided they're{" "}
        <strong>effectively final</strong> — assigned once and never changed. That restriction exists because the
        value is copied into the object, so a later reassignment couldn't be seen.
      </p>

      <h2>Anonymous classes</h2>
      <CodeBlock language="java" filename="declare and instantiate at once" code={anonymous} />
      <p>
        Before Java 8 these were everywhere — every listener, every comparator. Lambdas replaced most of that usage
        and are shorter and cheaper. Anonymous classes remain the answer when the interface has more than one
        method, or when the implementation needs its own state.
      </p>

      <CommonMistake
        title="a non-static inner class used as a data holder"
        wrong={`public class ReportService {
    private final Database db;      // heavyweight

    public class Row {              // inner!
        String label;
        int value;
    }

    public List<Row> load() { ... } // every Row pins this service,
}                                   // and therefore the Database`}
        right={`public class ReportService {
    private final Database db;

    public static class Row {       // static: independent of the service
        final String label;
        final int value;
        Row(String label, int value) { ... }
    }
}

// Better still, since it is pure data:
public record Row(String label, int value) { }`}
        explanation={
          <p>
            The rows are returned to callers and may live far longer than the service call. As an inner class, each
            one holds the service alive, and the service holds the database connection. Adding <code>static</code>
            {" "}is a one-word fix; making it a record is better still, since a data holder is exactly what records
            are for.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            You can declare a class inside another class. If you mark it <code>static</code>, it's an ordinary class
            with a longer name. If you don't, each one is attached to a particular object of the outer class and can
            use its data — which is occasionally handy and often an accident.
          </p>
        }
        developer={
          <p>
            An inner class compiles to <code>Outer$Inner</code> with a synthetic <code>this$0</code> field
            referencing the enclosing instance, plus a constructor parameter to supply it. Static nested classes
            have no such field. Local and anonymous classes capture effectively-final locals by value, copied into
            synthetic fields. Lambdas differ: they're compiled with <code>invokedynamic</code> rather than as
            classes, they capture only what they use, and they don't create a new <code>this</code>.
          </p>
        }
        interview={
          <p>
            The reliable question is static nested versus inner: the outer-instance reference, the{" "}
            <code>outer.new Inner()</code> syntax, and the leak risk. Follow-ups: why captured locals must be
            effectively final (the value is copied, so mutation couldn't propagate), and when an anonymous class
            still beats a lambda (multiple abstract methods, or the implementation needs state).
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What is the practical difference between a static nested class and an inner class?"
        options={[
          { id: "a", text: "Only the static one can be public" },
          { id: "b", text: "The inner class holds an implicit reference to an instance of the outer class; the static one does not" },
          { id: "c", text: "The static one cannot access private members of the outer class" },
          { id: "d", text: "There is no difference — static is just a style choice" },
        ]}
        correctId="b"
        explanation="That hidden reference is why an inner class can read outer instance fields, why it must be created from an instance, and why it can keep the outer object alive in memory. Both kinds can access the outer class's private static members, and both can be public."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Find the hidden field"
        hint={
          <p>
            Compile a class containing both kinds of nested class, then run <code>javap -p Outer\$Inner</code> and
            look at the field list and the constructor signature.
          </p>
        }
      >
        Write an outer class with one static nested class and one inner class, compile it, and use{" "}
        <code>javap -p</code> on both generated class files. Find the synthetic field in one and not the other, and
        note how the constructors differ. That's the entire distinction, visible in the bytecode.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why must a local variable captured by an anonymous class or lambda be effectively final?"
        answer={
          <p>
            Because the capture is by value, not by reference. Local variables live in the enclosing method's stack
            frame, which disappears when the method returns — but the object or lambda may outlive it. So the
            compiler copies the value into the capturing instance. If the variable could then be reassigned, you'd
            have two copies that silently disagree, and it would be impossible to say which one "the variable"
            means. Requiring it to be effectively final — assigned once, never reassigned — makes the copy
            indistinguishable from the original. Fields have no such restriction because they live on the heap; the
            classic workaround for needing mutation is a one-element array or an{" "}
            <code>AtomicInteger</code>, though needing that usually means the code wants restructuring.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Static nested classes are ordinary classes with a namespaced name — make this your default.",
          "Inner classes carry a hidden reference to the enclosing instance, which can keep it alive in memory.",
          "An inner class is created with outer.new Inner(), which is the syntax nobody remembers.",
          "Local and anonymous classes capture effectively-final locals, because the value is copied.",
          "Lambdas replaced anonymous classes for single-method interfaces; anonymous classes remain for multi-method or stateful cases.",
        ]}
      />
    </>
  )
}
