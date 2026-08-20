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

const basic = `public enum Status {
    NEW, PAID, SHIPPED, CANCELLED
}

Status status = Status.PAID;

status.name()          // "PAID"        — the constant's identifier
status.ordinal()       // 1             — its position; avoid depending on this
Status.valueOf("PAID") // Status.PAID   — throws IllegalArgumentException if unknown
Status.values()        // an array of all four, in declaration order

// Comparison with == is correct and preferred for enums:
if (status == Status.PAID) { ... }`

const withState = `public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS  (4.869e+24, 6.0518e6),
    EARTH  (5.976e+24, 6.37814e6);

    private final double massKg;        // each constant carries its own data
    private final double radiusM;

    Planet(double massKg, double radiusM) {   // constructors are implicitly private
        this.massKg = massKg;
        this.radiusM = radiusM;
    }

    public double surfaceGravity() {
        return 6.67300E-11 * massKg / (radiusM * radiusM);
    }

    public double weightOf(double massOnEarth) {
        return massOnEarth * surfaceGravity();
    }
}

Planet.EARTH.surfaceGravity();   // 9.80...`

const perConstant = `// Behaviour that differs per constant, without a switch anywhere
public enum Operation {
    PLUS("+")  { public double apply(double x, double y) { return x + y; } },
    MINUS("-") { public double apply(double x, double y) { return x - y; } },
    TIMES("*") { public double apply(double x, double y) { return x * y; } },
    DIVIDE("/") {
        public double apply(double x, double y) {
            if (y == 0) throw new ArithmeticException("divide by zero");
            return x / y;
        }
    };

    private final String symbol;
    Operation(String symbol) { this.symbol = symbol; }

    public abstract double apply(double x, double y);

    @Override public String toString() { return symbol; }
}

Operation.TIMES.apply(6, 7);     // 42.0

// Adding a new operation means adding one constant — and the
// compiler will not let you forget the apply implementation.`

const switchEnum = `// A switch expression over an enum needs no default,
// and the compiler checks every constant is handled
String describe(Status status) {
    return switch (status) {
        case NEW       -> "awaiting payment";
        case PAID      -> "ready to pick";
        case SHIPPED   -> "on its way";
        case CANCELLED -> "cancelled";
    };
}
// Add REFUNDED to the enum and this method stops compiling —
// which is exactly what you want.`

const collections = `// Purpose-built, and far faster than the general-purpose versions
EnumSet<Status> open = EnumSet.of(Status.NEW, Status.PAID);
EnumMap<Status, Integer> counts = new EnumMap<>(Status.class);

open.contains(Status.PAID);      // a single bit test — EnumSet is a bit vector
counts.put(Status.NEW, 3);       // EnumMap is backed by a plain array

// Also useful:
EnumSet.allOf(Status.class);
EnumSet.noneOf(Status.class);
EnumSet.complementOf(open);      // everything not in 'open'`

const singleton = `// The simplest correct singleton in Java
public enum Registry {
    INSTANCE;

    private final Map<String, Handler> handlers = new HashMap<>();

    public void register(String key, Handler handler) { handlers.put(key, handler); }
}

Registry.INSTANCE.register("csv", new CsvHandler());

// Serialization-safe and reflection-safe for free — a private
// constructor plus a static field is neither.`

const ordinalPredictor = `public class Ordinals {
    enum Priority { LOW, MEDIUM, HIGH }

    public static void main(String[] args) {
        Priority p = Priority.MEDIUM;
        System.out.println(p.ordinal() + " " + p.name() + " " + p);
    }
}`

export default function EnumsLesson() {
  return (
    <>
      <p>
        An enum is a class with a fixed, known set of instances, created once and reused forever. That sounds
        modest, and it turns a whole category of runtime bugs — invalid status strings, magic numbers, unhandled
        cases — into compile errors.
      </p>

      <h2>The basics</h2>
      <CodeBlock language="java" filename="Status.java" code={basic} />
      <p>
        Each constant is a singleton instance of the enum type, so <code>==</code> is both correct and idiomatic —
        one of the very few places in Java where that's true for objects.
      </p>

      <OutputPredictor
        code={ordinalPredictor}
        options={[
          { id: "a", text: "1 MEDIUM MEDIUM" },
          { id: "b", text: "2 MEDIUM MEDIUM" },
          { id: "c", text: "1 1 MEDIUM" },
          { id: "d", label: "It does not compile — toString is not defined", text: "" },
        ]}
        correctId="a"
        explanation={
          <p>
            <code>ordinal()</code> is the zero-based declaration position, so <code>MEDIUM</code> is 1.{" "}
            <code>name()</code> returns the identifier exactly as written, and the default{" "}
            <code>toString()</code> returns the same thing — which is why printing an enum is readable without any
            work. Never persist <code>ordinal()</code>: reordering the constants silently changes every stored
            value.
          </p>
        }
      />

      <h2>Enums are classes: give them state and behaviour</h2>
      <CodeBlock language="java" filename="Planet.java" code={withState} />
      <p>
        This is where enums stop being "named integers". Each constant carries its own data, and the enum exposes
        behaviour computed from it. The constructor is implicitly private — you can never create a new{" "}
        <code>Planet</code>.
      </p>

      <h2>Per-constant behaviour</h2>
      <CodeBlock language="java" filename="Operation.java" code={perConstant} />
      <Callout variant="tip" title="This is the pattern worth remembering">
        An abstract method on the enum, implemented by each constant, replaces a switch that would otherwise have to
        be repeated in every method that handles the type. Adding a constant then forces you to supply the
        behaviour, rather than hoping someone remembers to update a switch somewhere else.
      </Callout>

      <h2>Exhaustive switching</h2>
      <CodeBlock language="java" filename="the compiler as a safety net" code={switchEnum} />

      <AnalogyCard title="A form with tick boxes, not a blank line.">
        Ask for "status" as free text and you'll receive PAID, paid, Paid, and "payed". Give four tick boxes and
        only four answers are possible — and if you later add a fifth box, every form that reads the results has to
        acknowledge it. An enum is the tick boxes, and exhaustive switching is the acknowledgement.
      </AnalogyCard>

      <h2>EnumSet and EnumMap</h2>
      <CodeBlock language="java" filename="specialised collections" code={collections} />
      <p>
        Because the set of constants is known and small, these can be implemented as a bit vector and an array
        respectively. They're substantially faster and smaller than <code>HashSet</code> and <code>HashMap</code>,
        and they iterate in declaration order. If your key is an enum, use them.
      </p>

      <h2>The enum singleton</h2>
      <CodeBlock language="java" filename="Registry.java" code={singleton} />

      <CommonMistake
        title="using strings or ints where an enum belongs"
        wrong={`public void setStatus(String status) {
    this.status = status;
}

order.setStatus("SHIPPED");
order.setStatus("shipped");     // different value, no complaint
order.setStatus("SHIPPPED");    // typo, discovered in production

if (order.getStatus().equals("PAID")) { ... }   // and again, everywhere`}
        right={`public void setStatus(Status status) {
    this.status = status;
}

order.setStatus(Status.SHIPPED);
order.setStatus(Status.SHIPPPED);   // compile error, immediately

if (order.getStatus() == Status.PAID) { ... }`}
        explanation={
          <p>
            A <code>String</code> parameter accepts every string that has ever existed; an enum accepts exactly the
            values that are valid. The error moves from a production incident to a red squiggle, autocomplete tells
            you the options, and finding every use of a constant becomes a reliable IDE search rather than a
            text hunt.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            An enum is a type whose values are a fixed list you write down — like the days of the week. You can't
            create new ones or mistype an existing one, because the compiler checks. They can also carry data and
            methods, so each value knows things about itself.
          </p>
        }
        developer={
          <p>
            An enum compiles to a final class extending <code>java.lang.Enum</code>, with each constant a{" "}
            <code>public static final</code> instance created in a static initialiser — so they're thread-safe and
            lazily initialised with the class. Constructors are implicitly private, and constant-specific bodies
            compile to anonymous subclasses. <code>EnumSet</code> uses a long-based bit vector for up to 64
            constants; <code>EnumMap</code> uses an array indexed by ordinal. Enum singletons are the only form
            immune to both serialization and reflection attacks.
          </p>
        }
        interview={
          <p>
            Reliable questions: can an enum implement an interface (yes) or extend a class (no — it already extends{" "}
            <code>Enum</code>); why <code>==</code> is safe for enums (each constant is a singleton); why{" "}
            <code>ordinal()</code> shouldn't be persisted (reordering breaks stored data); and why an enum makes the
            best singleton (serialization and reflection safety, plus thread-safe lazy initialisation for free).
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is == safe for comparing enum constants when it is unsafe for most objects?"
        options={[
          { id: "a", text: "The compiler rewrites == to equals for enums" },
          { id: "b", text: "Each enum constant is a single shared instance, so identity and equality coincide" },
          { id: "c", text: "Enums are primitives" },
          { id: "d", text: "It isn't safe — equals should always be used" },
        ]}
        correctId="b"
        explanation="The JVM creates exactly one instance per constant, so there is never a second object with the same value. That also makes == faster, null-safe, and checked by the compiler — comparing constants of different enum types is a compile error, whereas equals would just return false."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Replace a switch with per-constant behaviour"
        hint={
          <p>
            Declare the method <code>abstract</code> on the enum and give each constant a body in braces after its
            arguments.
          </p>
        }
      >
        Take a method that switches over an enum to compute something, and move each branch into the constant it
        belongs to. Then add a new constant and confirm the compiler forces you to supply the behaviour. Compare
        that with what would have happened if you'd added a constant while leaving the switch in place.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="Why is an enum considered the best way to implement a singleton in Java?"
        answer={
          <p>
            Because the JVM guarantees the properties you'd otherwise have to hand-build. The instance is created
            during class initialisation, which is thread-safe by specification — no double-checked locking, no{" "}
            <code>volatile</code>. Serialization is handled specially: enums serialize by name and deserialize via{" "}
            <code>valueOf</code>, so you can never end up with a second instance, which is a real hazard with a
            classic singleton unless you write <code>readResolve</code>. And reflection explicitly refuses to
            instantiate enum types, closing the other loophole. The cost is that an enum singleton can't extend a
            class and is eagerly initialised with its class — if you need lazy initialisation, the static holder
            idiom is the usual alternative.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "An enum is a class with a fixed set of singleton instances — compare with ==.",
          "Constants can carry fields and behaviour; the constructor is implicitly private.",
          "An abstract method implemented per constant replaces switches and can't be forgotten.",
          "Switch expressions over enums are checked for exhaustiveness at compile time.",
          "Use EnumSet and EnumMap for enum keys, and an enum for singletons.",
        ]}
      />
    </>
  )
}
