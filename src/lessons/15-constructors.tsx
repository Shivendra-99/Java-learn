import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { ExecutionTrace } from "@/components/lesson/execution-trace"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const basics = `public class Book {
    private final String title;
    private final String author;
    private int copies;

    // No return type, same name as the class — that is what makes it a constructor
    public Book(String title, String author, int copies) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title required");
        }
        this.title = title;
        this.author = author;
        this.copies = copies;
    }
}

Book b = new Book("Dune", "Herbert", 3);`

const defaultCtor = `class Simple {
    int value;
}
// The compiler supplies:  Simple() { super(); }
new Simple();          // works

class Configured {
    int value;
    Configured(int value) { this.value = value; }
}
new Configured(5);     // works
new Configured();      // compile error — the default constructor is GONE
                       // as soon as you declare any constructor yourself`

const chaining = `public class Rectangle {
    private final int width;
    private final int height;

    public Rectangle(int width, int height) {   // the "real" one
        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException("dimensions must be positive");
        }
        this.width = width;
        this.height = height;
    }

    public Rectangle(int side) {
        this(side, side);      // delegate — must be the FIRST statement
    }

    public Rectangle() {
        this(1);               // chains through to the two-arg version
    }
}`

const order = `public class Order {
    static int created = 0;
    static { System.out.println("static block"); }

    private String id = defaultId();
    { System.out.println("instance block"); }

    Order(String id) {
        System.out.println("constructor");
        this.id = id;
        created++;
    }

    static String defaultId() {
        System.out.println("field initialiser");
        return "TMP";
    }

    public static void main(String[] args) {
        new Order("A-1");
    }
}`

const builder = `// Four constructors that differ only in which arguments they take
new Pizza("large", true, false, true, 2);   // what do these mean?

// A builder makes each value self-describing
Pizza pizza = Pizza.builder()
        .size("large")
        .extraCheese(true)
        .thinCrust(true)
        .toppings(2)
        .build();`

export default function ConstructorsLesson() {
  return (
    <>
      <p>
        A constructor has one job: make sure that by the time <code>new</code> returns, the object is valid. Not
        partially filled in, not "the caller will set the rest" — valid. Everything else about constructors follows
        from taking that job seriously.
      </p>

      <h2>The basics</h2>
      <CodeBlock language="java" filename="Book.java" code={basics} />
      <p>
        Same name as the class, no return type — not even <code>void</code>. Write <code>void</code> by accident and
        you've declared an ordinary method that happens to share the class's name, which then never runs and leaves
        every field at its default. It's a genuinely confusing bug and the compiler won't say a word.
      </p>

      <h2>The default constructor disappears</h2>
      <CodeBlock language="java" filename="no free lunch" code={defaultCtor} />
      <p>
        If you declare no constructor at all, the compiler adds a public no-argument one. Declare{" "}
        <em>any</em> constructor and that gift is withdrawn. This trips people up when adding a constructor to an
        existing class suddenly breaks callers that were using <code>new Thing()</code>.
      </p>

      <h2>Chaining with this(...)</h2>
      <CodeBlock language="java" filename="one real constructor" code={chaining} />
      <p>
        <code>this(...)</code> calls another constructor of the same class and must be the very first statement.
        Funnelling every constructor through one "real" one means validation is written once — add a rule there and
        every construction path gets it.
      </p>

      <h2>The exact order of initialisation</h2>
      <p>
        Static setup happens once, when the class is first used. Instance setup happens on every <code>new</code>,
        and — this is the part people get wrong — field initialisers and instance blocks run{" "}
        <strong>before</strong> the constructor body, in source order.
      </p>
      <ExecutionTrace
        title="Who runs first?"
        filename="Order.java"
        code={order}
        autoPlayMs={1900}
        steps={[
          {
            line: 2,
            vars: { created: "0" },
            note: "Class initialisation, triggered the first time the class is used. Static fields are set in source order.",
          },
          { line: 3, output: "static block", note: "Static blocks run as part of class initialisation — once per class, ever." },
          { line: 20, note: "main begins. new Order(\"A-1\") starts object creation: memory is allocated and fields are zeroed." },
          { line: 5, note: "Instance field initialisers run next — before the constructor body, not after." },
          { line: 15, output: "field initialiser", note: "The initialiser calls defaultId(), so its output appears here." },
          { line: 5, vars: { id: "\"TMP\"" }, note: "id is assigned the initialiser's result." },
          { line: 6, output: "instance block", note: "Instance initialiser blocks run in source order, interleaved with field initialisers." },
          { line: 9, output: "constructor", note: "Only now does the constructor body run." },
          { line: 10, vars: { id: "\"A-1\"" }, note: "The constructor overwrites what the field initialiser set. Both ran; the constructor won." },
          { line: 11, vars: { created: "1" }, note: "Final order: static block, field initialiser, instance block, constructor." },
        ]}
      />

      <Callout variant="info" title="With inheritance, add one more rule">
        A constructor's implicit first statement is <code>super()</code> unless you write{" "}
        <code>this(...)</code> or <code>super(...)</code> yourself. So the parent is fully constructed before any of
        the child's field initialisers run. That's why calling an overridable method from a constructor is
        dangerous — the override may run against a subclass whose fields are still zero.
      </Callout>

      <AnalogyCard title="A form that cannot be handed over half-filled.">
        The constructor is the clerk who checks the form before stamping it. Once stamped, everyone downstream can
        assume the mandatory boxes are filled — no re-checking, no defensive null tests everywhere. A class whose
        constructor accepts anything and hopes callers fix it later is a form handed over blank, and every
        subsequent department has to guess.
      </AnalogyCard>

      <CommonMistake
        title="calling an overridable method from a constructor"
        wrong={`class Base {
    Base() {
        init();                 // subclass override runs here...
    }
    void init() { }
}

class Child extends Base {
    private String name = "set";
    @Override void init() {
        System.out.println(name.length());   // NullPointerException
    }
}`}
        right={`class Base {
    Base() {
        init();
    }
    // final: subclasses cannot change what the constructor calls
    final void init() { }
}

// Or: don't call any method during construction; let the caller
// invoke an explicit start()/initialise() once the object exists.`}
        explanation={
          <p>
            The parent constructor runs before the child's field initialisers. So <code>init()</code> dispatches to
            the child's override at a moment when <code>name</code> is still <code>null</code>. Making the method{" "}
            <code>final</code> (or <code>private</code>, or <code>static</code>) removes the possibility, which is
            why "never call an overridable method from a constructor" is a standard rule.
          </p>
        }
      />

      <h2>When constructors get unwieldy</h2>
      <CodeBlock language="java" filename="telescoping vs builder" code={builder} />
      <p>
        Once you have four or more parameters — especially several of the same type — call sites become unreadable
        and easy to get wrong. A builder gives every value a name at the point it's supplied. It's more code to
        write; use it when the class is widely constructed or has many optional values, not for every three-field
        object.
      </p>

      <DifficultyLevels
        simple={
          <p>
            A constructor is the setup code that runs when you create an object with <code>new</code>. It has the
            same name as the class and no return type. Its purpose is to make sure the new object starts out valid,
            so put your checks there rather than hoping callers remember them.
          </p>
        }
        developer={
          <p>
            Order per instance: allocate and zero fields, call <code>super()</code> (implicitly if not written),
            run instance field initialisers and instance blocks in source order, then the constructor body. Class
            initialisation — static fields and blocks — happens once, lazily, on first active use, and the JVM
            guarantees it is thread-safe. <code>this(...)</code> and <code>super(...)</code> must be the first
            statement, and only one may appear.
          </p>
        }
        interview={
          <p>
            High-frequency questions: does the default constructor still exist once you write one (no); can a
            constructor be private (yes — that's how singletons and static factories work); can it be overloaded
            (yes) or overridden (no, constructors are not inherited); and what order initialisation happens in.
            Being able to explain <em>why</em> calling an overridable method from a constructor is unsafe is the
            answer that stands out.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question={`A field has an initialiser (String id = "TMP") and the constructor also assigns it. What is the field's value after new?`}
        options={[
          { id: "a", text: "The initialiser's value — it runs last" },
          { id: "b", text: "The constructor's value — initialisers run first, then the constructor overwrites" },
          { id: "c", text: "A compile error: the field is assigned twice" },
          { id: "d", text: "null, because the two assignments cancel out" },
        ]}
        correctId="b"
        explanation="Field initialisers and instance blocks run before the constructor body, so both assignments happen and the constructor's value survives. That is also why a final field cannot have both — the compiler would see it assigned twice."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Predict, then verify, the initialisation order"
        hint={
          <p>
            Give the parent and the child each a static block, an instance block, a field initialiser and a
            constructor, and print a distinct line from all eight.
          </p>
        }
      >
        Write two classes where one extends the other, each with static blocks, instance blocks, field initialisers
        and constructors that all print something. Write down the order you expect <em>before</em> running it, then
        run it. The rule you'll derive — parent's statics, child's statics, parent's instance setup, parent
        constructor, child's instance setup, child constructor — is worth knowing cold.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Can a constructor be private? What would that be for?"
        answer={
          <p>
            Yes, and it's a common technique. A private constructor prevents outside code from calling{" "}
            <code>new</code>, which enables several patterns: <strong>static factory methods</strong> (
            <code>Integer.valueOf</code>, <code>List.of</code>) that can return a cached instance or a subtype
            rather than always allocating; <strong>singletons</strong>, where the class controls that only one
            instance exists; <strong>builders</strong>, where the builder is the only thing allowed to construct the
            product; and <strong>utility classes</strong> such as <code>java.util.Collections</code>, where a
            private constructor documents that the class is never meant to be instantiated. Constructors can also be
            overloaded, but never overridden — they're not inherited.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Same name as the class, no return type; its job is to guarantee a valid object.",
          "Declaring any constructor removes the free no-argument default.",
          "this(...) chains to another constructor and must be the first statement — funnel validation through one.",
          "Order: statics once per class, then field initialisers and instance blocks, then the constructor body.",
          "Never call an overridable method from a constructor: the subclass's fields aren't initialised yet.",
        ]}
      />
    </>
  )
}
